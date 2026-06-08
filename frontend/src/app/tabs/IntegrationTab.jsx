import "./IntegrationTab.css";

const DATA_SOURCES = [
  { icon: "🏢", name: "Dynamics 365", sub: "ERP / CRM", color: "#2D6CDF", supported: true },
  { icon: "📊", name: "SAP", sub: "ERP Sistemi", color: "#f59e0b", supported: true },
  { icon: "📋", name: "XES / CSV", sub: "Standart Log Formatı", color: "#107c10", supported: true },
  { icon: "🗄️", name: "PostgreSQL", sub: "İlişkisel Veritabanı", color: "#7B4DFF", supported: true },
  { icon: "☁️", name: "Azure Data Lake", sub: "Bulut Depolama", color: "#0078d4", supported: true },
  { icon: "🔌", name: "Özel API", sub: "REST / Webhook", color: "#008272", supported: true },
];

const ARCH_STEPS = [
  {
    id: "source",
    icon: "🗃️",
    title: "Veri Kaynağı",
    sub: "Herhangi bir sistem",
    desc: "ERP, CRM, veritabanı veya dosya formatındaki ham iş süreci verisi platforma aktarılır",
    color: "#2D6CDF",
    tags: ["D365", "SAP", "CSV", "XES", "PostgreSQL"],
  },
  {
    id: "etl",
    icon: "🔄",
    title: "Veri Dönüşümü",
    sub: "ETL Katmanı",
    desc: "Ham veri; case_id, aktivite, zaman damgası ve kaynak kolonlarından oluşan standart event log formatına dönüştürülür",
    color: "#7B4DFF",
    tags: ["case_id", "activity", "timestamp", "resource"],
  },
  {
    id: "engine",
    icon: "⚙️",
    title: "Analiz Motoru",
    sub: "FastAPI + pm4py",
    desc: "Süreç keşfi, uyumluluk kontrolü, performans ve varyant analizleri pm4py kütüphanesiyle gerçek zamanlı hesaplanır",
    color: "#0078d4",
    tags: ["Petri Net", "Token Replay", "Bottleneck", "Variants"],
  },
  {
    id: "output",
    icon: "📊",
    title: "Görsel Çıktı",
    sub: "İnteraktif Panel",
    desc: "Sonuçlar; süreç haritası, KPI kartları, karşılaştırma tabloları ve grafikler olarak tarayıcıda sunulur",
    color: "#107c10",
    tags: ["Petri Net", "KPI", "Grafik", "Rapor"],
  },
];

const FEATURES = [
  {
    icon: "🗺️",
    title: "Otomatik Süreç Haritası",
    color: "#107c10",
    desc: "Herhangi bir event log'dan Petri net modeli otomatik üretilir. Hangi yolun ne sıklıkla izlendiği görselleştirilir.",
  },
  {
    icon: "🛡️",
    title: "Uyumluluk Denetimi",
    color: "#ca5010",
    desc: "Token-based replay ile her case'in keşfedilen sürece ne kadar uyduğu ölçülür, sapmalar tespit edilir.",
  },
  {
    icon: "⚡",
    title: "Performans & Darboğaz",
    color: "#d83b01",
    desc: "Ortalama case süresi, darboğaz adımlar ve kaynak yükü hesaplanır. SLA ihlalleri öne çıkarılır.",
  },
  {
    icon: "🔀",
    title: "Varyant Keşfi",
    color: "#8764b8",
    desc: "Kaç farklı trace varyantı olduğu, her varyantın case dağılımı ve nadir yollar listelenir.",
  },
  {
    icon: "📈",
    title: "Algoritma Karşılaştırması",
    color: "#2D6CDF",
    desc: "Inductive, Alpha ve Heuristics minerlar aynı anda çalışır; 4 metrik üzerinden otomatik sıralama yapılır.",
  },
  {
    icon: "🔍",
    title: "Veri Gezgini",
    color: "#008272",
    desc: "Ham event log tablo görünümünde incelenir; aktivite kategorileri, dağılım grafikleri ve örnek kayıtlar sunulur.",
  },
];

