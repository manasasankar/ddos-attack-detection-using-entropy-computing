function TrafficTable({ ipList, history }) {
  const ips = ipList.split(",").map(ip => ip.trim());

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-blue-700 mb-3">Traffic Details</h2>
      <table className="w-full border border-gray-200 text-sm text-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-blue-100">
          <tr>
            <th className="p-2 text-left">IP Address</th>
            <th className="p-2 text-left">Entropy</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {ips.map((ip, i) => (
            <tr key={i} className="border-t hover:bg-blue-50">
              <td className="p-2">{ip}</td>
              <td className="p-2">{history[history.length - 1]?.entropy.toFixed(4)}</td>
              <td className={`p-2 font-medium ${history[history.length - 1]?.status.includes("attack") ? "text-red-600" : "text-green-600"}`}>
                {history[history.length - 1]?.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TrafficTable;
