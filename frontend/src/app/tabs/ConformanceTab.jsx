import { useState } from "react";
import { apiClient } from "../api/client";
import "./ConformanceTab.css";

const ALGO_INFO = {
  inductive:  "Fitness garantisi verir — uyumluluk analizi için önerilir.",
  heuristics: "Gürültülü veriler için iyi, ama bazı trace'ler token sorunuyla karşılaşabilir.",
  alpha:      "Basit süreçler için. Karmaşık log'larda düşük uyumluluk çıkabilir.",
};

const STATUS_CONFIG = {
  fit:      { label: "Uyumlu",        color: "#10b981", bg: "rgba(16,185,129,0.1)",  icon: "✅" },
  partial:  { label: "Kısmen Uyumlu", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "⚠️" },
  non_fit:  { label: "Uyumsuz",       color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: "❌" },
};

export default function ConformanceTab() {
  const [algorithm, setAlgorithm] = useState("inductive");
  const [limit, setLimit]         = useState(1000);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.getConformance(algorithm, limit);
      setResult(res);
    } catch (err) {
      setError(err.message || "Uyumluluk analizi başarısız");
    } finally {
      setLoading(false);
    }
  };

  const overall = result?.overall;
  const maxDist = Math.max(...(result?.distribution?.map((d) => d.count) ?? [1]));

  return (
    <div className="conformanceTab">
      {/* Kontrol */}
      <div className="controlPanel">
        <div className="controlRow">
          <label className="field">
            <span>Referans Model</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={loading}
            >
              <option value="inductive">Inductive Miner (Önerilen)</option>
              <option value="heuristics">Heuristics Miner</option>
              <option value="alpha">Alpha Miner</option>
            </select>
          </label>

          <label className="field">
            <span>Veri Sayısı</span>
            <input
              type="number" min="100" max="5000" step="100"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={loading}
            />
            <small className="fieldHelper">Analiz edilecek event sayısı</small>
          </label>

          <button className="btnConf" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analiz Ediliyor..." : "Uyumluluğu Analiz Et"}
          </button>
        </div>
        <p className="algoHint">{ALGO_INFO[algorithm]}</p>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {loading && (
        <div className="loadingBox">
          <p>Model keşfediliyor ve her case için token replay çalıştırılıyor...</p>
          <p className="loadingHint">Bu işlem 20–60 saniye sürebilir.</p>
        </div>
      )}

      {result && overall && (
        <>
          {/* Genel Uyumluluk Kartları */}
          <div className="overallGrid">
            <div className="overallCard highlight">
              <div className="overallLabel">Uyumluluk Oranı</div>
              <div className="overallValue">{overall.compliance_rate}%</div>
              <div className="overallSub">{overall.fit_cases} / {result.cases_analyzed} case</div>
            </div>
            <div className="overallCard">
              <div className="overallLabel">Ortalama Fitness</div>
              <div className="overallValue">{(overall.avg_fitness * 100).toFixed(1)}%</div>
              <div className="overallSub">tüm case'lerin ortalaması</div>
            </div>
            <div className="statusCard" style={{ borderColor: STATUS_CONFIG.fit.color, background: STATUS_CONFIG.fit.bg }}>
              <div className="statusIcon">{STATUS_CONFIG.fit.icon}</div>
              <div className="statusCount">{overall.fit_cases}</div>
              <div className="statusLabel">Uyumlu</div>
            </div>
            <div className="statusCard" style={{ borderColor: STATUS_CONFIG.partial.color, background: STATUS_CONFIG.partial.bg }}>
              <div className="statusIcon">{STATUS_CONFIG.partial.icon}</div>
              <div className="statusCount">{overall.partial_cases}</div>
              <div className="statusLabel">Kısmen</div>
            </div>
            <div className="statusCard" style={{ borderColor: STATUS_CONFIG.non_fit.color, background: STATUS_CONFIG.non_fit.bg }}>
              <div className="statusIcon">{STATUS_CONFIG.non_fit.icon}</div>
              <div className="statusCount">{overall.non_fit_cases}</div>
              <div className="statusLabel">Uyumsuz</div>
            </div>
          </div>

          {/* Fitness Dağılımı */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Fitness Dağılımı</h3>
            <div className="distList">
              {result.distribution.map((d) => (
                <div className="distRow" key={d.range}>
                  <div className="distLabel">{d.range}</div>
                  <div className="distBarWrap">
                    <div
                      className="distBar"
                      style={{
                        width: `${(d.count / maxDist) * 100}%`,
                        backgroundColor: d.range === "1.0" ? "#10b981"
                          : d.range.startsWith("0.8") ? "#34d399"
                          : d.range.startsWith("0.6") ? "#f59e0b"
                          : d.range.startsWith("0.4") ? "#fb923c"
                          : "#ef4444",
                      }}
                    />
                  </div>
                  <div className="distStats">
                    <span className="distCount">{d.count}</span>
                    <span className="distPct">{d.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* En Sorunlu Case'ler */}
          <div className="sectionCard">
            <h3 className="sectionTitle">En Düşük Uyumluluklu Case'ler (İlk 20)</h3>
            <div className="tableContainer">
              <table className="confTable">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Durum</th>
                    <th>Fitness</th>
                    <th>Eksik Token</th>
                    <th>Kalan Token</th>
                  </tr>
                </thead>
                <tbody>
                  {result.worst_cases.map((c) => {
                    const cfg = STATUS_CONFIG[c.status];
                    return (
                      <tr key={c.case_id}>
                        <td className="caseIdCell">{c.case_id}</td>
                        <td>
                          <span
                            className="statusBadge"
                            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color }}
                          >
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td>
                          <div className="fitnessCell">
                            <div className="fitnessMini">
                              <div
                                className="fitnessFill"
                                style={{
                                  width: `${c.fitness * 100}%`,
                                  backgroundColor: cfg.color,
                                }}
                              />
                            </div>
                            <span style={{ color: cfg.color, fontWeight: 600 }}>
                              {(c.fitness * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className={c.missing_tokens > 0 ? "tokenBad" : "tokenOk"}>
                          {c.missing_tokens}
                        </td>
                        <td className={c.remaining_tokens > 0 ? "tokenBad" : "tokenOk"}>
                          {c.remaining_tokens}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="infoPanel">
          <h3>Uyumluluk Analizi (Conformance Checking)</h3>
          <p>
            Seçilen algoritmanın keşfettiği model ile gerçek event log'u karşılaştırır.
            Her case'in modele ne kadar uyduğunu ölçer.
          </p>
          <ul>
            <li><strong>✅ Uyumlu:</strong> Case tamamen modele uyuyor (fitness = 1.0)</li>
            <li><strong>⚠️ Kısmen:</strong> Bazı adımlar atlandı veya ekstra yapıldı (0.5–1.0)</li>
            <li><strong>❌ Uyumsuz:</strong> Case büyük ölçüde sapmış (0.0–0.5)</li>
            <li><strong>Eksik Token:</strong> Modelde olması gereken ama gerçekleşmeyen adımlar</li>
            <li><strong>Kalan Token:</strong> Süreç bitmeden kalan, tamamlanmamış adımlar</li>
          </ul>
        </div>
      )}
    </div>
  );
}
