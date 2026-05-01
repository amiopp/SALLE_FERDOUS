import { useEffect, useState } from "react";

import { api } from "../api/client";
import StatCard from "../components/StatCard";

export default function DashboardPage({ dashboard, loading, error }) {
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const data = await api.getClients(search);
        setResults(data.slice(0, 5));
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <section className="page-grid">
      <div className="panel section-block">
        <div className="section-header">
          <h2>Indicateurs du jour</h2>
          <p>Vue rapide de l'activite de la salle</p>
        </div>

        {loading ? <p className="empty-state">Chargement des donnees...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <div className="stats-grid">
          <StatCard title="Total clients" value={dashboard.total_clients} tone="neutral" />
        </div>
      </div>

      <div className="panel section-block">
        <div className="section-header">
          <h2>Recherche rapide client</h2>
          <p>Retrouver un client par son nom</p>
        </div>

        <input
          className="search-input"
          type="search"
          placeholder="Ex: Sara, Youssef..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {searchLoading ? <p className="empty-state">Recherche...</p> : null}

        {!searchLoading && search.trim() && !results.length ? (
          <p className="empty-state">Aucun client correspondant.</p>
        ) : null}

        {!!results.length && (
          <ul className="quick-results">
            {results.map((client) => (
              <li key={client.id}>
                <div>
                  <strong>{client.nom}</strong>
                  <p>{client.telephone}</p>
                </div>
                <span
                  className={`status-badge ${
                    client.statut === "actif" ? "status-active" : "status-expire"
                  }`}
                >
                  {client.statut === "actif" ? "Actif" : "Expire"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </section>
  );
}
