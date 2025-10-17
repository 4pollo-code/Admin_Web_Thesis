from flask import Blueprint, request, jsonify
from app import db
from app.models import db, DataSet, Data, Question, QuestionSet
from sqlalchemy.exc import SQLAlchemyError
import pandas as pd

dataset_bp = Blueprint("datasets", __name__)

def normalize(text):
    """Utility to clean question text for reliable matching."""
    if not text:
        return ""
    return (
        text.strip()
        .replace("&", "and")    # unify symbols
        .replace("  ", " ")     # collapse double spaces
        .lower()                # ignore case
    )

# Get all datasets
@dataset_bp.route("/datasets", methods=["GET"])
def get_datasets():

    try:
        datasets = DataSet.query.all()
        response = []
        for ds in datasets:
            print("Loaded dataset:", ds)  
            rows_count = Data.query.filter_by(data_set_id=ds.data_set_id).count()
            print("Rows count:", rows_count)
            print("DataSet info:", ds.data_set_info()) 
            response.append({
                **ds.data_set_info(),
                "rows": rows_count
            })
        return jsonify(response), 200
    except Exception as e:  
        print("❌ ERROR in /datasets:", str(e))
        return jsonify({"error": str(e)}), 500

# Create a new dataset
@dataset_bp.route("/import_dataset", methods=["POST"])
def import_dataset():
    try:
        data = request.get_json()
        dataset_name = data.get("dataset_name")

        if DataSet.query.filter_by(data_set_name=dataset_name).first():
            return jsonify({"error": "A dataset with this name already exists."}), 409
        
        description = data.get("description")
        question_set_id = data.get("question_set_id")
        rows = data.get("rows", [])

        if not dataset_name or not question_set_id or not rows:
            print("❌ Missing data:", {
                "dataset_name": dataset_name,
                "question_set_id": question_set_id,
                "rows_count": len(rows)
            })
            return jsonify({"error": "Missing dataset_name, question_set_id, or rows"}), 400

        print(f"📥 Importing dataset: {dataset_name}")
        print(f"➡️ Total rows received: {len(rows)}")
        print(f"➡️ Columns in first row: {list(rows[0].keys())}")

        # --- Fetch questions from DB ---
        questions = Question.query.filter_by(set_id=question_set_id).all()
        print(f"📚 Questions found in DB for set {question_set_id}: {len(questions)}")

        if not questions:
            return jsonify({"error": "No questions found for this question set"}), 400

        db_questions = {normalize(q.question_text): q.strand for q in questions}
        print(f"🧩 Normalized DB questions: {list(db_questions.keys())[:5]} ...")

        # --- Normalize file columns ---
        file_questions = [q for q in rows[0].keys() if normalize(q) != "strand"]
        norm_file_questions = {normalize(q) for q in file_questions}
        print(f"📄 Questions found in file: {len(norm_file_questions)}")
        print(f"🧠 Normalized file questions sample: {list(norm_file_questions)[:5]}")

        # --- Check mismatches ---
        missing_in_file = set(db_questions.keys()) - norm_file_questions
        extra_in_file = norm_file_questions - set(db_questions.keys())

        print(f"⚠️ Missing questions in file: {len(missing_in_file)}")
        print(f"⚠️ Extra questions in file: {len(extra_in_file)}")

      

        # --- Stop if any validation issues exist ---
        if missing_in_file:
            print("❌ Import failed — missing required columns or Strand values.")
            return jsonify({
                "error": "Import failed due to missing questions or Strand values.",
                "missing_questions": list(missing_in_file),
            }), 400

        # --- Log but ignore extra questions ---
        if extra_in_file:
            print(f"⚠️ Ignoring {len(extra_in_file)} extra question(s) not in DB: {list(extra_in_file)[:5]}")

        # --- Continue import only if everything is valid ---
        dataset = DataSet(
            data_set_name=dataset_name,
            data_set_description=description,
            question_set_id=question_set_id,
            best_k=0,
            accuracy=0.0
        )
        db.session.add(dataset)
        db.session.flush()

        strand_entries = []

        for row in rows:
            raw_strand = (
                row.get("Strand")
                or row.get("strand")
                or row.get("Is your Senior High School strand aligned with your current course/program?")
                or ""
            ).strip()

            # Map long-form strand names to short forms
            strand_map = {
                "science, technology, engineering and mathematics": "STEM",
                "humanities and social sciences": "HUMSS",
                "accountancy and business management": "ABM"
            }

            norm_strand = normalize(raw_strand)
            for key, val in strand_map.items():
                if key in norm_strand:
                    strand_label = val
                    break
            else:
                strand_label = raw_strand

            totals = {"STEM": 0, "ABM": 0, "HUMSS": 0}

            for question, value in row.items():
                norm_q = normalize(question)
                if norm_q == "strand" or norm_q not in db_questions:
                    continue
                strand = db_questions.get(norm_q)
                if strand in totals:
                    try:
                        totals[strand] += int(value or 0)
                    except (ValueError, TypeError):
                        return jsonify({"error": f"Invalid score for question '{question}'"}), 400

            entry = Data(
                data_set_id=dataset.data_set_id,
                strand=strand_label,
                stem_score=totals["STEM"],
                abm_score=totals["ABM"],
                humss_score=totals["HUMSS"],
            )
            db.session.add(entry)
            strand_entries.append(entry.data_info())

        print(f"✅ Successfully processed {len(strand_entries)} rows with strand labels")

        # --- Run KNN ---
        from app.services.KNN import KNN
        X = [[r["stem_score"], r["abm_score"], r["humss_score"]] for r in strand_entries]
        y = [r["strand"] for r in strand_entries]

        if len(X) >= 2:
            knn_runner = KNN(None, X, y)
            best_k, accuracy, results, fold_data = knn_runner.calculate_k()
            dataset.best_k = best_k
            dataset.accuracy = float(accuracy)
        else:
            dataset.best_k = 5
            dataset.accuracy = 1.0

        db.session.commit()

        print(f"✅ Import complete — K={dataset.best_k}, Accuracy={dataset.accuracy:.2f}")

        return jsonify({
            "success": True,
            "dataset": dataset.data_set_info(),
            "rows": strand_entries
        }), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Error during import:", str(e))
        return jsonify({"error": str(e)}), 500


