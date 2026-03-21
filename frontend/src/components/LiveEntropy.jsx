import { useEffect, useState } from "react";
import axios from "axios";
import EntropyChart from "./EntropyChart.jsx";

function LiveEntropy() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatest = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/monitor/state");
      const state = res.data;
      if (state.latest) {
        setLatest(state.latest);
      }
      if (Array.isArray(state.series)) {
        setHistory(
          state.series.map((point) => ({
            entropy: point.entropy,
            status: `${point.final_status} | RF:${point.rf_status}`,
          }))
        );
      }
      setError("");
    } catch (error) {
      console.error(error);
      setError("Unable to fetch live monitor state.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2 className="page-title">Live Entropy Monitoring</h2>
      <p className="page-subtitle">
        Auto-refreshing view of the most recent detections and entropy trend.
      </p>

      {loading ? <p>Loading live stream...</p> : null}
      {error ? <p className="text-red-400">{error}</p> : null}
      {latest ? (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="card w-[260px]">
            <p className="text-sm text-gray-500 mb-1">Latest Entropy</p>
            <p className="text-2xl font-bold">{Number(latest.entropy).toFixed(4)}</p>
          </div>
          <div className="card w-[260px]">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-lg font-semibold">{latest.final_status}</p>
          </div>
          <div className="card w-[340px]">
            <p className="text-sm text-gray-500 mb-1">Why flagged</p>
            <p className="text-sm font-semibold">{latest.reason}</p>
            <p className="text-xs mt-1">Entropy:{latest.entropy_status} | RF:{latest.rf_status}</p>
          </div>
        </div>
      ) : (
        <p>No detections recorded yet.</p>
      )}

      {history.length > 0 && (
        <div className="max-w-xl">
          <EntropyChart history={history} />
        </div>
      )}
    </div>
  );
}

export default LiveEntropy;

