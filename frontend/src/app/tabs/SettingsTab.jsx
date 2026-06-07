import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
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
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => { checkHealth(); }, []);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await apiClient.health();
      setHealth({ ok: true, message: res.message });
    } catch {
      setHealth({ ok: false, message: "Backend'e bağlanılamadı" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="settingsTab">

      {/* Bağlantı Durumu */}
      <div className="sectionCard">
        <div className="sectionHeader">
          <h3 className="sectionTitle">Sistem Durumu</h3>
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
            <div className="statusDetail">BPI Challenge 2012 — 262K kayıt</div>
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

      {/* Metrik Ağırlıkları */}
      <div className="sectionCard">
        <h3 className="sectionTitle">Model Kalite Metrik Ağırlıkları</h3>
        <p className="sectionHint">
          Genel model skoru (0–100) bu dört metriğin ağırlıklı ortalamasıdır.
        </p>
        <div className="weightList">
          {WEIGHTS.map((w) => (
            <div className="weightRow" key={w.key}>
              <div className="weightLabel" style={{ color: w.color }}>{w.label}</div>
              <div className="weightBarWrap">
                <div
                  className="weightBar"
                  style={{ width: `${w.pct}%`, backgroundColor: w.color }}
                />
              </div>
              <div className="weightPct" style={{ color: w.color }}>{w.pct}%</div>
              <div className="weightDesc">{w.desc}</div>
            </div>
          ))}
        </div>
        <div className="formulaBox">
          <code>
            Skor = Fitness×0.40 + Precision×0.30 + Generalization×0.20 + Simplicity×0.10
          </code>
        </div>
      </div>

      {/* Algoritma Bilgisi */}
      <div className="sectionCard">
        <h3 className="sectionTitle">Algoritma Karşılaştırması</h3>
        <div className="algoGrid">
          {ALGORITHMS.map((a) => (
            <div className="algoCard" key={a.tag} style={{ borderTopColor: a.color }}>
              <div className="algoName" style={{ color: a.color }}>{a.name}</div>
              <div className="algoSection">
                <div className="algoSectionTitle">Güçlü Yönler</div>
                <ul>
                  {a.strengths.map((s, i) => (
                    <li key={i} className="strengthItem">✓ {s}</li>
                  ))}
                </ul>
              </div>
              <div className="algoSection">
                <div className="algoSectionTitle">Zayıf Yönler</div>
                <ul>
                  {a.weaknesses.map((w, i) => (
                    <li key={i} className="weakItem">✗ {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proje Bilgisi */}
      <div className="sectionCard">
        <h3 className="sectionTitle">Proje Hakkında</h3>
        <div className="projectInfo">
          <div className="projectRow">
            <span className="projectKey">Proje Başlığı</span>
            <span className="projectVal">Microsoft Dynamics 365 Entegrasyonlu Süreç Madenciliği Tabanlı İş Süreci Analiz Platformu</span>
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
            <span className="projectKey">Veri Seti</span>
            <span className="projectVal">BPI Challenge 2012 — Hollanda bankası kredi başvurusu süreci</span>
          </div>
          <div className="projectRow">
            <span className="projectKey">Teknolojiler</span>
            <span className="projectVal">Python · FastAPI · pm4py · React · Supabase · Graphviz</span>
          </div>
        </div>
      </div>

    </div>
  );
}
