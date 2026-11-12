
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-this")
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "dev-only-change-this-too"
    )

    SQLALCHEMY_DATABASE_URI = (
        f"sqlite:///{BASE_DIR / 'disaster_management.db'}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

