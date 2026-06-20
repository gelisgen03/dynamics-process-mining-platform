const API_BASE = "http://localhost:8000";
const DEFAULT_TABLE = "event_log_data";

export const apiClient = {
  async health() {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  },

  async getDataCount(tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/data/count?table_name=${tableName}`);
    if (!res.ok) throw new Error("Kayıt sayısı alınamadı");
    return res.json();
  },

  async getDataSummary(tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/data/summary?table_name=${tableName}`);
    if (!res.ok) throw new Error("Veri özeti alınamadı");
    return res.json();
  },

  async getDataSample(limit = 10, offset = 0, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/data/sample?limit=${limit}&offset=${offset}&table_name=${tableName}`);
    if (!res.ok) throw new Error("Örnek veri alınamadı");
    return res.json();
  },

  async discoverProcess(algorithm = "inductive", outcomeFilter = "all", caseLimit = 500, threshold = 0.5, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/discover-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        algorithm,
        outcome_filter: outcomeFilter,
        case_limit: caseLimit,
        dependency_threshold: threshold,
        table_name: tableName,
      }),
    });
    if (!res.ok) throw new Error("Discovery başarısız oldu");
    return res.json();
  },

  async getConformance(algorithm = "inductive", outcomeFilter = "all", caseLimit = 500, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/conformance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ algorithm, outcome_filter: outcomeFilter, case_limit: caseLimit, table_name: tableName }),
    });
    if (!res.ok) throw new Error("Uyumluluk analizi başarısız oldu");
    return res.json();
  },

  async getPerformance(outcomeFilter = "all", caseLimit = 500, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/performance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome_filter: outcomeFilter, case_limit: caseLimit, table_name: tableName }),
    });
    if (!res.ok) throw new Error("Performans analizi başarısız oldu");
    return res.json();
  },

  async getVariants(outcomeFilter = "all", caseLimit = 500, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome_filter: outcomeFilter, case_limit: caseLimit, table_name: tableName }),
    });
    if (!res.ok) throw new Error("Varyant analizi başarısız oldu");
    return res.json();
  },

  async compareModels(algorithms = ["inductive", "alpha", "heuristics"], outcomeFilter = "all", caseLimit = 500, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/compare-models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ algorithms, outcome_filter: outcomeFilter, case_limit: caseLimit, table_name: tableName }),
    });
    if (!res.ok) throw new Error("Karşılaştırma başarısız oldu");
    return res.json();
  },

  async chat(message, context = "", history = []) {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Agent yanıt vermedi");
    }
    return res.json();
  },

  async getCaseDetail(caseId, tableName = DEFAULT_TABLE) {
    const res = await fetch(`${API_BASE}/api/case-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: String(caseId), table_name: tableName }),
    });
    if (res.status === 404) throw new Error(`Case '${caseId}' bulunamadı`);
    if (!res.ok) throw new Error("Case detay alınamadı");
    return res.json();
  },

  // ── Application Insights (canlı D365 F&O telemetri) ──
  async appInsightsStatus() {
    const res = await fetch(`${API_BASE}/api/appinsights/status`);
    if (!res.ok) throw new Error("Bağlantı durumu alınamadı");
    return res.json();
  },

  async appInsightsProcesses() {
    const res = await fetch(`${API_BASE}/api/appinsights/processes`);
    if (!res.ok) throw new Error("Süreç kataloğu alınamadı");
    return res.json();
  },

  async appInsightsOverview({ process = "wave", days } = {}) {
    const res = await fetch(`${API_BASE}/api/appinsights/overview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ process, days }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Genel bakış alınamadı");
    return data;
  },

  async appInsightsVariants({ process = "wave", days, cases } = {}) {
    const res = await fetch(`${API_BASE}/api/appinsights/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ process, days, cases }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Canlı varyant analizi başarısız oldu");
    return data;
  },

  async appInsightsPerformance({ process = "wave", days, cases } = {}) {
    const res = await fetch(`${API_BASE}/api/appinsights/performance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ process, days, cases }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Canlı performans analizi başarısız oldu");
    return data;
  },

  async appInsightsSlowestForms({ days, top = 15 } = {}) {
    const res = await fetch(`${API_BASE}/api/appinsights/slowest-forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, top }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Form performansı alınamadı");
    return data;
  },

  async appInsightsQuery({ process = "wave", days, query } = {}) {
    const res = await fetch(`${API_BASE}/api/appinsights/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ process, days, query }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Canlı sorgu başarısız oldu");
    return data;
  },

  async appInsightsDiscover({ process = "wave", days, algorithm = "inductive", query, cases } = {}) {
    const res = await fetch(`${API_BASE}/api/appinsights/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ process, days, algorithm, query, cases }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Canlı keşif başarısız oldu");
    return data;
  },
};
