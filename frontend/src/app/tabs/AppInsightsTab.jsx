import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { DonutChart, Bars, PALETTE } from "../components/Charts";
import "./AppInsightsTab.css";

const API_BASE = "http://localhost:8000";

const FLOW = {
  wave: ["Oluştur", "Ayır", "İşle", "İş Yarat", "Topla", "Sevk", "Tamamla"],
  batch: ["Oluştur", "Başlat", "Yürüt", "Tamamla"],
};

const SUBTABS = [
  { id: "overview", label: "Genel Bakış" },
  { id: "discovery", label: "Süreç Keşfi" },
  { id: "variants", label: "Varyant Analizi" },
  { id: "performance", label: "Performans" },
];

const ALGORITHMS = [
  { id: "inductive", label: "Inductive Miner", desc: "Yapısal, her zaman sağlam (sound) model" },
  { id: "heuristics", label: "Heuristics Miner", desc: "Gürültülü veride sık yolları öne çıkarır" },
  { id: "alpha", label: "Alpha Miner", desc: "Klasik, basit ve hızlı temel algoritma" },
];

const METRICS = [
  { key: "fitness", label: "Fitness", hint: "Model gözlemlenen davranışı ne kadar açıklıyor" },
  { key: "precision", label: "Precision", hint: "Model fazladan davranış üretmiyor mu" },
  { key: "generalization", label: "Generalization", hint: "Yeni vakalara genelleme esnekliği" },
  { key: "simplicity", label: "Simplicity", hint: "Modelin sadeliği / anlaşılırlığı" },
];

const DAYS_OPTIONS = [7, 14, 30];

const fmt = (n) => (n ?? 0).toLocaleString("tr-TR");
const day = (iso) => (iso ? String(iso).slice(0, 10) : "—");
const fmtMs = (ms) => (ms >= 1000 ? `${(ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn` : `${Math.round(ms)} ms`);
const dur = (h) => (h >= 24 ? `${(h / 24).toFixed(1)} gün` : h >= 1 ? `${h.toFixed(1)} sa` : `${Math.round(h * 60)} dk`);
const metricColor = (v) => (v >= 0.8 ? "#107c10" : v >= 0.5 ? "#d83b01" : "#c50f1f");
const scoreBand = (s) => (s >= 75 ? { label: "İyi", cls: "aiScoreGood" } : s >= 50 ? { label: "Orta", cls: "aiScoreMid" } : { label: "Zayıf", cls: "aiScoreLow" });

// Donut için top-N + "Diğer" toplaması
function donutData(items, labelFn, valFn, total, topN = 7) {
  const top = items.slice(0, topN).map((it, i) => ({ label: labelFn(it, i), value: valFn(it) }));
  const sumTop = top.reduce((s, d) => s + d.value, 0);
  const grand = total ?? items.reduce((s, it) => s + valFn(it), 0);
  const rest = grand - sumTop;
  if (rest > 0.5) top.push({ label: "Diğer", value: Math.round(rest), color: "#c8c6c4" });
  return top;
}

// Varyant akordiyonu için aktivite renkleri
function aiActivityColor(activity) {
  if (activity?.startsWith("A_")) return { bg: "#dbeafe", color: "#1d4ed8" };
  if (activity?.startsWith("O_")) return { bg: "#dcfce7", color: "#15803d" };
  if (activity?.startsWith("W_")) return { bg: "#fee2e2", color: "#b91c1c" };
  return { bg: "#f3e8ff", color: "#7e22ce" };
}

function AiTraceSteps({ trace }) {
  const steps = trace.split(" → ");
  return (
    <div className="aiTraceSteps">
      {steps.map((step, i) => {
        const { bg, color } = aiActivityColor(step);
        return (
          <span className="aiTraceStepWrap" key={step + i}>
            <span className="aiTraceChip" style={{ background: bg, color }}>{step}</span>
            {i < steps.length - 1 && <span className="aiTraceArrow">→</span>}
          </span>
        );
      })}
    </div>
  );
}

function AiVariantCard({ v, rank, maxFreq, color, isOpen, onToggle }) {
  const clean = v.trace.replace(/Warehouse\.|Batch/g, "");
  const steps = clean.split(" → ");
  const preview = steps.slice(0, 3).join(" → ") + (steps.length > 3 ? ` → … (+${steps.length - 3})` : "");
  return (
    <div className={`aiVariantCard ${isOpen ? "aiVariantCardOpen" : ""}`}>
      <button className="aiVariantHeader" onClick={onToggle}>
        <span className="aiVarBadge" style={{ background: color }}>{rank}</span>
        <span className="aiVariantPreview">{preview}</span>
        <span className="aiVariantStats">
          <span className="aiVariantCount">{fmt(v.frequency)} vaka</span>
          <span className="aiVariantPct">%{v.percentage}</span>
        </span>
        <span className="aiVariantChevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      <div className="aiVariantBarWrap">
        <div className="aiVariantBarFill" style={{ width: `${(v.frequency / maxFreq) * 100}%`, background: color }} />
      </div>
      {isOpen && (
        <div className="aiVariantBody">
          <div className="aiTraceStepCount">{steps.length} adım</div>
          <AiTraceSteps trace={clean} />
        </div>
      )}
    </div>
  );
}

function TraceFlow({ steps, live }) {
  return (
    <div className={`traceFlow ${live ? "traceFlowLive" : ""}`} aria-hidden="true">
      {steps.map((label, i) => (
        <div className="traceNodeWrap" key={label + i}>
          <div className="traceNode"><span className="traceDot" /><span className="traceLabel">{label}</span></div>
          {i < steps.length - 1 && <span className="traceLink" />}
        </div>
      ))}
    </div>
  );
}

function Loading({ steps, text }) {
  return (
    <div className="aiDiscoverLoading">
      <TraceFlow steps={steps} live />
      <span>{text}</span>
    </div>
  );
}

