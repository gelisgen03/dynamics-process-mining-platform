import "./HomeTab.css";

export default function HomeTab({ onNavigate }) {
  return (
    <div className="homeTab">

      {/* ══ HERO ══ */}
      <div className="hero">
        <div className="heroBadge">Süreç Madenciliği Platformu</div>
        <h1 className="heroTitle">
          İş Süreçlerinizi Keşfedin,<br />
          <span className="heroTitleAccent">Analiz Edin, İyileştirin</span>
        </h1>
        <p className="heroSub">
          İki çalışma alanı: hazır olay günlüğü veri kümeleri üzerinde derin analiz,
          ya da canlı Dynamics 365 telemetrisi üzerinde gerçek zamanlı süreç keşfi.
        </p>
      </div>

      {/* ══ İKİ YOL ══ */}
      <div className="pathGrid">
        {/* Supabase tarafı */}
        <div className="pathCard">
          <div className="pathTop">
            <span className="pathEyebrow">VERİ KÜMESİ ANALİZİ</span>
            <span className="pathTag pathTagBlue">Supabase</span>
          </div>
          <h2 className="pathTitle">Süreç Analizi</h2>
          <p className="pathDesc">
            Hazır olay günlüğü veri kümeleri (BPI 2012, D365 demo) üzerinde keşif,
            varyant, performans ve uyumluluk analizi.
          </p>
          <ul className="pathList">
            <li>Veri kümesini incele ve özetle</li>
            <li>Algoritmalarla süreç keşfi + karşılaştırma</li>
            <li>Varyant, performans ve uyumluluk analizi</li>
            <li>Tek bir case'i adım adım incele</li>
          </ul>
          <button className="pathBtn" onClick={() => onNavigate("data")}>
            Veri Kümesini Aç →
          </button>
        </div>

        {/* Canlı D365 tarafı */}
        <div className="pathCard pathCardLive">
          <div className="pathLiveGrid" aria-hidden="true" />
          <div className="pathLiveInner">
            <div className="pathTop">
              <span className="pathEyebrow pathEyebrowLive">CANLI TELEMETRİ</span>
              <span className="pathTag pathTagLive">
                <span className="pathTagDot" />Application Insights
              </span>
            </div>
            <h2 className="pathTitle pathTitleLive">Canlı D365 Bağlantısı</h2>
            <p className="pathDesc pathDescLive">
              BalSoft ortamının gerçek telemetrisini KQL ile çek, olay günlüğüne
              dönüştür ve doğrudan canlı süreç keşfine gönder.
            </p>
            <ul className="pathList pathListLive">
              <li>Depo Dalga İşleme süreci (waveId)</li>
              <li>Toplu İş Yürütme süreci (BatchJobId)</li>
              <li>Canlı keşif + model kalite metrikleri</li>
              <li>En yavaş formlar (form performansı)</li>
            </ul>
            <button className="pathBtn pathBtnLive" onClick={() => onNavigate("appinsights")}>
              Canlı Veriye Git →
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
