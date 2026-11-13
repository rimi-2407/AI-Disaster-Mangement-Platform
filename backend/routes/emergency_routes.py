
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.assignment import Assignment

from extensions import db
from models.emergency import EmergencyReport
from models.user import User

emergency_bp = Blueprint(
    "emergency",
    __name__,
    url_prefix="/api/reports",
)

VALID_SEVERITIES = {"low", "medium", "high", "critical"}


def get_field(data, frontend_name, backend_name, default=None):
    return data.get(backend_name, data.get(frontend_name, default))


def get_current_user():
    user_id = int(get_jwt_identity())
    return db.session.get(User, user_id)


def can_access_report(user, report):
    return user.role == "admin" or report.user_id == user.id


def report_to_dict(report):
    created_at = (
        report.created_at.isoformat()
        if report.created_at else None
    )

    return {
        "id": report.id,
        "description": report.description,
        "disasterType": report.disaster_type,
        "disaster_type": report.disaster_type,
        "location": report.location,
        "severity": report.severity,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "peopleAffected": report.people_affected,
        "people_affected": report.people_affected,
        "assistance": report.assistance_needed,
        "assistance_needed": report.assistance_needed,
        "priority": report.priority,
        "status": report.status,
        "createdAt": created_at,
        "created_at": created_at,
    }


# CREATE REPORT
@emergency_bp.route("/", methods=["POST"])
@jwt_required()
def create_report():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    disaster_type = get_field(data, "disasterType", "disaster_type")
    location = data.get("location")
    severity = data.get("severity", "Medium")

    if not isinstance(severity, str):
        return jsonify({"error": "Invalid severity"}), 400

    severity = severity.strip()

    assistance = get_field(data, "assistance", "assistance_needed")
    description = data.get("description") or ""

    if not isinstance(description, str):
        return jsonify({"error": "Invalid description"}), 400

    description = description.strip()

    if not isinstance(disaster_type, str) or not disaster_type.strip():
        return jsonify({"error": "Disaster type is required"}), 400

    if not isinstance(location, str) or not location.strip():
        return jsonify({"error": "Location is required"}), 400

    if not isinstance(assistance, str) or not assistance.strip():
        return jsonify({"error": "Assistance required is missing"}), 400

    if severity.lower() not in VALID_SEVERITIES:
        return jsonify({
            "error": "Severity must be Low, Medium, High, or Critical"
        }), 400

    raw_people = get_field(data, "peopleAffected", "people_affected", 0)

    try:
        if isinstance(raw_people, bool):
            raise ValueError()

        people = int(raw_people)

        if isinstance(raw_people, float) and not raw_people.is_integer():
            raise ValueError()

        if people < 0:
            raise ValueError()

    except (ValueError, TypeError, OverflowError):
        return jsonify({
            "error": "People affected must be a non-negative integer"
        }), 400

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    try:
        if (latitude is None) != (longitude is None):
            raise ValueError()

        if latitude is not None:
            latitude = float(latitude)
            longitude = float(longitude)

            if not (-90 <= latitude <= 90):
                raise ValueError()

            if not (-180 <= longitude <= 180):
                raise ValueError()

    except (ValueError, TypeError, OverflowError):
        return jsonify({
            "error": "Provide valid latitude and longitude together"
        }), 400

    report = EmergencyReport(
        user_id=user.id,
        description=description or "No description provided",
        disaster_type=disaster_type.strip(),
        location=location.strip(),
        severity=severity.title(),
        latitude=latitude,
        longitude=longitude,
        people_affected=people,
        assistance_needed=assistance.strip(),
        priority=severity.lower(),
        status="Reported",
    )

    try:
        db.session.add(report)
        db.session.commit()

        return jsonify({
            "message": "Emergency report created successfully",
            "report": report_to_dict(report),
        }), 201

    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Could not save the emergency report"
        }), 500

# GET ALL REPORTS
@emergency_bp.route("/", methods=["GET"])
@jwt_required()
def get_reports():

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    query = EmergencyReport.query

    if user.role == "citizen":
        query = query.filter(
            EmergencyReport.user_id == user.id
        )

    elif user.role == "responder":
        active_assignments = db.session.query(
            Assignment.emergency_id
        ).filter(
            Assignment.status.in_(["assigned", "in_progress"])
        )

        query = query.filter(
            EmergencyReport.status.ilike("Reported"),
            ~EmergencyReport.id.in_(active_assignments)
        )

    # Admins can see all reports.

    disaster_type = (
        request.args.get("disaster_type")
        or request.args.get("disasterType")
    )

    if disaster_type:
        query = query.filter(
            EmergencyReport.disaster_type.ilike(
                f"%{disaster_type.strip()}%"
            )
        )

    severity = request.args.get("severity")

    if severity:
        if severity.lower() not in VALID_SEVERITIES:
            return jsonify({
                "error": "Invalid severity. Use Low, Medium, High, or Critical."
            }), 400

        query = query.filter(
            EmergencyReport.severity.ilike(severity.strip())
        )

    status = request.args.get("status")

    if status:
        query = query.filter(
            EmergencyReport.status.ilike(status.strip())
        )

    location = request.args.get("location")

    if location:
        query = query.filter(
            EmergencyReport.location.ilike(
                f"%{location.strip()}%"
            )
        )

    reports = query.order_by(
        EmergencyReport.id.desc()
    ).all()

    return jsonify({
        "count": len(reports),
        "reports": [report_to_dict(report) for report in reports],
    }), 200

