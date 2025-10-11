import jwt
from datetime import datetime, timedelta
from flask import current_app
from functools import wraps
from flask import request, jsonify

def generate_jwt(payload, expires_in=None):
    expires_in = expires_in or current_app.config.get("JWT_EXPIRATION_SECONDS", 3600)
    payload_copy = payload.copy()
    payload_copy["exp"] = datetime.utcnow() + timedelta(seconds=expires_in)
    token = jwt.encode(payload_copy, current_app.config["SECRET_KEY"], algorithm="HS256")
    return token

def decode_jwt(token):
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header missing"}), 401
        token = auth_header.split(" ")[1]
        payload = decode_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(payload, *args, **kwargs)
    return decorated

def create_password_reset_token(user_email, otp):
    payload = {
        "email": user_email,
        "otp": otp
    }

    # Short expiry (e.g., 5 minutes)
    token = generate_jwt(payload, expires_in=300)
    return token