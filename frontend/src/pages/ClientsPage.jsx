import { useEffect, useState } from "react";

import { api } from "../api/client";
import ClientFormModal from "../components/ClientFormModal";
import ClientTable from "../components/ClientTable";

const INITIAL_MODAL_STATE = {
  isOpen: false,
  mode: "create",
  client: null,
};

export default function ClientsPage({ onDataChanged }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);

  async function loadClients(searchValue = "") {
    try {
      setLoading(true);
      setError("");
      const data = await api.getClients(searchValue);
      setClients(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  function openCreateModal() {
    setModalState({
      isOpen: true,
      mode: "create",
      client: null,
    });
  }

  function openEditModal(client) {
    setModalState({
      isOpen: true,
      mode: "edit",
      client,
    });
  }

  function closeModal() {
    setModalState(INITIAL_MODAL_STATE);
  }

  async function handleSaveClient(payload) {
    try {
      setSaving(true);
      setError("");

      if (modalState.mode === "edit" && modalState.client) {
        await api.updateClient(modalState.client.id, payload);
        setFeedback("Client modifie avec succes.");
      } else {
        await api.createClient(payload);
        setFeedback("Client ajoute avec succes.");
      }

      closeModal();
      await loadClients(search);
      await onDataChanged();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClient(client) {
    const shouldDelete = window.confirm(`Supprimer ${client.nom} ?`);
    if (!shouldDelete) {
      return;
    }

    try {
      setError("");
      await api.deleteClient(client.id);
      setFeedback("Client supprime.");
      await loadClients(search);
      await onDataChanged();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleCheckIn(client) {
    try {
      setError("");
      await api.checkInClient(client.id);
      setFeedback(`Check-in enregistre pour ${client.nom}.`);
      await onDataChanged();
    } catch (checkinError) {
      setError(checkinError.message);
    }
  }

  return (
    <section className="panel section-block">
      <div className="section-header">
        <h2>Gestion des clients</h2>
        <p>Ajouter, modifier, supprimer et check-in</p>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Rechercher un client par nom"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Nouveau client
        </button>
      </div>

      {feedback ? <p className="success-text">{feedback}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <ClientTable
        clients={clients}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDeleteClient}
        onCheckIn={handleCheckIn}
      />

      <ClientFormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialValues={modalState.client}
        onClose={closeModal}
        onSubmit={handleSaveClient}
        loading={saving}
      />
    </section>
  );
}
