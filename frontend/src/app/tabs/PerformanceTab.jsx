import { useState } from "react";
import { apiClient } from "../api/client";
import "./PerformanceTab.css";

function fmtDays(days) {
  if (days === undefined || days === null) return "-";
  if (days < 1)  return `${(days * 24).toFixed(1)} saat`;
  if (days < 30) return `${days.toFixed(1)} gün`;
  return `${(days / 30).toFixed(1)} ay`;
}

export default function PerformanceTab() {
  const [limit, setLimit]     = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.getPerformance(limit);
      setResult(res);
    } catch (err) {
      setError(err.message || "Performans analizi başarısız");
    } finally {
      setLoading(false);
    }
  };

  const maxDist  = Math.max(...(result?.distribution?.map((d) => d.count) ?? [1]));
  const maxWait  = result?.activity_wait?.[0]?.avg_wait_hours ?? 1;

  return (
    <div className="performanceTab">
      {/* Kontrol */}
      <div className="controlPanel">
        <div className="controlRow">
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
          <button className="btnPerf" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Hesaplanıyor..." : "Performansı Analiz Et"}
          </button>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {result && (
        <>
          {/* Özet Kartlar */}
          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Ortalama Süre</div>
              <div className="statValue">{fmtDays(result.summary.avg_days)}</div>
              <div className="statHelper">case başına ortalama</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Medyan Süre</div>
              <div className="statValue">{fmtDays(result.summary.median_days)}</div>
              <div className="statHelper">ortanca case süresi</div>
            </div>
            <div className="statCard">
              <div className="statLabel">En Kısa</div>
              <div className="statValue">{fmtDays(result.summary.min_days)}</div>
              <div className="statHelper">en hızlı tamamlanan</div>
            </div>
            <div className="statCard">
              <div className="statLabel">En Uzun</div>
              <div className="statValue">{fmtDays(result.summary.max_days)}</div>
              <div className="statHelper">en yavaş tamamlanan</div>
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
                      style={{ width: `${(d.count / maxDist) * 100}%` }}
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

          {/* Aktivite Bekleme Süreleri */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Aktivite Başına Ortalama Bekleme Süresi</h3>
            <p className="sectionHint">
              Her aktiviteden sonra bir sonraki adıma geçmek için beklenen ortalama süre.
              Yüksek değer = darboğaz noktası.
            </p>
            <div className="waitList">
              {result.activity_wait.map((a, i) => {
                const meta = getActivityMeta(a.activity);
                return (
                  <div className="waitRow" key={i}>
                    <div className="waitActivity">
                      <span className="waitIcon">{meta.icon}</span>
                      <span className="waitName">{a.activity}</span>
                    </div>
                    <div className="waitBarWrap">
                      <div
                        className="waitBar"
                        style={{
                          width: `${(a.avg_wait_hours / maxWait) * 100}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                    <div className="waitValue">
                      {a.avg_wait_hours >= 24
                        ? `${(a.avg_wait_hours / 24).toFixed(1)} gün`
                        : `${a.avg_wait_hours.toFixed(1)} saat`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* En Yavaş / En Hızlı */}
          <div className="caseGrid">
            <div className="sectionCard">
              <h3 className="sectionTitle">En Yavaş 5 Case</h3>
              <table className="caseTable">
                <thead>
                  <tr><th>Case ID</th><th>Süre</th></tr>
                </thead>
                <tbody>
                  {result.slowest_cases.map((c, i) => (
                    <tr key={i}>
                      <td className="caseIdCell">{c.case_id}</td>
                      <td className="caseDur slow">{fmtDays(c.duration_days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sectionCard">
              <h3 className="sectionTitle">En Hızlı 5 Case</h3>
              <table className="caseTable">
                <thead>
                  <tr><th>Case ID</th><th>Süre</th></tr>
                </thead>
                <tbody>
                  {result.fastest_cases.map((c, i) => (
                    <tr key={i}>
                      <td className="caseIdCell">{c.case_id}</td>
                      <td className="caseDur fast">{fmtDays(c.duration_days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

// Aktivite ikonları (DataTab ile aynı mantık)
function getActivityMeta(activity) {
  const map = {
    A_SUBMITTED: { icon: "📤", color: "#3b82f6" },
    A_PARTLYSUBMITTED: { icon: "📋", color: "#3b82f6" },
    A_PREACCEPTED: { icon: "⏳", color: "#3b82f6" },
    A_ACCEPTED: { icon: "✅", color: "#3b82f6" },
    A_FINALIZED: { icon: "🏁", color: "#3b82f6" },
    A_DECLINED: { icon: "❌", color: "#3b82f6" },
    A_CANCELLED: { icon: "🚫", color: "#3b82f6" },
    O_SELECTED: { icon: "🎯", color: "#10b981" },
    O_CREATED: { icon: "📝", color: "#10b981" },
    O_SENT: { icon: "📨", color: "#10b981" },
    O_ACCEPTED: { icon: "✅", color: "#10b981" },
    O_DECLINED: { icon: "❌", color: "#10b981" },
    O_CANCELLED: { icon: "🚫", color: "#10b981" },
  };
  if (map[activity]) return map[activity];
  if (activity?.startsWith("A_")) return { icon: "📋", color: "#3b82f6" };
  if (activity?.startsWith("O_")) return { icon: "📄", color: "#10b981" };
  if (activity?.startsWith("W_")) return { icon: "⚙️", color: "#f59e0b" };
  return { icon: "🔵", color: "#6b7280" };
}
