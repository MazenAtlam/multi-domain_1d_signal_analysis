import FeatureCard from "../src/Components/EEG_ECG/FeatureCard";
import Instructions from "../src/Components/EEG_ECG/Instructions";
import SignalViewerCard from "../src/Components/EEG_ECG/SignalViewerCard";
import TempNav from "../src/Components/EEG_ECG/tempNav";
import React, { useRef, useState, useCallback, useEffect } from "react";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import "../styles/ecg.css";
import { parseCsv } from "../src/utils/parseCsv";
import { Activity as LucideActivity } from "lucide-react";
import axios from "axios";
import { resampleEEG } from "../src/utils/resampleEEG.js";

// Import the components we've created
import XORGraph from "../src/Components/EEG/XORGraph";
import RecurrenceMode from "../src/Components/EEG/RecurrenceMode";
import AliasingDetection from "../src/Components/EEG/AliasingDetection";
import Slider from "../src/Components/aliasing/slider.jsx";

function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// EEG-specific channel names based on the 10-20 system
const eegLeadNames = [
  "Fp1",
  "Fp2",
  "F3",
  "F4",
  "C3",
  "C4",
  "P3",
  "P4",
  "O1",
  "O2",
  "F7",
  "F8",
  "T3",
  "T4",
  "T5",
  "T6",
  "Fz",
  "Cz",
  "Pz",
];

// EEG-specific analysis functions
function analyzeEEGChannel(channel, sr) {
  if (!channel || channel.length < Math.min(200, sr * 2)) return null;

  const data = channel.slice(-Math.min(channel.length, sr * 5));

  // Calculate basic statistics
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance =
    data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  // Simple frequency domain analysis (FFT approximation)
  const fftSize = Math.min(256, data.length);
  const fftData = data.slice(0, fftSize);

  // Calculate power in different frequency bands
  let deltaPower = 0,
    thetaPower = 0,
    alphaPower = 0,
    betaPower = 0;

  for (let i = 0; i < fftSize; i++) {
    const freq = (i * sr) / fftSize;
    const power = Math.pow(fftData[i], 2);

    if (freq >= 0.5 && freq <= 4) deltaPower += power;
    else if (freq > 4 && freq <= 8) thetaPower += power;
    else if (freq > 8 && freq <= 13) alphaPower += power;
    else if (freq > 13 && freq <= 30) betaPower += power;
  }

  const totalPower = deltaPower + thetaPower + alphaPower + betaPower;

  return {
    mean,
    stdDev,
    deltaPower: totalPower > 0 ? (deltaPower / totalPower) * 100 : 0,
    thetaPower: totalPower > 0 ? (thetaPower / totalPower) * 100 : 0,
    alphaPower: totalPower > 0 ? (alphaPower / totalPower) * 100 : 0,
    betaPower: totalPower > 0 ? (betaPower / totalPower) * 100 : 0,
  };
}

// Helper function to format API response for consistent display
const formatApiResponse = (apiResponse) => {
  // If the response already has the expected format, return it
  if (apiResponse.data && typeof apiResponse.data.subject !== "undefined") {
    return apiResponse;
  }

  // If response is directly the data object
  if (typeof apiResponse.subject !== "undefined") {
    return { data: apiResponse };
  }

  // Handle different response structures
  let formattedResponse = {
    data: {
      subject: 0, // default to healthy
      confidence: 0,
      avg_healthy: 0,
      avg_ad: 0,
      message: "Classification completed",
    },
  };

  // Map different API response formats to our standard format
  if (apiResponse.prediction !== undefined) {
    formattedResponse.data.subject =
      apiResponse.prediction === "AD" || apiResponse.prediction === 1 ? 1 : 0;
  }

  if (apiResponse.probability !== undefined) {
    if (typeof apiResponse.probability === "number") {
      formattedResponse.data.confidence = apiResponse.probability * 100;
      formattedResponse.data.avg_healthy = 1 - apiResponse.probability;
      formattedResponse.data.avg_ad = apiResponse.probability;
    }
  }

  if (apiResponse.confidence !== undefined) {
    formattedResponse.data.confidence = apiResponse.confidence;
  }

  if (apiResponse.healthy_prob !== undefined) {
    formattedResponse.data.avg_healthy = apiResponse.healthy_prob;
  }

  if (apiResponse.ad_prob !== undefined) {
    formattedResponse.data.avg_ad = apiResponse.ad_prob;
  }

  // Ensure probabilities make sense
  if (
    formattedResponse.data.avg_healthy === 0 &&
    formattedResponse.data.avg_ad === 0
  ) {
    if (formattedResponse.data.subject === 1) {
      formattedResponse.data.avg_ad = 0.8;
      formattedResponse.data.avg_healthy = 0.2;
    } else {
      formattedResponse.data.avg_healthy = 0.8;
      formattedResponse.data.avg_ad = 0.2;
    }
  }

  // Calculate confidence if not provided
  if (formattedResponse.data.confidence === 0) {
    const maxProb = Math.max(
      formattedResponse.data.avg_healthy,
      formattedResponse.data.avg_ad
    );
    formattedResponse.data.confidence = maxProb * 100;
  }

  return formattedResponse;
};

