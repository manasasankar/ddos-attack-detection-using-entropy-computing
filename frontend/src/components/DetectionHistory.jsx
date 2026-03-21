import { useEffect, useState } from "react";
import axios from "axios";

function DetectionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://127.0.0.1:8000/history");
      setHistory(res.data);
    } catch (error) {
      console.error(error);
      setError("Could not fetch detection history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="page-title">Detection History</h2>
          <p className="page-subtitle">Past entropy decisions · most recent first</p>
        </div>
        <button onClick={fetchHistory} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

      {history.length === 0 ? (
        <p className="text-sm text-slate-400">No detections recorded yet.</p>
      ) : (
        <div className="table-shell max-h-[390px]">
          <div className="custom-scrollbar">
            <table className="data-table">
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "40%" }} />
                <col style={{ width: "35%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Entropy</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{Number(item.entropy).toFixed(4)}</td>
                    <td>
                      <span
                        className={
                          item.status?.includes("Possible DDoS")
                            ? "text-rose-300 font-medium"
                            : "text-emerald-300 font-medium"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.timestamp || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetectionHistory;