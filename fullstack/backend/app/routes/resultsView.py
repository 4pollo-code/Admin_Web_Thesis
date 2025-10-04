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

        # Collect neighbors
        neighbors = [n.neighbor_info() for n in r.neighbors]

        # Collect tie info
        tie_info = r.tie_table.tie_info() if r.tie_table else None

        response.append({
            **r.result_info(),
            "user_data": {
                "name": f"{user.first_name} {user.last_name}" if user else None,
                "email": user.email if user else None,
                "grade_level": "N/A"  # add grade level column to User if you want
            },
            "dataset": {
                "name": dataset.data_set_name if dataset else None,
                "created_at": dataset.created_at.isoformat() if dataset else None
            },
            "neighbors": neighbors,
            "tie_info": tie_info
        })

    return jsonify(response)
