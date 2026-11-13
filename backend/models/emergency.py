
from datetime import datetime, timezone

from extensions import db


class EmergencyReport(db.Model):
    __tablename__ = "emergency_reports"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    user = db.relationship("User", backref="emergency_reports")

    description = db.Column(
        db.Text,
        nullable=False,
        default="No description provided"
    )

    disaster_type = db.Column(db.String(50), nullable=False)

    # The current frontend accepts a text location, not GPS coordinates.
    location = db.Column(db.String(200), nullable=False, default="Unknown")
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    severity = db.Column(db.String(20), nullable=False, default="Medium")
    people_affected = db.Column(db.Integer, nullable=False, default=0)
    assistance_needed = db.Column(db.String(200), nullable=False)

    priority = db.Column(db.String(20), nullable=False, default="medium")
    status = db.Column(db.String(30), nullable=False, default="pending")

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
