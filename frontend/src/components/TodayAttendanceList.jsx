function formatVisitTime(dateValue) {
  return new Date(dateValue).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TodayAttendanceList({ attendance }) {
  if (!attendance.length) {
    return <p className="empty-state">Aucune presence enregistree aujourd'hui.</p>;
  }

  return (
    <ul className="attendance-list">
      {attendance.map((item) => (
        <li key={item.id}>
          <div>
            <strong>{item.nom_client}</strong>
            <p>Check-in valide</p>
          </div>
          <span>{formatVisitTime(item.date_visite)}</span>
        </li>
      ))}
    </ul>
  );
}
