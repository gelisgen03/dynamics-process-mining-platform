import "./HomeTab.css";

const FEATURES = [
  {
    key: "data",
    title: "Veri Kümesi Özeti",
    description: "Event log'daki toplam olay, case ve aktivite sayılarını görüntüleyin. Örnek kayıtlara göz atın.",
    metric: "Veri Keşfi",
    color: "#0078d4",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M3 3h18v3H3V3zm0 5h18v3H3V8zm0 5h18v3H3v-3zm0 5h18v3H3v-3z" opacity=".3"/>
        <path d="M2 2a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2zm2 1v20h16V3H4zm1 1h14v1H5V4zm0 3h14v1H5V7zm0 3h14v1H5v-1zm0 3h14v1H5v-1zm0 3h14v1H5v-1z"/>
      </svg>
    ),
  },
  {
    key: "discovery",
    title: "Süreç Keşfi",
    description: "Inductive, Alpha veya Heuristics algoritmasıyla Petri net modeli oluşturun. 4 kalite metriği ile değerlendirin.",
    metric: "Model Üretimi",
    color: "#107c10",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    ),
  },
  {
    key: "comparison",
    title: "Algoritma Karşılaştırması",
    description: "3 algoritmayı aynı anda çalıştırın, metrik bazlı sıralama tablosu ve karşılaştırma grafikleri alın.",
    metric: "Oto. Sıralama",
    color: "#8764b8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
      </svg>
    ),
  },
  {
    key: "variants",
    title: "Varyant Analizi",
    description: "Case'lerin hangi aktivite sıralarını izlediğini analiz edin. En sık görülen trace varyantlarını keşfedin.",
    metric: "Trace Madenciliği",
    color: "#d83b01",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
      </svg>
    ),
  },
  {
    key: "performance",
    title: "Performans Analizi",
    description: "Case sürelerini, darboğaz aktiviteleri ve ortalama bekleme sürelerini hesaplayın.",
    metric: "Süre & Darboğaz",
    color: "#008272",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
      </svg>
    ),
  },
  {
    key: "conformance",
    title: "Uyumluluk Analizi",
    description: "Token-based replay ile her case'in keşfedilen modele ne kadar uyduğunu ölçün.",
    metric: "Token Replay",
    color: "#ca5010",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    ),
  },
];

const TECH_STACK = [
  { name: "FastAPI", desc: "Backend API" },
  { name: "pm4py", desc: "Process Mining" },
  { name: "Supabase", desc: "Veritabanı" },
  { name: "React 19", desc: "Arayüz" },
  { name: "Graphviz", desc: "Görselleştirme" },
];

const ACTIVITY_CATEGORIES = [
  { prefix: "A_", name: "Application", desc: "Başvuru akışı" },
  { prefix: "O_", name: "Offer",       desc: "Teklif akışı" },
  { prefix: "W_", name: "Workflow",    desc: "İş akışı görevleri" },
];


export default function HomeTab({ onNavigate }) {

  return (
    <div className="homeTab">
      {/* ── HERO ── */}
      <div className="hero">
        <div className="heroContent">
          <h1 className="heroTitle">
            Process Intelligence for Smarter Operations
          </h1>
          <p className="heroSub">
            ERP ve CRM sistemlerinden gelen süreç verilerini otomatik keşif, uyumluluk analizi
            ve performans madenciliği yöntemleriyle analiz edin.
          </p>
          <div className="heroActions">
            <button className="heroBtnPrimary" onClick={() => onNavigate("discovery")}>
              Süreç Keşfine Başla
            </button>
            <button className="heroBtnSecondary" onClick={() => onNavigate("data")}>
              Veriyi İncele
            </button>
          </div>
        </div>
        <div className="heroVisual">
          <div className="heroFlowChart">
            <div className="flowNode flowStart">Başlangıç</div>
            <div className="flowArrow">→</div>
            <div className="flowNode flowMid">Analiz</div>
            <div className="flowArrow">→</div>
            <div className="flowNode flowEnd">Içgörü</div>
          </div>
        </div>
      </div>

      {/* ── FEATURE CARDS ── */}
      <div className="featSection">
        <div className="sectionHeader">
          <h2 className="sectionHeaderTitle">Platform Sekmeleri</h2>
        </div>
        <div className="featGrid">
          {FEATURES.map((f) => (
            <button key={f.key} className="featCard" onClick={() => onNavigate(f.key)}>
              <div className="featIconWrap" style={{ background: f.color + "18", color: f.color }}>
                {f.icon}
              </div>
              <div className="featBody">
                <div className="featBadge" style={{ color: f.color, borderColor: f.color + "33", background: f.color + "0d" }}>
                  {f.metric}
                </div>
                <div className="featTitle">{f.title}</div>
                <div className="featDesc">{f.description}</div>
              </div>
              <div className="featArrow" style={{ color: f.color }}>→</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── DATASET INFO ── */}
      <div className="datasetSection">
        <div className="datasetLeft">
          <div className="sectionHeader">
            <h2 className="sectionHeaderTitle">Veri Kaynağı Hakkında</h2>
          </div>
          <p className="datasetDesc">
            Bu platform <strong>BPI Challenge 2012</strong> veri seti üzerinde çalışmaktadır.
            Hollandalı bir bankanın kredi başvuru sürecini kapsayan bu log, gerçek dünya
            iş süreçlerinin karmaşıklığını ve gürültüsünü yansıtmaktadır.
          </p>
          <div className="actCatList">
            {ACTIVITY_CATEGORIES.map((cat) => (
              <div className="actCatRow" key={cat.prefix}>
                <div className="actCatBadge">{cat.prefix}</div>
                <div>
                  <div className="actCatName">{cat.name}</div>
                  <div className="actCatDesc">{cat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="datasetRight">
          <div className="sectionHeader">
            <h2 className="sectionHeaderTitle">Teknoloji Yığını</h2>
          </div>
          <div className="techList">
            {TECH_STACK.map((t) => (
              <div className="techRow" key={t.name}>
                <div className="techDot" />
                <div>
                  <span className="techName">{t.name}</span>
                  <span className="techDesc">{t.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="datasetNote">
            <strong>Amaç:</strong> Dynamics 365, ERP ve CRM sistemlerinden gelen event
            loglarını analiz etmek için genel amaçlı bir Process Mining platformu.
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ value, label, sub, accent, small }) {
  return (
    <div className="kpiCard" style={{ borderTopColor: accent }}>
      <div className="kpiValue" style={{ color: accent, fontSize: small ? "18px" : undefined }}>
        {value ?? "—"}
      </div>
      <div className="kpiLabel">{label}</div>
      <div className="kpiSub">{sub}</div>
    </div>
  );
}
