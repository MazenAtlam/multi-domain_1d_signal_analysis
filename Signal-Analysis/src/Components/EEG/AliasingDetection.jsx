import React, { useState, useMemo } from "react";
import axios from "axios";

const AliasingDetection = ({
  channels,
  samplingRate,
  selected,
  signalType = "EEG",
}) => {
  const [aliasingResults, setAliasingResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Basic aliasing detection (client-side)
  const basicAliasingCheck = useMemo(() => {
    if (!channels.length || !samplingRate || selected.length === 0) return null;

    const checks = [];
    const channelIndex = selected[0];
    const signal = channels[channelIndex];

    if (!signal || signal.length < 100) return null;

    // Check 1: Nyquist frequency violation
    const nyquistFrequency = samplingRate / 2;
    checks.push({
      name: "Nyquist Frequency",
      status: nyquistFrequency > 1 ? "PASS" : "WARNING",
      message:
        nyquistFrequency > 1
          ? `Nyquist frequency (${nyquistFrequency}Hz) sufficient for ${signalType}`
          : `Sampling rate too low for ${signalType} analysis`,
    });

    // Check 2: High-frequency content (simple FFT-based check)
    const fftSize = Math.min(256, signal.length);
    const segment = signal.slice(0, fftSize);

    // Simple FFT approximation
    let highFreqPower = 0;
    let totalPower = 0;

    for (let i = 0; i < fftSize; i++) {
      const power = Math.pow(segment[i], 2);
      totalPower += power;

      const freq = (i * samplingRate) / fftSize;
      if (freq > nyquistFrequency * 0.8) {
        // Check frequencies near Nyquist
        highFreqPower += power;
      }
    }

    const highFreqRatio = highFreqPower / totalPower;
    checks.push({
      name: "High-Frequency Content",
      status: highFreqRatio < 0.1 ? "PASS" : "WARNING",
      message:
        highFreqRatio < 0.1
          ? "Low high-frequency content, minimal aliasing risk"
          : `High-frequency content detected (${(highFreqRatio * 100).toFixed(
              1
            )}%), possible aliasing`,
    });

    // Check 3: Signal-to-Noise ratio estimate
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance =
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);

    // Simple SNR estimation
    const estimatedSNR = stdDev > 0 ? 20 * Math.log10(stdDev / 0.01) : 0; // Assuming noise floor ~0.01
    checks.push({
      name: "Signal Quality",
      status: estimatedSNR > 20 ? "PASS" : "WARNING",
      message:
        estimatedSNR > 20
          ? `Good signal quality (SNR ~${estimatedSNR.toFixed(1)}dB)`
          : `Poor signal quality (SNR ~${estimatedSNR.toFixed(
              1
            )}dB), may affect analysis`,
    });

    return {
      checks,
      summary: {
        passed: checks.filter((c) => c.status === "PASS").length,
        warnings: checks.filter((c) => c.status === "WARNING").length,
        total: checks.length,
      },
    };
  }, [channels, samplingRate, selected, signalType]);

  // API-based aliasing detection
  const detectAliasing = async () => {
    if (!channels.length || selected.length === 0) {
      setError("No signal data available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const channelIndex = selected[0];
      const signalData = channels[channelIndex];

      // Convert to suitable format for API
      const signalBlob = new Blob(
        [
          JSON.stringify({
            signal: signalData,
            sampling_rate: samplingRate,
            signal_type: signalType,
          }),
        ],
        { type: "application/json" }
      );

      const formData = new FormData();
      formData.append("file", signalBlob, "signal_data.json");
      formData.append("sampling_frequency", samplingRate.toString());
      formData.append("signal_type", signalType);

      // Call aliasing detection API
      const response = await axios.post("/api/aliasing/detect", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      setAliasingResults(response.data);
    } catch (err) {
      console.error("Aliasing detection error:", err);
      setError(err.response?.data?.message || "Failed to detect aliasing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aliasing-detection p-3 bg-light rounded">
      <h6>Aliasing Phase Detection</h6>

      {/* Basic Aliasing Check */}
      {basicAliasingCheck && (
        <div className="mb-3">
          <h6 className="small">Basic Aliasing Analysis</h6>
          <div className="row">
            {basicAliasingCheck.checks.map((check, index) => (
              <div key={index} className="col-md-4 mb-2">
                <div
                  className={`card ${
                    check.status === "PASS"
                      ? "border-success"
                      : "border-warning"
                  }`}
                >
                  <div className="card-body p-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="small">{check.name}</strong>
                      <span
                        className={`badge ${
                          check.status === "PASS" ? "bg-success" : "bg-warning"
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>
                    <small className="text-muted">{check.message}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 text-center">
            <small className="text-muted">
              Summary: {basicAliasingCheck.summary.passed}/
              {basicAliasingCheck.summary.total} checks passed
            </small>
          </div>
        </div>
      )}

      {/* Advanced Aliasing Detection */}
      <div className="text-center mb-3">
        <button
          className="btn btn-primary btn-sm"
          onClick={detectAliasing}
          disabled={loading || !channels.length}
        >
          {loading
            ? "Detecting Aliasing..."
            : "Run Advanced Aliasing Detection"}
        </button>
      </div>

      {/* API Results */}
      {aliasingResults && (
        <div className="mt-3 p-3 bg-white rounded border">
          <h6 className="text-primary">Advanced Aliasing Analysis Results</h6>

          {aliasingResults.aliasing_detected ? (
            <div className="alert alert-warning">
              <strong>⚠ Aliasing Detected!</strong>
              <div className="small mt-1">
                {aliasingResults.message ||
                  "Signal shows signs of aliasing. Consider increasing sampling rate or applying anti-aliasing filter."}
              </div>
            </div>
          ) : (
            <div className="alert alert-success">
              <strong>✓ No Significant Aliasing</strong>
              <div className="small mt-1">
                {aliasingResults.message ||
                  "Signal appears free from significant aliasing artifacts."}
              </div>
            </div>
          )}

          {aliasingResults.details && (
            <div className="mt-2">
              <h6 className="small">Detailed Analysis:</h6>
              <pre className="bg-dark text-light p-2 rounded small">
                {JSON.stringify(aliasingResults.details, null, 2)}
              </pre>
            </div>
          )}

          {aliasingResults.recommendations && (
            <div className="mt-2">
              <h6 className="small">Recommendations:</h6>
              <ul className="small">
                {aliasingResults.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="alert alert-danger small mt-2">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mt-3 small text-muted">
        <strong>Note:</strong> Aliasing occurs when signal contains frequencies
        above Nyquist limit ({samplingRate / 2}Hz). This can distort signal
        analysis and AI classification results.
      </div>
    </div>
  );
};

export default AliasingDetection;
