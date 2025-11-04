import numpy as np
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_predict
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from tabulate import tabulate


class KNN:
    def __init__(self, sample_answers, dataset_list, strand_list):
        self.sample_answers = sample_answers
        self.dataset_list = dataset_list
        self.strand_list = strand_list

    def start_algorithm(self):
        k, acc = self.calculate_k()   
        knn = KNeighborsClassifier(n_neighbors=k)
        knn.fit(self.dataset_list, self.strand_list)
        results = self.predict(knn)
        results["best_k"] = k          
        results["accuracy"] = acc      
        return results

    def calculate_k(self):
        X = np.array(self.dataset_list)
        y = np.array(self.strand_list)

        # ---- Step 1: GridSearchCV to find best K ----
        model = KNeighborsClassifier()
        param_grid = {'n_neighbors': list(range(5, 11))}
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        grid_search = GridSearchCV(model, param_grid, cv=skf, return_train_score=True)
        grid_search.fit(X, y)

        # ---- Step 2: Best parameters and results ----
        k = grid_search.best_params_['n_neighbors']
        acc = grid_search.best_score_
        print(f"\nBest K: {k}, Best Mean Accuracy: {acc:.4f}")

        # Keep cv_results_ for compatibility
        results = grid_search.cv_results_

        # ---- Accuracy summary (mean ± std) ----
        summary_table = [[k_val, f"{mean:.4f} ± {std:.4f}"]
                        for mean, std, k_val in zip(results['mean_test_score'], results['std_test_score'], results['param_n_neighbors'])]
        print("\nAccuracy per k (mean ± std):")
        print(tabulate(summary_table, headers=["k", "Mean ± Std"], tablefmt="grid"))

        # ---- Fold-level accuracies per k ----
        fold_scores_table = []
        for i, k_val in enumerate(results['param_n_neighbors']):
            fold_scores = [results[f"split{j}_test_score"][i] for j in range(skf.get_n_splits())]
            fold_scores_table.append([k_val] + [f"{s:.4f}" for s in fold_scores] + [f"{np.mean(fold_scores):.4f}"])

        fold_headers = ["k"] + [f"Fold {j+1}" for j in range(skf.get_n_splits())] + ["Average"]
        print("\nAccuracy of each fold for each k:")
        print(tabulate(fold_scores_table, headers=fold_headers, tablefmt="grid"))

        # ---- Step 3: Confusion matrices and metrics for best K ----
        best_model = KNeighborsClassifier(n_neighbors=k)
        all_conf = []
        all_y_test = []
        all_y_pred = []

        print("\nConfusion Matrices per Fold (Best K):")
        for fold_idx, (train_idx, test_idx) in enumerate(skf.split(X, y), 1):
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]

            best_model.fit(X_train, y_train)
            y_pred = best_model.predict(X_test)

            # Save for aggregated metrics
            all_y_test.extend(y_test)
            all_y_pred.extend(y_pred)

            cm = confusion_matrix(y_test, y_pred, labels=np.unique(y))
            all_conf.append(cm)
            fold_acc = accuracy_score(y_test, y_pred)

            print(f"\nFold {fold_idx} Confusion Matrix (Accuracy: {fold_acc:.4f}):")
            print(cm)

        # ---- Step 4: Aggregated confusion matrix and metrics ----
        final_cm = sum(all_conf)
        accuracy_final = accuracy_score(all_y_test, all_y_pred)
        precision_macro = precision_score(all_y_test, all_y_pred, average='macro', zero_division=0)
        recall_macro = recall_score(all_y_test, all_y_pred, average='macro', zero_division=0)
        f1_macro = f1_score(all_y_test, all_y_pred, average='macro', zero_division=0)

        print("\nFinal (Aggregated) Confusion Matrix:")
        print(final_cm)
        print("\nFinal Metrics (Aggregated from CV):")
        print(f"Accuracy : {accuracy_final:.4f}")
        print(f"Precision: {precision_macro:.4f}")
        print(f"Recall   : {recall_macro:.4f}")
        print(f"F1 Score : {f1_macro:.4f}")

        return k, acc, results, []



    def calculate_distance(self, knn):
        distances, indices = knn.kneighbors(self.sample_answers)
        print(distances)
        print(indices)
        return indices[0], distances[0]
         
    
    def predict(self, knn):
        indices, distances = self.calculate_distance(knn)
        nearest_neighbors = []
        k = len(indices)
        for i in range(k):            
            nearest_neighbors.append(self.strand_list[indices[i]])
        print(f"Nearest Neighbors: {nearest_neighbors}")
        total_stem = nearest_neighbors.count("STEM")
        total_humss = nearest_neighbors.count("HUMSS")
        total_abm = nearest_neighbors.count("ABM")
        strand_votes = {"stem_score": total_stem, "humss_score": total_humss, "abm_score": total_abm}
        vote_score = [total_stem, total_humss, total_abm]
        print(f"Votes: {strand_votes}")
        if vote_score.count(max(vote_score)) > 1:
            strand_votes["tie"] = True
            strand_votes["tie_strands"] = {}
            recommendation = self.tie_breaker(strand_votes, nearest_neighbors, distances, max(vote_score))
            
            
        else:
            strand_votes["tie"] = False           
            strand_votes["tie_strands"] = None
            recommendation = max(["stem_score", "humss_score", "abm_score"], key=strand_votes.get)
            
            print(f"Recommendation: {recommendation}")

        fixed_recommendation = self.fix_recommendation(recommendation)
        print(f"Recommendation: {fixed_recommendation}")
        strand_votes["recommendation"] = fixed_recommendation  
        strand_votes["neighbors"] = []
        strand_votes["k"] = k
        for i in range(k):
            strand_votes["neighbors"].append({})
            strand_votes["neighbors"][i]["neighbor_index"] = int(indices[i] + 1)
            strand_votes["neighbors"][i]["strand"] = nearest_neighbors[i]
            strand_votes["neighbors"][i]["distance"] = float(distances[i])
        

        return strand_votes


    def tie_breaker(self, strand_votes, nearest_neighbors, distances, tie_score):
        tied_strands = {}
        
        # Initialize weights for tied strands
        for key in strand_votes:
            if strand_votes[key] == tie_score:
                if key == "stem_score":
                    tied_strands["stem_weight"] = 0
                elif key == "humss_score":
                    tied_strands["humss_weight"] = 0
                elif key == "abm_score":
                    tied_strands["abm_weight"] = 0

        print(f"Tie between: {tied_strands}")

        # Calculate weighted distances for tied strands
        for i in range(len(nearest_neighbors)):
            convert_to_weighted = float(1 / distances[i])
            
            if nearest_neighbors[i] == "STEM" and "stem_weight" in tied_strands:
                tied_strands["stem_weight"] += convert_to_weighted
            elif nearest_neighbors[i] == "HUMSS" and "humss_weight" in tied_strands:
                tied_strands["humss_weight"] += convert_to_weighted
            elif nearest_neighbors[i] == "ABM" and "abm_weight" in tied_strands:
                tied_strands["abm_weight"] += convert_to_weighted

        # Determine the final recommendation based on weighted distances
        recommendation = max(tied_strands, key=tied_strands.get)
        if recommendation == "stem_weight":
            recommendation = "stem_score"
        elif recommendation == "humss_weight": 
            recommendation = "humss_score"
        elif recommendation == "abm_weight":
            recommendation = "abm_score"
        print(f"Final Recommendation: {recommendation}")
        
        strand_votes["tie"] = True
        strand_votes["tie_strands"] = tied_strands
        return recommendation
    
    def fix_recommendation(self, recommendation):
        if recommendation == "stem_weight" or recommendation == "stem_score":
            return "STEM"
        elif recommendation == "hummss_weight" or recommendation == "humss_score":
            return "HUMSS"
        elif recommendation == "abm_weight" or recommendation == "abm_score":
            return "ABM"
  
  



        
        