# GET SINGLE REPORT
@emergency_bp.route("/<int:report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id):

    report = db.session.get(EmergencyReport, report_id)

    if report is None:
        return jsonify({"error": "Emergency report not found"}), 404

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not can_access_report(user, report):
        return jsonify({
            "error": "You are not authorized to view this report"
        }), 403

    return jsonify({
        "report": report_to_dict(report)
    }), 200


# UPDATE REPORT
@emergency_bp.route("/<int:report_id>", methods=["PUT"])
@jwt_required()
def update_report(report_id):

    report = db.session.get(EmergencyReport, report_id)

    if report is None:
        return jsonify({"error": "Emergency report not found"}), 404

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not can_access_report(user, report):
        return jsonify({
            "error": "You are not authorized to update this report"
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    if "disasterType" in data or "disaster_type" in data:
        value = get_field(data, "disasterType", "disaster_type")

        if not isinstance(value, str) or not value.strip():
            return jsonify({"error": "Invalid disaster type"}), 400

        report.disaster_type = value.strip()

    if "location" in data:
        value = data["location"]

        if not isinstance(value, str) or not value.strip():
            return jsonify({"error": "Invalid location"}), 400

        report.location = value.strip()

    if "severity" in data:
        value = data["severity"]

        if not isinstance(value, str) or value.lower() not in VALID_SEVERITIES:
            return jsonify({"error": "Invalid severity"}), 400

        report.severity = value.title()
        report.priority = value.lower()

    if "description" in data:
        value = data["description"]

        if not isinstance(value, str):
            return jsonify({"error": "Invalid description"}), 400

        report.description = value.strip() or "No description provided"

    if "assistance" in data or "assistance_needed" in data:
        value = get_field(data, "assistance", "assistance_needed")

        if not isinstance(value, str) or not value.strip():
            return jsonify({"error": "Invalid assistance required"}), 400

        report.assistance_needed = value.strip()

    if "peopleAffected" in data or "people_affected" in data:
        value = get_field(data, "peopleAffected", "people_affected")

        try:
            if isinstance(value, bool):
                raise ValueError()

            people = int(value)

            if isinstance(value, float) and not value.is_integer():
                raise ValueError()

            if people < 0:
                raise ValueError()

        except (ValueError, TypeError, OverflowError):
            return jsonify({
                "error": "Invalid number of people affected"
            }), 400

        report.people_affected = people

    if "latitude" in data or "longitude" in data:
        latitude = data.get("latitude")
        longitude = data.get("longitude")

        try:
            if latitude is None or longitude is None:
                raise ValueError()

            latitude = float(latitude)
            longitude = float(longitude)

            if not (-90 <= latitude <= 90):
                raise ValueError()

            if not (-180 <= longitude <= 180):
                raise ValueError()

        except (ValueError, TypeError, OverflowError):
            return jsonify({
                "error": "Provide valid latitude and longitude together"
            }), 400

        report.latitude = latitude
        report.longitude = longitude

    if "status" in data:
        value = data["status"]

        # Only admins can change report status.
        if user.role != "admin":
            return jsonify({
                "error": "Only admins can change report status"
            }), 403

        if not isinstance(value, str) or not value.strip():
            return jsonify({"error": "Invalid status"}), 400

        report.status = value.strip()

    try:
        db.session.commit()

        return jsonify({
            "message": "Emergency report updated successfully",
            "report": report_to_dict(report)
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Could not update report"
        }), 500


# DELETE REPORT
@emergency_bp.route("/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):

    report = db.session.get(EmergencyReport, report_id)

    if report is None:
        return jsonify({"error": "Emergency report not found"}), 404

    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not can_access_report(user, report):
        return jsonify({
            "error": "You are not authorized to delete this report"
        }), 403

    try:
        db.session.delete(report)
        db.session.commit()

        return jsonify({
            "message": "Emergency report deleted successfully",
            "id": report_id
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Could not delete report"
        }), 500
