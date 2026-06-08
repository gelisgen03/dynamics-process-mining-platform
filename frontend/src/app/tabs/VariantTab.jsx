import { useState } from "react";
import { apiClient } from "../api/client";
import CaseSelector from "../components/CaseSelector";
import "./VariantTab.css";

function getActivityColor(activity) {
  if (activity?.startsWith("A_")) return { bg: "#dbeafe", color: "#1d4ed8" };
  if (activity?.startsWith("O_")) return { bg: "#dcfce7", color: "#15803d" };
  if (activity?.startsWith("W_")) return { bg: "#fee2e2", color: "#b91c1c" };
  return { bg: "#f3e8ff", color: "#7e22ce" };
}

function TraceSteps({ trace }) {
  const steps = trace.split(" → ");
  return (
    <div className="traceSteps">
      {steps.map((step, i) => {
        const { bg, color } = getActivityColor(step);
        return (
          <span key={i} className="traceStepWrap">
            <span className="traceChip" style={{ background: bg, color }}>{step}</span>
            {i < steps.length - 1 && <span className="traceArrow">→</span>}
          </span>
        );
      })}
    </div>
  );
}

function VariantCard({ v, maxFreq, isOpen, onToggle }) {
  const steps = v.trace.split(" → ");
  const preview = steps.slice(0, 3).join(" → ") + (steps.length > 3 ? ` → ... (+${steps.length - 3})` : "");
  return (
    <div className={`variantCard ${isOpen ? "variantCardOpen" : ""}`}>
      <button className="variantCardHeader" onClick={onToggle}>
        <span className="variantRank">#{v.rank}</span>
        <span className="variantPreview">{preview}</span>
        <span className="variantStats">
          <span className="variantCount">{v.frequency} case</span>
          <span className="variantPct">{v.percentage}%</span>
        </span>
        <span className="variantChevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      <div className="variantBarWrap">
        <div className="variantBarFill" style={{ width: `${(v.frequency / maxFreq) * 100}%` }} />
      </div>
      {isOpen && (
        <div className="variantCardBody">
          <div className="traceStepCount">{steps.length} adım</div>
          <TraceSteps trace={v.trace} />
        </div>
      )}
    </div>
  );
}

export default function VariantTab() {
  const [outcome, setOutcome]     = useState("all");
  const [caseLimit, setCaseLimit] = useState(500);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);
  const [openVariant, setOpenVariant] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.getVariants(outcome, caseLimit);
      setResult(res);
    } catch (err) {
      setError(err.message || "Varyant analizi başarısız");
    } finally {
      setLoading(false);
    }
  };

  const maxFreq  = result?.top_variants?.[0]?.frequency ?? 1;
  const maxCount = result?.top_activities?.[0]?.count ?? 1;

  return (
    <div className="variantTab">
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
            {loading ? "Analiz Ediliyor..." : "Varyantları Analiz Et"}
          </button>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {loading && (
        <div className="loadingBox">
          <p>Trace varyantları ve aktivite frekansları hesaplanıyor...</p>
          <p className="loadingHint">Bu işlem birkaç saniye sürebilir.</p>
        </div>
      )}

      {result && (
        <>
          {/* KPI Kartlar */}
          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Toplam Event</div>
              <div className="statValue">{result.events_analyzed.toLocaleString()}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Toplam Case</div>
              <div className="statValue">{result.cases_analyzed.toLocaleString()}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Benzersiz Varyant</div>
              <div className="statValue">{result.unique_variants}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Varyant Çeşitliliği</div>
              <div className="statValue">
                {(result.unique_variants / result.cases_analyzed * 100).toFixed(1)}%
              </div>
              <div className="statHelper">kaç case'in kendine özgü yolu var</div>
            </div>
          </div>

          {/* Üst Varyantlar */}
          <div className="sectionCard">
            <h3 className="sectionTitle">En Sık Görülen 10 Trace Varyantı</h3>
            <div className="variantList">
              {result.top_variants.map((v) => (
                <VariantCard
                  key={v.rank}
                  v={v}
                  maxFreq={maxFreq}
                  isOpen={openVariant === v.rank}
                  onToggle={() => setOpenVariant(openVariant === v.rank ? null : v.rank)}
                />
              ))}
            </div>
          </div>

          {/* Aktivite Frekansları */}
          <div className="sectionCard">
            <h3 className="sectionTitle">Aktivite Frekansları (İlk 15)</h3>
            <div className="activityList">
              {result.top_activities.map((a, i) => {
                const color = a.activity?.startsWith("A_") ? "#0078d4"
                            : a.activity?.startsWith("O_") ? "#107c10"
                            : a.activity?.startsWith("W_") ? "#d83b01"
                            : "#8764b8";
                return (
                  <div className="distRow" key={i}>
                    <div className="distLabel">{a.activity}</div>
                    <div className="distBarWrap">
                      <div
                        className="distBar"
                        style={{ width: `${(a.count / maxCount) * 100}%`, background: color }}
                      />
                    </div>
                    <div className="distStats">
                      <span className="distCount">{a.count.toLocaleString()}</span>
                      <span className="distPct">{a.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="infoPanel">
          <h3>Varyant Analizi</h3>
          <p>
            Her case'in hangi aktivite sırasını izlediğini analiz eder. Aynı sırayı paylaşan
            case'ler bir "varyant" oluşturur. Az varyant → standart süreç; çok varyant → karmaşık süreç.
          </p>
          <ul>
            <li><strong>Trace:</strong> Bir case'in baştan sona aktivite dizisi</li>
            <li><strong>Varyant:</strong> Aynı trace'e sahip case grubu</li>
            <li><strong>Frekans:</strong> O varyantın kaç case'de görüldüğü</li>
          </ul>
        </div>
      )}
    </div>
  );
}
