
import sqlite3
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "disaster_management.db"
BACKUP_PATH = BASE_DIR / "disaster_management_pre_role.bak"

if not DB_PATH.exists():
    raise FileNotFoundError(f"Database not found: {DB_PATH}")

connection = sqlite3.connect(DB_PATH)

try:
    cursor = connection.cursor()

    # Check whether the users table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='users'
    """)

    if cursor.fetchone() is None:
        raise RuntimeError(
            "Users table does not exist. Check your database first."
        )

    # Check existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]

    if "role" in columns:
        print("Role column already exists. No migration needed.")

    else:
        # Back up the database before changing it
        shutil.copy2(DB_PATH, BACKUP_PATH)
        print(f"Backup created: {BACKUP_PATH}")

        cursor.execute("""
            ALTER TABLE users
            ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'citizen'
        """)

        connection.commit()
        print("Role column added successfully.")

finally:
    connection.close()
