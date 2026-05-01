export default function Header({ isAuthenticated = false, onLogout }) {
  return (
    <header className="topbar panel">
      <div className="brand">
        <img
          src="/unnamed.png"
          alt="Logo Ferdaouss Fitness Club"
          className="brand-logo"
        />
        <div>
          <p className="brand-eyebrow">Salle de sport</p>
          <h1>Ferdaouss Fitness Club</h1>
          <p className="brand-subtitle">Gestion des clients</p>
        </div>
      </div>
      {isAuthenticated ? (
        <button type="button" className="btn-secondary" onClick={onLogout}>
          Déconnexion
        </button>
      ) : (
        <span className="badge-pill">Connexion requise</span>
      )}
    </header>
  );
}
