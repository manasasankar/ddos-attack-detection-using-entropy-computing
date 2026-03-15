import { useEffect, useState } from "react";
import axios from "axios";

function DetectionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/history");
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[0.18em] uppercase text-cyan-300">
            Detection History
          </h2>
          <p className="text-[0.7rem] text-slate-400 uppercase tracking-[0.22em] mt-1">
            Past entropy decisions · most recent first
          </p>
        </div>
        <button onClick={fetchHistory} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-400">No detections recorded yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs text-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-cyan-300 uppercase tracking-[0.16em]">
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Entropy</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-t border-slate-800/70 ${
                      idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"
                    } hover:bg-sky-900/30 transition-colors`}
                  >
                    <td className="px-3 py-2">{item.id}</td>
                    <td className="px-3 py-2">{Number(item.entropy).toFixed(4)}</td>
                    <td className="px-3 py-2">
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