const TECH = [
  { name: "pm4py", role: "Process Mining Motoru", detail: "Petri net üretimi, token replay, varyant analizi", color: "#2D6CDF" },
  { name: "FastAPI", role: "Backend API", detail: "Python tabanlı yüksek performanslı REST API", color: "#107c10" },
  { name: "React 19", role: "Frontend", detail: "Komponent tabanlı interaktif kullanıcı arayüzü", color: "#7B4DFF" },
  { name: "Supabase", role: "Veritabanı", detail: "PostgreSQL üzerinde BPI 2012 event log", color: "#0078d4" },
  { name: "Graphviz", role: "Görselleştirme", detail: "Petri net ve süreç haritası render", color: "#d83b01" },
  { name: "Python 3.11", role: "Runtime", detail: "Analiz hesaplamaları ve veri işleme", color: "#008272" },
];

const DEPLOY_OPTIONS = [
  {
    title: "Bulut (Azure / AWS / GCP)",
    icon: "☁️",
    badge: "Önerilen",
    badgeColor: "#107c10",
    desc: "Herhangi bir bulut sağlayıcısında container veya PaaS olarak çalıştırın. Otomatik ölçekleme ve yüksek erişilebilirlik sağlayın.",
    pros: ["Otomatik ölçekleme", "Yönetilen altyapı", "Global erişim"],
  },
  {
    title: "Docker Container",
    icon: "🐳",
    badge: "Taşınabilir",
    badgeColor: "#2D6CDF",
    desc: "docker-compose ile tek komutta tüm stack'i ayağa kaldırın. Ortamdan bağımsız, tutarlı çalışma garantisi.",
    pros: ["Ortamdan bağımsız", "Tek komut kurulum", "Kolay taşıma"],
  },
  {
    title: "Şirket İçi Sunucu",
    icon: "🖥️",
    badge: "On-Premises",
    badgeColor: "#8764b8",
    desc: "Veri dışarı çıkmasın. Şirket ağında kendi sunucunuzda çalıştırın. GDPR ve uyumluluk gereksinimlerini karşılayın.",
    pros: ["Veri şirket içinde", "Tam kontrol", "Compliance uyumlu"],
  },
  {
    title: "Yerel Geliştirme",
    icon: "💻",
    badge: "Geliştirici",
    badgeColor: "#605e5c",
    desc: "Lokal ortamda Python + Node.js ile dakikalar içinde çalıştırın. Analiz ve geliştirme için idealdir.",
    pros: ["Hızlı kurulum", "Debug kolaylığı", "Bağımlılık yok"],
  },
];

