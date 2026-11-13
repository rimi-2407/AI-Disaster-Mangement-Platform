
from datetime import datetime, timezone

from extensions import db


class Responder(db.Model):
    __tablename__ = "responders"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=False
    )

    location = db.Column(
        db.String(200),
        nullable=False
    )

    specialisation = db.Column(
        db.String(100),
        nullable=False
    )

    approval_status = db.Column(
        db.String(20),
        nullable=False,
        default="approved"
    )

    availability = db.Column(
        db.String(20),
        nullable=False,
        default="unavailable"
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship(
        "User",
        backref=db.backref("responder_profile", uselist=False)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username,
            "email": self.user.email,
            "phone": self.phone,
            "location": self.location,
            "specialisation": self.specialisation,
            "approval_status": self.approval_status,
            "availability": self.availability,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }
