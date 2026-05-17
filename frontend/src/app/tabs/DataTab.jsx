import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import "./DataTab.css";

export default function DataTab() {
  const [summary, setSummary] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sayfa yüklenince veri çek
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Özet ve örnek veriyi paralel çek
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

  if (loading) {
    return (
      <div className="dataTab">
        <p className="hint">Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dataTab">
        <p style={{ color: "var(--error)" }}>
          Hata: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="dataTab">
      {/* Üst: Stat Kartları */}
      <div className="statsGrid">
        <div className="statCard">
          <div className="statLabel">Toplam Event</div>
          <div className="statValue">{summary?.total_events || 0}</div>
          <div className="statHelper">Veri tabanında kaydedilen olaylar</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Toplam Case</div>
          <div className="statValue">{summary?.total_cases || 0}</div>
          <div className="statHelper">İş süreci örneği sayısı</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Ortalama Event/Case</div>
          <div className="statValue">
            {summary?.avg_events_per_case || 0}
          </div>
          <div className="statHelper">Ortalama olay sayısı</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Zaman Aralığı</div>
          <div className="statValue">
            {summary?.date_range?.min
              ? new Date(summary.date_range.min).toLocaleDateString("tr-TR")
              : "-"}
          </div>
          <div className="statHelper">
            {summary?.date_range?.max
              ? `- ${new Date(summary.date_range.max).toLocaleDateString("tr-TR")}`
              : ""}
          </div>
        </div>
      </div>

      {/* Orta: Veri Örneği Tablosu */}
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
                <th>Activity</th>
                <th>Timestamp</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {samples.length > 0 ? (
                samples.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.case_id}</td>
                    <td>{row.activity}</td>
                    <td>
                      {new Date(row.timestamp).toLocaleString("tr-TR")}
                    </td>
                    <td>{row.resource || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="emptyState">
                    Veri bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}   