export default function AppInsightsTab() {
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState("");
  const [processes, setProcesses] = useState([]);
  const [process, setProcess] = useState("wave");
  const [days, setDays] = useState(30);
  const [cases, setCases] = useState(250);
  const [subTab, setSubTab] = useState("overview");
  const [openVar, setOpenVar] = useState(null);

  const [data, setData] = useState({});       // { overview, variants, performance }
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [loadedFor, setLoadedFor] = useState({});

  const [algorithm, setAlgorithm] = useState("inductive");
  const [discovery, setDiscovery] = useState(null);
  const [discoverErr, setDiscoverErr] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);

  const configured = status?.configured === true;
  const activeProc = processes.find((p) => p.id === process);
  const steps = FLOW[process] || FLOW.wave;
  const dataKey = `${process}:${days}:${cases}`;

  // İlk yükte durum + katalog
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([apiClient.appInsightsStatus(), apiClient.appInsightsProcesses()]);
        if (!alive) return;
        setStatus(s);
        setProcesses(p.processes || []);
      } catch (e) {
        if (alive) setStatusErr(e.message || "Sunucuya ulaşılamadı. Backend çalışıyor mu?");
      }
    })();
    return () => { alive = false; };
  }, []);

  // Süreç / gün değişince her şeyi sıfırla
  useEffect(() => {
    setData({}); setLoadedFor({}); setErrors({}); setDiscovery(null); setDiscoverErr("");
  }, [dataKey]);

  // Genel Bakış otomatik yüklenir (vaka sayısından bağımsız).
  // Varyant ve Performans ise Süreç Keşfi gibi MANUEL: slider seçilir, "Analiz Et"e basılır.
  useEffect(() => {
    if (!configured || subTab !== "overview") return;
    if (loadedFor.overview === dataKey) return;
    let alive = true;
    const run = async () => {
      setLoading((l) => ({ ...l, overview: true }));
      setErrors((e) => ({ ...e, overview: "" }));
      try {
        const [overview, forms] = await Promise.all([
          apiClient.appInsightsOverview({ process, days }),
          apiClient.appInsightsSlowestForms({ days }),
        ]);
        if (!alive) return;
        setData((d) => ({ ...d, overview: { overview, forms } }));
        setLoadedFor((f) => ({ ...f, overview: dataKey }));
      } catch (e) {
        if (alive) setErrors((er) => ({ ...er, overview: e.message }));
      } finally {
        if (alive) setLoading((l) => ({ ...l, overview: false }));
      }
    };
    run();
    return () => { alive = false; };
  }, [subTab, dataKey, configured]); // eslint-disable-line

  // Varyant / Performans manuel analiz tetikleyici
  const runAnalysis = async (tab) => {
    setLoading((l) => ({ ...l, [tab]: true }));
    setErrors((e) => ({ ...e, [tab]: "" }));
    try {
      const res = tab === "variants"
        ? await apiClient.appInsightsVariants({ process, days, cases })
        : await apiClient.appInsightsPerformance({ process, days, cases });
      setData((d) => ({ ...d, [tab]: res }));
      setLoadedFor((f) => ({ ...f, [tab]: dataKey }));
    } catch (e) {
      setErrors((er) => ({ ...er, [tab]: e.message }));
    } finally {
      setLoading((l) => ({ ...l, [tab]: false }));
    }
  };

  const runDiscover = async () => {
    setDiscoverErr(""); setDiscovery(null); setDiscoverLoading(true);
    try {
      setDiscovery(await apiClient.appInsightsDiscover({ process, days, algorithm, cases }));
    } catch (e) {
      setDiscoverErr(e.message);
    } finally {
      setDiscoverLoading(false);
    }
  };

  return (
    <div className="aiTab">
      {/* ══ BANNER ══ */}
      <section className={`aiBanner ${configured ? "aiBannerLive" : ""}`}>
        <div className="aiBannerGrid" aria-hidden="true" />
        <div className="aiBannerInner">
          <div className="aiBannerTop">
            <span className="aiEyebrow">CANLI VERİ · DYNAMICS 365 F&amp;O</span>
            <span className={`aiPill ${configured ? "aiPillLive" : "aiPillOff"}`}>
              <span className="aiPillDot" />{configured ? "Bağlı" : "Bağlantı bekliyor"}
            </span>
          </div>
          <h1 className="aiTitle">Application Insights · Canlı Süreç Telemetrisi</h1>
          
        
        </div>
      </section>

      {statusErr && <div className="errorBox">{statusErr}</div>}
      {status && !configured && (
        <div className="aiNotice">
          <strong>{status.message}</strong>
          <ol className="aiSteps">
            <li>Azure portalda <code>Application Insights → API Access</code> sayfasını aç.</li>
            <li><code>Create API key</code> → <em>Read telemetry</em>, anahtarı kopyala.</li>
            <li><code>backend/app/.env</code> → <code>APPINSIGHTS_API_KEY</code> satırına yapıştır, backend'i yeniden başlat.</li>
          </ol>
        </div>
      )}

      {/* ══ KONTROL: süreç + zaman ══ */}
      <section className="sectionCard aiControlCard">
        <div className="aiControlMain">
          <div className="aiSeg">
            {processes.map((p) => (
              <button key={p.id} className={`aiSegBtn ${p.id === process ? "aiSegBtnActive" : ""}`} onClick={() => setProcess(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Zaman Aralığı</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {DAYS_OPTIONS.map((d) => <option key={d} value={d}>Son {d} gün</option>)}
            </select>
          </label>
        </div>
        {activeProc && <p className="aiControlNote">{activeProc.description}</p>}
      </section>

      {/* ══ ÜST SEKMELER ══ */}
      <div className="aiSubNav">
        {SUBTABS.map((t) => (
          <button key={t.id} className={`aiSubBtn ${t.id === subTab ? "aiSubBtnActive" : ""}`} onClick={() => setSubTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* hata + yükleniyor (keşif hariç) */}
      {subTab !== "discovery" && errors[subTab] && <div className="errorBox">{errors[subTab]}</div>}
      {subTab !== "discovery" && loading[subTab] && <Loading steps={steps} text="Canlı telemetri çekiliyor ve hesaplanıyor…" />}

      {/* Varyant / Performans: vaka sayısı seçici + manuel analiz (kalıcı kutu) */}
      {(subTab === "variants" || subTab === "performance") && configured && (
        <section className="sectionCard aiRunPanel">
          <div className="sectionTitle">{subTab === "variants" ? "Varyant Analizi" : "Performans Analizi"}</div>
          <p className="sectionHint">Analiz edilecek vaka adedini seç, sonra başlat. En güncel {cases} vaka kullanılır.</p>
          <div className="aiRunRow">
            <label className="field aiCasesField">
              <span>Vaka Sayısı · <strong>{cases}</strong></span>
              <input
                type="range"
                min={100}
                max={500}
                step={50}
                value={cases}
                onChange={(e) => setCases(Number(e.target.value))}
                className="aiCasesRange"
                disabled={loading[subTab]}
              />
              <span className="aiCasesHint">100 – 500 arası</span>
            </label>
            <button className="btnPrimary aiDiscoverBtn" onClick={() => runAnalysis(subTab)} disabled={loading[subTab]}>
              {loading[subTab] ? "Analiz ediliyor…" : `${cases} vaka için analiz et →`}
            </button>
          </div>
        </section>
      )}

      {/* ═══════════ GENEL BAKIŞ ═══════════ */}
      {subTab === "overview" && data.overview && !loading.overview && (() => {
        const ov = data.overview.overview;
        const fm = data.overview.forms;
        const actDonut = donutData(ov.top_activities, (a) => a.activity.replace(/^Warehouse\.|^Batch/, ""), (a) => a.count, ov.kpi.events);
        const maxForm = fm?.forms?.[0]?.avg_ms || 1;
        return (
          <>
            <section className="sectionCard">
              <div className="sectionTitle">{ov.label} · canlı KPI <span className="aiRangeTag">{day(ov.kpi.date_min)} – {day(ov.kpi.date_max)}</span></div>
              <div className="statsGrid">
                <div className="statCard aiStatLive"><div className="statLabel">Aktivite Türü</div><div className="statValue">{fmt(ov.kpi.activities)}</div></div>
                <div className="statCard aiStatLive"><div className="statLabel">Toplam Olay</div><div className="statValue">{fmt(ov.kpi.events)}</div><div className="statHelper">son {ov.days} gün</div></div>
                <div className="statCard aiStatLive"><div className="statLabel">Vaka</div><div className="statValue">{fmt(ov.kpi.cases)}</div><div className="statHelper">benzersiz {process === "wave" ? "dalga" : "iş"}</div></div>
                </div>
            </section>

            <section className="sectionCard">
              <div className="sectionTitle">Aktivite Dağılımı</div>
              <DonutChart data={actDonut} centerValue={fmt(ov.kpi.activities)} centerLabel="aktivite" />
            </section>

            {fm && (
              <section className="sectionCard">
                <div className="sectionTitle">En Yavaş Formlar <span className="aiRangeTag">form yükleme · son {fm.days} gün</span></div>
                {fm.forms.length > 0 ? (
                  <div className="tableContainer">
                    <table>
                      <thead><tr><th>Form</th><th>Ortalama</th><th className="aiNum">Çağrı</th><th className="aiNum">p95</th><th className="aiNum">Maks</th></tr></thead>
                      <tbody>
                        {fm.forms.map((f) => (
                          <tr key={f.form}>
                            <td className="caseIdCell aiFormName">{f.form}</td>
                            <td className="aiFormBarCell">
                              <span className="aiFormBarWrap"><span className="aiFormBar" style={{ width: `${(f.avg_ms / maxForm) * 100}%` }} /></span>
                              <span className="aiFormMs">{fmtMs(f.avg_ms)}</span>
                            </td>
                            <td className="aiNum">{fmt(f.calls)}</td>
                            <td className="aiNum aiFormMuted">{fmtMs(f.p95_ms)}</td>
                            <td className="aiNum aiFormMuted">{fmtMs(f.max_ms)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="hint">Bu aralıkta form telemetrisi bulunamadı.</p>}
              </section>
            )}
          </>
        );
      })()}

      {/* ═══════════ VARYANT ANALİZİ ═══════════ */}
      {subTab === "variants" && data.variants && !loading.variants && (() => {
        const v = data.variants;
        const varDonut = donutData(v.top_variants, (_, i) => `Varyant ${i + 1}`, (x) => x.frequency, v.cases_analyzed);
        const actBars = v.top_activities.slice(0, 10).map((a) => ({ label: a.activity.replace(/^Warehouse\.|^Batch/, ""), value: a.count, display: `${fmt(a.count)} · %${a.percentage}` }));
        return (
          <>
            <div className="statsGrid">
              <div className="statCard aiStatLive"><div className="statLabel">Vaka (Trace)</div><div className="statValue">{fmt(v.cases_analyzed)}</div></div>
              <div className="statCard aiStatLive"><div className="statLabel">Benzersiz Varyant (Benzersiz vaka)</div><div className="statValue">{fmt(v.unique_variants)}</div></div>
              <div className="statCard aiStatLive"><div className="statLabel">Olay</div><div className="statValue">{fmt(v.events_analyzed)}</div></div>
            </div>
            <section className="sectionCard">
              <div className="sectionTitle">Varyant Dağılımı (en sık akışlar)</div>
              <DonutChart data={varDonut} centerValue={fmt(v.unique_variants)} centerLabel="varyant" />
            </section>
            <section className="sectionCard">
              <div className="sectionTitle">Aktivite Frekansı</div>
              <Bars data={actBars} colorFn={(_, i) => PALETTE[i % PALETTE.length]} labelWidth={220} />
            </section>
            <section className="sectionCard">
              <div className="sectionTitle">En Sık Varyantlar</div>
              <div className="aiVariantList">
                {v.top_variants.map((tv, i) => (
                  <AiVariantCard
                    key={i}
                    v={tv}
                    rank={i + 1}
                    maxFreq={v.top_variants[0]?.frequency || 1}
                    color={PALETTE[i % PALETTE.length]}
                    isOpen={openVar === i}
                    onToggle={() => setOpenVar(openVar === i ? null : i)}
                  />
                ))}
              </div>
            </section>
          </>
        );
      })()}

      {/* ═══════════ PERFORMANS ═══════════ */}
      {subTab === "performance" && data.performance && !loading.performance && (() => {
        const p = data.performance;
        const s = p.summary;
        const distDonut = p.distribution.filter((d) => d.count > 0).map((d, i) => ({ label: d.bucket, value: d.count, color: PALETTE[i % PALETTE.length] }));
        const waitBars = p.activity_wait.slice(0, 10).map((a) => ({ label: a.activity.replace(/^Warehouse\.|^Batch/, ""), value: a.avg_wait_hours, display: dur(a.avg_wait_hours) }));
        return (
          <>
            <div className="statsGrid">
              <div className="statCard aiStatLive"><div className="statLabel">Ortalama Süre</div><div className="statValue aiDurVal">{dur(s.avg_hours)}</div></div>
                <div className="statCard aiStatLive"><div className="statLabel">En Uzun</div><div className="statValue aiDurVal">{dur(s.max_hours)}</div></div>
            </div>
            <section className="sectionCard">
              <div className="sectionTitle">Süre Dağılımı</div>
              <DonutChart data={distDonut} centerValue={fmt(p.cases_analyzed)} centerLabel="vaka" unit="" />
            </section>
            <section className="sectionCard">
              <div className="sectionTitle">Aktivite Başına Ortalama Bekleme</div>
              {waitBars.length > 0
                ? <Bars data={waitBars} colorFn={() => "var(--accent-orange)"} labelWidth={220} />
                : <p className="hint">Bekleme süresi verisi yok.</p>}
            </section>
          </>
        );
      })()}

      {/* ═══════════ SÜREÇ KEŞFİ ═══════════ */}
      {subTab === "discovery" && (
        <section className="sectionCard aiDiscover">
          <div className="sectionTitle">Canlı Süreç Keşfi</div>
          <p className="sectionHint">Seçili süreci PM4Py ile keşfedip Petri net modelini ve kalite metriklerini üretir.</p>
          <div className="aiAlgoGrid">
            {ALGORITHMS.map((a) => (
              <button key={a.id} className={`aiAlgoCard ${a.id === algorithm ? "aiAlgoCardActive" : ""}`} onClick={() => setAlgorithm(a.id)} disabled={discoverLoading}>
                <span className="aiAlgoLabel">{a.label}</span>
                <span className="aiAlgoDesc">{a.desc}</span>
              </button>
            ))}
          </div>
          <div className="aiRunRow">
            <label className="field aiCasesField">
              <span>Vaka Sayısı · <strong>{cases}</strong></span>
              <input
                type="range"
                min={100}
                max={500}
                step={50}
                value={cases}
                onChange={(e) => setCases(Number(e.target.value))}
                className="aiCasesRange"
                disabled={discoverLoading}
              />
              <span className="aiCasesHint">100 – 500 arası</span>
            </label>
            <button className="btnPrimary aiDiscoverBtn" onClick={runDiscover} disabled={!configured || discoverLoading}>
              {discoverLoading ? "Keşfediliyor…" : "Süreç Keşfine Gönder →"}
            </button>
          </div>

          {discoverLoading && <Loading steps={steps} text="Canlı veri çekiliyor, model keşfediliyor ve kalite metrikleri hesaplanıyor…" />}
          {discoverErr && <div className="errorBox" style={{ marginTop: 16 }}>{discoverErr}</div>}

          {discovery && !discoverLoading && (() => {
            const m = discovery.metrics || {};
            const hasScore = typeof m.overall_score === "number";
            const band = hasScore ? scoreBand(m.overall_score) : null;
            const info = m.petri_net_info || {};
            return (
              <div className="aiResult">
                <div className="aiResultHead">
                  {hasScore && (
                    <div className={`aiScore ${band.cls}`}>
                      <div className="aiScoreVal">{Math.round(m.overall_score)}</div>
                      <div className="aiScoreOf">/ 100</div>
                      <div className="aiScoreBand">{band.label}</div>
                    </div>
                  )}
                  <div className="aiResultFacts">
                    <div className="aiFactRow">
                      <span className="aiFact"><b>{fmt(discovery.events_analyzed)}</b> olay</span>
                      <span className="aiFact"><b>{fmt(discovery.cases_analyzed)}</b> vaka</span>
                      <span className="aiFact aiFactAlgo">{discovery.algorithm}</span>
                    </div>
                    {hasScore && (
                      <div className="aiMetricList">
                        {METRICS.map((mt) => {
                          const val = m[mt.key] ?? 0;
                          return (
                            <div className="aiMetric" key={mt.key} title={mt.hint}>
                              <span className="aiMetricLabel">{mt.label}</span>
                              <span className="aiMetricBarWrap"><span className="aiMetricBar" style={{ width: `${val * 100}%`, background: metricColor(val) }} /></span>
                              <span className="aiMetricVal">{(val * 100).toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {info.places != null && (
                      <div className="aiNetChips">
                        <span className="aiChip">{info.places} yer</span>
                        <span className="aiChip">{info.transitions} geçiş</span>
                        <span className="aiChip">{info.arcs} bağ</span>
                      </div>
                    )}
                  </div>
                </div>
                <figure className="aiModelFrame">
                  <div className="aiModelToolbar">
                    <span className="aiModelCaption">Petri Net · {activeProc?.label}</span>
                    <a className="aiModelOpen" href={`${API_BASE}/api/petri-image/${discovery.image_filename}?t=${Date.now()}`} target="_blank" rel="noreferrer">Yeni sekmede aç ↗</a>
                  </div>
                  <div className="aiModelCanvas">
                    <img className="aiPetri" src={`${API_BASE}/api/petri-image/${discovery.image_filename}?t=${Date.now()}`} alt="Petri net modeli" />
                  </div>
                </figure>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
