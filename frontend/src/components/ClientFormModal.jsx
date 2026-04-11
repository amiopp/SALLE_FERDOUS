import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  nom: "",
  telephone: "",
  date_debut: new Date().toISOString().slice(0, 10),
  duree_abonnement: 1,
};

export default function ClientFormModal({
  isOpen,
  mode,
  initialValues,
  onClose,
  onSubmit,
  loading,
}) {
  const defaultValues = useMemo(
    () =>
      initialValues
        ? {
            nom: initialValues.nom,
            telephone: initialValues.telephone,
            date_debut: initialValues.date_debut,
            duree_abonnement: initialValues.duree_abonnement,
          }
        : EMPTY_FORM,
    [initialValues]
  );

  const [form, setForm] = useState(defaultValues);

  useEffect(() => {
    if (isOpen) {
      setForm(defaultValues);
    }
  }, [defaultValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      duree_abonnement: Number(form.duree_abonnement),
    });
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card panel">
        <h3>{mode === "edit" ? "Modifier le client" : "Ajouter un client"}</h3>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nom complet
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              minLength={2}
            />
          </label>

          <label>
            Telephone
            <input
              type="text"
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Date de debut
            <input
              type="date"
              name="date_debut"
              value={form.date_debut}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Duree abonnement (mois)
            <input
              type="number"
              name="duree_abonnement"
              min={1}
              value={form.duree_abonnement}
              onChange={handleChange}
              required
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enregistrement..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
