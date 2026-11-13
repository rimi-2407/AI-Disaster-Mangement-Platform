
from datetime import datetime, timezone
from extensions import db


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(150),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    alert_type = db.Column(
        db.String(50),
        nullable=False,
        default="general"
    )

    severity = db.Column(
        db.String(20),
        nullable=False,
        default="medium"
    )

    location = db.Column(
        db.String(200),
        nullable=False
    )

    emergency_id = db.Column(
        db.Integer,
        db.ForeignKey("emergency_reports.id"),
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    emergency = db.relationship("EmergencyReport")
    creator = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "location": self.location,
            "emergency_id": self.emergency_id,
            "is_active": self.is_active,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
