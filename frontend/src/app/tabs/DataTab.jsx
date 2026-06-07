import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import "./DataTab.css";

// BPI Challenge 2012 aktivite ikonları
const ACTIVITY_MAP = {
  A_SUBMITTED:         { icon: "📤", label: "Başvuru Gönderildi",       color: "#3b82f6" },
  A_PARTLYSUBMITTED:   { icon: "📋", label: "Kısmen Gönderildi",        color: "#3b82f6" },
  A_PREACCEPTED:       { icon: "⏳", label: "Ön Kabul",                  color: "#3b82f6" },
  A_ACCEPTED:          { icon: "✅", label: "Kabul Edildi",              color: "#3b82f6" },
  A_FINALIZED:         { icon: "🏁", label: "Tamamlandı",                color: "#3b82f6" },
  A_DECLINED:          { icon: "❌", label: "Reddedildi",                color: "#3b82f6" },
  A_CANCELLED:         { icon: "🚫", label: "İptal Edildi",              color: "#3b82f6" },
  O_SELECTED:          { icon: "🎯", label: "Teklif Seçildi",            color: "#10b981" },
  O_CREATED:           { icon: "📝", label: "Teklif Oluşturuldu",        color: "#10b981" },
  O_SENT:              { icon: "📨", label: "Teklif Gönderildi",         color: "#10b981" },
  O_SENT_BACK:         { icon: "🔄", label: "Teklif Geri Gönderildi",   color: "#10b981" },
  O_RETURNED:          { icon: "↩️",  label: "Teklif İade Edildi",       color: "#10b981" },
  O_ACCEPTED:          { icon: "✅", label: "Teklif Kabul Edildi",       color: "#10b981" },
  O_DECLINED:          { icon: "❌", label: "Teklif Reddedildi",         color: "#10b981" },
  O_CANCELLED:         { icon: "🚫", label: "Teklif İptal Edildi",       color: "#10b981" },
};

function getActivityMeta(activity) {
  if (!activity) return { icon: "🔵", label: activity, color: "#6b7280" };
  if (ACTIVITY_MAP[activity]) return ACTIVITY_MAP[activity];
  if (activity.startsWith("A_")) return { icon: "📋", label: activity, color: "#3b82f6" };
  if (activity.startsWith("O_")) return { icon: "📄", label: activity, color: "#10b981" };
  if (activity.startsWith("W_")) return { icon: "⚙️", label: activity, color: "#f59e0b" };
  return { icon: "🔵", label: activity, color: "#6b7280" };
}

const CATEGORIES = [
  {
    prefix: "A_",
    title: "Başvuru Adımları",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.3)",
    activities: [
      "A_SUBMITTED", "A_PARTLYSUBMITTED", "A_PREACCEPTED",
      "A_ACCEPTED", "A_FINALIZED", "A_DECLINED", "A_CANCELLED",
    ],
  },
  {
    prefix: "O_",
    title: "Teklif Adımları",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    activities: [
      "O_CREATED", "O_SELECTED", "O_SENT", "O_SENT_BACK",
      "O_RETURNED", "O_ACCEPTED", "O_DECLINED", "O_CANCELLED",
    ],
  },
  {
    prefix: "W_",
    title: "İş Akışı Görevleri",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    activities: [],
    note: "W_ ile başlayan görevler Hollandaca iş akışı adımlarıdır (tamamlama, doğrulama, arama vb.)",
  },
];

export default function DataTab() {
  const [summary, setSummary]   = useState(null);
  const [samples, setSamples]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, samplesRes] = await Promise.all([
        apiClient.getDataSummary(),
        apiClient.getDataSample(10, 0),
      ]);
      setSummary(summaryRes);
      setSamples(samplesRes.data || []);
    } catch (err) {
      setError(err.message || "Veri yükleme hatası");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dataTab"><p className="hint">Yükleniyor...</p></div>;
  if (error)   return <div className="dataTab"><p style={{ color: "var(--error)" }}>Hata: {error}</p></div>;

  return (
    <div className="dataTab">

      {/* Özet Kartlar */}
      <div className="statsGrid">
        <div className="statCard">
          <div className="statLabel">Toplam Event</div>
          <div className="statValue">{summary?.total_events?.toLocaleString() || 0}</div>
          <div className="statHelper">Veritabanındaki toplam olay sayısı</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Toplam Case</div>
          <div className="statValue">{summary?.total_cases?.toLocaleString() || 0}</div>
          <div className="statHelper">İş süreci örneği sayısı</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Ort. Event / Case</div>
          <div className="statValue">{summary?.avg_events_per_case || 0}</div>
          <div className="statHelper">Her başvurudaki ortalama adım</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Zaman Aralığı</div>
          <div className="statValue" style={{ fontSize: "18px" }}>
            {summary?.date_range?.min
              ? new Date(summary.date_range.min).toLocaleDateString("tr-TR")
              : "-"}
          </div>
          <div className="statHelper">
            {summary?.date_range?.max
              ? `→ ${new Date(summary.date_range.max).toLocaleDateString("tr-TR")}`
              : ""}
          </div>
        </div>
      </div>

      {/* Süreç Adımları Kategorileri */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h3>Süreç Adımları</h3>
        </div>
        <div className="categoryList">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.prefix}
              className="categoryBlock"
              style={{ background: cat.bg, borderColor: cat.border }}
            >
              <div className="categoryTitle" style={{ color: cat.color }}>
                {cat.title}
                <span className="categoryPrefix">{cat.prefix}*</span>
              </div>
              {cat.note ? (
                <p className="categoryNote">{cat.note}</p>
              ) : (
                <div className="activityChips">
                  {cat.activities.map((act) => {
                    const meta = ACTIVITY_MAP[act];
                    return (
                      <div className="activityChip" key={act} style={{ borderColor: cat.border }}>
                        <span className="chipIcon">{meta.icon}</span>
                        <div className="chipText">
                          <span className="chipCode">{act}</span>
                          <span className="chipLabel">{meta.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Veri Örneği Tablosu */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h3>Veri Örneği (İlk 10 Kayıt)</h3>
          <button className="btnRefresh" onClick={fetchData}>
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
        </div>
        <div className="tableContainer">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Aktivite</th>
                <th>Timestamp</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {samples.length > 0 ? (
                samples.map((row, idx) => {
                  const meta = getActivityMeta(row.activity);
                  return (
                    <tr key={idx}>
                      <td><span className="caseId">{row.case_id}</span></td>
                      <td>
                        <span className="activityCell">
                          <span className="activityIcon">{meta.icon}</span>
                          <span className="activityName" style={{ color: meta.color }}>
                            {row.activity}
                          </span>
                        </span>
                      </td>
                      <td>{new Date(row.timestamp).toLocaleString("tr-TR")}</td>
                      <td>{row.resource || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="emptyState">Veri bulunamadı</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