export default function IntegrationTab() {
  return (
    <div className="integrationTab">

      {/* ── PLATFORM TANIMI ── */}
      <div className="platformHero">
        <div className="platformHeroContent">
          <div className="platformHeroTop">
            <h2 className="platformTitle">Process Insights Nedir?</h2>
            <p className="platformDesc">
              Herhangi bir kurumsal sistemden gelen event log verilerini analiz eden
              bağımsız bir süreç madenciliği platformu. Belirli bir ERP veya CRM'e
              bağımlı değil — veri hangi kaynaktan gelirse gelsin çalışır.
            </p>
            <p className="platformDescEm">
              "İş süreçleriniz gerçekte nasıl işliyor?" — Raporlama araçları size
              sayıları gösterir; Process Insights sürecin kendisini adım adım görünür kılar.
            </p>
          </div>
          <div className="platformStatsRow">
            {[
              { val: "3",  label: "Keşif Algoritması",  icon: "🤖", color: "#60a5fa" },
              { val: "5",  label: "Analiz Modülü",      icon: "📊", color: "#a78bfa" },
              { val: "4",  label: "Kalite Metriği",     icon: "✅", color: "#34d399" },
              { val: "6+", label: "Veri Kaynağı",       icon: "🔌", color: "#fb923c" },
            ].map((s) => (
              <div key={s.label} className="platformStatCard">
                <div className="platformStatIcon">{s.icon}</div>
                <div className="platformStatVal" style={{ color: s.color }}>{s.val}</div>
                <div className="platformStatLabel">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="platformHeroSources">
          <div className="sourceTitle">Desteklenen Veri Kaynakları</div>
          <div className="sourcesGrid">
            {DATA_SOURCES.map((s) => (
              <div key={s.name} className="sourceCard" style={{ borderColor: s.color + "50" }}>
                <span className="sourceIcon">{s.icon}</span>
                <div className="sourceName" style={{ color: s.color }}>{s.name}</div>
                <div className="sourceSub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MİMARİ ── */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Mimari Genel Bakış</h2>
          <span className="sectionSub">Veri kaynağından içgörüye uçtan uca akış</span>
        </div>
        <div className="archFlow">
          {ARCH_STEPS.map((step, i) => (
            <div key={step.id} className="archItem">
              <div className="archBox" style={{ borderColor: step.color + "50", background: step.color + "08" }}>
                <div className="archIcon" style={{ color: step.color }}>{step.icon}</div>
                <div className="archTitle" style={{ color: step.color }}>{step.title}</div>
                <div className="archSub">{step.sub}</div>
                <div className="archDesc">{step.desc}</div>
                <div className="archTags">
                  {step.tags.map((t) => (
                    <span key={t} className="archTag" style={{ background: step.color + "12", color: step.color, borderColor: step.color + "30" }}>{t}</span>
                  ))}
                </div>
              </div>
              {i < ARCH_STEPS.length - 1 && (
                <div className="archArrow">
                  <svg viewBox="0 0 40 16" fill="none" width="40" height="16">
                    <path d="M0 8 L32 8" stroke="#d0cdc9" strokeWidth="2" strokeDasharray="4 2"/>
                    <path d="M28 3 L36 8 L28 13" stroke="#d0cdc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ÖZELLİKLER ── */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Platform Özellikleri</h2>
          <span className="sectionSub">Süreç analizinin tüm boyutları tek platformda</span>
        </div>
        <div className="benefitsGrid">
          {FEATURES.map((f) => (
            <div key={f.title} className="benefitCard">
              <div className="benefitIcon" style={{ background: f.color + "14", color: f.color }}>{f.icon}</div>
              <div className="benefitTitle" style={{ color: f.color }}>{f.title}</div>
              <div className="benefitDesc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TEKNOLOJİ YIĞINI ── */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Teknoloji Yığını</h2>
          <span className="sectionSub">Açık kaynak ve endüstri standardı teknolojiler</span>
        </div>
        <div className="techGrid">
          {TECH.map((t) => (
            <div key={t.name} className="techCard" style={{ borderTopColor: t.color }}>
              <div className="techName" style={{ color: t.color }}>{t.name}</div>
              <div className="techRole">{t.role}</div>
              <div className="techDetail">{t.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAĞITIM ── */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Dağıtım Seçenekleri</h2>
          <span className="sectionSub">Her ortamda çalışır — bulut, şirket içi veya yerel</span>
        </div>
        <div className="deployGrid">
          {DEPLOY_OPTIONS.map((opt) => (
            <div key={opt.title} className="deployCard">
              <div className="deployCardTop">
                <span className="deployIcon">{opt.icon}</span>
                <span className="deployBadge" style={{ background: opt.badgeColor + "18", color: opt.badgeColor, borderColor: opt.badgeColor + "40" }}>
                  {opt.badge}
                </span>
              </div>
              <div className="deployTitle">{opt.title}</div>
              <div className="deployDesc">{opt.desc}</div>
              <ul className="deployPros">
                {opt.pros.map((p) => (
                  <li key={p} className="deployPro">
                    <span className="deployProDot">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
