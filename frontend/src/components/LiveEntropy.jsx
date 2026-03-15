import { useEffect, useState } from "react";
import axios from "axios";
import EntropyChart from "./EntropyChart.jsx";

function LiveEntropy() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatest = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/latest-detection");
      if (res.data && res.data.entropy !== undefined) {
        setLatest(res.data);
        setHistory((prev) => {
          const next = [...prev, { entropy: res.data.entropy, status: res.data.status }];
          return next.slice(-50);
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-blue-700">Live Entropy Monitoring</h2>
      <p className="mb-4 text-sm text-gray-600">
        Auto-refreshing view of the most recent detections and entropy trend.
      </p>

      {latest ? (
        <div className="flex gap-4 mb-6">
          <div className="card w-[260px]">
            <p className="text-sm text-gray-500 mb-1">Latest Entropy</p>
            <p className="text-2xl font-bold">{Number(latest.entropy).toFixed(4)}</p>
          </div>
          <div className="card w-[260px]">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-lg font-semibold">{latest.status}</p>
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

