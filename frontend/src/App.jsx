import { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function Dashboard() {
  const [entropy, setEntropy] = useState(null);
  const [status, setStatus] = useState("");
  const [ipList, setIpList] = useState("192.168.1.2,192.168.1.3");
  const [history, setHistory] = useState([]);

  // 🟡 Load saved IPs and graph from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("entropyHistory");
    const savedIPs = localStorage.getItem("lastIPs");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedIPs) setIpList(savedIPs);
  }, []);

  // 🟡 Save graph history + IPs automatically
  useEffect(() => {
    localStorage.setItem("entropyHistory", JSON.stringify(history));
    localStorage.setItem("lastIPs", ipList);
  }, [history, ipList]);

  // 🧠 Detect DDoS
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

  // 🔓 Unblock all IPs
  const handleUnblock = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/unblock");
      alert(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  // 📊 Chart Data
  const chartData = {
    labels: history.map((_, i) => i + 1),
    datasets: [
      {
        label: "Entropy Trend",
        data: history.map((h) => h.entropy),
        borderColor: "#0077b6",
        backgroundColor: "rgba(0, 119, 182, 0.3)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-gray-900">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">DDoS Entropy Detector</h1>

      <input
        value={ipList}
        onChange={(e) => setIpList(e.target.value)}
        className="p-2 rounded border border-gray-400 w-80 mb-4"
        placeholder="Enter comma-separated IPs"
      />

      <div className="flex gap-4">
        <button onClick={handleDetect} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Detect
        </button>
        <button onClick={handleUnblock} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Unblock All
        </button>
      </div>

      {entropy && (
        <div className="mt-6 p-4 bg-white shadow-md rounded-lg text-center w-80">
          <p>Entropy: <b>{entropy}</b></p>
          <p>Status: <b>{status}</b></p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 w-[500px] bg-white shadow-md p-4 rounded-lg">
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
}

function App() {
  return <Dashboard />;
}

export default App;
