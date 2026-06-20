import { useState } from "react";
import { apiClient } from "../api/client";
import CaseSelector from "../components/CaseSelector";
import { useDataSource } from "../context/DataSourceContext";
import "./ComparisonTab.css";

const ALGO_LABELS = {
  inductive:  "Inductive Miner",
  alpha:      "Alpha Miner",
  heuristics: "Heuristics Miner",
};

const METRICS = [
  { key: "fitness",        label: "Fitness",        color: "#0078d4" },
  { key: "precision",      label: "Precision",      color: "#107c10" },
  { key: "generalization", label: "Generalization", color: "#8764b8" },
  { key: "simplicity",     label: "Simplicity",     color: "#d83b01" },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function ComparisonTab() {
  const { tableName } = useDataSource();
  const [outcome, setOutcome]     = useState("all");
  const [caseLimit, setCaseLimit] = useState(100);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.compareModels(
        ["inductive", "alpha", "heuristics"],
        outcome,
        caseLimit,
        tableName
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
          <button className="btnPrimary" onClick={handleCompare} disabled={loading}>
            {loading ? "Karşılaştırılıyor..." : "3 Algoritmayı Karşılaştır"}
          </button>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {loading && (
        <div className="loadingBox">
          <p>3 algoritma çalıştırılıyor ve metrikler hesaplanıyor...</p>
          <p className="loadingHint">Bu işlem 30–90 saniye sürebilir.</p>
        </div>
      )}

      {result && ranking.length > 0 && (
        <>
          {/* En İyi Algoritma */}
          <div className="bestAlgoCard">
            <div className="bestAlgoLeft">
              <div className="bestAlgoTitle">En İyi Algoritma</div>
              <div className="bestAlgoName">
                {RANK_MEDALS[0]} {ALGO_LABELS[ranking[0].algorithm]}
              </div>
              <div className="bestAlgoMeta">
                {result.events_analyzed?.toLocaleString()} olay · {result.cases_analyzed?.toLocaleString()} case
              </div>
            </div>
            <div className="bestAlgoScore">
              <div className="bestScoreValue">{ranking[0].overall_score}</div>
              <div className="bestScoreSub">/ 100</div>
            </div>
          </div>

          {/* Sıralama Tablosu */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Sıralama Tablosu</h3>
            <div className="tableContainer">
              <table>
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
                    <tr key={row.algorithm} style={row.rank === 1 ? { background: "#eff6fc" } : {}}>
                      <td style={{ fontSize: 18 }}>{RANK_MEDALS[row.rank - 1] ?? row.rank}</td>
                      <td style={{ fontWeight: row.rank === 1 ? 700 : 400 }}>
                        {ALGO_LABELS[row.algorithm]}
                      </td>
                      <td style={{ fontWeight: 700, color: "#0078d4" }}>{row.overall_score}</td>
                      <td>{(row.fitness * 100).toFixed(1)}%</td>
                      <td>{(row.precision * 100).toFixed(1)}%</td>
                      <td>{(row.generalization * 100).toFixed(1)}%</td>
                      <td>{(row.simplicity * 100).toFixed(1)}%</td>
                      <td>{row.petri_net_info?.total_nodes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metrik Karşılaştırma */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Metrik Bazlı Karşılaştırma</h3>
            <div className="metricCompareGrid">
              {METRICS.map(({ key, label, color }) => (
                <div className="metricCompareCard" key={key}>
                  <div className="metricCompareLabel" style={{ color }}>{label}</div>
                  <div className="metricBars">
                    {ranking.map((row) => {
                      const val = row[key] ?? 0;
                      return (
                        <div key={row.algorithm} className="metricBarGroup">
                          <div className="metricBarLabel">{ALGO_LABELS[row.algorithm].split(" ")[0]}</div>
                          <div className="distBarWrap">
                            <div
                              className="distBar"
                              style={{ width: `${val * 100}%`, background: color }}
                            />
                          </div>
                          <div className="metricBarValue" style={{ color }}>{(val * 100).toFixed(1)}%</div>
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
