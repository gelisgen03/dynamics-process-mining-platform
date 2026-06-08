import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import "./DataTab.css";

/* ── Static dataset facts (BPI Challenge 2012) ─────────────────── */
const STATS = [
  { label: "Toplam Event",       value: "262.200", sub: "Ham kayıt",           accent: "#0078d4" },
  { label: "Toplam Case",        value: "13.087",  sub: "Benzersiz başvuru",   accent: "#107c10" },
  { label: "Ort. Event / Case",  value: "20",      sub: "Başvuru başına adım", accent: "#8764b8" },
  { label: "Benzersiz Aktivite", value: "24",      sub: "Farklı süreç adımı",  accent: "#d83b01" },
  { label: "Benzersiz Kaynak",   value: "69",      sub: "Çalışan / sistem",    accent: "#008272" },
  { label: "Dönem",              value: "5 ay",    sub: "Eki 2011 – Mar 2012", accent: "#ca5010" },
];

/* ── Process flow stages ─────────────────────────────────────────── */
const FLOW_STAGES = [
  {
    icon: "📤",
    title: "Başvuru",
    code: "A_SUBMITTED",
    desc: "Müşteri kredi başvurusunu gönderir",
    color: "#0078d4",
  },
  {
    icon: "🔍",
    title: "Değerlendirme",
    code: "A_PREACCEPTED",
    desc: "Başvuru ön inceleme & eksik evrak kontrolü",
    color: "#0078d4",
  },
  {
    icon: "📝",
    title: "Teklif Üretimi",
    code: "O_CREATED",
    desc: "Banka kredi teklifi oluşturur",
    color: "#107c10",
  },
  {
    icon: "📨",
    title: "Teklif Gönderimi",
    code: "O_SENT",
    desc: "Teklif müşteriye iletilir",
    color: "#107c10",
  },
  {
    icon: "⚙️",
    title: "İş Akışı",
    code: "W_*",
    desc: "Personel görevleri & doğrulama adımları",
    color: "#f59e0b",
  },
  {
    icon: "🏁",
    title: "Sonuç",
    code: "A_FINALIZED",
    desc: "Başvuru kabul, red veya iptal ile kapanır",
    color: "#8764b8",
  },
];

/* ── Category event distribution ─────────────────────────────────── */
const CATEGORIES = [
  {
    prefix: "W_",
    label: "İş Akışı Görevleri",
    desc: "Hollandaca iş akışı adımları — tamamlama, doğrulama, arama",
    events: 170000,
    pct: 65,
    color: "#f59e0b",
    bg: "rgba(245,158,11,.08)",
    border: "rgba(245,158,11,.3)",
    activities: [
      { name: "W_Completeren aanvraag", label: "Başvuru Tamamlama",   count: 51000 },
      { name: "W_Nabellen offertes",    label: "Teklif Takibi",       count: 37000 },
      { name: "W_Valideren aanvraag",   label: "Başvuru Doğrulama",   count: 23000 },
      { name: "W_Afhandelen leads",     label: "Lead Yönetimi",       count: 15000 },
      { name: "W_Nabellen incomplete",  label: "Eksik Takip",         count: 14000 },
    ],
  },
  {
    prefix: "A_",
    label: "Başvuru Adımları",
    desc: "Kredi başvurusunun yaşam döngüsü — gönderimden sonuca",
    events: 64000,
    pct: 24,
    color: "#0078d4",
    bg: "rgba(0,120,212,.07)",
    border: "rgba(0,120,212,.25)",
    activities: [
      { name: "A_SUBMITTED",       label: "Başvuru Gönderildi",  count: 13087 },
      { name: "A_PARTLYSUBMITTED", label: "Kısmen Gönderildi",   count: 13087 },
      { name: "A_PREACCEPTED",     label: "Ön Kabul",            count: 7034  },
      { name: "A_ACCEPTED",        label: "Kabul Edildi",        count: 5113  },
      { name: "A_FINALIZED",       label: "Tamamlandı",          count: 5015  },
      { name: "A_DECLINED",        label: "Reddedildi",          count: 7635  },
      { name: "A_CANCELLED",       label: "İptal Edildi",        count: 2807  },
    ],
  },
  {
    prefix: "O_",
    label: "Teklif Adımları",
    desc: "Oluşturulan kredi tekliflerinin yönetimi",
    events: 28200,
    pct: 11,
    color: "#107c10",
    bg: "rgba(16,124,16,.07)",
    border: "rgba(16,124,16,.25)",
    activities: [
      { name: "O_CREATED",    label: "Teklif Oluşturuldu",    count: 7030 },
      { name: "O_SENT",       label: "Teklif Gönderildi",     count: 7030 },
      { name: "O_ACCEPTED",   label: "Teklif Kabul Edildi",   count: 2243 },
      { name: "O_DECLINED",   label: "Teklif Reddedildi",     count: 3613 },
      { name: "O_CANCELLED",  label: "Teklif İptal Edildi",   count: 3655 },
    ],
  },
];

