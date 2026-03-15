import { useState } from "react";
import axios from "axios";

function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setResult(null);
    try {
      const res = await axios.post("http://127.0.0.1:8000/upload-dataset", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (error) {
      console.error(error);
      setResult({ error: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-blue-700">Traffic Dataset Upload</h2>
      <p className="mb-4 text-sm text-gray-600">
        Upload a CSV traffic dataset for offline analysis and storage.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload Dataset"}
        </button>
      </form>

      {result && (
        <div className="card mt-6 text-sm text-left">
          {"error" in result ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <p><b>File:</b> {result.filename}</p>
              <p><b>Rows:</b> {result.rows ?? "Unknown"}</p>
              <p><b>Columns:</b> {result.columns?.join(", ")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DatasetUpload;

