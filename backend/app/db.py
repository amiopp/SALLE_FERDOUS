from contextlib import contextmanager
import os

import psycopg

DB_CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", "5432")),
    "dbname": os.getenv("PGDATABASE", "Salle_sport_ferdaouss"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "123456789"),
}


def init_db() -> None:
    with psycopg.connect(**DB_CONFIG) as conn:
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


@contextmanager
def get_connection():
    conn = psycopg.connect(**DB_CONFIG)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
