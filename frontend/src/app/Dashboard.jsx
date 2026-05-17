import { useMemo, useState } from "react";
import "./Dashboard.css";
import DataTab from "./tabs/DataTab";
import DiscoveryTab from "./tabs/DiscoveryTab";

export default function Dashboard() {
  const tabs = useMemo(
    () => [
      { key: "data", label: "Veri Kümesi Özeti", component: DataTab },
      { key: "discovery", label: "Süreç Keşfi", component: DiscoveryTab },
      { key: "variants", label: "Varyant Analizi", component: null },
      { key: "performance", label: "Performans", component: null },
      { key: "settings", label: "Sistem Ayarları", component: null },
    ],
    []
  );

  const [activeKey, setActiveKey] = useState(tabs[0].key);
  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0];
  const ActiveComponent = activeTab.component;

  return (
    <div className="dash">
      <aside className="dashSidebar">
        <div className="dashTitle">
          <h1>Process Mining</h1>
          <p>Platform</p>
        </div>

        <nav className="dashTabs" aria-label="Dashboard Menü">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={t.key === activeKey ? "tabBtn tabBtnActive" : "tabBtn"}
              onClick={() => setActiveKey(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="dashMain">
        <header className="dashHeader">
          <h2>{activeTab.label}</h2>
        </header>

        <div className="dashContentWrapper">
          <main className="dashContent">
            {ActiveComponent ? (
              <ActiveComponent />
            ) : (
              <p className="hint">
                Bu sekme henüz hazırlanmadı. Bir sonraki adımda burada içerik olacak.
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}