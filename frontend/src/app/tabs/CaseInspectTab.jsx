import { useState, useRef } from "react";
import { apiClient } from "../api/client";
import "./CaseInspectTab.css";

function fmtDays(days) {
  if (days === undefined || days === null) return "—";
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)} dk`;
  if (days < 1)      return `${(days * 24).toFixed(1)} saat`;
  if (days < 30)     return `${days.toFixed(1)} gün`;
  return `${(days / 30).toFixed(1)} ay`;
}

function fmtWait(hours) {
  if (hours === null || hours === undefined) return null;
  if (hours < 1 / 60) return "< 1 dk";
  if (hours < 1)   return `${Math.round(hours * 60)} dk`;
  if (hours < 24)  return `${hours.toFixed(1)} saat`;
  if (hours < 720) return `${(hours / 24).toFixed(1)} gün`;
  return `${(hours / 720).toFixed(1)} ay`;
}

function fmtTs(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function actColor(activity) {
  if (activity?.startsWith("A_")) return { bg: "#dbeafe", color: "#1d4ed8", bar: "#0078d4" };
  if (activity?.startsWith("O_")) return { bg: "#dcfce7", color: "#15803d", bar: "#107c10" };
  if (activity?.startsWith("W_")) return { bg: "#fee2e2", color: "#b91c1c", bar: "#d83b01" };
  return { bg: "#f3e8ff", color: "#7e22ce", bar: "#8764b8" };
}

function outcomeStyle(outcome) {
  if (outcome === "Kabul Edildi")  return { color: "#15803d", bg: "#dcfce7" };
  if (outcome === "Reddedildi")    return { color: "#b91c1c", bg: "#fee2e2" };
  return { color: "#6b7280", bg: "#f3f4f6" };
}

export default function CaseInspectTab() {
  const [inputId, setInputId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async (id) => {
    const target = (id ?? inputId).trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.getCaseDetail(target);
      setResult(res);
    } catch (err) {
      setError(err.message || "Case bulunamadı");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const maxWaitHours = result
    ? Math.max(...(result.steps ?? []).map(s => s.wait_hours ?? 0), 1)
    : 1;

  const cmp = result?.comparison;
  const diffDays = result ? result.total_days - (cmp?.avg_days ?? 0) : 0;
  const isSlow = diffDays > 0;

  return (
    <div className="caseInspectTab">
      {/* Arama */}
      <div className="inspectSearch">
        <div className="inspectSearchRow">
          <input
            ref={inputRef}
            className="inspectInput"
            type="text"
            placeholder="Case ID girin… örn. 173694"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="btnPrimary"
            onClick={() => handleSearch()}
            disabled={loading || !inputId.trim()}
          >
            {loading ? "Aranıyor…" : "İncele"}
          </button>
        </div>
        <p className="inspectHint">
          Performans veya Uyumluluk sekmesinden bir Case ID kopyalayıp buraya yapıştırabilirsiniz.
        </p>
      </div>

      {error && (
        <div className="errorBox">{error}</div>
      )}

      {loading && (
        <div className="loadingBox">
          <p>Case aranıyor ve adımlar hesaplanıyor…</p>
        </div>
      )}

      {result && (
        <>
          {/* Özet başlık */}
          <div className="inspectHeader">
            <div className="inspectCaseId">#{result.case_id}</div>
            <span
              className="inspectOutcome"
              style={outcomeStyle(result.outcome)}
            >
              {result.outcome}
            </span>
            <div className="inspectMeta">
              {fmtTs(result.start_time)} → {fmtTs(result.end_time)}
            </div>
          </div>

          {/* KPI Kartlar */}
          <div className="inspectKpiGrid">
            <div className="inspectKpi">
              <div className="inspectKpiLabel">Toplam Süre</div>
              <div className="inspectKpiValue">{fmtDays(result.total_days)}</div>
            </div>
            <div className="inspectKpi">
              <div className="inspectKpiLabel">Adım Sayısı</div>
              <div className="inspectKpiValue">{result.step_count}</div>
            </div>
            <div className="inspectKpi">
              <div className="inspectKpiLabel">En Uzun Bekleme</div>
              <div className="inspectKpiValue" style={{ color: "#c50f1f" }}>
                {result.longest_wait ? fmtWait(result.longest_wait.hours) : "—"}
              </div>
              {result.longest_wait && (
                <div className="inspectKpiSub">{result.longest_wait.activity}</div>
              )}
            </div>
            <div className="inspectKpi">
              <div className="inspectKpiLabel">Dataset Ortalamasına Göre</div>
              <div
                className="inspectKpiValue"
                style={{ color: isSlow ? "#c50f1f" : "#15803d" }}
              >
                {isSlow ? "+" : ""}{fmtDays(Math.abs(diffDays))} {isSlow ? "yavaş" : "hızlı"}
              </div>
              <div className="inspectKpiSub">
                Ort. {fmtDays(cmp?.avg_days)} · %{cmp?.pct_rank} diliminde
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Adım Adım Timeline ({result.step_count} adım)</h3>
            <div className="inspectTimeline">
              {result.steps.map((s, i) => {
                const { bg, color, bar } = actColor(s.activity);
                const waitLabel = fmtWait(s.wait_hours);
                const isLongest = result.longest_wait && s.activity === result.longest_wait.activity
                  && s.wait_hours === result.longest_wait.hours;
                return (
                  <div className={`timelineRow ${isLongest ? "timelineRowAlert" : ""}`} key={i}>
                    {/* Sol: numara + connector */}
                    <div className="timelineLeft">
                      <div className="timelineDot" style={{ background: color }} />
                      {i < result.steps.length - 1 && <div className="timelineLine" />}
                    </div>

                    {/* Sağ: içerik */}
                    <div className="timelineContent">
                      <div className="timelineTopRow">
                        <span className="timelineOrder">#{s.order}</span>
                        <span className="timelineChip" style={{ background: bg, color }}>{s.activity}</span>
                        {isLongest && <span className="timelineAlert">⚠ En Uzun Bekleme</span>}
                        <span className="timelineTs">{fmtTs(s.timestamp)}</span>
                      </div>

                      {waitLabel && (
                        <div className="timelineWait">
                          <div className="timelineWaitBarWrap">
                            <div
                              className="timelineWaitBar"
                              style={{
                                width: `${((s.wait_hours ?? 0) / maxWaitHours) * 100}%`,
                                background: bar,
                              }}
                            />
                          </div>
                          <span className="timelineWaitLabel" style={{ color: bar }}>
                            {waitLabel} bekledi
                          </span>
                        </div>
                      )}
                      {!waitLabel && i === result.steps.length - 1 && (
                        <div className="timelineEnd">Son adım</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hızlı ara tekrar */}
          <div className="inspectAgain">
            <input
              className="inspectInput inspectInputSm"
              type="text"
              placeholder="Başka Case ID…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  setInputId(e.target.value.trim());
                  handleSearch(e.target.value.trim());
                }
              }}
            />
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="infoPanel">
          <h3>Case İnceleme</h3>
          <p>
            Bir case ID girerek o case'in baştan sona tüm adımlarını, her adımdaki
            bekleme sürelerini ve dataset ortalamasıyla karşılaştırmasını görebilirsiniz.
          </p>
          <ul>
            <li><strong>Adım:</strong> Bir aktivitenin gerçekleştiği an</li>
            <li><strong>Bekleme:</strong> O adımdan sonraki adıma geçiş süresi</li>
            <li><strong>⚠ Uyarı:</strong> En uzun bekleme yaratan adım işaretlenir</li>
            <li><strong>İpucu:</strong> Performans sekmesindeki Case ID'leri buraya kopyalayın</li>
          </ul>
        </div>
      )}
    </div>
  );
}
