from flask import Blueprint, request, jsonify
from app import db
from app.models import QuestionSet, Question
from sqlalchemy.exc import SQLAlchemyError

question_sets_bp = Blueprint("question-sets", __name__)

# Get all question sets
@question_sets_bp.route("/question-sets", methods=["GET"])
def get_question_sets():
    sets = QuestionSet.query.all()
    response = []
    for s in sets:
        response.append({
            "question_set_id": s.question_set_id,
            "question_set_name": s.question_set_name,
        
            "total_questions": len(Question.query.filter_by(set_id=s.question_set_id).all()),
            "responses": 0,   
            "description": s.description,  # optional field
            "created_at": s.created_at.isoformat()
        })
    return jsonify(response), 200


# Get a specific question set (with all questions)
@question_sets_bp.route("/question-sets/<int:set_id>", methods=["GET"])
def get_question_set(set_id):
    s = QuestionSet.query.get_or_404(set_id)
    return jsonify({
        "question_set_id": s.question_set_id,
        "question_set_name": s.question_set_name,

        "questions": [
            {
                "question_id": q.question_id,
                "question_text": q.question_text,
                "strand": q.strand
            } for q in s.questions
        ]
    })


# Add new question set
@question_sets_bp.route("/question-sets", methods=["POST"])
def create_question_set():
    print(" Received request to create question set")
    try:
        data = request.get_json()
        print("📥 Received payload:", data)

        # Step 1: Create QuestionSet
        new_set = QuestionSet(
            question_set_name=data["question_set_name"],
            description=data.get("description", "")
        )
        db.session.add(new_set)
        db.session.flush() 

        for q in data.get("questions", []):
            new_question = Question(
                question_text=q["question_text"],
                strand=q["strand"],
                set_id=new_set.question_set_id
            )
            db.session.add(new_question)

        db.session.commit()

        return jsonify(new_set.question_set_info()), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Error:", str(e))
        return jsonify({"error": str(e)}), 400

@question_sets_bp.route("/question-sets/<int:set_id>", methods=["PUT"])
def update_question_set(set_id):
    s = QuestionSet.query.get_or_404(set_id)
    try:
        data = request.get_json()
        s.question_set_name = data.get("question_set_name", s.question_set_name)
        s.description = data.get("description", s.description)
        db.session.commit()
        return jsonify(s.question_set_info()), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
   






@question_sets_bp.route("/question-sets/<int:set_id>/questions", methods=["GET"])
def get_questions_for_set(set_id):
    questions = Question.query.filter_by(set_id=set_id).all()
    return jsonify([{
        "question_id": q.question_id,
        "question_text": q.question_text,
        "strand": q.strand
    } for q in questions])

@question_sets_bp.route("/question-sets/<int:set_id>", methods=["DELETE"])
def delete_question_set(set_id):
    s = QuestionSet.query.get_or_404(set_id)
    try:
        db.session.delete(s)
        db.session.commit()
        return jsonify({"message": f"Question set {set_id} deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400