export default function Header() {
  return (
    <header className="topbar panel">
      <div className="brand">
        <img
          src="/logo-ferdaouss.svg"
          alt="Logo Ferdaouss Fitness Club"
          className="brand-logo"
        />
        <div>
          <p className="brand-eyebrow">Salle de sport</p>
          <h1>Ferdaouss Fitness Club</h1>
          <p className="brand-subtitle">Gestion des clients et des presences</p>
        </div>
      </div>
      <span className="badge-pill">Dashboard</span>
    </header>
  );
}
