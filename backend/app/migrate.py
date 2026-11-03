from pathlib import Path

from sqlalchemy import text

from app.infrastructure.database import engine


def main():
    # One transaction and a PostgreSQL advisory lock serialize concurrent migration jobs.
    with engine.begin() as connection:
        connection.execute(text("SELECT pg_advisory_xact_lock(73002001)"))
        connection.execute(text("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)"))
        for path in sorted((Path(__file__).parent.parent / "migrations").glob("*.sql")):
            if connection.execute(
                text("SELECT 1 FROM schema_migrations WHERE name=:name"), {"name": path.name}
            ).scalar():
                continue
            connection.exec_driver_sql(path.read_text(encoding="utf-8"))
            connection.execute(text("INSERT INTO schema_migrations VALUES (:name)"), {"name": path.name})


if __name__ == "__main__":
    main()
