import { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function Dashboard() {
  const [entropy, setEntropy] = useState(null);
  const [status, setStatus] = useState("");
  const [ipList, setIpList] = useState("");
  const [history, setHistory] = useState([]);

  // 🧩 Step 1: Load previous data when app opens
  useEffect(() => {
    const savedIPs = localStorage.getItem("ipList");
    const savedHistory = localStorage.getItem("history");
    const savedEntropy = localStorage.getItem("entropy");
    const savedStatus = localStorage.getItem("status");

    if (savedIPs) setIpList(savedIPs);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedEntropy) setEntropy(savedEntropy);
    if (savedStatus) setStatus(savedStatus);
  }, []);

  // 🧩 Step 2: Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("ipList", ipList);
    localStorage.setItem("history", JSON.stringify(history));
    if (entropy) localStorage.setItem("entropy", entropy);
    if (status) localStorage.setItem("status", status);
  }, [ipList, history, entropy, status]);

  // 🧩 Step 3: Detect DDoS entropy
  const handleDetect = async () => {
    try {
      const ips = ipList.split(",").map((ip) => ip.trim());
      const res = await axios.post("http://127.0.0.1:8000/detect", {
        ip_list: ips,
        features: [100, 2000, 1.5, 3, 600, 40, 30, 70],
      });
      setEntropy(res.data.entropy.toFixed(4));
      setStatus(res.data.status);
      setHistory((prev) => [...prev, { entropy: res.data.entropy, status: res.data.status }]);
    } catch (err) {
      console.error(err);
    }
  };

  // 🧩 Step 4: Unblock all IPs
  const handleUnblock = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/unblock");
      const extra =
        res.data.unblocked_ips && res.data.unblocked_ips.length > 0
          ? `\n\nUnblocked IPs:\n- ${res.data.unblocked_ips.join("\n- ")}`
          : "";
      alert(res.data.message + extra);
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = {
    labels: history.map((_, i) => i + 1),
    datasets: [
      {
        label: "Entropy Trend",
        data: history.map((h) => h.entropy),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.3)",
        tension: 0.3, // smooth curve
      },
    ],
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-2 tracking-[0.25em] uppercase">
        Entropy Scanner
      </h1>
      <p className="text-xs uppercase tracking-[0.3em] text-red-300 mb-6">
        Live anomaly sweep across the network
      </p>

      <input
        value={ipList}
        onChange={(e) => setIpList(e.target.value)}
        className="p-2 rounded border border-gray-700 w-80 mb-4 bg-black/40 text-red-100"
        placeholder="Enter comma-separated IPs to scan"
      />

      <div className="flex gap-4 mb-2">
        <button onClick={handleDetect}>
          Detect Anomaly
        </button>
        <button onClick={handleUnblock}>
          Purge Blocks
        </button>
      </div>
      <p className="text-[0.65rem] text-slate-400 uppercase tracking-[0.22em]">
        high entropy ≈ calm · low entropy ≈ disturbance
      </p>

      {entropy && (
        <div className="mt-6 p-4 card text-center w-[300px]">
          <p>Entropy: <b>{entropy}</b></p>
          <p>Status: <b>{status}</b></p>
        </div>
      )}

      {history.length > 0 && (
        <div className="chart-container">
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
