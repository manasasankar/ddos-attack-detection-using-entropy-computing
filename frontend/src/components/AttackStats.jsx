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
        backgroundColor: "rgba(37, 99, 235, 0.6)",
      },
    ],
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-blue-700">Attack Statistics</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="card w-[200px]">
          <p className="text-xs text-gray-500 mb-1">Total Detections</p>
          <p className="text-2xl font-bold">{stats.total_detections}</p>
        </div>
        <div className="card w-[200px]">
          <p className="text-xs text-gray-500 mb-1">Attacks Detected</p>
          <p className="text-2xl font-bold text-red-600">{stats.attack_count}</p>
        </div>
        <div className="card w-[200px]">
          <p className="text-xs text-gray-500 mb-1">Normal Traffic</p>
          <p className="text-2xl font-bold text-green-600">{stats.normal_count}</p>
        </div>
        <div className="card w-[220px]">
          <p className="text-xs text-gray-500 mb-1">Average Entropy</p>
          <p className="text-2xl font-bold">
            {stats.average_entropy != null ? stats.average_entropy.toFixed(4) : "—"}
          </p>
        </div>
      </div>

      {stats.comparison && (
        <div className="card w-full max-w-2xl mb-4">
          <p className="text-sm">
            Detection comparison - Entropy: <b>{stats.comparison.entropy_status || "-"}</b> | Random Forest:{" "}
            <b>{stats.comparison.rf_status || "-"}</b> | Final: <b>{stats.comparison.final_status || "-"}</b>
          </p>
        </div>
      )}

      {stats.per_day.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-4 max-w-2xl">
          <Bar data={data} />
        </div>
      ) : (
        <p>No per-day detection data available yet.</p>
      )}
    </div>
  );
}

export default AttackStats;

