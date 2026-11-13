
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.alert import Alert
from models.emergency import EmergencyReport
from models.user import User


alert_bp = Blueprint(
    "alerts",
    __name__,
    url_prefix="/api/alerts"
)


def get_current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def admin_required():
    user = get_current_user()

    if not user or user.role != "admin":
        return None

    return user


# ADMIN: Create an alert
@alert_bp.route("/", methods=["POST"])
@jwt_required()
def create_alert():

    admin = admin_required()

    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    title = data.get("title")
    message = data.get("message")
    location = data.get("location")
    alert_type = data.get("alert_type", "general")
    severity = data.get("severity", "medium")
    emergency_id = data.get("emergency_id")

    if not title or not message or not location:
        return jsonify({
            "error": "Title, message and location are required"
        }), 400

    if not all(isinstance(value, str) and value.strip()
               for value in [title, message, location, alert_type, severity]):
        return jsonify({"error": "Invalid alert fields"}), 400

    if len(title) > 150 or len(location) > 200:
        return jsonify({"error": "Title or location is too long"}), 400

    if severity.lower() not in ["low", "medium", "high", "critical"]:
        return jsonify({"error": "Invalid severity"}), 400

    emergency = None

    if emergency_id is not None:
        try:
            emergency_id = int(emergency_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid emergency ID"}), 400

        emergency = db.session.get(EmergencyReport, emergency_id)

        if not emergency:
            return jsonify({"error": "Emergency report not found"}), 404

    alert = Alert(
        title=title.strip(),
        message=message.strip(),
        location=location.strip(),
        alert_type=alert_type.strip().lower(),
        severity=severity.strip().lower(),
        emergency_id=emergency_id,
        created_by=admin.id
    )

    try:
        db.session.add(alert)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not create alert"}), 500

    return jsonify({
        "message": "Alert created successfully",
        "alert": alert.to_dict()
    }), 201


# AUTHENTICATED USERS: View alerts
@alert_bp.route("/", methods=["GET"])
@jwt_required()
def get_alerts():

    query = Alert.query

    active_only = request.args.get("active", "true").lower()

    if active_only == "true":
        query = query.filter_by(is_active=True)
    elif active_only != "false":
        return jsonify({"error": "Invalid active filter"}), 400

    location = request.args.get("location")

    if location:
        query = query.filter(
            Alert.location.ilike(f"%{location.strip()}%")
        )

    alerts = query.order_by(Alert.created_at.desc()).all()

    return jsonify({
        "count": len(alerts),
        "alerts": [alert.to_dict() for alert in alerts]
    }), 200


# AUTHENTICATED USERS: View one alert
@alert_bp.route("/<int:alert_id>", methods=["GET"])
@jwt_required()
def get_alert(alert_id):

    alert = db.session.get(Alert, alert_id)

    if not alert:
        return jsonify({"error": "Alert not found"}), 404

    return jsonify({"alert": alert.to_dict()}), 200


# ADMIN: Deactivate an alert
@alert_bp.route("/<int:alert_id>/deactivate", methods=["PATCH"])
@jwt_required()
def deactivate_alert(alert_id):

    admin = admin_required()

    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    alert = db.session.get(Alert, alert_id)

    if not alert:
        return jsonify({"error": "Alert not found"}), 404

    alert.is_active = False

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not deactivate alert"}), 500

    return jsonify({
        "message": "Alert deactivated successfully",
        "alert": alert.to_dict()
    }), 200
