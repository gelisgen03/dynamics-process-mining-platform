import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useDataSource } from "../context/DataSourceContext";
import "./SettingsTab.css";

const WEIGHTS = [
  { key: "fitness",        label: "Fitness",        pct: 40, color: "#3b82f6", desc: "Modelin log'u ne kadar kapsıyor" },
  { key: "precision",      label: "Precision",       pct: 30, color: "#10b981", desc: "Gereksiz davranış üretmemesi" },
  { key: "generalization", label: "Generalization",  pct: 20, color: "#8b5cf6", desc: "Yeni trace'lere genellenebilirlik" },
  { key: "simplicity",     label: "Simplicity",      pct: 10, color: "#f59e0b", desc: "Modelin okunabilirliği" },
];

const ALGORITHMS = [
  {
    name: "Inductive Miner",
    tag: "inductive",
    color: "#3b82f6",
    strengths: ["Fitness garantisi (her zaman 1.0)", "Karmaşık yapıları yakalar", "Sound Petri net üretir"],
    weaknesses: ["Düşük precision", "Büyük modeller üretebilir"],
  },
  {
    name: "Heuristics Miner",
    tag: "heuristics",
    color: "#10b981",
    strengths: ["Gürültülü veriye dayanıklı", "İyi fitness-precision dengesi", "Gerçek dünya verisi için önerilir"],
    weaknesses: ["Sound model garantisi yok", "Parametre hassasiyeti"],
  },
  {
    name: "Alpha Miner",
    tag: "alpha",
    color: "#f59e0b",
    strengths: ["Basit ve anlaşılır model", "Yüksek simplicity", "Teorik temel"],
    weaknesses: ["Gürültüye duyarlı", "Döngüleri yönetemez", "Büyük veri için uygun değil"],
  },
];

