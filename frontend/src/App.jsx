import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import DetectionHistory from "./components/DetectionHistory.jsx";
import SuspiciousIPAnalysis from "./components/SuspiciousIPAnalysis.jsx";
import LiveEntropy from "./components/LiveEntropy.jsx";
import AttackStats from "./components/AttackStats.jsx";
import SystemHealth from "./components/SystemHealth.jsx";
import AttackLogTable from "./components/AttackLogTable.jsx";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "history":
        return <DetectionHistory />;
      case "suspicious":
        return <SuspiciousIPAnalysis />;
      case "live":
        return <LiveEntropy />;
      case "stats":
        return <AttackStats />;
      case "health":
        return <SystemHealth />;
      case "logs":
        return <AttackLogTable />;
      default:
        return <Dashboard />;
    }
  };

  const navButtonClass = (page) =>
    `nav-button ${activePage === page ? "active" : ""}`;

  return (
    <div className="horror-shell">
      <aside className="horror-sidebar">
        <div className="horror-title">
          DDoS WATCHTOWER
          <span>REAL-TIME THREAT OBSERVATORY</span>
        </div>

        <button className={navButtonClass("dashboard")} onClick={() => setActivePage("dashboard")}>
          <span className="nav-accent-dot" />
          <span>Live Detection</span>
        </button>
        <button className={navButtonClass("history")} onClick={() => setActivePage("history")}>
          <span className="nav-accent-dot" />
          <span>Detection History</span>
        </button>
        <button className={navButtonClass("suspicious")} onClick={() => setActivePage("suspicious")}>
          <span className="nav-accent-dot" />
          <span>Suspicious IPs</span>
        </button>
        <button className={navButtonClass("live")} onClick={() => setActivePage("live")}>
          <span className="nav-accent-dot" />
          <span>Live Entropy</span>
        </button>
        <button className={navButtonClass("stats")} onClick={() => setActivePage("stats")}>
          <span className="nav-accent-dot" />
          <span>Attack Statistics</span>
        </button>
        <button className={navButtonClass("health")} onClick={() => setActivePage("health")}>
          <span className="nav-accent-dot" />
          <span>System Health</span>
        </button>
        <button className={navButtonClass("logs")} onClick={() => setActivePage("logs")}>
          <span className="nav-accent-dot" />
          <span>Attack Logs</span>
        </button>
      </aside>
      <main className="horror-main">{renderPage()}</main>
    </div>
  );
}

export default App;
