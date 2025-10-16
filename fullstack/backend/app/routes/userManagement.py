from flask import Blueprint, request, jsonify
from ..models import User
from app import db
from ..services.hashing import hash_password
from sqlalchemy.exc import IntegrityError

userManagement_bp = Blueprint("user-management", __name__)


# CREATE
@userManagement_bp.route("/user-management", methods=["POST"])
def create(): 
    try:
        data = request.get_json()

        new_user = User(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],  
            affix=data.get("affix"),
            password= hash_password(data["password"]),
            birthday=data.get("birthday"),
            role=data.get("role")
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        print(e)
        db.session.rollback()
        if "user_data_email_key" in str(e):
            return jsonify({"error": "Email already exists in the system"}), 400

        return jsonify({"error": f"Failed to Create User: {str(e)}"}), 500

# DELETE
@userManagement_bp.route("/user-management/<int:chosen_id>", methods=["DELETE"])
def delete(chosen_id):
    try:
        user = User.query.get(chosen_id)    
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": f"Failed to Delete User: {str(e)}"}), 500


# UPDATE
@userManagement_bp.route("/user-management/<int:chosen_id>", methods=["PUT"])
def update(chosen_id):
    try:
        data = request.get_json()
        print(data)
        user = User.query.get(chosen_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.email = data.get("email", user.email)
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.affix = data.get("affix", user.affix)
        user.password = data.get("password", user.password)
        user.role = data.get("role", user.role)

        db.session.commit()
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": f"Failed to Update User: {str(e)}"}), 500


# READ
@userManagement_bp.route("/user-management", methods=["GET"])
def display_users():
    try:
        users = User.query.all()
        users_list = [user.user_info() for user in users]
        return jsonify(users_list), 200
    except Exception as e:
        print(e)
        return jsonify({"error": f"Failed to Retrieve Users: {str(e)}"}), 500
    