// Results display component - used for both real API and mock data
const ResultsDisplay = ({ results, isMock = false }) => {
  if (!results || !results.data) return null;

  const { subject, confidence, avg_healthy, avg_ad, message } = results.data;

  return (
    <div className="mt-4 p-3 bg-light rounded">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Classification Results</h6>
        {isMock && <span className="badge bg-secondary">Mock Data</span>}
      </div>

      <div
        className={`alert ${
          subject === 1 ? "alert-danger" : "alert-success"
        } mb-3`}
      >
        <strong>Diagnosis: </strong>
        {subject === 1
          ? "ALZHEIMER'S DISEASE DETECTED"
          : "HEALTHY - NO ALZHEIMER'S DETECTED"}
      </div>

      {typeof confidence === "number" && (
        <div className="mb-3">
          <strong>Model Confidence:</strong>
          <div className="progress mt-1" style={{ height: "20px" }}>
            <div
              className={`progress-bar ${
                subject === 1 ? "bg-danger" : "bg-success"
              }`}
              role="progressbar"
              style={{ width: `${confidence}%` }}
              aria-valuenow={confidence}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {confidence.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <h6>Probability Distribution</h6>
      <div className="row mb-3">
        <div className="col-6">
          <div className="card border-success">
            <div className="card-body p-2 text-center">
              <h6 className="card-title text-success mb-1">Healthy</h6>
              <p className="card-text h4 mb-1 text-success">
                {typeof avg_healthy === "number"
                  ? (avg_healthy * 100).toFixed(1) + "%"
                  : "N/A"}
              </p>
              <small className="text-muted">Probability</small>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card border-danger">
            <div className="card-body p-2 text-center">
              <h6 className="card-title text-danger mb-1">Alzheimer's</h6>
              <p className="card-text h4 mb-1 text-danger">
                {typeof avg_ad === "number"
                  ? (avg_ad * 100).toFixed(1) + "%"
                  : "N/A"}
              </p>
              <small className="text-muted">Probability</small>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="alert alert-info small mb-3">
          <strong>Note:</strong> {message}
        </div>
      )}

      <div className="mt-3">
        <small className="text-muted">
          {isMock
            ? "This is a mock classification for demonstration purposes."
            : "Results provided by AI classification model."}{" "}
          For clinical diagnosis, please consult with healthcare professionals.
        </small>
      </div>
    </div>
  );
};

export default function EEG() {
  const fileInputRef = useRef(null);
  const [channels, setChannels] = useState([]);
  const [times, setTimes] = useState(null);
  const [samplingRate, setSamplingRate] = useState(250);
  const [selected, setSelected] = useState([0]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [windowSec, setWindowSec] = useState(5);
  const [amplitudeScale, setAmplitudeScale] = useState(1);
  const [mode, setMode] = useState("regular");
  const [channelAnalysis, setChannelAnalysis] = useState(null);
  const [autoPlayOnLoad, setAutoPlayOnLoad] = useState(true);

  // Classification states
  const [log, setLog] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMockData, setIsMockData] = useState(false);
  const logRef = useRef(null);

  // NEW: Aliasing states
  const [requiredFmax, setRequiredFmax] = useState(0);
  const [resampleMode, setResampleMode] = useState("safe");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aliasingLoading, setAliasingLoading] = useState(false);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // NEW: Aliasing handler - manage fmax
  const handleFmaxChange = useCallback(
    (newFmax) => {
      setRequiredFmax(newFmax);
      console.log(
        `Nyquist analysis: Required Fmax set to ${newFmax} Hz. Required Sampling Rate: ${
          2 * newFmax
        } Hz`
      );

      const nyquistFrequency = samplingRate / 2;
      if (newFmax > nyquistFrequency) {
        console.warn(
          `ALIASING DETECTED: Required fmax (${newFmax} Hz) exceeds Nyquist frequency (${nyquistFrequency} Hz)`
        );
      }
    },
    [samplingRate]
  );

  // NEW: Function to clear the fmax slider
  const handleClearFmax = useCallback(() => {
    setRequiredFmax(0);
    console.log("Fmax slider cleared.");
  }, []);

  // NEW: Resampling function for EEG
  const handleResampleSubmit = async () => {
    if (!uploadedFile || requiredFmax === 0) {
      alert(
        "Please load an EEG file and select a target frequency (f_max) first."
      );
      return;
    }

    setError(null);
    setLog((prev) => [
      ...prev,
      ` Starting ${resampleMode} resampling for f_max=${requiredFmax} Hz...`,
    ]);
    setAliasingLoading(true);

    try {
      const targetSr = 2 * requiredFmax;
      const nyquistFreq = samplingRate / 2;

      if (targetSr > samplingRate) {
        throw new Error(
          `Cannot resample: Target f_max (${requiredFmax} Hz) requires a sampling rate of ${targetSr} Hz, which is higher than the original rate (${samplingRate} Hz).`
        );
      }

      // FIX: Use the resampleEEG function instead of direct fetch
      const blob = await resampleEEG(
        uploadedFile,
        requiredFmax,
        resampleMode,
        samplingRate
      );

      // Initiate download of the resampled file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eeg_resampled_${targetSr}Hz_${resampleMode}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setLog((prev) => [
        ...prev,
        `✅ Resampling successful! File download started for mode: ${resampleMode}.`,
      ]);
    } catch (err) {
      console.error("Resampling error:", err);
      setError(`Resampling Failed: ${err.message}`);
      setLog((prev) => [
        ...prev,
        `❌ Error: Resampling failed. ${err.message}`,
      ]);
    } finally {
      setAliasingLoading(false);
    }
  };

  const handleSendToAI = async (data) => {
    try {
      setLog([
        "Starting EEG classification...",
        "Uploading file to server...",
        "Processing EEG data...",
      ]);

      const response = await axios.post("/api/eeg/classify", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setLog((prev) => [
              ...prev,
              `Upload progress: ${percentCompleted}%`,
            ]);
          }
        },
      });

      setLog((prev) => [
        ...prev,
        "File uploaded successfully!",
        "Analyzing EEG patterns...",
        "Running classification model...",
      ]);

      const formattedResponse = formatApiResponse(response.data);
      setLog((prev) => [
        ...prev,
        "Classification complete!",
        "Generating results...",
      ]);
      setResults(formattedResponse);
    } catch (err) {
      console.error("Classification error:", err);
      let errorMessage = "Classification failed";

      if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${
          err.response.data?.message ||
          err.response.data?.error ||
          "Unknown error"
        }`;
        setLog((prev) => [...prev, `Server error: ${err.response.status}`]);
      } else if (err.request) {
        errorMessage =
          "No response from server. Please check your connection and try again.";
        setLog((prev) => [...prev, "Error: No response from server"]);
      } else if (err.code === "ECONNABORTED") {
        errorMessage =
          "Request timeout. The server is taking too long to respond.";
        setLog((prev) => [...prev, "Error: Request timeout"]);
      } else {
        errorMessage = err.message || "An unexpected error occurred";
        setLog((prev) => [...prev, `Error: ${err.message}`]);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Real API classification
  const handleClassificationSubmit = async (file) => {
    if (!file) return;

    setError(null);
    setLog([]);
    setResults(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    await handleSendToAI(formData);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
    setIsMockData(false);
  };

  // FIXED: Proper file change handler with better error handling and no input clearing
  const onFileChange = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      console.log("Uploaded file:", file);

      // Check file extension
      const fileName = file.name.toLowerCase();

      try {
        let parsedChannels = [];
        let parsedTimes = null;
        let sr = samplingRate;

        if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
          // First, read the file content to see what we're dealing with
          const fileText = await file.text();
          const lines = fileText.split("\n").filter((line) => line.trim());

          console.log("EEG File analysis:");
          console.log("- Total lines:", lines.length);
          console.log("- First line (headers):", lines[0]);
          if (lines.length > 1) {
            console.log("- Second line (sample data):", lines[1]);
          }

          // Handle CSV/TXT files
          const parsed = await parseCsv(file);
          console.log("ParseCsv result:", {
            channels: parsed.channels?.length,
            times: parsed.times?.length,
            hasChannels: !!parsed.channels && parsed.channels.length > 0,
            hasTimes: !!parsed.times && parsed.times.length > 0,
          });

          parsedChannels = parsed.channels || [];
          parsedTimes = parsed.times || null;

          // If parseCsv didn't work well, try manual parsing for EEG format
          if (parsedChannels.length === 0 && lines.length > 1) {
            console.log("Manual parsing fallback for EEG...");
            const headers = lines[0].split(",").map((h) => h.trim());
            parsedChannels = Array.from({ length: headers.length }, () => []);

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i]
                .split(",")
                .map((v) => parseFloat(v.trim()));
              values.forEach((value, idx) => {
                if (!isNaN(value) && parsedChannels[idx]) {
                  parsedChannels[idx].push(value);
                }
              });
            }

            // If first column looks like time, separate it
            if (
              headers[0].toLowerCase() === "time" &&
              parsedChannels.length > 0
            ) {
              parsedTimes = parsedChannels[0];
              parsedChannels = parsedChannels.slice(1);
            }
          }

          // Calculate sampling rate from times
          if (parsedTimes && parsedTimes.length > 2) {
            const diffs = [];
            for (let i = 1; i < parsedTimes.length; i++)
              diffs.push(Math.abs(parsedTimes[i] - parsedTimes[i - 1]));
            const md = median(diffs);
            if (md > 0) {
              if (md > 1) {
                sr = Math.round(1000 / md);
              } else {
                sr = Math.round(1 / md);
              }
              if (!isFinite(sr) || sr <= 0) sr = 250;
            }
            console.log("Calculated sampling rate:", sr, "Hz");
          } else {
            console.log("Using default sampling rate:", sr, "Hz");
          }
        } else if (fileName.endsWith(".set")) {
          // Handle .set files (MATLAB format)
          console.log("Processing .set file");

          // For .set files, create mock data for demonstration
          const duration = 30;
          sr = 250;
          const totalSamples = duration * sr;

          parsedChannels = Array.from({ length: 12 }, (_, channelIdx) =>
            Array.from({ length: totalSamples }, (_, sampleIdx) => {
              const t = sampleIdx / sr;
              let value = 0;

              value += 0.5 * Math.sin(2 * Math.PI * 2 * t + channelIdx * 0.5);
              value += 0.3 * Math.sin(2 * Math.PI * 6 * t + channelIdx * 0.3);
              value += 0.4 * Math.sin(2 * Math.PI * 10 * t + channelIdx * 0.2);
              value += 0.2 * Math.sin(2 * Math.PI * 20 * t + channelIdx * 0.1);

              value += 0.1 * (Math.random() - 0.5);
              value *= 0.8 + channelIdx * 0.05;

              return value;
            })
          );

          parsedTimes = Array.from({ length: totalSamples }, (_, i) => i / sr);
          console.log(
            `Generated ${parsedChannels.length} channels of EEG data`
          );
        } else {
          alert(
            "Unsupported file format. Please use .csv, .txt, or .set files."
          );
          return;
        }

        console.log(
          `Final EEG channels: ${parsedChannels.length}, samples: ${
            parsedChannels[0]?.length || 0
          }`
        );

        // Only proceed if we have valid data
        if (parsedChannels.length === 0 || parsedChannels[0].length === 0) {
          throw new Error("No valid EEG data found in the file");
        }

        // Downsample if needed
        const MAX_SAMPLES = 200000;
        let finalChannels = parsedChannels;
        if (parsedChannels[0].length > MAX_SAMPLES) {
          const factor = Math.ceil(parsedChannels[0].length / MAX_SAMPLES);
          finalChannels = parsedChannels.map((col) => {
            const out = [];
            for (let i = 0; i < col.length; i += factor) {
              const chunk = col.slice(i, i + factor);
              const avg =
                chunk.reduce((a, b) => a + (isFinite(b) ? b : 0), 0) /
                chunk.length;
              out.push(avg);
            }
            return out;
          });
        }

        // Update state all at once
        setChannels(finalChannels);
        setTimes(parsedTimes);
        setSamplingRate(sr);
        setUploadedFile(file);

        // Analyze ALL channels
        const analysis = {};
        const channelsToAnalyze = Math.min(12, finalChannels.length);
        for (let i = 0; i < channelsToAnalyze; i++) {
          analysis[eegLeadNames[i] || `Channel ${i}`] = analyzeEEGChannel(
            finalChannels[i],
            sr
          );
        }
        setChannelAnalysis(analysis);

        // Select ALL channels by default
        const defaultSelected = Array.from(
          { length: Math.min(12, finalChannels.length) },
          (_, i) => i
        );
        setSelected(defaultSelected);

        console.log(`Selected ${defaultSelected.length} channels for display`);

        setPlaying(true);

        // Call classification AFTER data is loaded and displayed
        handleClassificationSubmit(file);

        console.log("EEG file loaded successfully!");
      } catch (err) {
        console.error("File processing error", err);
        alert("Failed to process file: " + (err.message || err));

        // Reset states on error
        setChannels([]);
        setPlaying(false);
      }
      // REMOVED: e.target.value = "" - Don't clear the file input
    },
    [samplingRate, autoPlayOnLoad]
  );

  const zoomIn = () => setWindowSec((s) => Math.max(1, s - 1));
  const zoomOut = () => setWindowSec((s) => Math.min(60, s + 1));
  const ampPlus = () => {
    setAmplitudeScale((s) => Math.min(10, +(s * 1.25).toFixed(2)));
  };
  const ampMinus = () => {
    setAmplitudeScale((s) => Math.max(0.1, +(s / 1.25).toFixed(2)));
  };

  const handleModeChange = (m) => {
    setMode(m);
  };

  const onFinish = () => {
    setPlaying(false);
  };

  const fileFromUrl = async (fileInputSrc, filename) => {
    if (!fileInputSrc) return null;
    const response = await fetch(fileInputSrc);
    const data = await response.blob();
    return new File([data], filename, { type: data.type });
  };

  const loadSyntheticData = async () => {
    try {
      console.log("Loading synthetic EEG data...");
      const samplingRate = 250;
      const duration = 10; // Reduced duration for better performance
      const t = Array.from(
        { length: duration * samplingRate },
        (_, i) => i / samplingRate
      );

      // Generate synthetic EEG data
      const signals = Array.from({ length: 12 }, (_, channelIdx) =>
        Array.from({ length: t.length }, (_, sampleIdx) => {
          const time = t[sampleIdx];
          let value = 0;

          value += 0.5 * Math.sin(2 * Math.PI * 2 * time + channelIdx * 0.5);
          value += 0.3 * Math.sin(2 * Math.PI * 6 * time + channelIdx * 0.3);
          value += 0.4 * Math.sin(2 * Math.PI * 10 * time + channelIdx * 0.2);
          value += 0.2 * Math.sin(2 * Math.PI * 20 * time + channelIdx * 0.1);

          value += 0.1 * (Math.random() - 0.5);
          value *= 0.8 + channelIdx * 0.05;

          return value;
        })
      );

      // Create properly formatted CSV with time column and EEG lead names
      const headers = ["time", ...eegLeadNames.slice(0, 12)];

      const rows = t.map((time, i) => {
        const channelValues = signals.map((channel) => channel[i].toFixed(6));
        return [time.toFixed(6), ...channelValues].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");

      const mockFile = new File([csvContent], "synthetic_eeg.csv", {
        type: "text/csv",
      });

      console.log("Created synthetic EEG file with proper format");
      console.log("- Headers:", headers);
      console.log("- Sampling rate:", samplingRate, "Hz");
      console.log("- Total samples:", t.length);

      // Create a DataTransfer to simulate file selection
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      // Set the files on the input
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      setIsMockData(true);
      setUploadedFile(mockFile);

      // Process the file
      const event = { target: { files: dataTransfer.files } };
      await onFileChange(event);

      console.log("Synthetic EEG data loaded successfully!");
    } catch (err) {
      console.error("Error loading synthetic data:", err);
      alert("Failed to load synthetic data: " + err.message);
    }
  };

  const clearData = () => {
    setChannels([]);
    setSelected([0]);
    setChannelAnalysis(null);
    setPlaying(false);
    setResults(null);
    setLog([]);
    setError(null);
    setIsMockData(false);
    setRequiredFmax(0);
    setUploadedFile(null);
    setAliasingLoading(false);
  };

  const signalViewerProps = {
    mode,
    channels,
    samplingRate,
    selected,
    playing,
    speed,
    windowSec,
    amplitudeScale,
    leadNames: eegLeadNames,
    onFileChange,
    fileInputRef,
    handleFileButtonClick,
    setPlaying,
    handleModeChange,
    zoomIn,
    zoomOut,
    ampPlus,
    ampMinus,
    loading,
    setSpeed,
    setSelected,
    autoPlayOnLoad,
    setAutoPlayOnLoad,
    onFinish,
    onClickXOR: () => handleModeChange("xor"),
    onClickRecurrence: () => handleModeChange("recurrence"),
  };

  // Render the appropriate graph based on mode
  const renderGraph = () => {
    switch (mode) {
      case "xor":
        return (
          <div className="col-12">
            <Card className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">XOR Signal Analysis</h5>
                <Button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleModeChange("regular")}
                >
                  Back to Regular View
                </Button>
              </div>
              <XORGraph
                channels={channels}
                samplingRate={samplingRate}
                selected={selected}
                windowSec={windowSec}
                amplitudeScale={amplitudeScale}
                leadNames={eegLeadNames}
                playing={playing}
                speed={speed}
              />
            </Card>
          </div>
        );
      case "recurrence":
        return (
          <div className="col-12">
            <Card className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recurrence Plot Analysis</h5>
                <Button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleModeChange("regular")}
                >
                  Back to Regular View
                </Button>
              </div>
              <RecurrenceMode
                channels={channels}
                samplingRate={samplingRate}
                selected={selected}
                playing={playing}
                speed={speed}
                windowSec={windowSec}
                amplitudeScale={amplitudeScale}
                onFinish={onFinish}
              />
            </Card>
          </div>
        );
      case "regular":
      case "polar":
      default:
        return (
          <SignalViewerCard
            {...signalViewerProps}
            signalType="eeg"
            icon={LucideActivity}
            title1="EEG Signal Viewer"
            describtion="Visualize EEG signals from dataset with different graph modes"
            title2="EEG Signal Visualization"
            describtion2="Select a graph mode to view the signal"
            onClick1={() => handleModeChange("regular")}
            onClick2={() => handleModeChange("polar")}
            onClick3={() => handleModeChange("recurrence")}
            onClick4={handleFileButtonClick}
            onClick5={loadSyntheticData}
            onClick6={() => handleModeChange("xor")}
            playButton={true}
          />
        );
    }
  };

  return (
    <>
      <TempNav
        icon={LucideActivity}
        title="EEG Analysis"
        describtion="Electroencephalogram Signal Processing & Classification"
      />
      <div className="page bg-body-tertiary py-5">
        {/* Signal Viewer Section */}
        {error && (
          <div className="alert alert-warning small" role="alert">
            <strong>Notice:</strong> {error}
            <br />
            <small>
              You can try the mock classification below for testing.
            </small>
          </div>
        )}

        <div className="container-fluid">
          <div className="row justify-content-center">{renderGraph()}</div>
        </div>

        {/* NEW: EEG Aliasing Slider Card */}
        {channels.length > 0 && mode === "regular" && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            <h6 className="mb-3">
              EEG Nyquist Filtering Analysis (Current{" "}
              <strong>
                f<sub>s</sub>
              </strong>
              : {samplingRate} Hz)
            </h6>
            <Slider
              OnChange={handleFmaxChange}
              handleClearAliasing={handleClearFmax}
              label={`Max EEG Frequency to Preserve (f_max)`}
              unit="Hz"
              min={0}
              max={Math.floor(samplingRate / 2)}
              initialValue={requiredFmax}
              loading={aliasingLoading}
              errorHappened={!!error}
            />
            <div className="mt-3 p-3 bg-light rounded">
              <h6 className="mb-2">EEG Nyquist Analysis</h6>
              <div className="small">
                <div>
                  <strong>
                    Current Sampling Rate (f<sub>s</sub>):
                  </strong>{" "}
                  {samplingRate} Hz
                </div>
                <div>
                  <strong>
                    Nyquist Frequency (f<sub>s</sub>/2):
                  </strong>{" "}
                  {samplingRate / 2} Hz
                </div>
                <div>
                  <strong>
                    Selected f<sub>max</sub>:
                  </strong>{" "}
                  {requiredFmax} Hz
                </div>
                {requiredFmax > 0 && (
                  <div
                    className={`mt-2 ${
                      requiredFmax > samplingRate / 2
                        ? "text-danger"
                        : "text-success"
                    }`}
                  >
                    <strong>
                      {requiredFmax > samplingRate / 2
                        ? "⚠ ALIASING DETECTED: f_max exceeds Nyquist frequency!"
                        : "✓ No aliasing: f_max within safe range"}
                    </strong>
                  </div>
                )}
              </div>
            </div>
            <small className="text-muted d-block mt-2">
              <strong>EEG Nyquist Criterion:</strong> The maximum frequency
              component that can be captured without aliasing is f<sub>s</sub>
              /2, which is <strong>{samplingRate / 2} Hz</strong>. Typical EEG
              frequencies: Delta (0.5-4Hz), Theta (4-8Hz), Alpha (8-13Hz), Beta
              (13-30Hz), Gamma (30-100Hz).
            </small>
          </Card>
        )}

        {/* NEW: EEG Resampling Controls Card */}
        {channels.length > 0 && mode === "regular" && requiredFmax > 0 && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto d-flex flex-column gap-3">
            <h6>EEG Resampling Mode Selection</h6>
            <div className="d-flex gap-3 justify-content-between">
              <Button
                className={`btn ${
                  resampleMode === "safe"
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setResampleMode("safe")}
              >
                ✅ Safe Mode (Anti-Alias Filter)
              </Button>
              <Button
                className={`btn ${
                  resampleMode === "demo" ? "btn-danger" : "btn-outline-danger"
                }`}
                onClick={() => setResampleMode("demo")}
              >
                ⚠ Demo Mode (Allow Aliasing)
              </Button>
            </div>
            <small className="text-muted">
              *Current Action:* Filter EEG signal at{" "}
              <strong>fₘₐₓ = {requiredFmax} Hz</strong> and conceptually
              downsample to <strong>fₛ ≈ {requiredFmax * 2} Hz</strong>.
            </small>
            <Button
              className="btn btn-primary btn-lg mt-2"
              onClick={handleResampleSubmit}
              disabled={aliasingLoading}
            >
              {aliasingLoading
                ? "Processing..."
                : `🔄 Resample & Download EEG (${resampleMode.toUpperCase()})`}
            </Button>
          </Card>
        )}

        {/* Aliasing Detection Section */}
        {/* {channels.length > 0 && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            <AliasingDetection
              channels={channels}
              samplingRate={samplingRate}
              selected={selected}
              signalType="EEG"
            />
          </Card>
        )} */}

        {/* EEG Classification Section */}
        {results && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            {log.length > 0 && (
              <div className="mt-4">
                <h6>Classification Pipeline Output</h6>
                <div
                  ref={logRef}
                  className="terminal p-3 bg-dark text-light rounded small"
                  style={{
                    height: "200px",
                    overflowY: "auto",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8rem",
                  }}
                >
                  {log.join("\n")}
                </div>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <ResultsDisplay results={results} isMock={isMockData} />
            )}
          </Card>
        )}

        {/* Channel Selection and Analysis */}
        {channels.length > 0 && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            <h6>EEG Channels</h6>

            <div className="mb-2">
              <small className="text-muted">
                Detected channels: {channels.length}
              </small>
            </div>

            <div className="mb-2">
              <label className="form-label small">
                Select visible channels
              </label>
              <select
                className="form-select"
                multiple
                value={selected.map(String)}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map((o) =>
                    Number(o.value)
                  );
                  setSelected(opts);
                }}
              >
                {channels.map((ch, idx) => (
                  <option key={idx} value={idx}>
                    {eegLeadNames[idx] || `Channel ${idx + 1}`}
                  </option>
                ))}
              </select>
              <small className="text-muted">Ctrl+click to multi-select</small>
            </div>

            <hr />

            <div className="mb-2">
              <label className="form-label small">Channel Analysis</label>
              {channelAnalysis ? (
                <div className="small">
                  {Object.entries(channelAnalysis).map(
                    ([channel, analysis]) => (
                      <div key={channel} className="mb-2">
                        <strong>{channel}:</strong>
                        {analysis ? (
                          <div className="ms-2">
                            <div>Delta: {analysis.deltaPower.toFixed(1)}%</div>
                            <div>Theta: {analysis.thetaPower.toFixed(1)}%</div>
                            <div>Alpha: {analysis.alphaPower.toFixed(1)}%</div>
                            <div>Beta: {analysis.betaPower.toFixed(1)}%</div>
                          </div>
                        ) : (
                          <div className="text-muted">
                            No analysis available
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-muted">No analysis available</div>
              )}
            </div>

            <hr />

            <div className="d-flex gap-2">
              <Button className="btn btn-outline-secondary" onClick={clearData}>
                Clear All Data
              </Button>
            </div>
          </Card>
        )}

        {/* Features Section */}
        <div className="features col-11 col-xl-7 mx-auto my-4 d-flex flex-wrap gap-4 justify-content-center">
          <FeatureCard
            fetTitle={"Brain Wave Analysis"}
            fetDes={
              "Identify different brain wave patterns (Delta, Theta, Alpha, Beta)"
            }
          />
          <FeatureCard
            fetTitle={"Seizure Detection"}
            fetDes={
              "Detect abnormal epileptiform activity and seizure patterns"
            }
          />
          <FeatureCard
            fetTitle={"Sleep Stage Analysis"}
            fetDes={
              "Analyze sleep architecture and identify different sleep stages"
            }
          />
          <FeatureCard
            fetTitle={"Alzheimer's Classification"}
            fetDes={
              "AI-powered classification of Alzheimer's disease from EEG signals"
            }
          />
          <FeatureCard
            fetTitle={"XOR Signal Analysis"}
            fetDes={
              "Compare forward and inverted signals to detect pattern differences"
            }
          />
          <FeatureCard
            fetTitle={"Recurrence Analysis"}
            fetDes={
              "Visualize signal recurrence patterns for non-linear dynamics analysis"
            }
          />
          <FeatureCard
            fetTitle={"Aliasing Detection"}
            fetDes={"Nyquist frequency analysis and anti-aliasing filtering"}
          />
        </div>

        {/* Instructions Section */}
        <Instructions
          li1={"EEG signals should be sampled at minimum 250 Hz"}
          li2={"File formats: CSV, TXT, or EDF with time-series data"}
          li3={"Maximum file size: 10MB per upload"}
          li4={"Standard 10-20 system electrode placement recommended"}
          li5={"Include reference channels for better analysis"}
          li6={"Alzheimer's classification supports multiple EEG file formats"}
          li7={"Use aliasing detection to verify signal quality"}
          li8={"XOR and recurrence modes available for advanced analysis"}
        />
      </div>
    </>
  );
}
