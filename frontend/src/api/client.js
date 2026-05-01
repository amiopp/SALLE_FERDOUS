const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("admin_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("admin_token");
      throw new Error("Session expirée ou identifiants invalides.");
    }

    let message = "Une erreur est survenue";
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Fallback si la reponse n'est pas en JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getClients(search = "") {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return request(`/api/clients${query}`);
  },

  createClient(payload) {
    return request("/api/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateClient(clientId, payload) {
    return request(`/api/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteClient(clientId) {
    return request(`/api/clients/${clientId}`, {
      method: "DELETE",
    });
  },

  getDashboard() {
    return request("/api/dashboard");
  },

  login(username, password) {
    return request("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
};