/* ── Case outcomes ────────────────────────────────────────────────── */
const OUTCOMES = [
  { label: "Reddedildi",        count: 7635,  pct: 58, color: "#c50f1f", icon: "✗" },
  { label: "İptal Edildi",      count: 2807,  pct: 21, color: "#d83b01", icon: "○" },
  { label: "Kabul & Finalize",  count: 2645,  pct: 20, color: "#107c10", icon: "✓" },
];

/* ── Activity icons ───────────────────────────────────────────────── */
const ACTIVITY_ICONS = {
  A_SUBMITTED: "📤", A_PARTLYSUBMITTED: "📋", A_PREACCEPTED: "⏳",
  A_ACCEPTED: "✅", A_FINALIZED: "🏁", A_DECLINED: "❌", A_CANCELLED: "🚫",
  O_SELECTED: "🎯", O_CREATED: "📝", O_SENT: "📨", O_SENT_BACK: "🔄",
  O_RETURNED: "↩️", O_ACCEPTED: "✅", O_DECLINED: "❌", O_CANCELLED: "🚫",
};

function getActivityMeta(activity) {
  if (!activity) return { icon: "🔵", color: "#6b7280" };
  if (ACTIVITY_ICONS[activity]) return { icon: ACTIVITY_ICONS[activity], color: activity.startsWith("A_") ? "#0078d4" : activity.startsWith("O_") ? "#107c10" : "#f59e0b" };
  if (activity.startsWith("A_")) return { icon: "📋", color: "#0078d4" };
  if (activity.startsWith("O_")) return { icon: "📄", color: "#107c10" };
  if (activity.startsWith("W_")) return { icon: "⚙️", color: "#f59e0b" };
  return { icon: "🔵", color: "#6b7280" };
}

/* ================================================================= */

