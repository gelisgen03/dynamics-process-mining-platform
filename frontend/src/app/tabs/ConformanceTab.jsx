import { useState } from "react";
import { apiClient } from "../api/client";
import CaseSelector from "../components/CaseSelector";
import "./ConformanceTab.css";

const ALGO_INFO = {
  inductive:  "Fitness garantisi verir — uyumluluk analizi için önerilir.",
  heuristics: "Gürültülü veriler için iyi, ama bazı trace'ler token sorunuyla karşılaşabilir.",
  alpha:      "Basit süreçler için. Karmaşık log'larda düşük uyumluluk çıkabilir.",
};

const STATUS_CONFIG = {
  fit:     { label: "Uyumlu",        color: "#107c10", bg: "rgba(16,124,16,.1)",  icon: "✓" },
  partial: { label: "Kısmen Uyumlu", color: "#d83b01", bg: "rgba(216,59,1,.1)",   icon: "~" },
  non_fit: { label: "Uyumsuz",       color: "#c50f1f", bg: "rgba(197,15,31,.1)",  icon: "✗" },
};

export default function ConformanceTab() {
  const [algorithm, setAlgorithm] = useState("inductive");
  const [outcome, setOutcome]     = useState("all");
  const [caseLimit, setCaseLimit] = useState(500);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.getConformance(algorithm, outcome, caseLimit);
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

          <CaseSelector
            outcome={outcome}
            caseLimit={caseLimit}
            onOutcomeChange={setOutcome}
            onCaseLimitChange={setCaseLimit}
            disabled={loading}
          />

          <button className="btnPrimary" onClick={handleAnalyze} disabled={loading}>
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
          <div className="confOverallGrid">
            <div className="confHighlightCard">
              <div className="confHighlightLabel">Uyumluluk Oranı</div>
              <div className="confHighlightValue">{overall.compliance_rate}%</div>
              <div className="confHighlightSub">
                {overall.fit_cases} / {result.cases_analyzed} case · {result.events_analyzed.toLocaleString()} olay
              </div>
            </div>
            <div className="confStatCard">
              <div className="confStatLabel">Ortalama Fitness</div>
              <div className="confStatValue">{(overall.avg_fitness * 100).toFixed(1)}%</div>
              <div className="confStatSub">tüm case'lerin ortalaması</div>
            </div>
            {["fit", "partial", "non_fit"].map((key) => {
              const cfg = STATUS_CONFIG[key];
              return (
                <div key={key} className="confStatusCard" style={{ borderTop: `3px solid ${cfg.color}` }}>
                  <div className="confStatusIcon" style={{ color: cfg.color }}>{cfg.icon}</div>
                  <div className="confStatusCount">{overall[`${key}_cases`]}</div>
                  <div className="confStatusLabel" style={{ color: cfg.color }}>{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {/* Fitness Dağılımı */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Fitness Dağılımı</h3>
            <div className="distList">
              {result.distribution.map((d) => {
                const color = d.range === "1.0"            ? "#107c10"
                            : d.range.startsWith("0.8")    ? "#00b7c3"
                            : d.range.startsWith("0.6")    ? "#d83b01"
                            : "#c50f1f";
                return (
                  <div className="distRow" key={d.range}>
                    <div className="distLabel">{d.range}</div>
                    <div className="distBarWrap">
                      <div
                        className="distBar"
                        style={{ width: `${(d.count / maxDist) * 100}%`, background: color }}
                      />
                    </div>
                    <div className="distStats">
                      <span className="distCount">{d.count}</span>
                      <span className="distPct">{d.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* En Sorunlu Case'ler */}
          <div className="sectionCard">
            <h3 className="sectionTitle">En Düşük Uyumluluklu Case'ler (İlk 20)</h3>
            <div className="tableContainer">
              <table>
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
                          <span className="confStatusBadge" style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td>
                          <div className="fitnessCell">
                            <div className="fitnessMiniBar">
                              <div
                                className="fitnessMiniBarFill"
                                style={{ width: `${c.fitness * 100}%`, background: cfg.color }}
                              />
                            </div>
                            <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>
                              {(c.fitness * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className={c.missing_tokens > 0 ? "tokenBad" : "tokenOk"}>{c.missing_tokens}</td>
                        <td className={c.remaining_tokens > 0 ? "tokenBad" : "tokenOk"}>{c.remaining_tokens}</td>
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
            <li><strong>✓ Uyumlu:</strong> Case tamamen modele uyuyor (fitness = 1.0)</li>
            <li><strong>~ Kısmen:</strong> Bazı adımlar atlandı veya ekstra yapıldı (0.5–1.0)</li>
            <li><strong>✗ Uyumsuz:</strong> Case büyük ölçüde sapmış (0.0–0.5)</li>
            <li><strong>Eksik Token:</strong> Modelde olması gereken ama gerçekleşmeyen adımlar</li>
            <li><strong>Kalan Token:</strong> Tamamlanmamış adımlar</li>
          </ul>
        </div>
      )}
    </div>
  );
}
