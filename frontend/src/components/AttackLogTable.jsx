import { useEffect, useState } from "react";
import axios from "axios";

function AttackLogTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://127.0.0.1:8000/attack-logs?limit=120");
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Could not load attack logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Attack Log Table</h2>
        <button onClick={fetchLogs} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <p className="text-red-400 mb-2">{error}</p>}
      <div className="card overflow-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">IP Address</th>
              <th className="text-left p-2">Request Count</th>
              <th className="text-left p-2">Entropy Value</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-700">
                <td className="p-2">{row.ip_address}</td>
                <td className="p-2">{row.request_count}</td>
                <td className="p-2">{Number(row.entropy_value || 0).toFixed(4)}</td>
                <td className="p-2">{row.status}</td>
                <td className="p-2">{row.reason}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-slate-400">
                  No attack logs available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttackLogTable;
