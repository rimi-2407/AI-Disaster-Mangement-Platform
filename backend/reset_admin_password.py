from getpass import getpass
from app import app
from extensions import db
from models.user import User

with app.app_context():
    admin = User.query.filter_by(
        email="test@example.com",
        role="admin"
    ).first()

    if not admin:
        print("Admin account not found.")
    else:
        password = getpass("Enter new admin password: ")
        confirm = getpass("Confirm new admin password: ")

        if len(password) < 8:
            print("Password must be at least 8 characters.")
        elif password != confirm:
            print("Passwords do not match.")
        else:
            admin.set_password(password)
            db.session.commit()
            print("Admin password updated successfully.")