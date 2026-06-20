import { useEffect, useState } from "react";
import "./Charts.css";

export const PALETTE = [
  "#0078d4", "#6366f1", "#22d3ee", "#107c10", "#d83b01",
  "#8764b8", "#e3008c", "#00b294", "#ffb900", "#5c2e91",
];

/**
 * Animasyonlu donut (pie) grafiği.
 * data: [{ label, value, color? }]
 */
export function DonutChart({ data = [], size = 196, thickness = 26, centerValue, centerLabel, unit = "" }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;

  const [on, setOn] = useState(false);
  const key = data.map((d) => `${d.label}:${d.value}`).join("|");
  useEffect(() => {
    setOn(false);
    const id = setTimeout(() => setOn(true), 70);
    return () => clearTimeout(id);
  }, [key]);

  let acc = 0;
  const slices = data.map((d, i) => {
    const frac = (d.value || 0) / total;
    const len = circ * frac;
    const offset = circ * (acc / total);
    acc += d.value || 0;
    const color = d.color || PALETTE[i % PALETTE.length];
    return (
      <circle
        key={i}
        className="donutSlice"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={on ? `${len} ${circ - len}` : `0 ${circ}`}
        strokeDashoffset={-offset}
        style={{ transitionDelay: `${i * 0.09}s` }}
      />
    );
  });

  return (
    <div className="donutFig">
      <div className="donutSvgWrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-light)" strokeWidth={thickness} />
            {slices}
          </g>
        </svg>
        <div className="donutCenter">
          <div className="donutCenterVal">{centerValue}</div>
          <div className="donutCenterLabel">{centerLabel}</div>
        </div>
      </div>
      <ul className="donutLegend">
        {data.map((d, i) => {
          const pct = (((d.value || 0) / total) * 100).toFixed(1);
          return (
            <li key={i} className="donutLegendItem">
              <span className="donutSwatch" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
              <span className="donutLegendLabel" title={d.label}>{d.label}</span>
              <span className="donutLegendVal">{(d.value || 0).toLocaleString("tr-TR")}{unit} <em>%{pct}</em></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Animasyonlu yatay bar listesi.
 * data: [{ label, value, display? }]
 */
export function Bars({ data = [], colorFn, labelWidth = 200 }) {
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  const [on, setOn] = useState(false);
  const key = data.map((d) => `${d.label}:${d.value}`).join("|");
  useEffect(() => {
    setOn(false);
    const id = setTimeout(() => setOn(true), 70);
    return () => clearTimeout(id);
  }, [key]);

  return (
    <div className="barsList">
      {data.map((d, i) => (
        <div className="barRow" key={i}>
          <span className="barLabel" style={{ width: labelWidth }} title={d.label}>{d.label}</span>
          <span className="barTrack">
            <span
              className="barFill"
              style={{
                width: on ? `${((d.value || 0) / max) * 100}%` : "0%",
                background: colorFn ? colorFn(d, i) : "var(--primary)",
                transitionDelay: `${i * 0.05}s`,
              }}
            />
          </span>
          <span className="barVal">{d.display ?? (d.value || 0).toLocaleString("tr-TR")}</span>
        </div>
      ))}
    </div>
  );
}
