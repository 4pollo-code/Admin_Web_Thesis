from flask import Blueprint, request, jsonify, session, make_response
from ..models import User
from argon2 import PasswordHasher
from app.services.verify_email import verify_email
from .. import db

auth_bp = Blueprint("login", __name__)
ph = PasswordHasher()
OTP_EXPIRY = 300      
RESEND_COOLDOWN = 60  

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

@auth_bp.route("/request-otp", methods=["POST"])
def request_otp():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    otp = verify_email(email)
    if not otp:
        return jsonify({"success": False, "message": "Error sending OTP email"}), 500

    session["password_reset_otp"] = otp
    session["password_reset_email"] = email

    return jsonify({"success": True, "message": "OTP sent to email"}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    otp = data.get("otp")
    new_password = data.get("newPassword")

    if not otp or not new_password:
        return jsonify({"success": False, "message": "OTP and new password are required"}), 400

    # Check session
    if "password_reset_otp" not in session or "password_reset_email" not in session:
        return jsonify({"success": False, "message": "No password reset session found"}), 400

    if str(session["password_reset_otp"]) != str(otp):
        return jsonify({"success": False, "message": "Invalid OTP"}), 400

    # Update user password
    user = User.query.filter_by(email=session["password_reset_email"]).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    hashed_password = ph.hash(new_password)
    user.password = hashed_password
    db.session.commit()

    # Clear session
    session.pop("password_reset_otp", None)
    session.pop("password_reset_email", None)

    return jsonify({"success": True, "message": "Password reset successfully"}), 200

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    print("/me hit")
    print(session)
    try:
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Not logged in"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.user_info()), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get current user: {str(e)}"}), 500