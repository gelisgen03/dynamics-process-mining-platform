// Backend API base URL
const API_BASE = "http://localhost:8000";

export const apiClient = {
  // === Health Check ===
  async health() {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  },

  // === Data Summary ===
  async getDataSummary() {
    const res = await fetch(`${API_BASE}/api/data/summary`);
    if (!res.ok) throw new Error("Veri özeti alınamadı");
    return res.json();
  },

  // === Data Sample ===
  async getDataSample(limit = 10, offset = 0) {
    const res = await fetch(
      `${API_BASE}/api/data/sample?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) throw new Error("Örnek veri alınamadı");
    return res.json();
  },

  // === Discovery ===
  async runDiscovery(algorithm = "inductive", limit = 500, offset = 0) {
    const res = await fetch(
      `${API_BASE}/api/discovery?algorithm=${algorithm}&limit=${limit}&offset=${offset}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Discovery başarısız oldu");
    return res.json();
  },
};