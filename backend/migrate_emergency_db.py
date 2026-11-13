
import shutil
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent / "disaster_management.db"
backup_path = db_path.with_name("disaster_management.db.bak")

if not db_path.exists():
    raise FileNotFoundError(f"Database not found: {db_path}")

# Keep a backup before changing the schema.
shutil.copy2(db_path, backup_path)
print(f"Backup created: {backup_path}")

conn = sqlite3.connect(db_path)

try:
    conn.execute("PRAGMA foreign_keys = OFF")
    conn.execute("BEGIN")

    tables = conn.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name='emergency_reports'"
    ).fetchone()

    if not tables:
        raise RuntimeError("emergency_reports table was not found")

    conn.execute(
        "ALTER TABLE emergency_reports "
        "RENAME TO emergency_reports_old"
    )

    conn.execute("""
        CREATE TABLE emergency_reports (
            id INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            disaster_type VARCHAR(50) NOT NULL,
            location VARCHAR(200) NOT NULL DEFAULT 'Unknown',
            latitude FLOAT,
            longitude FLOAT,
            severity VARCHAR(20) NOT NULL DEFAULT 'Medium',
            people_affected INTEGER NOT NULL DEFAULT 0,
            assistance_needed VARCHAR(200) NOT NULL,
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            status VARCHAR(30) NOT NULL DEFAULT 'Reported',
            created_at DATETIME NOT NULL
        )
    """)

    conn.execute("""
        INSERT INTO emergency_reports (
            id, description, disaster_type, location,
            latitude, longitude, severity, people_affected,
            assistance_needed, priority, status, created_at
        )
        SELECT
            id,
            description,
            disaster_type,
            'Unknown',
            latitude,
            longitude,
            CASE LOWER(priority)
                WHEN 'critical' THEN 'Critical'
                WHEN 'high' THEN 'High'
                WHEN 'medium' THEN 'Medium'
                WHEN 'low' THEN 'Low'
                ELSE 'Medium'
            END,
            people_affected,
            assistance_needed,
            priority,
            status,
            created_at
        FROM emergency_reports_old
    """)

    conn.execute("DROP TABLE emergency_reports_old")
    conn.commit()

    count = conn.execute(
        "SELECT COUNT(*) FROM emergency_reports"
    ).fetchone()[0]

    print("Database migration successful.")
    print(f"Existing reports preserved: {count}")

except Exception:
    conn.rollback()
    raise

finally:
    conn.close()
