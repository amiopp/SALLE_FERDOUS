const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
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

  checkInClient(clientId) {
    return request(`/api/attendance/checkin/${clientId}`, {
      method: "POST",
    });
  },

  getTodayAttendance() {
    return request("/api/attendance/today");
  },

  getDashboard() {
    return request("/api/dashboard");
  },
};
