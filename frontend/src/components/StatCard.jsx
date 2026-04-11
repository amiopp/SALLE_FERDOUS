export default function StatCard({ title, value, tone = "neutral" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <p>{title}</p>
      <h3>{value}</h3>
    </article>
  );
}
