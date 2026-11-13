
from datetime import datetime, timezone

from extensions import db


class Resource(db.Model):
    __tablename__ = "resources"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(120),
        nullable=False
    )

    category = db.Column(
        db.String(50),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    available_quantity = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    unit = db.Column(
        db.String(30),
        nullable=False,
        default="units"
    )

    location = db.Column(
        db.String(200),
        nullable=False
    )

    latitude = db.Column(
        db.Float,
        nullable=True
    )

    longitude = db.Column(
        db.Float,
        nullable=True
    )

    contact_person = db.Column(
        db.String(100),
        nullable=True
    )

    contact_phone = db.Column(
        db.String(20),
        nullable=True
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="active"
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

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "quantity": self.quantity,
            "available_quantity": self.available_quantity,
            "unit": self.unit,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "contact_person": self.contact_person,
            "contact_phone": self.contact_phone,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at else None
            )
        }
