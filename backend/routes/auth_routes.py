
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from extensions import db
from models.user import User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON object is required"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({
            "error": "Username, email and password are required"
        }), 400

    if len(username) < 3 or len(username) > 80:
        return jsonify({
            "error": "Username must contain between 3 and 80 characters"
        }), 400

    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"error": "Enter a valid email address"}), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters"
        }), 400

    if len(password) > 128:
        return jsonify({"error": "Password is too long"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"error": "Email is already registered"}), 409

    user = User(
        username=username,
        email=email
    )
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not register user"}), 500

    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON object is required"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():

    user_id = get_jwt_identity()

    try:
        user = db.session.get(User, int(user_id))
    except (ValueError, TypeError):
        user = None

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": user.to_dict()
    }), 200
