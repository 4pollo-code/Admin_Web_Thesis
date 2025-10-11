from flask import Blueprint, request, jsonify
from ..models import User
from argon2 import PasswordHasher
from datetime import datetime, timedelta
from app.services.verify_email import verify_email
from app.services.jwt_utils import generate_jwt, decode_jwt, token_required, create_password_reset_token
from ..config import Config
from .. import db

auth_bp = Blueprint("auth", __name__)
ph = PasswordHasher()
SECRET_KEY = Config.SECRET_KEY
ALGORITHM = Config.ALGORITHM
JWT_EXPIRATION_SECONDS = 3600 
OTP_EXPIRY = 300      
RESEND_COOLDOWN = 60  


@auth_bp.route("/login", methods=["POST"])
def login():

    print("Login endpoint hit")
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    remember = data.get("remember", False)

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

    token = generate_jwt({"user_id": user.user_id, "email": user.email})
    return jsonify({
        "success": True,
        "token": token,
    }), 200



# Verify email using JWT
@auth_bp.route("/verify-email", methods=["POST"])
@token_required
def verify_email_code(payload):
    
    data = request.get_json()
    otp = data.get("otp")

    if not otp:
        return jsonify({"success": False, "message": "OTP is required"}), 400

    # Verify OTP from JWT payload
    if str(payload.get("otp")) != str(otp):
        return jsonify({"success": False, "message": "Invalid OTP"}), 400

    # Create new user
    new_user = User(
        email=payload["email"],
        password=payload["password"],
        first_name=payload["first_name"],
        last_name=payload["last_name"],
        middle_name=payload["middle_name"],
        affix=payload["affix"],
        birthday=datetime.strptime(payload["birthday"], "%Y-%m-%d").date(),
        role="USER"
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True, "message": "Email verified, user created successfully"}), 201


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

  
    reset_token_payload = {
        "email": email,
        "otp": str(otp)
    }
    reset_token = generate_jwt(reset_token_payload, expires_in=OTP_EXPIRY)

    return jsonify({
        "success": True,
        "message": "OTP sent to email",
        "reset_token": reset_token
    }), 200


@auth_bp.route("/forgot-password", methods=["POST"])
@token_required
def forgot_password(payload):
    data = request.get_json()
    otp = data.get("otp")
    reset_token = data.get("reset_token")  
    new_password = data.get("newPassword")
    print(data)
    if not otp or not reset_token or not new_password:
        return jsonify({"success": False, "message": "OTP, token, and new password are required"}), 400

    if not payload:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 400
    print(payload)
    if str(payload["otp"]) != str(otp):
        return jsonify({"success": False, "message": "Invalid OTP"}), 400

    user = User.query.filter_by(email=payload["email"]).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    hashed_password = ph.hash(new_password)
    user.password = hashed_password
    db.session.commit()

    return jsonify({"success": True, "message": "Password reset successfully"}), 200

@auth_bp.route("/verify-password", methods=["POST"])
@token_required
def verify_password(payload):
    data = request.get_json()
    password = data.get("password")

    if not password:
        return jsonify({"valid": False, "message": "Password is required"}), 400
    user = User.query.get(payload["user_id"])
    if not user:
        return jsonify({"valid": False, "message": "User not found"}), 404
    try:
        ph.verify(user.password, password)
        return jsonify({"valid": True}), 200
    except Exception:
        return jsonify({"valid": False, "message": "Your current password is wrong"}), 401

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(payload):
    user_id = payload.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.user_info()), 200