import { useState } from "react";
import { apiClient } from "../api/client";
import CaseSelector from "../components/CaseSelector";
import { useDataSource } from "../context/DataSourceContext";
import "./DiscoveryTab.css";

const API_BASE = "http://localhost:8000";

const ALGO_INFO = {
  inductive:  "Rekursif yapı, fitness garantisi verir. Karmaşık ve büyük süreçler için uygundur.",
  alpha:      "Klasik algoritma. Basit ve gürültüsüz veri setleri için idealdir.",
  heuristics: "Frekans tabanlı, gürültülü gerçek dünya verilerinde en iyi sonucu verir. Önerilir.",
};

const METRICS = [
  { key: "fitness",        label: "Fitness",        desc: "Modelin log'u ne kadar kapsıyor",       color: "#0078d4", weight: "40%" },
  { key: "precision",      label: "Precision",      desc: "Gereksiz davranış üretmemesi",          color: "#107c10", weight: "30%" },
  { key: "generalization", label: "Generalization", desc: "Yeni trace'lere genellenebilirlik",     color: "#8764b8", weight: "20%" },
  { key: "simplicity",     label: "Simplicity",     desc: "Modelin okunabilirliği / karmaşıklığı", color: "#d83b01", weight: "10%" },
];

export default function DiscoveryTab() {
  const { tableName } = useDataSource();
  const [algorithm, setAlgorithm]   = useState("heuristics");
  const [outcome, setOutcome]       = useState("all");
  const [caseLimit, setCaseLimit]   = useState(100);
  const [threshold, setThreshold]   = useState(0.5);
  const [loading, setLoading]       = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.discoverProcess(algorithm, outcome, caseLimit, threshold, tableName);
      setResult({ ...res, timestamp: Date.now() });
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
            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} disabled={loading}>
              <option value="heuristics">Heuristics Miner </option>
              <option value="inductive">Inductive Miner</option>
              <option value="alpha">Alpha Miner</option>
            </select>
          </label>

          <CaseSelector
            outcome={outcome}
            caseLimit={caseLimit}
            onOutcomeChange={setOutcome}
            onCaseLimitChange={setCaseLimit}
            disabled={loading}
          />

          <button className="btnPrimary" onClick={handleRun} disabled={loading}>
            {loading ? "Analiz Yapılıyor..." : "Modeli Üret"}
          </button>
        </div>
        <p className="algoHint">{ALGO_INFO[algorithm]}</p>

        {algorithm === "heuristics" && (
          <div className="thresholdRow">
            <span className="thresholdLabel">
              Bağlantı Eşiği (Dependency Threshold):
              <strong> {threshold.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0.1"
              max="0.99"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              disabled={loading}
              className="thresholdSlider"
            />
            <span className="thresholdHint">
              {threshold < 0.5 ? "Düşük — çok yol dahil edilir (karmaşık model)"
               : threshold < 0.75 ? "Orta — dengeli"
               : "Yüksek — sadece sık yollar (sade model)"}
            </span>
          </div>
        )}
      </div>

      {error && <div className="errorBox">{error}</div>}

      {loading && (
        <div className="loadingBox">
          <p>Süreç modeli keşfediliyor ve metrikler hesaplanıyor...</p>
          <p className="loadingHint">Bu işlem 10–60 saniye sürebilir.</p>
        </div>
      )}

      {result && (
        <div className="discoveryResult">
          {/* Sonuç başlık */}
          <div className="resultHeaderBar">
            <div className="resultHeaderLeft">
              <h3>Süreç Modeli Oluşturuldu</h3>
              <div className="resultBadges">
                <span className="badge">{result.algorithm}</span>
                <span className="badge">{result.events_analyzed?.toLocaleString()} olay</span>
                <span className="badge">{result.cases_analyzed?.toLocaleString()} case</span>
              </div>
            </div>
            <div className="overallScoreBox">
              <div className="overallScoreValue">{result.metrics?.overall_score ?? "—"}</div>
              <div className="overallScoreSub">/ 100 puan</div>
            </div>
          </div>

          {/* Metrik Kartları */}
          <div className="metricsGrid">
            {METRICS.map(({ key, label, desc, color, weight }) => {
              const val = result.metrics?.[key] ?? 0;
              return (
                <div className="metricCard" key={key} style={{ borderTopColor: color }}>
                  <div className="metricTopRow">
                    <div className="metricLabel">{label}</div>
                    <div className="metricWeight" style={{ color }}>{weight}</div>
                  </div>
                  <div className="metricValue" style={{ color }}>{(val * 100).toFixed(1)}%</div>
                  <div className="metricBarWrap">
                    <div className="metricBarFill" style={{ width: `${val * 100}%`, background: color }} />
                  </div>
                  <div className="metricDesc">{desc}</div>
                </div>
              );
            })}
          </div>

          {/* Petri Net */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Petri Net Görselleştirme</h3>
            {result.petri_net_info && (
              <div className="petriNetMeta">
                <span className="badge">{result.petri_net_info.places} yer</span>
                <span className="badge">{result.petri_net_info.transitions} geçiş</span>
                <span className="badge">{result.petri_net_info.arcs} ark</span>
              </div>
            )}
            <div className="petriNetImageWrap">
              <img
                key={result.timestamp}
                src={`${API_BASE}/api/petri-image/${result.image_filename}?t=${result.timestamp}`}
                alt="Petri Net Model"
                className="petriNetImage"
              />
            </div>

            {/* Legend */}
            <div className="petriLegend">
              <div className="petriLegendItem">
                <svg width="32" height="28" viewBox="0 0 32 28">
                  <circle cx="16" cy="14" r="11" fill="white" stroke="#333" strokeWidth="1.8"/>
                </svg>
                <div>
                  <div className="petriLegendLabel">Yer (Place)</div>
                  <div className="petriLegendDesc">Sürecin o anki durumunu temsil eder</div>
                </div>
              </div>

              <div className="petriLegendItem">
                <svg width="32" height="28" viewBox="0 0 32 28">
                  <circle cx="16" cy="14" r="11" fill="white" stroke="#333" strokeWidth="1.8"/>
                  <circle cx="16" cy="14" r="4.5" fill="#333"/>
                </svg>
                <div>
                  <div className="petriLegendLabel">Token (Jeton)</div>
                  <div className="petriLegendDesc">Başlangıç/bitiş yerindeki işaretleyici</div>
                </div>
              </div>

              <div className="petriLegendItem">
                <svg width="32" height="28" viewBox="0 0 32 28">
                  <rect x="2" y="8" width="28" height="12" rx="1" fill="white" stroke="#333" strokeWidth="1.8"/>
                  <text x="16" y="18" textAnchor="middle" fontSize="7" fill="#333" fontFamily="sans-serif">aktivite</text>
                </svg>
                <div>
                  <div className="petriLegendLabel">Geçiş (Transition)</div>
                  <div className="petriLegendDesc">Gerçekleşen bir aktivite / iş adımı</div>
                </div>
              </div>

              <div className="petriLegendItem">
                <svg width="32" height="28" viewBox="0 0 32 28">
                  <rect x="8" y="8" width="16" height="12" rx="1" fill="#333" stroke="#333" strokeWidth="1.5"/>
                </svg>
                <div>
                  <div className="petriLegendLabel">Sessiz Geçiş (τ)</div>
                  <div className="petriLegendDesc">Görünmez başlangıç veya bitiş adımı</div>
                </div>
              </div>

              <div className="petriLegendItem">
                <svg width="32" height="28" viewBox="0 0 32 28">
                  <defs>
                    <marker id="lg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#555"/>
                    </marker>
                  </defs>
                  <line x1="2" y1="14" x2="25" y2="14" stroke="#555" strokeWidth="1.8" markerEnd="url(#lg-arr)"/>
                </svg>
                <div>
                  <div className="petriLegendLabel">Ark (Arc)</div>
                  <div className="petriLegendDesc">Yer → Geçiş veya Geçiş → Yer akışı</div>
                </div>
              </div>

              <div className="petriLegendItem">
                <svg width="32" height="28" viewBox="0 0 32 28">
                  <circle cx="8" cy="14" r="7" fill="white" stroke="#333" strokeWidth="1.8"/>
                  <circle cx="8" cy="14" r="3" fill="#333"/>
                  <line x1="15" y1="14" x2="22" y2="14" stroke="#555" strokeWidth="1.5"/>
                  <circle cx="26" cy="14" r="4" fill="none" stroke="#333" strokeWidth="4"/>
                </svg>
                <div>
                  <div className="petriLegendLabel">Başlangıç → Bitiş</div>
                  <div className="petriLegendDesc">Sol: token'lı yer · Sağ: çift çizgili yer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
