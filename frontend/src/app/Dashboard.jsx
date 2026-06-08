import { useState } from "react";
import "./Dashboard.css";
import HomeTab from "./tabs/HomeTab";
import DataTab from "./tabs/DataTab";
import DiscoveryTab from "./tabs/DiscoveryTab";
import ComparisonTab from "./tabs/ComparisonTab";
import VariantTab from "./tabs/VariantTab";
import PerformanceTab from "./tabs/PerformanceTab";
import ConformanceTab from "./tabs/ConformanceTab";
import SettingsTab from "./tabs/SettingsTab";
import IntegrationTab from "./tabs/IntegrationTab";
import CaseInspectTab from "./tabs/CaseInspectTab";
import ChatWidget from "./components/ChatWidget";

const TABS = [
  {
    key: "home",
    label: "Ana Sayfa",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8.707.293a1 1 0 0 0-1.414 0L1 6.586V15a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1V6.586L8.707.293Z"/>
      </svg>
    ),
    component: HomeTab,
    section: null,
  },
  {
    key: "data",
    label: "Veri Kümesi",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12v2H2V2Zm0 4h12v2H2V6Zm0 4h12v2H2v-2Zm0 4h12v2H2v-2Z" opacity=".3"/>
        <path d="M1 1a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V1Zm2 1v2h10V2H3Zm0 4v2h10V6H3Zm0 4v2h10v-2H3Zm0 4v2h10v-2H3Z"/>
      </svg>
    ),
    component: DataTab,
    section: "ANALİZ",
  },
  {
    key: "discovery",
    label: "Süreç Keşfi",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099ZM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"/>
      </svg>
    ),
    component: DiscoveryTab,
    section: null,
  },
  {
    key: "comparison",
    label: "Algoritma Karşılaştırması",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2Zm-1 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-4Zm2-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H2Z"/>
      </svg>
    ),
    component: ComparisonTab,
    section: null,
  },
  {
    key: "variants",
    label: "Varyant Analizi",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5V5a.5.5 0 0 1-.207.404L8.5 9v5.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V9L.707 5.404A.5.5 0 0 1 .5 5V1.5z"/>
      </svg>
    ),
    component: VariantTab,
    section: null,
  },
  {
    key: "performance",
    label: "Performans Analizi",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z"/>
        <path d="M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3.5a.5.5 0 0 0 .5-.5v-3.5Z"/>
      </svg>
    ),
    component: PerformanceTab,
    section: null,
  },
  {
    key: "case-inspect",
    label: "Case İncele",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a2 2 0 0 1 2 2v1h2.5A1.5 1.5 0 0 1 14 5.5v8A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-8A1.5 1.5 0 0 1 3.5 4H6V3a2 2 0 0 1 2-2Zm0 1a1 1 0 0 0-1 1v1h2V3a1 1 0 0 0-1-1ZM3.5 5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5H3.5Zm1 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1Zm0 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1Zm0 2h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1Z"/>
      </svg>
    ),
    component: CaseInspectTab,
    section: null,
  },
  {
    key: "conformance",
    label: "Uyumluluk Analizi",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12ZM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Z"/>
        <path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022Z"/>
      </svg>
    ),
    component: ConformanceTab,
    section: null,
  },
  {
    key: "integration",
    label: "Platform Hakkında",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 8C8 10 5.9 16.17 3.82 19.82L5.71 21 7 19c.97.64 2.14 1 3.36 1 2.3 0 4.31-1.22 5.44-3.05C17.35 16.15 18 14.16 18 12c0-.68-.06-1.35-.17-2H17zM11 8V2H9v2H7v2h2v2h2z" opacity=".3"/>
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-6h2v2h-2v-2zm0-8h2v6h-2V6z"/>
      </svg>
    ),
    component: IntegrationTab,
    section: "SİSTEM",
  },
  {
    key: "settings",
    label: "Sistem Bilgileri",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492ZM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0Z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319Zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319Z"/>
      </svg>
    ),
    component: SettingsTab,
    section: null,
  },
];

export default function Dashboard() {
  const [activeKey, setActiveKey] = useState("home");
  const activeTab = TABS.find((t) => t.key === activeKey) ?? TABS[0];
  const ActiveComponent = activeTab.component;

  let lastSection = undefined;

  return (
    <div className="dash">
      <aside className="dashSidebar">
        <div className="dashBrand">
          <div className="brandLogoSvg">
            <img src="/proccesminnig_logo.png" alt="Process Insights" width="96" height="96" style={{ objectFit: "contain" }} />
          </div>
          <div className="brandText">
            <div className="brandName">Process Insights</div>
          </div>
        </div>

        <nav className="dashNav" aria-label="Ana Menü">
          {TABS.map((t) => {
            const showSection = t.section !== undefined && t.section !== lastSection;
            if (showSection) lastSection = t.section;
            return (
              <div key={t.key}>
                {showSection && t.section && (
                  <div className="navSection">{t.section}</div>
                )}
                {showSection && t.section && <div className="navDivider" />}
                <button
                  type="button"
                  className={`navItem ${t.key === activeKey ? "navItemActive" : ""}`}
                  onClick={() => setActiveKey(t.key)}
                >
                  <span className="navIcon">{t.icon}</span>
                  <span className="navLabel">{t.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebarFooter">
          <div className="footerVersion">BPI Challenge 2012 · v2.0</div>
        </div>
      </aside>

      <div className="dashMain">
        <header className="dashHeader">
          <div className="headerBreadcrumb">
            <span className="breadcrumbRoot">Process Insights</span>
            <span className="breadcrumbSep">›</span>
            <span className="breadcrumbCurrent">{activeTab.label}</span>
          </div>
        </header>

        <div className="dashContentWrapper">
          <main className="dashContent">
            {ActiveComponent === HomeTab ? (
              <HomeTab onNavigate={setActiveKey} />
            ) : (
              <ActiveComponent />
            )}
          </main>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
