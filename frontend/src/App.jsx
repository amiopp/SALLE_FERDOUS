import { useEffect, useState } from "react";

import { api } from "./api/client";
import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
import AttendancePage from "./pages/AttendancePage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({
    total_clients: 0,
    total_presences_aujourdhui: 0,
  });
  const [attendance, setAttendance] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");

  async function refreshGlobalData(withLoader = false) {
    try {
      if (withLoader) {
        setGlobalLoading(true);
      }
      setGlobalError("");

      const [dashboardData, attendanceData] = await Promise.all([
        api.getDashboard(),
        api.getTodayAttendance(),
      ]);

      setDashboard(dashboardData);
      setAttendance(attendanceData);
    } catch (fetchError) {
      setGlobalError(fetchError.message);
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    refreshGlobalData(true);
  }, []);

  function renderActivePage() {
    if (activeTab === "clients") {
      return <ClientsPage onDataChanged={() => refreshGlobalData(false)} />;
    }

    if (activeTab === "attendance") {
      return (
        <AttendancePage
          attendance={attendance}
          loading={globalLoading}
          error={globalError}
          onRefresh={() => refreshGlobalData(false)}
        />
      );
    }

    return (
      <DashboardPage
        dashboard={dashboard}
        todayAttendance={attendance}
        loading={globalLoading}
        error={globalError}
      />
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <NavTabs activeTab={activeTab} onChange={setActiveTab} />
      {renderActivePage()}
    </div>
  );
}
