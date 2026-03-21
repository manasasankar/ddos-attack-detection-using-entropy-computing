import { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function AttackStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/attack-stats");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) {
    return <p>Loading attack statistics...</p>;
  }

  const labels = stats.per_day.map((d) => d.day);
  const data = {
    labels,
    datasets: [
      {
        label: "Detections per day",
        data: stats.per_day.map((d) => d.count),
        backgroundColor: "rgba(34, 211, 238, 0.65)",
        borderColor: "rgba(167, 139, 250, 0.9)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="panel">
      <h2 className="page-title">Attack Statistics</h2>
      <p className="page-subtitle">Aggregated detections and model comparison snapshot</p>

      <div className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Total Detections</p>
          <p className="metric-value">{stats.total_detections}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Attacks Detected</p>
          <p className="metric-value text-rose-300">{stats.attack_count}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Normal Traffic</p>
          <p className="metric-value text-emerald-300">{stats.normal_count}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Average Entropy</p>
          <p className="metric-value">
            {stats.average_entropy != null ? stats.average_entropy.toFixed(4) : "—"}
          </p>
        </div>
      </div>

      {stats.comparison && (
        <div className="chip mb-4">
          <p className="text-sm m-0">
            Entropy: <b>{stats.comparison.entropy_status || "-"}</b> | RF: <b>{stats.comparison.rf_status || "-"}</b>{" "}
            | Final: <b>{stats.comparison.final_status || "-"}</b>
          </p>
        </div>
      )}

      {stats.per_day.length > 0 ? (
        <div className="chart-container max-w-2xl">
          <Bar data={data} />
        </div>
      ) : (
        <p>No per-day detection data available yet.</p>
      )}
    </div>
  );
}

export default AttackStats;

