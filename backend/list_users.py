
from app import app
from models.user import User

with app.app_context():
    users = User.query.all()

    if not users:
        print("No registered users found.")

    for user in users:
        print(
            f"ID: {user.id} | "
            f"Username: {user.username} | "
            f"Email: {user.email} | "
            f"Role: {user.role}"
        )
