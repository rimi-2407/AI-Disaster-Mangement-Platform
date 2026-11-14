
import sqlite3

DB_NAME = "disaster_management.db"

connection = sqlite3.connect(DB_NAME)

try:
    connection.execute("PRAGMA foreign_keys = OFF")

    columns = connection.execute(
        "PRAGMA table_info(assignments)"
    ).fetchall()

    responder_column = next(
        column for column in columns if column[1] == "responder_id"
    )

    if responder_column[3] == 0:
        print("responder_id is already nullable. No migration needed.")
        raise SystemExit

    # Preserve existing indexes and triggers, if any.
    objects = connection.execute("""
        SELECT sql
        FROM sqlite_master
        WHERE tbl_name = 'assignments'
        AND type IN ('index', 'trigger')
        AND sql IS NOT NULL
    """).fetchall()

    connection.execute("BEGIN IMMEDIATE")

    connection.execute("""
        CREATE TABLE assignments_new (
            id INTEGER PRIMARY KEY,
            emergency_id INTEGER NOT NULL
                REFERENCES emergency_reports(id),
            responder_id INTEGER
                REFERENCES responders(id),
            resource_id INTEGER
                REFERENCES resources(id),
            resource_quantity INTEGER NOT NULL,
            status VARCHAR(30) NOT NULL,
            assigned_by INTEGER NOT NULL
                REFERENCES users(id),
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
    """)

    connection.execute("""
        INSERT INTO assignments_new (
            id, emergency_id, responder_id, resource_id,
            resource_quantity, status, assigned_by,
            created_at, updated_at
        )
        SELECT
            id, emergency_id, responder_id, resource_id,
            resource_quantity, status, assigned_by,
            created_at, updated_at
        FROM assignments
    """)

    connection.execute("DROP TABLE assignments")
    connection.execute(
        "ALTER TABLE assignments_new RENAME TO assignments"
    )

    for (sql,) in objects:
        connection.execute(sql)

    # Verify the migrated table before committing.
    errors = connection.execute(
        "PRAGMA foreign_key_check"
    ).fetchall()

    if errors:
        raise RuntimeError(f"Foreign-key errors: {errors}")

    connection.commit()

    print("Migration successful!")
    print("Existing assignments:")

    rows = connection.execute("""
        SELECT id, emergency_id, responder_id,
               resource_id, resource_quantity, status
        FROM assignments
    """).fetchall()

    for row in rows:
        print(row)

    print(
        "New responder_id nullable setting:",
        connection.execute(
            "PRAGMA table_info(assignments)"
        ).fetchall()[2][3] == 0
    )

except Exception:
    connection.rollback()
    raise

finally:
    connection.execute("PRAGMA foreign_keys = ON")
    connection.close()
