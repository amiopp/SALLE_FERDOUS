const TABS = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "clients", label: "Clients" },
  { id: "expired", label: "Clients expires" },
];

export default function NavTabs({ activeTab, onChange }) {
  return (
    <nav className="tabs panel" aria-label="Navigation principale">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-button ${activeTab === tab.id ? "tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
