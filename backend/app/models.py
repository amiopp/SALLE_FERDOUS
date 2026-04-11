from datetime import date, datetime

from pydantic import BaseModel, Field


class ClientBase(BaseModel):
    nom: str = Field(..., min_length=2, max_length=120)
    telephone: str = Field(..., min_length=6, max_length=30)
    date_debut: date
    duree_abonnement: int = Field(..., gt=0, le=60)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientOut(ClientBase):
    id: int
    date_expiration: date
    statut: str


class CheckInOut(BaseModel):
    id: int
    client_id: int
    nom_client: str
    date_visite: datetime


class DashboardOut(BaseModel):
    total_clients: int
    total_presences_aujourdhui: int
