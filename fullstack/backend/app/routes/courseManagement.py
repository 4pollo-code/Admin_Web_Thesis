# app/routes/course_management.py
from flask import Blueprint, jsonify, request
from app import db
from app.models import Course

course_bp = Blueprint("course_bp", __name__, url_prefix="/courses")

# Get all courses
@course_bp.route("/", methods=["GET"])
def get_courses():
    courses = Course.query.order_by(Course.created_at.desc()).all()
    return jsonify([c.course_info() for c in courses]), 200

# Create a new course
@course_bp.route("/", methods=["POST"])
def create_course():
    data = request.json
    if not data.get("course_name"):
        return jsonify({"error": "Course name is required"}), 400

    if Course.query.filter_by(course_name=data["course_name"]).first():
        return jsonify({"error": "Course already exists"}), 400

    new_course = Course(course_name=data["course_name"])
    db.session.add(new_course)
    db.session.commit()
    return jsonify(new_course.course_info()), 201

# Update course
@course_bp.route("/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.json
    if not data.get("course_name"):
        return jsonify({"error": "Course name is required"}), 400

    if Course.query.filter(Course.course_name==data["course_name"], Course.course_id!=course_id).first():
        return jsonify({"error": "Another course with same name exists"}), 400

    course.course_name = data["course_name"]
    db.session.commit()
    return jsonify(course.course_info()), 200

# Delete course
@course_bp.route("/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted successfully"}), 200
