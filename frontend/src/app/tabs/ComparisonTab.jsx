import { useState } from "react";
import { apiClient } from "../api/client";
import "./ComparisonTab.css";

const ALGO_LABELS = {
  inductive:  "Inductive Miner",
  alpha:      "Alpha Miner",
  heuristics: "Heuristics Miner",
};

const METRICS = [
  { key: "fitness",        label: "Fitness",        color: "#3b82f6" },
  { key: "precision",      label: "Precision",       color: "#10b981" },
  { key: "generalization", label: "Generalization",  color: "#8b5cf6" },
  { key: "simplicity",     label: "Simplicity",      color: "#f59e0b" },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function ComparisonTab() {
  const [limit, setLimit]     = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.compareModels(
        ["inductive", "alpha", "heuristics"],
        limit
      );
      setResult(res);
    } catch (err) {
      setError(err.message || "Karşılaştırma başarısız");
    } finally {
      setLoading(false);
    }
  };

  const ranking = result?.ranking ?? [];

  return (
    <div className="comparisonTab">
      {/* Kontrol Paneli */}
      <div className="controlPanel">
        <div className="controlRow">
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
            <small className="fieldHelper">Tüm algoritmalar aynı veri ile çalışır</small>
          </label>

          <button className="btnCompare" onClick={handleCompare} disabled={loading}>
            {loading ? "Karşılaştırılıyor..." : "3 Algoritmayı Karşılaştır"}
          </button>
        </div>
      </div>

      {/* Hata */}
      {error && <div className="errorBox">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="loadingBox">
          <p>3 algoritma çalıştırılıyor ve metrikler hesaplanıyor...</p>
          <p className="loadingHint">Bu işlem 30–90 saniye sürebilir.</p>
        </div>
      )}

      {/* Sonuçlar */}
      {result && ranking.length > 0 && (
        <>
          {/* En İyi Algoritma */}
          <div className="bestAlgo">
            <div className="bestLabel">En İyi Algoritma</div>
            <div className="bestName">
              {RANK_MEDALS[0]} {ALGO_LABELS[ranking[0].algorithm]}
            </div>
            <div className="bestScore">{ranking[0].overall_score} / 100</div>
            <div className="bestMeta">
              {result.events_analyzed} olay · {result.cases_analyzed} case
            </div>
          </div>

          {/* Sıralama Tablosu */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Sıralama Tablosu</h3>
            <div className="tableContainer">
              <table className="compTable">
                <thead>
                  <tr>
                    <th>Sıra</th>
                    <th>Algoritma</th>
                    <th>Genel Skor</th>
                    <th>Fitness</th>
                    <th>Precision</th>
                    <th>Generalization</th>
                    <th>Simplicity</th>
                    <th>Nodes</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row) => (
                    <tr key={row.algorithm} className={row.rank === 1 ? "rowBest" : ""}>
                      <td className="tdRank">{RANK_MEDALS[row.rank - 1] ?? row.rank}</td>
                      <td className="tdAlgo">{ALGO_LABELS[row.algorithm]}</td>
                      <td className="tdScore">{row.overall_score}</td>
                      <td>{(row.fitness * 100).toFixed(1)}%</td>
                      <td>{(row.precision * 100).toFixed(1)}%</td>
                      <td>{(row.generalization * 100).toFixed(1)}%</td>
                      <td>{(row.simplicity * 100).toFixed(1)}%</td>
                      <td>{row.petri_net_info?.total_nodes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metrik Karşılaştırma Grafikleri */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Metrik Karşılaştırması</h3>
            <div className="metricCharts">
              {METRICS.map(({ key, label, color }) => (
                <div className="chartRow" key={key}>
                  <div className="chartLabel">{label}</div>
                  <div className="chartBars">
                    {ranking.map((row) => {
                      const val = row[key] ?? 0;
                      return (
                        <div className="chartBarGroup" key={row.algorithm}>
                          <div className="chartBarWrap">
                            <div
                              className="chartBar"
                              style={{ width: `${val * 100}%`, backgroundColor: color }}
                            />
                          </div>
                          <div className="chartBarLabel">
                            <span>{ALGO_LABELS[row.algorithm].split(" ")[0]}</span>
                            <span style={{ color }}>{(val * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bilgi Paneli */}
      {!result && !loading && (
        <div className="infoPanel">
          <h3>Algoritma Karşılaştırması</h3>
          <p>
            Inductive, Alpha ve Heuristics Miner algoritmalarını aynı veri üzerinde çalıştırıp
            dört kalite metriğiyle otomatik olarak karşılaştırır ve sıralar.
          </p>
          <ul>
            <li><strong>Fitness (40%):</strong> Modelin log'u ne kadar kapsıyor</li>
            <li><strong>Precision (30%):</strong> Gereksiz davranış üretmemesi</li>
            <li><strong>Generalization (20%):</strong> Yeni trace'lere genellenebilirlik</li>
            <li><strong>Simplicity (10%):</strong> Modelin okunabilirliği</li>
          </ul>
        </div>
      )}
    </div>
  );
}
