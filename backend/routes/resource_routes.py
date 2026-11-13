
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from models.resources import Resource


resource_bp = Blueprint(
    "resources",
    __name__,
    url_prefix="/api/resources"
)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        try:
            user_id = int(get_jwt_identity())
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid user identity"}), 401

        user = db.session.get(User, user_id)

        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        return fn(*args, **kwargs)

    return wrapper


def validate_resource_data(data, partial=False):
    if not isinstance(data, dict):
        return "Request body must be valid JSON"

    required_fields = ["name", "category", "location"]

    if not partial:
        for field in required_fields:
            value = data.get(field)
            if not isinstance(value, str) or not value.strip():
                return f"{field} is required"

    string_fields = [
        "name", "category", "location", "unit",
        "description", "contact_person", "contact_phone"
    ]

    for field in string_fields:
        if field in data and data[field] is not None:
            if not isinstance(data[field], str):
                return f"{field} must be a string"

            if field in ["name", "category", "location", "unit"]:
                if not data[field].strip():
                    return f"{field} cannot be empty"

    for field in ["quantity", "available_quantity"]:
        if field in data:
            value = data[field]

            if type(value) is not int or value < 0:
                return f"{field} must be a non-negative integer"

    for field, minimum, maximum in [
        ("latitude", -90, 90),
        ("longitude", -180, 180)
    ]:
        if field in data and data[field] is not None:
            value = data[field]

            if type(value) not in (int, float):
                return f"{field} must be a number"

            if not minimum <= value <= maximum:
                return f"{field} must be between {minimum} and {maximum}"

    if "status" in data:
        if data["status"] not in ["active", "inactive"]:
            return "status must be active or inactive"

    return None


def check_quantities(quantity, available_quantity):
    if available_quantity > quantity:
        return "Available quantity cannot exceed total quantity"

    return None


def commit_changes():
    try:
        db.session.commit()
        return None
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database operation failed"}), 500


# 1. Add a new resource (Admin only)
@resource_bp.route("/", methods=["POST"])
@admin_required
def add_resource():
    data = request.get_json(silent=True)

    error = validate_resource_data(data)

    if error:
        return jsonify({"error": error}), 400

    quantity = data.get("quantity", 0)
    available_quantity = data.get("available_quantity", quantity)

    error = check_quantities(quantity, available_quantity)

    if error:
        return jsonify({"error": error}), 400

    resource = Resource(
        name=data["name"].strip(),
        category=data["category"].strip(),
        description=data.get("description"),
        quantity=quantity,
        available_quantity=available_quantity,
        unit=data.get("unit", "units").strip(),
        location=data["location"].strip(),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        contact_person=data.get("contact_person"),
        contact_phone=data.get("contact_phone"),
        status=data.get("status", "active")
    )

    db.session.add(resource)

    result = commit_changes()
    if result:
        return result

    return jsonify({
        "message": "Resource added successfully",
        "resource": resource.to_dict()
    }), 201


# 2. View all resources (Authenticated users)
@resource_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_resources():
    query = Resource.query

    category = request.args.get("category")
    location = request.args.get("location")
    status = request.args.get("status")

    if category:
        query = query.filter(Resource.category.ilike(f"%{category}%"))

    if location:
        query = query.filter(Resource.location.ilike(f"%{location}%"))

    if status:
        if status.lower() not in ["active", "inactive"]:
            return jsonify({"error": "Invalid status filter"}), 400

        query = query.filter_by(status=status.lower())

    resources = query.order_by(Resource.created_at.desc()).all()

    return jsonify({
        "count": len(resources),
        "resources": [resource.to_dict() for resource in resources]
    }), 200


# 3. View one resource
@resource_bp.route("/<int:resource_id>", methods=["GET"])
@jwt_required()
def get_resource(resource_id):
    resource = db.session.get(Resource, resource_id)

    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    return jsonify({"resource": resource.to_dict()}), 200


# 4. Update a resource (Admin only)
@resource_bp.route("/<int:resource_id>", methods=["PUT"])
@admin_required
def update_resource(resource_id):
    resource = db.session.get(Resource, resource_id)

    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    data = request.get_json(silent=True)

    error = validate_resource_data(data, partial=True)

    if error:
        return jsonify({"error": error}), 400

    quantity = data.get("quantity", resource.quantity)
    available_quantity = data.get(
        "available_quantity",
        resource.available_quantity
    )

    error = check_quantities(quantity, available_quantity)

    if error:
        return jsonify({"error": error}), 400

    allowed_fields = [
        "name", "category", "description",
        "quantity", "available_quantity", "unit",
        "location", "latitude", "longitude",
        "contact_person", "contact_phone", "status"
    ]

    for field in allowed_fields:
        if field in data:
            value = data[field]

            if field in ["name", "category", "unit", "location"]:
                value = value.strip()

            setattr(resource, field, value)

    result = commit_changes()
    if result:
        return result

    return jsonify({
        "message": "Resource updated successfully",
        "resource": resource.to_dict()
    }), 200


# 5. Delete a resource (Admin only)
@resource_bp.route("/<int:resource_id>", methods=["DELETE"])
@admin_required
def delete_resource(resource_id):
    resource = db.session.get(Resource, resource_id)

    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    db.session.delete(resource)

    result = commit_changes()
    if result:
        return result

    return jsonify({
        "message": "Resource deleted successfully"
    }), 200
