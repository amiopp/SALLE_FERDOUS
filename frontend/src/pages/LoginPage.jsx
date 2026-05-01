import { useState } from "react";

export default function LoginPage({ onLogin, loading, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin(username.trim(), password);
  }

  return (
    <section className="auth-shell">
      <div className="panel auth-card">
        <div className="auth-header">
          <div>
            <p className="brand-eyebrow">Espace administrateur</p>
            <h2>Connexion sécurisée</h2>
            <p>Entrez votre identifiant et votre mot de passe pour accéder au tableau de bord.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Identifiant
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Votre identifiant"
              required
              autoFocus
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </section>
  );
}
