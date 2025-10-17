from flask import Blueprint, jsonify, request
from sqlalchemy import func
from app import db
from app.models import Course

course_bp = Blueprint("course_bp", __name__, url_prefix="/courses")

# Get all courses
@course_bp.route("/", methods=["GET"])
def get_courses():
    courses = Course.query.order_by(Course.course_name.asc()).all()
    return jsonify([c.course_info() for c in courses]), 200

# Create a new course
@course_bp.route("/", methods=["POST"])
def create_course():
    data = request.get_json()
    raw_name = data.get("course_name", "").strip()

    if not raw_name:
        return jsonify({"error": "Course name is required"}), 400

    formatted_name = raw_name.title()  # Make Title Case (e.g., "Bachelor Of Science In IT")

    # Case-insensitive duplicate check
    existing_course = Course.query.filter(func.lower(Course.course_name) == func.lower(formatted_name)).first()
    if existing_course:
        return jsonify({"error": f'Course "{formatted_name}" already exists.'}), 400

    new_course = Course(course_name=formatted_name)
    db.session.add(new_course)
    db.session.commit()
    return jsonify(new_course.course_info()), 201

# Update course
@course_bp.route("/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    raw_name = data.get("course_name", "").strip()

    if not raw_name:
        return jsonify({"error": "Course name is required"}), 400

    formatted_name = raw_name.title()

    # Check for duplicates excluding current course (case-insensitive)
    existing_course = Course.query.filter(
        func.lower(Course.course_name) == func.lower(formatted_name),
        Course.course_id != course_id
    ).first()
    if existing_course:
        return jsonify({"error": f'Another course named "{formatted_name}" already exists.'}), 400

    course.course_name = formatted_name
    db.session.commit()
    return jsonify(course.course_info()), 200

# Delete course
@course_bp.route("/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted successfully"}), 200
