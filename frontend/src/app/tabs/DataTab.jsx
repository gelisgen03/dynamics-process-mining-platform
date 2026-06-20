import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useDataSource } from "../context/DataSourceContext";
import "./DataTab.css";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="statCard" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="statValue" style={{ color: accent }}>{value}</div>
      <div className="statLabel">{label}</div>
      {sub && <div className="statSub">{sub}</div>}
    </div>
  );
}

function fmtTs(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DataTab() {
  const { source, tableName } = useDataSource();
  const [summary, setSummary]   = useState(null);
  const [sample, setSample]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setSample([]);

    Promise.all([
      apiClient.getDataSummary(tableName),
      apiClient.getDataSample(10, 0, tableName),
    ])
      .then(([sum, smp]) => {
        setSummary(sum);
        setSample(smp.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tableName]);

  const stats = summary
    ? [
        { label: "Toplam Event",      value: summary.total_events?.toLocaleString("tr-TR") ?? "—", sub: "Ham kayıt",           accent: "#0078d4" },
        { label: "Toplam Case",       value: summary.total_cases?.toLocaleString("tr-TR")  ?? "—", sub: "Benzersiz vaka",      accent: "#107c10" },
        { label: "Ort. Event / Case", value: summary.avg_events_per_case ?? "—",                   sub: "Vaka başına adım",    accent: "#8764b8" },
        { label: "Başlangıç",         value: fmtTs(summary.date_range?.min),                       sub: "İlk kayıt",           accent: "#d83b01" },
        { label: "Bitiş",             value: fmtTs(summary.date_range?.max),                       sub: "Son kayıt",           accent: "#ca5010" },
      ]
    : [];

  const columns = sample.length > 0
    ? Object.keys(sample[0]).filter((k) => k !== "id")
    : [];

  return (
    <div className="dataTab">
      {/* Başlık */}
      <div className="dataHeader">
        <div className="dataHeaderLeft">
          <span className="dataBadge">{source.badge}</span>
          <div>
            <div className="dataTitle">{source.label}</div>
            <div className="dataSub">{source.description}</div>
          </div>
        </div>
        <div className="dataTableName">
          Tablo: <code>{tableName}</code>
        </div>
      </div>

      {/* Hata */}
      {error && (
        <div className="dataError">Veri yüklenemedi: {error}</div>
      )}

      {/* İstatistik kartları */}
      {loading ? (
        <div className="dataLoading">Yükleniyor…</div>
      ) : (
        <div className="statsGrid">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Örnek veri tablosu */}
      {!loading && sample.length > 0 && (
        <div className="sampleSection">
          <div className="sampleTitle">Örnek Kayıtlar</div>
          <div className="sampleTableWrap">
            <table className="sampleTable">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sample.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>{String(row[col] ?? "—")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
