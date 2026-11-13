
from app import app
from extensions import db
from models.user import User

with app.app_context():
    email = input("Enter the registered email for admin: ").strip().lower()

    user = User.query.filter_by(email=email).first()

    if not user:
        print("No user found with this email.")
    else:
        user.role = "admin"
        db.session.commit()

        print(f"{user.email} is now an admin.")
