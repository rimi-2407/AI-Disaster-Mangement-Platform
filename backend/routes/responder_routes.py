
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from models.responder import Responder


responder_bp = Blueprint(
    "responders",
    __name__,
    url_prefix="/api/responders"
)


def get_current_user():
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return None

    return db.session.get(User, user_id)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = get_current_user()

        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        return fn(*args, **kwargs)

    return wrapper


def validate_responder_data(data, include_account=True):
    if not isinstance(data, dict):
        return "Request body must be valid JSON"

    required_fields = ["phone", "location", "specialisation"]

    if include_account:
        required_fields.extend(["username", "email", "password"])

    for field in required_fields:
        value = data.get(field)

        if not isinstance(value, str) or not value.strip():
            return f"{field} is required"

    if include_account:
        if len(data["password"]) < 8:
            return "Password must contain at least 8 characters"

        if "@" not in data["email"]:
            return "Enter a valid email address"

    return None


def create_responder_account(data, approval_status="pending"):
    email = data["email"].strip().lower()

    if User.query.filter_by(email=email).first():
        return None, "An account with this email already exists", 409

    try:
        user = User(
            username=data["username"].strip(),
            email=email,
            role="responder"
        )

        user.set_password(data["password"])

        db.session.add(user)
        db.session.flush()

        responder = Responder(
            user_id=user.id,
            phone=data["phone"].strip(),
            location=data["location"].strip(),
            specialisation=data["specialisation"].strip(),
            approval_status=approval_status,
            availability="unavailable"
        )

        db.session.add(responder)
        db.session.commit()

        return responder, None, 201

    except Exception:
        db.session.rollback()
        return None, "Could not create responder account", 500


# 1. Responder self-registration
@responder_bp.route("/register", methods=["POST"])
def register_responder():
    data = request.get_json(silent=True)

    error = validate_responder_data(data)

    if error:
        return jsonify({"error": error}), 400

    responder, error, status_code = create_responder_account(
        data,
        approval_status="pending"
    )

    if error:
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Responder registered successfully. Awaiting admin approval.",
        "responder": responder.to_dict()
    }), 201


# 2. Admin creates a responder account
@responder_bp.route("/admin", methods=["POST"])
@admin_required
def admin_create_responder():
    data = request.get_json(silent=True)

    error = validate_responder_data(data)

    if error:
        return jsonify({"error": error}), 400

    responder, error, status_code = create_responder_account(
        data,
        approval_status="approved"
    )

    if error:
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Responder account created successfully",
        "responder": responder.to_dict()
    }), 201


# 3. Admin views all responders
@responder_bp.route("/", methods=["GET"])
@admin_required
def get_all_responders():
    responders = Responder.query.order_by(
        Responder.created_at.desc()
    ).all()

    return jsonify({
        "count": len(responders),
        "responders": [
            responder.to_dict() for responder in responders
        ]
    }), 200


# 4. View a responder's profile
@responder_bp.route("/<int:responder_id>", methods=["GET"])
@jwt_required()
def get_responder(responder_id):
    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    responder = db.session.get(Responder, responder_id)

    if not responder:
        return jsonify({"error": "Responder not found"}), 404

    if user.role != "admin" and responder.user_id != user.id:
        return jsonify({"error": "Access denied"}), 403

    return jsonify({
        "responder": responder.to_dict()
    }), 200


# 5. Admin approves or rejects a responder
@responder_bp.route("/<int:responder_id>/approval", methods=["PATCH"])
@admin_required
def update_responder_approval(responder_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    status = data.get("approval_status")

    if not isinstance(status, str) or status not in ["approved", "rejected"]:
        return jsonify({
            "error": "Status must be approved or rejected"
        }), 400

    responder = db.session.get(Responder, responder_id)

    if not responder:
        return jsonify({"error": "Responder not found"}), 404

    responder.approval_status = status

    if status == "rejected":
        responder.availability = "unavailable"

    try:
        db.session.commit()

        return jsonify({
            "message": "Responder status updated",
            "responder": responder.to_dict()
        }), 200

    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Could not update responder approval"
        }), 500


# 6. Responder updates availability
@responder_bp.route("/<int:responder_id>/availability", methods=["PATCH"])
@jwt_required()
def update_availability(responder_id):
    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    responder = db.session.get(Responder, responder_id)

    if not responder:
        return jsonify({"error": "Responder not found"}), 404

    if user.role != "admin" and (
        user.role != "responder" or responder.user_id != user.id
    ):
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    availability = data.get("availability")

    if not isinstance(availability, str) or availability not in [
        "available", "unavailable", "busy"
    ]:
        return jsonify({
            "error": "Availability must be available, unavailable, or busy"
        }), 400

    if responder.approval_status != "approved":
        return jsonify({
            "error": "Only approved responders can update availability"
        }), 403

    responder.availability = availability

    try:
        db.session.commit()

        return jsonify({
            "message": "Availability updated successfully",
            "responder": responder.to_dict()
        }), 200

    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Could not update availability"
        }), 500
