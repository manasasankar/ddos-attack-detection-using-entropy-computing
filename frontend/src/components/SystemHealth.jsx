import { useEffect, useState } from "react";
import axios from "axios";

function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/health");
      setHealth(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (val) =>
    val === "ok" || val === true ? "text-green-600" : "text-red-600";

  return (
    <div className="panel">
      <h2 className="page-title">System Health</h2>
      <p className="page-subtitle">
        Quick overview of backend components and dependencies.
      </p>

      <button onClick={fetchHealth} className="mb-4">
        {loading ? "Checking..." : "Refresh"}
      </button>

      {health && (
        <div className="card max-w-2xl text-left text-sm">
          <p>
            <b>Database:</b>{" "}
            <span className={statusClass(health.database)}>{health.database}</span>
          </p>
          <p>
            <b>ML Model Loaded:</b>{" "}
            <span className={statusClass(health.model_loaded)}>
              {health.model_loaded ? "yes" : "no"}
            </span>
          </p>
          <p>
            <b>Realtime Mode:</b> <span>{health.realtime_mode || "idle"}</span>
          </p>
          <p>
            <b>Capture Running:</b>{" "}
            <span className={statusClass(health.capture_running)}>{health.capture_running ? "yes" : "no"}</span>
          </p>
          {health.db_error && (
            <p className="text-xs text-red-500">
              <b>DB Error:</b> {health.db_error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SystemHealth;

