# Application Gym Tracker (React + FastAPI)

Application web complete en francais pour gerer les clients d'une salle de sport, suivre les check-in et visualiser les indicateurs du jour.

## Stack

- Frontend: React + Vite
- Backend: FastAPI (Python)
- Base de donnees: SQLite (fichier local)

## Fonctionnalites

- Gestion des clients
  - Ajouter un client
  - Modifier un client
  - Supprimer un client
  - Recherche par nom
- Suivi de presence
  - Bouton Check-in pour chaque client
  - Enregistrement date/heure de visite
  - Liste des presences du jour
- Statut abonnement
  - Calcul automatique actif/expire
  - Affichage en couleur (vert/rouge)
- Dashboard
  - Total clients
  - Total check-in du jour
  - Recherche rapide client

## Structure du projet

```text
PROJET_GYM5/
|-- backend/
|   |-- app/
|   |   |-- __init__.py
|   |   |-- db.py
|   |   |-- main.py
|   |   `-- models.py
|   `-- requirements.txt
|-- frontend/
|   |-- public/
|   |   `-- logo-ferdaouss.svg
|   |-- src/
|   |   |-- api/
|   |   |   `-- client.js
|   |   |-- components/
|   |   |   |-- ClientFormModal.jsx
|   |   |   |-- ClientTable.jsx
|   |   |   |-- Header.jsx
|   |   |   |-- NavTabs.jsx
|   |   |   |-- StatCard.jsx
|   |   |   `-- TodayAttendanceList.jsx
|   |   |-- pages/
|   |   |   |-- AttendancePage.jsx
|   |   |   |-- ClientsPage.jsx
|   |   |   `-- DashboardPage.jsx
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- .gitignore
`-- README.md
```

## Installation et execution

### 1) Backend FastAPI

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API disponible sur: http://127.0.0.1:8000

### 2) Frontend React

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible sur: http://localhost:5173

## Configuration optionnelle

Si l'API tourne sur une autre URL, creer un fichier `.env` dans le dossier `frontend`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## Logo

Le front utilise le fichier `frontend/public/logo-ferdaouss.svg`.
Si vous voulez utiliser exactement votre fichier image original, remplacez ce fichier par votre logo (en gardant le meme nom), ou adaptez le chemin dans `Header.jsx`.
