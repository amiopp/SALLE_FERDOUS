function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("fr-FR");
}

export default function ClientTable({ clients, loading, onEdit, onDelete, onCheckIn }) {
  if (loading) {
    return <p className="empty-state">Chargement des clients...</p>;
  }

  if (!clients.length) {
    return <p className="empty-state">Aucun client trouve.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Telephone</th>
            <th>Debut</th>
            <th>Expiration</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.nom}</td>
              <td>{client.telephone}</td>
              <td>{formatDate(client.date_debut)}</td>
              <td>{formatDate(client.date_expiration)}</td>
              <td>
                <span
                  className={`status-badge ${
                    client.statut === "actif" ? "status-active" : "status-expire"
                  }`}
                >
                  {client.statut === "actif" ? "Actif" : "Expire"}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" className="btn-ghost" onClick={() => onEdit(client)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn-success"
                    onClick={() => onCheckIn(client)}
                  >
                    Check-in
                  </button>
                  <button type="button" className="btn-danger" onClick={() => onDelete(client)}>
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
