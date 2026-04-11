import TodayAttendanceList from "../components/TodayAttendanceList";

export default function AttendancePage({ attendance, loading, error, onRefresh }) {
  return (
    <section className="panel section-block">
      <div className="section-header">
        <div>
          <h2>Liste des presences</h2>
          <p>Clients ayant fait le check-in aujourd'hui</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          Actualiser
        </button>
      </div>

      {loading ? <p className="empty-state">Chargement...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <TodayAttendanceList attendance={attendance} />
    </section>
  );
}