export default function SettingsTab() {
  const { source, tableName } = useDataSource();
  const [health, setHealth]   = useState(null);
  const [checking, setChecking] = useState(false);
  const [dbCount, setDbCount]   = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => { checkHealth(); }, []);

  useEffect(() => {
    setDbCount(null);
    apiClient.getDataCount(tableName)
      .then((r) => setDbCount(r.count))
      .catch(() => setDbCount("—"));
  }, [tableName]);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await apiClient.health();
      setHealth({ ok: true, message: res.message });
    } catch {
      setHealth({ ok: false, message: "Backend'e bağlanılamadı" });
    }
    try {
      setAiStatus(await apiClient.appInsightsStatus());
    } catch {
      setAiStatus({ configured: false, message: "App Insights durumu alınamadı" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="settingsTab">

      {/* Bağlantı Durumu — iki kaynak */}
      <div className="statusGrid">

        {/* Statik veri kaynağı: Supabase */}
        <div className="sectionCard">
          <div className="sectionHeader">
            <div className="sectionTitleWrap">
              <span className="supabaseBadge">
                <img src="/supabase.png" alt="Supabase" />
              </span>
              <h3 className="sectionTitle">Sistem Durumu · Supabase  (D365 dummy)</h3>
            </div>
            <button className="btnCheck" onClick={checkHealth} disabled={checking}>
              {checking ? "Kontrol ediliyor..." : "Yenile"}
            </button>
          </div>
          <div className="statusRow">
            <div className={`statusDot ${health?.ok ? "ok" : "fail"}`} />
            <div className="statusInfo">
              <div className="statusName">FastAPI Backend</div>
              <div className="statusDetail">http://localhost:8000</div>
            </div>
            <div className={`statusBadge ${health?.ok ? "ok" : "fail"}`}>
              {checking ? "..." : health?.ok ? "Çevrimiçi" : "Bağlantı Yok"}
            </div>
          </div>
          <div className="statusRow">
            <div className="statusDot ok" />
            <div className="statusInfo">
              <div className="statusName">Supabase (PostgreSQL)</div>
              <div className="statusDetail">
                {source.label} — {dbCount !== null ? Number(dbCount).toLocaleString("tr-TR") + " kayıt" : "yükleniyor…"}
              </div>
            </div>
            <div className="statusBadge ok">Bağlı</div>
          </div>
          <div className="statusRow">
            <div className="statusDot ok" />
            <div className="statusInfo">
              <div className="statusName">pm4py Kütüphanesi</div>
              <div className="statusDetail">Process Mining for Python</div>
            </div>
            <div className="statusBadge ok">Aktif</div>
          </div>
        </div>

        {/* Canlı veri kaynağı: Azure (D365) */}
        <div className="sectionCard">
          <div className="sectionHeader">
            <div className="sectionTitleWrap">
              <span className="balsoftBadge">
                <img src="/balsoft-logo-light.svg" alt="BalSoft" />
              </span>
              <h3 className="sectionTitle">Sistem Durumu · D365 F&amp;O Azure DB</h3>
            </div>
            <button className="btnCheck" onClick={checkHealth} disabled={checking}>
              {checking ? "Kontrol ediliyor..." : "Yenile"}
            </button>
          </div>
          <div className="statusRow">
            <div className={`statusDot ${aiStatus?.configured ? "ok" : "fail"}`} />
            <div className="statusInfo">
              <div className="statusName">Azure Application Insights</div>
              <div className="statusDetail">
                {aiStatus?.app_id_masked ? `App ID: ${aiStatus.app_id_masked}` : "Application Insights telemetri"}
              </div>
            </div>
            <div className={`statusBadge ${aiStatus?.configured ? "ok" : "fail"}`}>
              {checking ? "..." : aiStatus?.configured ? "Bağlı" : "Yapılandırılmadı"}
            </div>
          </div>
          <div className="statusRow">
            <div className="statusDot ok" />
            <div className="statusInfo">
              <div className="statusName">D365 Finance &amp; Operations</div>
              <div className="statusDetail">customEvents / pageViews tabloları</div>
            </div>
            <div className={`statusBadge ${aiStatus?.configured ? "ok" : "fail"}`}>
              {aiStatus?.configured ? "Canlı" : "Beklemede"}
            </div>
          </div>
          <div className="statusRow">
            <div className="statusDot ok" />
            <div className="statusInfo">
              <div className="statusName">KQL Sorgu Motoru</div>
              <div className="statusDetail">Kusto — canlı varyant / performans / keşif</div>
            </div>
            <div className="statusBadge ok">Aktif</div>
          </div>
        </div>

      </div>

      {/* Proje Bilgisi */}
      <div className="sectionCard">
        <h3 className="sectionTitle">Proje Hakkında</h3>
        <div className="projectInfo">
          <div className="projectRow">
            <span className="projectKey">Proje Başlığı</span>
            <span className="projectVal">Microsoft Dynamics 365 Destekli Süreç Madenciliği Tabanlı İş Süreci Analiz Platformu</span>
          </div>
          <div className="projectRow">
            <span className="projectKey">Öğrenci</span>
            <span className="projectVal">Süleyman Asım Gelişgen</span>
          </div>
          <div className="projectRow">
            <span className="projectKey">Danışman</span>
            <span className="projectVal">Prof. Dr. Turgay Tugay Bilgin</span>
          </div>
          <div className="projectRow">
            <span className="projectKey">Veri Kaynakları</span>
            <span className="projectVal">Statik: BPI Challenge 2012 (benchmark) · D365 Dummy Data (Supabase) — Canlı: Azure Application Insights (D365 F&amp;O, BalSoft)</span>
          </div>
          <div className="projectRow">
            <span className="projectKey">Teknolojiler</span>
            <span className="projectVal">Python · FastAPI · pm4py · React 19 · Supabase · Azure Application Insights (KQL) · Graphviz · Google Gemini</span>
          </div>
        </div>
      </div>

    </div>
  );
}
