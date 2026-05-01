import { useEffect, useState } from "react";

import { api } from "./api/client";
import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import ExpiredClientsPage from "./pages/ExpiredClientsPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({
    total_clients: 0,
    total_presences_aujourdhui: 0,
  });
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("admin_token") || "");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const isAuthenticated = Boolean(authToken);

  async function refreshGlobalData(withLoader = false) {
    try {
      if (withLoader) {
        setGlobalLoading(true);
      }
      setGlobalError("");

      const dashboardData = await api.getDashboard();

      setDashboard(dashboardData);
    } catch (fetchError) {
      setGlobalError(fetchError.message);
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    refreshGlobalData(true);
  }, [isAuthenticated]);

  async function handleLogin(username, password) {
    setLoginLoading(true);
    setLoginError("");

    try {
      const loginResponse = await api.login(username, password);
      sessionStorage.setItem("admin_token", loginResponse.access_token);
      setAuthToken(loginResponse.access_token);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setAuthToken("");
    setActiveTab("dashboard");
    setGlobalError("");
    setLoginError("");
  }

  function renderActivePage() {
    if (activeTab === "clients") {
      return <ClientsPage onDataChanged={() => refreshGlobalData(false)} />;
    }

    if (activeTab === "expired") {
      return <ExpiredClientsPage />;
    }

    return (
      <DashboardPage
        dashboard={dashboard}
        loading={globalLoading}
        error={globalError}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <Header isAuthenticated={false} />
        <LoginPage
          onLogin={handleLogin}
          loading={loginLoading}
          error={loginError}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header isAuthenticated onLogout={handleLogout} />
      <NavTabs activeTab={activeTab} onChange={setActiveTab} />
      {renderActivePage()}
    </div>
  );
}
