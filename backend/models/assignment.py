
from datetime import datetime, timezone
from extensions import db


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)

    emergency_id = db.Column(
        db.Integer,
        db.ForeignKey("emergency_reports.id"),
        nullable=False
    )

    responder_id = db.Column(
        db.Integer,
        db.ForeignKey("responders.id"),
        nullable=True
    )

    resource_id = db.Column(
        db.Integer,
        db.ForeignKey("resources.id"),
        nullable=True
    )

    resource_quantity = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="assigned"
    )

    assigned_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    emergency = db.relationship("EmergencyReport")
    responder = db.relationship("Responder")
    resource = db.relationship("Resource")
    admin = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "emergency_id": self.emergency_id,
            "responder_id": self.responder_id,
            "resource_id": self.resource_id,
            "resource_quantity": self.resource_quantity,
            "status": self.status,
            "assigned_by": self.assigned_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
