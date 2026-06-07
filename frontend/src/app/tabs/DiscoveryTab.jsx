import { useState } from "react";
import { apiClient } from "../api/client";
import "./DiscoveryTab.css";

const API_BASE = "http://localhost:8000";

const ALGO_INFO = {
  inductive: "Rekursif yapı, fitness garantisi verir. Karmaşık ve büyük süreçler için uygundur.",
  alpha: "Klasik algoritma. Basit ve gürültüsüz veri setleri için idealdir.",
  heuristics: "Frekans tabanlı, gürültülü gerçek dünya verilerinde en iyi sonucu verir. Önerilir.",
};

const METRICS = [
  { key: "fitness",        label: "Fitness",        desc: "Modelin log'u ne kadar kapsıyor",       color: "#3b82f6" },
  { key: "precision",      label: "Precision",       desc: "Gereksiz davranış üretmemesi",          color: "#10b981" },
  { key: "generalization", label: "Generalization",  desc: "Yeni trace'lere genellenebilirlik",     color: "#8b5cf6" },
  { key: "simplicity",     label: "Simplicity",      desc: "Modelin okunabilirliği / karmaşıklığı", color: "#f59e0b" },
];

export default function DiscoveryTab() {
  const [algorithm, setAlgorithm] = useState("heuristics");
  const [limit, setLimit] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.discoverProcess(algorithm, limit);
      setResult(res);
    } catch (err) {
      setError(err.message || "Discovery başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="discoveryTab">
      {/* Kontrol Paneli */}
      <div className="controlPanel">
        <div className="controlRow">
          <label className="field">
            <span>Algoritma</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={loading}
            >
              <option value="heuristics">Heuristics Miner (Önerilen)</option>
              <option value="inductive">Inductive Miner</option>
              <option value="alpha">Alpha Miner</option>
            </select>
          </label>

          <label className="field">
            <span>Veri Sayısı</span>
            <input
              type="number"
              min="100"
              max="5000"
              step="100"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={loading}
            />
            <small className="fieldHelper">100–5000 arası önerilen</small>
          </label>

          <button className="btnDiscovery" onClick={handleRun} disabled={loading}>
            {loading ? "Analiz Yapılıyor..." : "Modeli Üret"}
          </button>
        </div>
        <p className="algoHint">{ALGO_INFO[algorithm]}</p>
      </div>

      {/* Hata */}
      {error && <div className="errorBox">{error}</div>}

      {/* Sonuç */}
      {result && (
        <div className="resultPanel">
          <div className="resultHeader">
            <h3>Süreç Modeli Başarıyla Oluşturuldu</h3>
            <div className="resultMeta">
              <span className="badge">{result.algorithm}</span>
              <span className="badge">{result.events_analyzed} olay</span>
              <span className="badge">{result.cases_analyzed} case</span>
            </div>
          </div>

          {/* Genel Skor */}
          <div className="overallScore">
            <div className="overallLabel">Genel Model Skoru</div>
            <div className="overallValue">{result.metrics?.overall_score ?? "-"}</div>
            <div className="overallSub">/ 100</div>
          </div>

          {/* Metrik Kartları */}
          <div className="metricsGrid">
            {METRICS.map(({ key, label, desc, color }) => {
              const val = result.metrics?.[key] ?? 0;
              return (
                <div className="metricCard" key={key}>
                  <div className="metricLabel">{label}</div>
                  <div className="metricValue" style={{ color }}>
                    {(val * 100).toFixed(1)}%
                  </div>
                  <div className="metricBar">
                    <div
                      className="metricFill"
                      style={{ width: `${val * 100}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="metricDesc">{desc}</div>
                </div>
              );
            })}
          </div>

          {/* Petri Net Görseli */}
          <div className="modelViewer">
            <h4>Petri Net Görselleştirme</h4>
            <img
              src={`${API_BASE}/outputs/${result.image_filename}`}
              alt="Petri Net Model"
              className="petriNetImage"
            />
          </div>
        </div>
      )}

      {/* Bilgi Paneli */}
      {!result && !loading && (
        <div className="infoPanel">
          <h3>Süreç Keşfi (Process Discovery)</h3>
          <p>
            Seçilen algoritma ile event log üzerinden otomatik süreç modeli oluşturulur.
            Model dört metrikle değerlendirilir: Fitness, Precision, Generalization, Simplicity.
          </p>
          <ul>
            <li><strong>Heuristics:</strong> Gürültülü gerçek dünya verisi için önerilir</li>
            <li><strong>Inductive:</strong> Fitness garantisi, karmaşık yapılar için</li>
            <li><strong>Alpha:</strong> Basit ve temiz veri setleri için</li>
          </ul>
        </div>
      )}
    </div>
  );
}
