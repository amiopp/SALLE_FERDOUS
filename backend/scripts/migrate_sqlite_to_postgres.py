import os
import sqlite3

import psycopg
from psycopg.rows import dict_row

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SQLITE_PATH = os.path.join(BASE_DIR, "gym.db")

PG_CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", "5432")),
    "dbname": os.getenv("PGDATABASE", "Salle_sport_ferdaouss"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "123456789"),
}


def ensure_database_exists() -> None:
    admin_config = PG_CONFIG.copy()
    admin_config["dbname"] = os.getenv("PGADMIN_DB", "postgres")

    with psycopg.connect(**admin_config) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (PG_CONFIG["dbname"],),
            )
            exists = cur.fetchone()
            if not exists:
                cur.execute(f'CREATE DATABASE "{PG_CONFIG["dbname"]}"')


def ensure_tables(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                nom TEXT NOT NULL,
                telephone TEXT NOT NULL,
                date_debut DATE NOT NULL,
                duree_abonnement INTEGER NOT NULL CHECK(duree_abonnement > 0)
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                date_visite TIMESTAMP NOT NULL
            );
            """
        )


def migrate_data() -> None:
    if not os.path.exists(SQLITE_PATH):
        raise FileNotFoundError(f"SQLite database not found: {SQLITE_PATH}")

    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row

    ensure_database_exists()

    with psycopg.connect(**PG_CONFIG) as pg_conn:
        ensure_tables(pg_conn)

        with pg_conn.cursor(row_factory=dict_row) as cur:
            cur.execute("DELETE FROM attendance")
            cur.execute("DELETE FROM clients")

            clients = sqlite_conn.execute(
                "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients"
            ).fetchall()
            for row in clients:
                cur.execute(
                    """
                    INSERT INTO clients (id, nom, telephone, date_debut, duree_abonnement)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        row["id"],
                        row["nom"],
                        row["telephone"],
                        row["date_debut"],
                        row["duree_abonnement"],
                    ),
                )

            attendance = sqlite_conn.execute(
                "SELECT id, client_id, date_visite FROM attendance"
            ).fetchall()
            for row in attendance:
                cur.execute(
                    """
                    INSERT INTO attendance (id, client_id, date_visite)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (row["id"], row["client_id"], row["date_visite"]),
                )

            cur.execute(
                "SELECT setval(pg_get_serial_sequence('clients', 'id'), COALESCE(MAX(id), 1)) FROM clients"
            )
            cur.execute(
                "SELECT setval(pg_get_serial_sequence('attendance', 'id'), COALESCE(MAX(id), 1)) FROM attendance"
            )

    sqlite_conn.close()


if __name__ == "__main__":
    migrate_data()
    print("Migration terminee vers PostgreSQL.")
