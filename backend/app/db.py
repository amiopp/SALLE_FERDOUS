from contextlib import contextmanager
import os
from pathlib import Path
import sqlite3

import psycopg

BASE_DIR = Path(__file__).resolve().parent.parent
SQLITE_PATH = BASE_DIR / "gym.db"
ENV_PATH = BASE_DIR / ".env"


def load_env_file() -> None:
    if not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL")
USE_POSTGRES = bool(
    DATABASE_URL
    or os.getenv("PGHOST")
    or os.getenv("PGDATABASE")
    or os.getenv("PGUSER")
    or os.getenv("PGPASSWORD")
)

DB_CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", "5432")),
    "dbname": os.getenv("PGDATABASE", "Salle_sport_ferdaouss"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "123456789"),
}


def init_db() -> None:
    if USE_POSTGRES:
        with get_connection() as conn:
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
        return

    with sqlite3.connect(SQLITE_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                telephone TEXT NOT NULL,
                date_debut TEXT NOT NULL,
                duree_abonnement INTEGER NOT NULL CHECK(duree_abonnement > 0)
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                date_visite TEXT NOT NULL,
                FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
            );
            """
        )


@contextmanager
def get_connection():
    if USE_POSTGRES:
        conn = psycopg.connect(DATABASE_URL) if DATABASE_URL else psycopg.connect(**DB_CONFIG)
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")

    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
