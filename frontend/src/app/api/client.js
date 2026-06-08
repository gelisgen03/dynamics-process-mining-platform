const API_BASE = "http://localhost:8000";

export const apiClient = {
  // === Health Check ===
  async health() {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  },

  // === Data Count ===
  async getDataCount() {
    const res = await fetch(`${API_BASE}/api/data/count`);
    if (!res.ok) throw new Error("Kayıt sayısı alınamadı");
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
    const res = await fetch(`${API_BASE}/api/data/sample?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Örnek veri alınamadı");
    return res.json();
  },

  // === Discovery — outcome_filter + case_limit + dependency_threshold ===
  async discoverProcess(algorithm = "inductive", outcomeFilter = "all", caseLimit = 500, threshold = 0.5) {
    const res = await fetch(`${API_BASE}/api/discover-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        algorithm,
        outcome_filter: outcomeFilter,
        case_limit: caseLimit,
        dependency_threshold: threshold,
      }),
    });
    if (!res.ok) throw new Error("Discovery başarısız oldu");
    return res.json();
  },

  // === Conformance Checking ===
  async getConformance(algorithm = "inductive", outcomeFilter = "all", caseLimit = 500) {
    const res = await fetch(`${API_BASE}/api/conformance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ algorithm, outcome_filter: outcomeFilter, case_limit: caseLimit }),
    });
    if (!res.ok) throw new Error("Uyumluluk analizi başarısız oldu");
    return res.json();
  },

  // === Performance Analysis ===
  async getPerformance(outcomeFilter = "all", caseLimit = 500) {
    const res = await fetch(`${API_BASE}/api/performance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome_filter: outcomeFilter, case_limit: caseLimit }),
    });
    if (!res.ok) throw new Error("Performans analizi başarısız oldu");
    return res.json();
  },

  // === Variant Analysis ===
  async getVariants(outcomeFilter = "all", caseLimit = 500) {
    const res = await fetch(`${API_BASE}/api/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome_filter: outcomeFilter, case_limit: caseLimit }),
    });
    if (!res.ok) throw new Error("Varyant analizi başarısız oldu");
    return res.json();
  },

  // === Compare Models ===
  async compareModels(algorithms = ["inductive", "alpha", "heuristics"], outcomeFilter = "all", caseLimit = 500) {
    const res = await fetch(`${API_BASE}/api/compare-models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ algorithms, outcome_filter: outcomeFilter, case_limit: caseLimit }),
    });
    if (!res.ok) throw new Error("Karşılaştırma başarısız oldu");
    return res.json();
  },
};
