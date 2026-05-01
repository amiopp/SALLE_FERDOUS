import { useEffect, useState } from "react";

import { api } from "../api/client";

const DEFAULT_COUNTRY_CODE = "212";
const WHATSAPP_MESSAGE =
  "Bonjour, nous vous informons que votre abonnement est épuisé. Passez à la salle pour le renouveler. Merci.💪";

export default function ExpiredClientsPage() {
  const [expiredClients, setExpiredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadExpiredClients() {
    try {
      setLoading(true);
      setError("");
      const data = await api.getClients();
      setExpiredClients(data.filter((client) => client.statut === "expire"));
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpiredClients();
  }, []);

  function formatWhatsAppPhone(value) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      return "";
    }

    if (digits.startsWith("0") && digits.length === 10) {
      return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
    }

    return digits;
  }

  function buildWhatsAppUrl(client) {
    const phone = formatWhatsAppPhone(client.telephone || "");
    if (!phone) {
      return "";
    }

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      WHATSAPP_MESSAGE
    )}`;
  }

  function handleWhatsApp(client) {
    const url = buildWhatsAppUrl(client);
    if (!url) {
      setError("Numero de telephone invalide pour WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  return (
    <section className="panel section-block">
      <div className="section-header">
        <div>
          <h2>Clients expires</h2>
          <p>Abonnements termines a relancer par WhatsApp</p>
        </div>
        <button type="button" className="btn-secondary" onClick={loadExpiredClients}>
          Actualiser
        </button>
      </div>

      {loading ? <p className="empty-state">Chargement des clients...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !expiredClients.length ? (
        <p className="empty-state">Aucun abonnement expire pour le moment.</p>
      ) : null}

      {!!expiredClients.length && (
        <ul className="quick-results">
          {expiredClients.map((client) => (
            <li key={client.id}>
              <div>
                <strong>{client.nom}</strong>
                <p>{client.telephone}</p>
              </div>
              <button
                type="button"
                className="btn-success"
                onClick={() => handleWhatsApp(client)}
              >
                Envoyer WhatsApp
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
