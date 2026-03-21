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
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="page-title">Attack Log Table</h2>
          <p className="page-subtitle">Structured evidence for flagged events</p>
        </div>
        <button onClick={fetchLogs} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <p className="text-red-400 mb-2">{error}</p>}
      <div className="table-shell max-h-[430px]">
        <table className="data-table">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "40%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Request Count</th>
              <th>Entropy Value</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.ip_address}</td>
                <td>{row.request_count}</td>
                <td>{Number(row.entropy_value || 0).toFixed(4)}</td>
                <td>{row.status}</td>
                <td>{row.reason}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-slate-400">
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
