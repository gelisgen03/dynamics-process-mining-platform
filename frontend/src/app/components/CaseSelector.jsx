import "./CaseSelector.css";

const OUTCOME_OPTIONS = [
  { value: "all",      label: "Tüm Case'ler" },
  { value: "accepted", label: "Kabul Edilenler" },
  { value: "declined", label: "Reddedilenler" },
];

const OUTCOME_STYLE = {
  all:      { bg: "rgba(0,120,212,.07)",  border: "rgba(0,120,212,.25)",  color: "#0078d4" },
  accepted: { bg: "rgba(16,124,16,.07)",  border: "rgba(16,124,16,.25)",  color: "#107c10" },
  declined: { bg: "rgba(197,15,31,.07)",  border: "rgba(197,15,31,.25)",  color: "#c50f1f" },
};

export default function CaseSelector({
  outcome,
  caseLimit,
  onOutcomeChange,
  onCaseLimitChange,
  disabled = false,
}) {
  const style = OUTCOME_STYLE[outcome] ?? OUTCOME_STYLE.all;
  const label = OUTCOME_OPTIONS.find((o) => o.value === outcome)?.label ?? "";

  return (
    <>
      <label className="caseField">
        <span className="caseLabel">Sonuç Filtresi</span>
        <select
          className="caseSelect"
          value={outcome}
          onChange={(e) => onOutcomeChange(e.target.value)}
          disabled={disabled}
        >
          {OUTCOME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label className="caseField">
        <span className="caseLabel">Case Sayısı</span>
        <input
          className="caseLimitInput"
          type="number"
          min="50"
          max="5000"
          step="50"
          value={caseLimit}
          onChange={(e) =>
            onCaseLimitChange(Math.max(50, Math.min(5000, Number(e.target.value))))
          }
          disabled={disabled}
        />
      </label>

      <div
        className="casePreview"
        style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}
      >
        <span className="previewCount">{caseLimit.toLocaleString("tr-TR")}</span>
        <span className="previewUnit"> Case işlenecek</span>
        {outcome !== "all" && (
          <span className="previewTotal"> · {label.toLowerCase()}</span>
        )}
      </div>
    </>
  );
}
