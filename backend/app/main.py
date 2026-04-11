from calendar import monthrange
from datetime import date, datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .db import get_connection, init_db
from .models import CheckInOut, ClientCreate, ClientOut, ClientUpdate, DashboardOut

app = FastAPI(title="Ferdaouss Fitness API", version="1.0.0")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ferdaoussclub.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup() -> None:
    init_db()


def add_months(source_date: date, months: int) -> date:
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, monthrange(year, month)[1])
    return date(year, month, day)


def map_client_row(row) -> dict:
    date_debut = date.fromisoformat(row["date_debut"])
    date_expiration = add_months(date_debut, row["duree_abonnement"])
    statut = "actif" if date_expiration >= date.today() else "expire"
    return {
        "id": row["id"],
        "nom": row["nom"],
        "telephone": row["telephone"],
        "date_debut": date_debut,
        "duree_abonnement": row["duree_abonnement"],
        "date_expiration": date_expiration,
        "statut": statut,
    }


def map_attendance_row(row) -> dict:
    return {
        "id": row["id"],
        "client_id": row["client_id"],
        "nom_client": row["nom_client"],
        "date_visite": datetime.fromisoformat(row["date_visite"]),
    }


@app.get("/")
def root() -> dict:
    return {"message": "API Ferdaouss Fitness active"}


@app.get("/api/clients", response_model=list[ClientOut])
def get_clients(search: str | None = Query(default=None)) -> list[ClientOut]:
    sql = "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients"
    params: list[str] = []

    if search and search.strip():
        sql += " WHERE LOWER(nom) LIKE ?"
        params.append(f"%{search.strip().lower()}%")

    sql += " ORDER BY nom ASC"

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()

    return [map_client_row(row) for row in rows]


@app.post("/api/clients", response_model=ClientOut, status_code=201)
def create_client(payload: ClientCreate) -> ClientOut:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO clients (nom, telephone, date_debut, duree_abonnement)
            VALUES (?, ?, ?, ?)
            """,
            (
                payload.nom.strip(),
                payload.telephone.strip(),
                payload.date_debut.isoformat(),
                payload.duree_abonnement,
            ),
        )
        new_id = cursor.lastrowid
        row = conn.execute(
            "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients WHERE id = ?",
            (new_id,),
        ).fetchone()

    return map_client_row(row)


@app.put("/api/clients/{client_id}", response_model=ClientOut)
def update_client(client_id: int, payload: ClientUpdate) -> ClientOut:
    with get_connection() as conn:
        existing = conn.execute("SELECT id FROM clients WHERE id = ?", (client_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client introuvable")

        conn.execute(
            """
            UPDATE clients
            SET nom = ?, telephone = ?, date_debut = ?, duree_abonnement = ?
            WHERE id = ?
            """,
            (
                payload.nom.strip(),
                payload.telephone.strip(),
                payload.date_debut.isoformat(),
                payload.duree_abonnement,
                client_id,
            ),
        )

        row = conn.execute(
            "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients WHERE id = ?",
            (client_id,),
        ).fetchone()

    return map_client_row(row)


@app.delete("/api/clients/{client_id}", status_code=204)
def delete_client(client_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM clients WHERE id = ?", (client_id,))

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Client introuvable")


@app.post("/api/attendance/checkin/{client_id}", response_model=CheckInOut)
def check_in(client_id: int) -> CheckInOut:
    today = date.today().isoformat()

    with get_connection() as conn:
        client = conn.execute("SELECT id, nom FROM clients WHERE id = ?", (client_id,)).fetchone()
        if not client:
            raise HTTPException(status_code=404, detail="Client introuvable")

        existing = conn.execute(
            """
            SELECT a.id, a.client_id, c.nom AS nom_client, a.date_visite
            FROM attendance a
            JOIN clients c ON c.id = a.client_id
            WHERE a.client_id = ? AND date(a.date_visite) = ?
            ORDER BY a.id DESC
            LIMIT 1
            """,
            (client_id, today),
        ).fetchone()

        if existing:
            return map_attendance_row(existing)

        now_value = datetime.now().replace(microsecond=0).isoformat()
        cursor = conn.execute(
            "INSERT INTO attendance (client_id, date_visite) VALUES (?, ?)",
            (client_id, now_value),
        )
        attendance_id = cursor.lastrowid

        row = conn.execute(
            """
            SELECT a.id, a.client_id, c.nom AS nom_client, a.date_visite
            FROM attendance a
            JOIN clients c ON c.id = a.client_id
            WHERE a.id = ?
            """,
            (attendance_id,),
        ).fetchone()

    return map_attendance_row(row)


@app.get("/api/attendance/today", response_model=list[CheckInOut])
def get_today_attendance() -> list[CheckInOut]:
    today = date.today().isoformat()

    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT a.id, a.client_id, c.nom AS nom_client, a.date_visite
            FROM attendance a
            JOIN clients c ON c.id = a.client_id
            WHERE date(a.date_visite) = ?
            ORDER BY a.date_visite DESC
            """,
            (today,),
        ).fetchall()

    return [map_attendance_row(row) for row in rows]


@app.get("/api/dashboard", response_model=DashboardOut)
def get_dashboard() -> DashboardOut:
    today = date.today().isoformat()

    with get_connection() as conn:
        total_clients = conn.execute("SELECT COUNT(*) FROM clients").fetchone()[0]
        total_today = conn.execute(
            "SELECT COUNT(*) FROM attendance WHERE date(date_visite) = ?",
            (today,),
        ).fetchone()[0]

    return {
        "total_clients": total_clients,
        "total_presences_aujourdhui": total_today,
    }
