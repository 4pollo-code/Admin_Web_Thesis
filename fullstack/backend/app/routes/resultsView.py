# app/routes/results.py
from flask import Blueprint, jsonify
from app import db
from app.models import Results, Assessment, User, DataSet, Neighbors, TieTable

results_bp = Blueprint("results", __name__, url_prefix="/results")

@results_bp.route("/", methods=["GET"])
def get_all_results():
    results = Results.query.all()
    response = []

    for r in results:
        assessment = Assessment.query.get(r.assessment_id)
        user = User.query.get(assessment.user_id) if assessment else None
        dataset = DataSet.query.get(assessment.data_set_id) if assessment else None

        response.append({
            **r.result_info(),

            "user_data": {
                "name": f"{user.first_name} {user.last_name}" if user else None,
                "email": user.email if user else None,
            },

            "dataset": {
                "data_set_id": dataset.data_set_id if dataset else None,
                "data_set_name": dataset.data_set_name if dataset else None,
                "created_at": dataset.created_at.isoformat() if dataset else None
            },

            # ✅ Include both result scores and assessment totals
            "assessment_info": {
                "stem_score": float(r.stem_score),
                "humss_score": float(r.humss_score),
                "abm_score": float(r.abm_score),
                "stem_total": float(assessment.stem_total) if assessment else 0,
                "humss_total": float(assessment.humss_total) if assessment else 0,
                "abm_total": float(assessment.abm_total) if assessment else 0,
                "created_at": assessment.created_at.isoformat() if assessment else None,
            },

            "neighbors": [
                {
                    "neighbor_index": n.neighbor_index,
                    "strand": n.strand,
                    "distance": float(n.distance) if n.distance else 0
                } for n in r.neighbors
            ],

            "tie_info": {
                "stem_weight": r.tie_table.stem_weight,
                "humss_weight": r.tie_table.humss_weight,
                "abm_weight": r.tie_table.abm_weight
            } if r.tie_table else None
        })

    return jsonify(response), 200
