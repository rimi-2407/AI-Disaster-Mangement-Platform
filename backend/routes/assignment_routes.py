
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
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return None

    return db.session.get(User, user_id)


def admin_required():
    user = get_current_user()

    if not user or user.role != "admin":
        return None

    return user


# ADMIN: Create an assignment (responder is optional)
@assignment_bp.route("/", methods=["POST"])
@jwt_required()
def create_assignment():

    admin = admin_required()

    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON body is required"}), 400

    emergency_id = data.get("emergency_id")
    responder_id = data.get("responder_id")
    resource_id = data.get("resource_id")
    resource_quantity = data.get("resource_quantity", 0)

    try:
        emergency_id = int(emergency_id)
        resource_quantity = int(resource_quantity)

        if responder_id is not None:
            responder_id = int(responder_id)

        if resource_id is not None:
            resource_id = int(resource_id)

    except (ValueError, TypeError):
        return jsonify({"error": "IDs and quantity must be valid numbers"}), 400

    if emergency_id <= 0:
        return jsonify({"error": "Emergency ID must be positive"}), 400

    if responder_id is not None and responder_id <= 0:
        return jsonify({"error": "Responder ID must be positive"}), 400

    if resource_id is not None and resource_id <= 0:
        return jsonify({"error": "Resource ID must be positive"}), 400

    if resource_quantity < 0:
        return jsonify({"error": "Resource quantity cannot be negative"}), 400

    if resource_id is None and resource_quantity != 0:
        return jsonify({
            "error": "Select a resource when allocating a quantity"
        }), 400

    emergency = db.session.get(EmergencyReport, emergency_id)

    if not emergency:
        return jsonify({"error": "Emergency report not found"}), 404

    if emergency.status in ["resolved", "closed", "completed"]:
        return jsonify({"error": "This emergency report is already closed"}), 400

    responder = None

    # If the admin selected a responder, retain the old direct-assignment flow.
    if responder_id is not None:
        responder = db.session.get(Responder, responder_id)

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

        if responder:
            responder.availability = "busy"

        db.session.add(assignment)
        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not create assignment"}), 500

    return jsonify({
        "message": (
            "Assignment created successfully"
            if responder else "Unclaimed assignment created successfully"
        ),
        "assignment": assignment.to_dict()
    }), 201


# ADMIN or RESPONDER: View all assignments
@assignment_bp.route("/", methods=["GET"])
@jwt_required()
def get_assignments():

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role not in ["admin", "responder"]:
        return jsonify({"error": "Access denied"}), 403

    assignments = Assignment.query.order_by(
        Assignment.created_at.desc()
    ).all()

    return jsonify({
        "count": len(assignments),
        "assignments": [item.to_dict() for item in assignments]
    }), 200


# RESPONDER: Claim an unclaimed assignment
@assignment_bp.route("/<int:assignment_id>/claim", methods=["POST"])
@jwt_required()
def claim_assignment(assignment_id):

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "responder":
        return jsonify({"error": "Responder access required"}), 403

    responder = user.responder_profile

    if not responder:
        return jsonify({"error": "Responder profile not found"}), 404

    if responder.approval_status != "approved":
        return jsonify({"error": "Your responder account is not approved"}), 403

    if responder.availability != "available":
        return jsonify({"error": "You are not currently available"}), 400

    assignment = db.session.get(Assignment, assignment_id)

    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    if assignment.responder_id is not None:
        return jsonify({"error": "This assignment has already been claimed"}), 409

    if assignment.status != "assigned":
        return jsonify({"error": "This assignment is not available to claim"}), 400

    emergency = db.session.get(EmergencyReport, assignment.emergency_id)

    if not emergency or emergency.status in ["resolved", "closed", "completed"]:
        return jsonify({"error": "This emergency report is already closed"}), 400

    existing_assignment = Assignment.query.filter(
        Assignment.responder_id == responder.id,
        Assignment.status.in_(["assigned", "in_progress"])
    ).first()

    if existing_assignment:
        return jsonify({
            "error": "You already have an active assignment"
        }), 400

    try:
        # Reserve this responder only if they are still available.
        responder_updated = Responder.query.filter(
            Responder.id == responder.id,
            Responder.approval_status == "approved",
            Responder.availability == "available"
        ).update(
            {"availability": "busy"},
            synchronize_session=False
        )

        if responder_updated != 1:
            db.session.rollback()
            return jsonify({
                "error": "You are no longer available to claim an assignment"
            }), 409

        # Claim only if the assignment is still unclaimed.
        assignment_updated = Assignment.query.filter(
            Assignment.id == assignment_id,
            Assignment.responder_id.is_(None),
            Assignment.status == "assigned"
        ).update(
            {"responder_id": responder.id},
            synchronize_session=False
        )

        if assignment_updated != 1:
            db.session.rollback()
            return jsonify({
                "error": "Another responder has already claimed this assignment"
            }), 409

        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not claim assignment"}), 500

    assignment = db.session.get(Assignment, assignment_id)

    return jsonify({
        "message": "Assignment claimed successfully",
        "assignment": assignment.to_dict()
    }), 200


# ADMIN or any RESPONDER: View one assignment
@assignment_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment(assignment_id):

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role not in ["admin", "responder"]:
        return jsonify({"error": "Access denied"}), 403

    assignment = db.session.get(Assignment, assignment_id)

    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

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
            user.role != "responder"
            or not user.responder_profile
            or user.responder_profile.id != assignment.responder_id
        ):
            return jsonify({"error": "Access denied"}), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict) or "status" not in data:
        return jsonify({"error": "Status is required"}), 400

    new_status = data["status"]

    if not isinstance(new_status, str):
        return jsonify({"error": "Status must be text"}), 400

    allowed_transitions = {
        "assigned": ["in_progress", "cancelled"],
        "in_progress": ["completed", "cancelled"]
    }

    if new_status not in allowed_transitions.get(assignment.status, []):
        return jsonify({"error": "Invalid status transition"}), 400

    # An unclaimed assignment cannot be started or completed.
    if assignment.responder_id is None and new_status != "cancelled":
        return jsonify({
            "error": "An assignment must be claimed before it can be started"
        }), 400

    responder = (
        db.session.get(Responder, assignment.responder_id)
        if assignment.responder_id is not None
        else None
    )

    try:
        if new_status == "cancelled" and assignment.resource_id:
            resource = db.session.get(Resource, assignment.resource_id)

            if resource:
                resource.available_quantity = min(
                    resource.quantity,
                    resource.available_quantity + assignment.resource_quantity
                )

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
