from calendar import monthrange
from datetime import date, datetime

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg.rows import dict_row

from .db import get_connection, init_db
from .models import CheckInOut, ClientCreate, ClientOut, ClientUpdate, DashboardOut

app = FastAPI(title="Ferdaouss Fitness API", version="1.0.0")

ADMIN_USERNAME = "090100"
ADMIN_PASSWORD = "P@ssw0rD"
ADMIN_TOKEN = "ferdaouss-admin-token-v1"

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def get_authorization_header(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non autorisé")

    token = authorization.split(" ", 1)[1]
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Jeton invalide")

    return token

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
    date_debut_value = row["date_debut"]
    date_debut = (
        date.fromisoformat(date_debut_value)
        if isinstance(date_debut_value, str)
        else date_debut_value
    )
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
    date_visite_value = row["date_visite"]
    date_visite = (
        datetime.fromisoformat(date_visite_value)
        if isinstance(date_visite_value, str)
        else date_visite_value
    )
    return {
        "id": row["id"],
        "client_id": row["client_id"],
        "nom_client": row["nom_client"],
        "date_visite": date_visite,
    }


@app.get("/")
def root() -> dict:
    return {"message": "API Ferdaouss Fitness active"}


@app.post("/api/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if payload.username != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    return LoginResponse(access_token=ADMIN_TOKEN)


@app.get("/api/clients", response_model=list[ClientOut])
def get_clients(search: str | None = Query(default=None), token: str = Depends(get_authorization_header)) -> list[ClientOut]:
    sql = "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients"
    params: list[str] = []

    if search and search.strip():
        sql += " WHERE nom ILIKE %s"
        params.append(f"%{search.strip()}%")

    sql += " ORDER BY nom ASC"

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()

    return [map_client_row(row) for row in rows]


@app.post("/api/clients", response_model=ClientOut, status_code=201)
def create_client(payload: ClientCreate, token: str = Depends(get_authorization_header)) -> ClientOut:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO clients (nom, telephone, date_debut, duree_abonnement)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (
                    payload.nom.strip(),
                    payload.telephone.strip(),
                    payload.date_debut,
                    payload.duree_abonnement,
                ),
            )
            new_id = cur.fetchone()["id"]
            cur.execute(
                "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients WHERE id = %s",
                (new_id,),
            )
            row = cur.fetchone()

    return map_client_row(row)


@app.put("/api/clients/{client_id}", response_model=ClientOut)
def update_client(client_id: int, payload: ClientUpdate, token: str = Depends(get_authorization_header)) -> ClientOut:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT id FROM clients WHERE id = %s", (client_id,))
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Client introuvable")

            cur.execute(
                """
                UPDATE clients
                SET nom = %s, telephone = %s, date_debut = %s, duree_abonnement = %s
                WHERE id = %s
                """,
                (
                    payload.nom.strip(),
                    payload.telephone.strip(),
                    payload.date_debut,
                    payload.duree_abonnement,
                    client_id,
                ),
            )

            cur.execute(
                "SELECT id, nom, telephone, date_debut, duree_abonnement FROM clients WHERE id = %s",
                (client_id,),
            )
            row = cur.fetchone()

    return map_client_row(row)


@app.delete("/api/clients/{client_id}", status_code=204)
def delete_client(client_id: int, token: str = Depends(get_authorization_header)) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM clients WHERE id = %s", (client_id,))
            rowcount = cur.rowcount

    if rowcount == 0:
        raise HTTPException(status_code=404, detail="Client introuvable")


@app.post("/api/attendance/checkin/{client_id}", response_model=CheckInOut)
def check_in(client_id: int, token: str = Depends(get_authorization_header)) -> CheckInOut:
    today = date.today()

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT id, nom FROM clients WHERE id = %s", (client_id,))
            client = cur.fetchone()
            if not client:
                raise HTTPException(status_code=404, detail="Client introuvable")

            cur.execute(
                """
                SELECT a.id, a.client_id, c.nom AS nom_client, a.date_visite
                FROM attendance a
                JOIN clients c ON c.id = a.client_id
                WHERE a.client_id = %s AND DATE(a.date_visite) = %s
                ORDER BY a.id DESC
                LIMIT 1
                """,
                (client_id, today),
            )
            existing = cur.fetchone()

            if existing:
                return map_attendance_row(existing)

            now_value = datetime.now().replace(microsecond=0)
            cur.execute(
                "INSERT INTO attendance (client_id, date_visite) VALUES (%s, %s) RETURNING id",
                (client_id, now_value),
            )
            attendance_id = cur.fetchone()["id"]

            cur.execute(
                """
                SELECT a.id, a.client_id, c.nom AS nom_client, a.date_visite
                FROM attendance a
                JOIN clients c ON c.id = a.client_id
                WHERE a.id = %s
                """,
                (attendance_id,),
            )
            row = cur.fetchone()

    return map_attendance_row(row)


@app.get("/api/attendance/today", response_model=list[CheckInOut])
def get_today_attendance(token: str = Depends(get_authorization_header)) -> list[CheckInOut]:
    today = date.today()

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT a.id, a.client_id, c.nom AS nom_client, a.date_visite
                FROM attendance a
                JOIN clients c ON c.id = a.client_id
                WHERE DATE(a.date_visite) = %s
                ORDER BY a.date_visite DESC
                """,
                (today,),
            )
            rows = cur.fetchall()

    return [map_attendance_row(row) for row in rows]


@app.get("/api/dashboard", response_model=DashboardOut)
def get_dashboard(token: str = Depends(get_authorization_header)) -> DashboardOut:
    today = date.today()

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM clients")
            total_clients = cur.fetchone()["total"]
            cur.execute(
                "SELECT COUNT(*) AS total FROM attendance WHERE DATE(date_visite) = %s",
                (today,),
            )
            total_today = cur.fetchone()["total"]

    return {
        "total_clients": total_clients,
        "total_presences_aujourdhui": total_today,
    }