@dataset_bp.route("/datasets/<int:data_set_id>", methods=["DELETE"])
def delete_dataset(data_set_id):
    try:
        dataset = DataSet.query.get_or_404(data_set_id)
        db.session.delete(dataset)
        db.session.commit()
        return jsonify({"message": "Dataset deleted successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@dataset_bp.route("/datasets/<int:data_set_id>/records", methods=["GET"])
def get_dataset_records(data_set_id):
    try:
        records = Data.query.filter_by(data_set_id=data_set_id).all()
        return jsonify([r.data_info() for r in records]), 200
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500
    
@dataset_bp.route("/activate/<int:data_set_id>", methods=["PUT", "OPTIONS"])
def update_dataset_status(data_set_id):
    if request.method == "OPTIONS":
        # Preflight request, just return OK with headers
        return "", 200

    try:
        dataset = DataSet.query.get_or_404(data_set_id)
        data = request.get_json()
        new_status = data.get("status")

        if new_status == "Active":
            DataSet.query.filter(
                DataSet.data_set_id != data_set_id,
                DataSet.status == "Active"
            ).update({"status": "Inactive"}, synchronize_session=False)
            dataset.status = "Active"

        elif new_status == "Inactive":
            dataset.status = "Inactive"

        print("Changed to ACtive")
        db.session.commit()
        return jsonify(dataset.data_set_info()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": str(e)}), 500


@dataset_bp.route("/datasets/<int:data_set_id>", methods=["PUT"])
def update_dataset_info(data_set_id):
    try:
        dataset = DataSet.query.get_or_404(data_set_id)
        data = request.get_json()
        new_name = data.get("data_set_name", dataset.data_set_name)

        # ✅ Check for duplicate dataset name
        existing = DataSet.query.filter(
            DataSet.data_set_name == new_name,
            DataSet.data_set_id != data_set_id
        ).first()

        if existing:
            return jsonify({
                "error": f"A dataset with the name '{new_name}' already exists."
            }), 409  # Conflict

        # ✅ Update fields
        dataset.data_set_name = new_name
        dataset.data_set_description = data.get("data_set_description", dataset.data_set_description)
        db.session.commit()

        print("✅ Updated dataset:", dataset.data_set_info())
        return jsonify(dataset.data_set_info()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

