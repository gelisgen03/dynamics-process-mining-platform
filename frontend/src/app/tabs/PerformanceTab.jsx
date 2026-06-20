import { useState } from "react";
import { apiClient } from "../api/client";
import CaseSelector from "../components/CaseSelector";
import { useDataSource } from "../context/DataSourceContext";
import "./PerformanceTab.css";

function fmtDays(days) {
  if (days === undefined || days === null) return "—";
  if (days < 1)  return `${(days * 24).toFixed(1)} saat`;
  if (days < 30) return `${days.toFixed(1)} gün`;
  return `${(days / 30).toFixed(1)} ay`;
}

function getActivityMeta(activity) {
  if (activity?.startsWith("A_")) return { color: "#0078d4" };
  if (activity?.startsWith("O_")) return { color: "#107c10" };
  if (activity?.startsWith("W_")) return { color: "#d83b01" };
  return { color: "#8764b8" };
}

function fmtWait(hours) {
  if (hours === null || hours === undefined) return null;
  if (hours < 1)   return `${Math.round(hours * 60)} dk`;
  if (hours < 24)  return `${hours.toFixed(1)} saat`;
  if (hours < 720) return `${(hours / 24).toFixed(1)} gün`;
  return `${(hours / 720).toFixed(1)} ay`;
}

function SlowCaseRow({ c, isOpen, onToggle }) {
  const maxWait = Math.max(...(c.steps ?? []).map(s => s.wait_hours ?? 0), 1);
  return (
    <div className={`slowCaseCard ${isOpen ? "slowCaseCardOpen" : ""}`}>
      <button className="slowCaseHeader" onClick={onToggle}>
        <span className="caseIdCell">{c.case_id}</span>
        <span className="slowCaseDur" style={{ color: "#c50f1f" }}>{fmtDays(c.duration_days)}</span>
        <span className="slowCaseChevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && c.steps && (
        <div className="slowCaseBody">
          {c.steps.map((s, i) => {
            const { color } = getActivityMeta(s.activity);
            const label = fmtWait(s.wait_hours);
            return (
              <div className="slowStep" key={i}>
                <span className="slowStepNum">{i + 1}</span>
                <span className="slowStepName" style={{ color }}>{s.activity}</span>
                {label ? (
                  <>
                    <div className="slowStepBarWrap">
                      <div
                        className="slowStepBar"
                        style={{ width: `${((s.wait_hours ?? 0) / maxWait) * 100}%`, background: color }}
                      />
                    </div>
                    <span className="slowStepWait" style={{ color }}>{label}</span>
                  </>
                ) : (
                  <span className="slowStepLast">son adım</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PerformanceTab() {
  const { tableName } = useDataSource();
  const [outcome, setOutcome]   = useState("all");
  const [caseLimit, setCaseLimit] = useState(100);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);
  const [openCase, setOpenCase] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.getPerformance(outcome, caseLimit, tableName);
      setResult(res);
    } catch (err) {
      setError(err.message || "Performans analizi başarısız");
    } finally {
      setLoading(false);
    }
  };

  const maxDist = Math.max(...(result?.distribution?.map((d) => d.count) ?? [1]));
  const maxWait = result?.activity_wait?.[0]?.avg_wait_hours ?? 1;

  return (
    <div className="performanceTab">
      {/* Kontrol */}
      <div className="controlPanel">
        <div className="controlRow">
          <CaseSelector
            outcome={outcome}
            caseLimit={caseLimit}
            onOutcomeChange={setOutcome}
            onCaseLimitChange={setCaseLimit}
            disabled={loading}
          />
          <button className="btnPrimary" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Hesaplanıyor..." : "Performansı Analiz Et"}
          </button>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {loading && (
        <div className="loadingBox">
          <p>Case süreleri ve darboğaz noktaları hesaplanıyor...</p>
          <p className="loadingHint">Bu işlem birkaç saniye sürebilir.</p>
        </div>
      )}

      {result && (
        <>
          {/* Özet KPI Kartları */}
          <div className="statsGrid">
            {[
              { label: "En Kısa",       value: fmtDays(result.summary.min_days), sub: "en hızlı tamamlanan" },
              { label: "En Uzun",       value: fmtDays(result.summary.max_days), sub: "en yavaş tamamlanan" },
              { label: "Ortalama Süre", value: fmtDays(result.summary.avg_days), sub: "case başına ortalama" },
              
            ].map((s) => (
              <div className="statCard" key={s.label}>
                <div className="statLabel">{s.label}</div>
                <div className="statValue">{s.value}</div>
                <div className="statHelper">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* En Yavaş / En Hızlı */}
          <div className="perfCaseGrid">
            <div className="sectionCard">
              <h3 className="sectionTitle">En Yavaş 5 Case</h3>
              <div className="slowCaseList">
                {result.slowest_cases.map((c) => (
                  <SlowCaseRow
                    key={c.case_id}
                    c={c}
                    isOpen={openCase === c.case_id}
                    onToggle={() => setOpenCase(openCase === c.case_id ? null : c.case_id)}
                  />
                ))}
              </div>
            </div>
            <div className="sectionCard">
              <h3 className="sectionTitle">En Hızlı 5 Case</h3>
              <table>
                <thead>
                  <tr><th>Case ID</th><th>Süre</th></tr>
                </thead>
                <tbody>
                  {result.fastest_cases.map((c, i) => (
                    <tr key={i}>
                      <td className="caseIdCell">{c.case_id}</td>
                      <td style={{ color: "#107c10", fontWeight: 600 }}>{fmtDays(c.duration_days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Darboğaz Analizi */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Darboğaz Analizi — Aktivite Başına Bekleme Süresi</h3>
            
            <div className="waitList">
              {result.activity_wait.map((a, i) => {
                const meta = getActivityMeta(a.activity);
                return (
                  <div className="distRow" key={i}>
                    <div className="distLabel">{a.activity}</div>
                    <div className="distBarWrap">
                      <div
                        className="distBar"
                        style={{ width: `${(a.avg_wait_hours / maxWait) * 100}%`, background: meta.color }}
                      />
                    </div>
                    <div className="distStats">
                      <span className="distCount" style={{ color: meta.color }}>
                        {a.avg_wait_hours >= 24
                          ? `${(a.avg_wait_hours / 24).toFixed(1)} gün`
                          : `${a.avg_wait_hours.toFixed(1)} saat`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Süre Dağılımı */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Case Süresi Dağılımı</h3>
            <div className="distList">
              {result.distribution.map((d) => (
                <div className="distRow" key={d.bucket}>
                  <div className="distLabel">{d.bucket}</div>
                  <div className="distBarWrap">
                    <div
                      className="distBar"
                      style={{ width: `${(d.count / maxDist) * 100}%`, background: "#0078d4" }}
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
        </>
      )}

      {!result && !loading && (
        <div className="infoPanel">
          <h3>Performans Analizi</h3>
          <p>
            Her case'in ne kadar sürdüğünü ve hangi aktivitelerin en çok bekleme süresi
            yarattığını (darboğaz) hesaplar.
          </p>
          <ul>
            <li><strong>Case Süresi:</strong> İlk event'ten son event'e kadar geçen süre</li>
            <li><strong>Bekleme Süresi:</strong> Bir aktiviteden sonra bir sonrakine geçme süresi</li>
            <li><strong>Darboğaz:</strong> En yüksek bekleme süresine sahip aktivite</li>
          </ul>
        </div>
      )}
    </div>
  );
}