export default function DataTab() {
  const [samples, setSamples] = useState([]);
  const [sLoading, setSLoading] = useState(false);

  useEffect(() => {
    setSLoading(true);
    apiClient.getDataSample(10, 0)
      .then((r) => setSamples(r.data || []))
      .catch(() => setSamples([]))
      .finally(() => setSLoading(false));
  }, []);

  const maxActivity = Math.max(...CATEGORIES.flatMap((c) => c.activities.map((a) => a.count)));

  return (
    <div className="dataTab">

      {/* ── 1. INTRO BANNER ──────────────────────────────────── */}
      <div className="introBanner">
        <div className="introLeft">
          <div className="introBadge">BPI Challenge 2012</div>
          <h2 className="introTitle">Hollanda Bankası Kredi Başvuru Süreci</h2>
          <p className="introDesc">
            Bu veri seti, gerçek bir Hollanda bankasının kredi başvuru sürecindeki tüm olayları
            içerir. Bir müşterinin başvurudan final karara kadar geçirdiği her adım kayıt
            altındadır. Process mining araştırmacıları için referans veri seti olarak kullanılır.
          </p>
          <div className="introTags">
            <span className="introTag">Gerçek Dünya Verisi</span>
            <span className="introTag">Hollanda Bankası</span>
            <span className="introTag">Kredi Başvuruları</span>
            <span className="introTag">2011–2012</span>
          </div>
        </div>
        <div className="introRight">
          <div className="statsRow">
            {STATS.map((s) => (
              <div className="miniStat" key={s.label} style={{ borderTopColor: s.accent }}>
                <div className="miniStatValue" style={{ color: s.accent }}>{s.value}</div>
                <div className="miniStatLabel">{s.label}</div>
                <div className="miniStatSub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. SÜREÇ AKIŞI ───────────────────────────────────── */}
      <div className="sectionCard">
        <div className="sectionTitle">Süreç Akışı — Kredi Başvurusunun Yolculuğu</div>
        <p className="sectionHint">
          Her case (başvuru) aşağıdaki adımlar boyunca ilerler. Bazı adımlar tekrarlanabilir
          veya atlanabilir — bu varyantları <strong>Varyant Analizi</strong> sekmesinde inceleyebilirsiniz.
        </p>
        <div className="processSteps">
          <div className="processLine" />
          {FLOW_STAGES.map((stage, i) => (
            <div className="processStep" key={stage.code}>
              <div
                className="processCircle"
                style={{ borderColor: stage.color, background: stage.color + "14", color: stage.color }}
              >
                <span className="processStepNum" style={{ background: stage.color }}>{i + 1}</span>
                <span className="processIcon">{stage.icon}</span>
              </div>
              <div className="processStepTitle" style={{ color: stage.color }}>{stage.title}</div>
              <div className="processStepCode">{stage.code}</div>
              <div className="processStepDesc">{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. KATEGORİ DAĞILIMI + AKTİVİTE FREKANS ─────────── */}
      <div className="twoColSection">

        {/* Sol: Kategori pasta-bar */}
        <div className="sectionCard">
          <div className="sectionTitle">Kategori Dağılımı</div>
          <p className="sectionHint">Toplam 262.200 event'in kategori bazlı dağılımı</p>
          <div className="catBars">
            {CATEGORIES.map((cat) => (
              <div className="catBarRow" key={cat.prefix}>
                <div className="catBarHeader">
                  <span className="catPrefix" style={{ color: cat.color, borderColor: cat.border, background: cat.bg }}>
                    {cat.prefix}
                  </span>
                  <span className="catLabel">{cat.label}</span>
                  <span className="catPct" style={{ color: cat.color }}>{cat.pct}%</span>
                </div>
                <div className="catBarTrack">
                  <div
                    className="catBarFill"
                    style={{ width: `${cat.pct}%`, background: cat.color }}
                  />
                </div>
                <div className="catBarSub">{cat.events.toLocaleString("tr-TR")} event · {cat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: Case sonuçları */}
        <div className="sectionCard">
          <div className="sectionTitle">Case Sonuçları</div>
          <p className="sectionHint">13.087 başvurunun nasıl sonuçlandığı</p>
          <div className="outcomeBars">
            {OUTCOMES.map((o) => (
              <div className="outcomeRow" key={o.label}>
                <div className="outcomeHeader">
                  <span className="outcomeIcon" style={{ color: o.color }}>{o.icon}</span>
                  <span className="outcomeLabel">{o.label}</span>
                  <span className="outcomeCount">{o.count.toLocaleString("tr-TR")}</span>
                  <span className="outcomePct" style={{ color: o.color }}>{o.pct}%</span>
                </div>
                <div className="outcomeTrack">
                  <div
                    className="outcomeFill"
                    style={{ width: `${o.pct}%`, background: o.color }}
                  />
                </div>
              </div>
            ))}
            <div className="outcomeNote">
              Başvuruların büyük çoğunluğu reddedilmektedir — bu, gerçek dünya kredi
              süreçlerinin tipik bir özelliğidir.
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. AKTİVİTE KATEGORİLERİ ─────────────────────────── */}
      {CATEGORIES.map((cat) => (
        <div className="sectionCard" key={cat.prefix}>
          <div className="catCardHeader" style={{ borderLeftColor: cat.color }}>
            <div>
              <div className="catCardTitle" style={{ color: cat.color }}>
                {cat.label}
                <span className="catCardPrefix">{cat.prefix}*</span>
              </div>
              <div className="catCardDesc">{cat.desc}</div>
            </div>
            <div className="catCardStat" style={{ color: cat.color }}>
              <span className="catCardStatVal">{cat.pct}%</span>
              <span className="catCardStatSub">of events</span>
            </div>
          </div>
          <div className="actFreqList">
            {cat.activities.map((act) => (
              <div className="actFreqRow" key={act.name}>
                <div className="actFreqName">
                  <span className="actFreqCode">{act.name}</span>
                  <span className="actFreqLabel">{act.label}</span>
                </div>
                <div className="actFreqTrack">
                  <div
                    className="actFreqFill"
                    style={{ width: `${(act.count / maxActivity) * 100}%`, background: cat.color }}
                  />
                </div>
                <span className="actFreqCount">{act.count.toLocaleString("tr-TR")}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── 5. VERİ ÖRNEĞİ ──────────────────────────────────── */}
      <div className="sectionCard">
        <div className="sectionTitle">Ham Veri Örneği — İlk 10 Kayıt</div>
        <p className="sectionHint">
          Her satır tek bir event'i temsil eder. Aynı <code>case_id</code>'ye ait tüm event'ler
          bir "trace" oluşturur.
        </p>
        <div className="tableContainer">
          {sLoading ? (
            <p className="hint">Yükleniyor…</p>
          ) : (
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Aktivite</th>
                  <th>Zaman</th>
                  <th>Kaynak</th>
                </tr>
              </thead>
              <tbody>
                {samples.length > 0 ? samples.map((row, i) => {
                  const meta = getActivityMeta(row.activity);
                  return (
                    <tr key={i}>
                      <td><span className="caseId">{row.case_id}</span></td>
                      <td>
                        <span className="activityCell">
                          <span>{meta.icon}</span>
                          <span className="activityName" style={{ color: meta.color }}>{row.activity}</span>
                        </span>
                      </td>
                      <td>{new Date(row.timestamp).toLocaleString("tr-TR")}</td>
                      <td>{row.resource || "—"}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="4" className="emptyState">Backend bağlantısı kurulamadı</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
