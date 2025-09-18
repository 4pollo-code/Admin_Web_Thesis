from flask import Blueprint, request, jsonify, session, make_response
from ..models import User
from argon2 import PasswordHasher

auth_bp = Blueprint("login", __name__)
ph = PasswordHasher()

@auth_bp.route("/login", methods=["POST"])
def login():
    print(session)
    session.clear()
    print("Login endpoint hit")
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400
    print(email, password)
    
    user = User.query.filter_by(email=email).first()
    
    if user is None:
        return jsonify({"success": False, "message": "User not found"}), 404

    if user.role != "ADMIN":
        return jsonify({"success": False, "message": "Unauthorized"}), 403
    try:
        ph.verify(user.password, password)
    except Exception:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    session["user_id"] = user.user_id
    print(session)

    return jsonify({
        "success": True,
        "redirect": "/dashboard"
    }), 200

@auth_bp.route("/check-session")
def check_session():
    print(session)
    if "user_id" in session:
        return jsonify({"logged_in": True, "user": session["user_id"]})
    else:
        return jsonify({"logged_in": False}), 401
    
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    
    resp = make_response(jsonify({"success": True, "redirect": "/"}))

    resp.delete_cookie("session")

    return resp, 200
