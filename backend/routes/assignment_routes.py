
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.assignment import Assignment
from models.emergency import EmergencyReport
from models.responder import Responder
from models.resources import Resource
from models.user import User


assignment_bp = Blueprint(
    "assignment",
    __name__,
    url_prefix="/api/assignments"
)


def get_current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def admin_required():
    user = get_current_user()

    if not user or user.role != "admin":
        return None

    return user


# ADMIN: Create an assignment
@assignment_bp.route("/", methods=["POST"])
@jwt_required()
def create_assignment():

    admin = admin_required()

    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    emergency_id = data.get("emergency_id")
    responder_id = data.get("responder_id")
    resource_id = data.get("resource_id")
    resource_quantity = data.get("resource_quantity", 0)

    if not emergency_id or not responder_id:
        return jsonify({
            "error": "Emergency ID and responder ID are required"
        }), 400

    try:
        emergency_id = int(emergency_id)
        responder_id = int(responder_id)
        resource_quantity = int(resource_quantity)

        if resource_id is not None:
            resource_id = int(resource_id)

    except (ValueError, TypeError):
        return jsonify({"error": "IDs and quantity must be valid numbers"}), 400

    if resource_quantity < 0:
        return jsonify({"error": "Resource quantity cannot be negative"}), 400

    if resource_id is None and resource_quantity != 0:
        return jsonify({
            "error": "Select a resource when allocating a quantity"
        }), 400

    emergency = db.session.get(EmergencyReport, emergency_id)
    responder = db.session.get(Responder, responder_id)

    if not emergency:
        return jsonify({"error": "Emergency report not found"}), 404

    if not responder:
        return jsonify({"error": "Responder not found"}), 404

    if responder.approval_status != "approved":
        return jsonify({"error": "Responder is not approved"}), 400

    if responder.availability != "available":
        return jsonify({"error": "Responder is not available"}), 400

    existing_assignment = Assignment.query.filter(
        Assignment.responder_id == responder_id,
        Assignment.status.in_(["assigned", "in_progress"])
    ).first()

    if existing_assignment:
        return jsonify({
            "error": "Responder already has an active assignment"
        }), 400

    resource = None

    if resource_id is not None:
        resource = db.session.get(Resource, resource_id)

        if not resource:
            return jsonify({"error": "Resource not found"}), 404

        if resource.status != "active":
            return jsonify({"error": "Resource is inactive"}), 400

        if resource_quantity <= 0:
            return jsonify({
                "error": "Resource quantity must be greater than zero"
            }), 400

        if resource_quantity > resource.available_quantity:
            return jsonify({
                "error": "Insufficient resource quantity",
                "available_quantity": resource.available_quantity
            }), 400

    assignment = Assignment(
        emergency_id=emergency_id,
        responder_id=responder_id,
        resource_id=resource_id,
        resource_quantity=resource_quantity,
        assigned_by=admin.id,
        status="assigned"
    )

    try:
        if resource:
            resource.available_quantity -= resource_quantity

        responder.availability = "busy"

        db.session.add(assignment)
        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not create assignment"}), 500

    return jsonify({
        "message": "Assignment created successfully",
        "assignment": assignment.to_dict()
    }), 201


# ADMIN: View all assignments
@assignment_bp.route("/", methods=["GET"])
@jwt_required()
def get_assignments():

    admin = admin_required()

    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    assignments = Assignment.query.order_by(
        Assignment.created_at.desc()
    ).all()

    return jsonify({
        "count": len(assignments),
        "assignments": [item.to_dict() for item in assignments]
    }), 200


# ADMIN or assigned responder: View one assignment
@assignment_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment(assignment_id):

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    assignment = db.session.get(Assignment, assignment_id)

    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    if user.role != "admin":
        if (
            not user.responder_profile
            or user.responder_profile.id != assignment.responder_id
        ):
            return jsonify({"error": "Access denied"}), 403

    return jsonify({"assignment": assignment.to_dict()}), 200


# ADMIN or assigned responder: Update assignment status
@assignment_bp.route("/<int:assignment_id>/status", methods=["PATCH"])
@jwt_required()
def update_assignment_status(assignment_id):

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    assignment = db.session.get(Assignment, assignment_id)

    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    if user.role != "admin":
        if (
            not user.responder_profile
            or user.responder_profile.id != assignment.responder_id
        ):
            return jsonify({"error": "Access denied"}), 403

    data = request.get_json()

    if not data or "status" not in data:
        return jsonify({"error": "Status is required"}), 400

    new_status = data["status"]

    allowed_statuses = ["in_progress", "completed", "cancelled"]

    if new_status not in allowed_statuses:
        return jsonify({"error": "Invalid assignment status"}), 400

    if assignment.status in ["completed", "cancelled"]:
        return jsonify({
            "error": "This assignment is already closed"
        }), 400

    responder = db.session.get(Responder, assignment.responder_id)

    try:
        if new_status == "cancelled" and assignment.resource_id:
            resource = db.session.get(Resource, assignment.resource_id)

            if resource:
                resource.available_quantity += assignment.resource_quantity

        if new_status in ["completed", "cancelled"] and responder:
            responder.availability = "available"

        assignment.status = new_status

        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not update assignment"}), 500

    return jsonify({
        "message": "Assignment status updated successfully",
        "assignment": assignment.to_dict()
    }), 200
