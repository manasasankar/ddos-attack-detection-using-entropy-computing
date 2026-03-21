import { useEffect, useState } from "react";
import axios from "axios";

function SuspiciousIPAnalysis() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIps();
  }, []);

  const fetchIps = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://127.0.0.1:8000/suspicious-ips");
      setIps(res.data);
    } catch (error) {
      console.error(error);
      setError("Could not fetch suspicious IP data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2 className="page-title">Suspicious IP Analysis</h2>
      <p className="page-subtitle">
        Top IPs observed during detected DDoS attacks.
      </p>
      <button onClick={fetchIps} className="mb-4">
        Refresh
      </button>

      {loading && <p className="text-slate-300">Loading...</p>}
      {error && <p className="text-red-400 mb-2">{error}</p>}

      {ips.length === 0 && !loading && <p className="text-slate-400">No suspicious IPs recorded yet.</p>}

      {ips.length > 0 && (
        <div className="table-shell max-h-[390px]">
          <table className="data-table">
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "50%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Attack Count</th>
                <th>Last Detected</th>
              </tr>
            </thead>
            <tbody>
              {ips.map((row) => (
                <tr key={row.ip}>
                  <td>{row.ip}</td>
                  <td>{row.count}</td>
                  <td>{row.last_detected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SuspiciousIPAnalysis;

