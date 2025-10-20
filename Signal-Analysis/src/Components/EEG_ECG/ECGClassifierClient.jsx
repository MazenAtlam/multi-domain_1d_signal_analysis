import React, { useRef, useState } from "react";

const DEFAULTS = {
  useEnsemble: true,
  modelType: "main",
  threshold: 0.5,
};

class ECGClassifierClient {
  constructor(
    apiUrl = "https://fleshier-alvin-appealingly.ngrok-free.dev/api/ecg"
  ) {
    this.apiUrl = apiUrl;
  }

  async classifyFromFile(file, options = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("useEnsemble", options.useEnsemble ? "true" : "false");
    formData.append("modelType", options.modelType || DEFAULTS.modelType);
    formData.append("threshold", options.threshold ?? DEFAULTS.threshold);

    const response = await fetch(`${this.apiUrl}/classify`, {
      method: "POST",
      body: formData,
    });
    return await response.json();
  }
}

export default function ECGClassifierPanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef();
  const client = new ECGClassifierClient();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
  };

  const handleClassify = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await client.classifyFromFile(selectedFile, DEFAULTS);
      setResult(res);
    } catch (err) {
      setResult({ error: err.message || "Classification failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-3 mb-4">
      <h5>🫀 ECG Abnormality Classification</h5>
      <div className="mb-2">
        <input
          type="file"
          accept=".hdf5,.h5,.csv,.txt,.npy"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="form-control"
        />
      </div>
      <button
        className="btn btn-success"
        disabled={!selectedFile || loading}
        onClick={handleClassify}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Classifying...
          </>
        ) : (
          "Classify ECG"
        )}
      </button>
      <div className="mt-3" id="results-content">
        {result && result.error && (
          <div className="alert alert-danger">{result.error}</div>
        )}
        {result && result.result && (
          <div>
            <div className="result-summary mb-2 p-2 bg-light border rounded">
              <h6>
                Diagnosis:{" "}
                {result.result.summary.is_normal
                  ? "Normal"
                  : "Abnormalities Detected"}
              </h6>
              <div>
                Total abnormalities detected:{" "}
                {result.result.summary.total_detected}
              </div>
              {result.result.summary.confidence && (
                <div>Confidence: {result.result.summary.confidence}</div>
              )}
            </div>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Abnormality</th>
                  <th>Probability</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.result.predictions.map((pred, idx) => (
                  <tr
                    key={idx}
                    className={pred.detected ? "table-warning fw-bold" : ""}
                  >
                    <td>{pred.abnormality}</td>
                    <td>{pred.percentage}</td>
                    <td>{pred.detected ? "✓ Detected" : "✗ Not detected"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!result && (
          <div className="text-muted">
            Upload an ECG file to see classification results.
          </div>
        )}
      </div>
    </div>
  );
}
