import { useEffect, useState } from "react";
import axios from "axios";

function SuspiciousIPAnalysis() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIps();
  }, []);

  const fetchIps = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/suspicious-ips");
      setIps(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-blue-700">Suspicious IP Analysis</h2>
      <p className="mb-4 text-sm text-gray-600">
        Top IPs observed during detected DDoS attacks.
      </p>
      <button onClick={fetchIps} className="mb-4">
        Refresh
      </button>

      {loading && <p>Loading...</p>}

      {ips.length === 0 && !loading && <p>No suspicious IPs recorded yet.</p>}

      {ips.length > 0 && (
        <table className="w-full border border-gray-200 text-sm text-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-blue-100">
            <tr>
              <th className="p-2 text-left">IP Address</th>
              <th className="p-2 text-left">Attack Count</th>
              <th className="p-2 text-left">Last Detected</th>
            </tr>
          </thead>
          <tbody>
            {ips.map((row) => (
              <tr key={row.ip} className="border-t hover:bg-blue-50">
                <td className="p-2">{row.ip}</td>
                <td className="p-2">{row.count}</td>
                <td className="p-2">{row.last_detected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SuspiciousIPAnalysis;

