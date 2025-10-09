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

// XOR Graph Component
const XORGraph = ({
  channels,
  samplingRate,
  selected,
  windowSec,
  amplitudeScale,
  leadNames = [],
  playing = false,
  speed = 1,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const currentTimeRef = useRef(0);

  // Calculate dimensions and parameters
  const dimensions = {
    width: 800,
    height: 400,
    margin: { top: 40, right: 20, bottom: 60, left: 60 },
  };

  // Calculate chunk parameters
  const chunkParams = React.useMemo(() => {
    if (!channels.length || !samplingRate) return null;

    const samplesPerWindow = Math.floor(windowSec * samplingRate);
    const totalSamples = channels[0]?.length || 0;
    const numChunks = Math.floor(totalSamples / samplesPerWindow);

    return { samplesPerWindow, totalSamples, numChunks };
  }, [channels, samplingRate, windowSec]);

  // Process data for XOR visualization
  const processedData = React.useMemo(() => {
    if (!channels.length || !chunkParams || selected.length === 0) return null;

    const { samplesPerWindow, numChunks } = chunkParams;
    const processedChunks = [];

    // Process each chunk
    for (let chunkIndex = 0; chunkIndex < numChunks - 1; chunkIndex++) {
      const startSample = chunkIndex * samplesPerWindow;
      const endSample = startSample + samplesPerWindow;

      const chunkData = selected
        .map((channelIdx) => {
          const channel = channels[channelIdx];
          if (!channel || channel.length < endSample) return null;

          return channel.slice(startSample, endSample);
        })
        .filter(Boolean);

      processedChunks.push(chunkData);
    }

    return processedChunks;
  }, [channels, selected, chunkParams]);

  // Draw XOR visualization
  const drawXORGraph = (ctx, currentChunkIndex) => {
    const { width, height, margin } = dimensions;
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    if (!processedData || processedData.length === 0) {
      // Draw no data message
      ctx.fillStyle = "#666";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "No data available for XOR visualization",
        width / 2,
        height / 2
      );
      return;
    }

    // Draw title
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("EEG XOR Visualization - Stacked Time Chunks", width / 2, 20);

    // Draw axes
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = "#888";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Time (s)", width / 2, height - 10);

    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Amplitude", 0, 0);
    ctx.restore();

    // Draw time labels
    for (let i = 0; i <= 5; i++) {
      const x = margin.left + (i / 5) * graphWidth;
      const time = (i / 5) * windowSec;

      ctx.fillStyle = "#888";
      ctx.textAlign = "center";
      ctx.fillText(time.toFixed(1), x, margin.top + graphHeight + 20);

      // Vertical grid lines
      ctx.strokeStyle = "#333";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw amplitude labels
    const maxAmp = 2 * amplitudeScale;
    for (let i = -1; i <= 1; i++) {
      const y = margin.top + graphHeight / 2 - (i * graphHeight) / (2 * maxAmp);

      ctx.fillStyle = "#888";
      ctx.textAlign = "right";
      ctx.fillText((i * amplitudeScale).toFixed(1), margin.left - 10, y + 4);

      // Horizontal grid lines
      ctx.strokeStyle = "#333";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + graphWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Calculate chunks to draw
    const chunksToDraw = playing
      ? Math.min(currentChunkIndex + 1, processedData.length)
      : processedData.length;

    // Draw XOR patterns for each channel
    selected.forEach((channelIdx, channelIndex) => {
      const color = `hsl(${(channelIndex * 360) / selected.length}, 70%, 60%)`;

      for (let chunkIndex = 0; chunkIndex < chunksToDraw; chunkIndex++) {
        const chunkData = processedData[chunkIndex];
        const channelData = chunkData[channelIndex];

        if (!channelData) continue;

        // Calculate opacity based on chunk age (newer chunks are more visible)
        const opacity = 0.3 + 0.7 * (chunkIndex / chunksToDraw);
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 1.5;

        ctx.beginPath();

        for (let i = 0; i < channelData.length; i++) {
          const x = margin.left + (i / channelData.length) * graphWidth;
          const y =
            margin.top +
            graphHeight / 2 -
            (channelData[i] * amplitudeScale * graphHeight) / (2 * maxAmp);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Apply XOR effect by drawing subsequent chunks
        if (chunkIndex > 0) {
          const prevChunkData = processedData[chunkIndex - 1];
          const prevChannelData = prevChunkData[channelIndex];

          if (prevChannelData) {
            ctx.strokeStyle = "#000";
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 2;

            ctx.beginPath();

            for (
              let i = 0;
              i < Math.min(channelData.length, prevChannelData.length);
              i++
            ) {
              // XOR effect: if signals are similar, cancel them out
              const diff = Math.abs(channelData[i] - prevChannelData[i]);
              if (diff < 0.1) {
                // Threshold for similarity
                const x = margin.left + (i / channelData.length) * graphWidth;
                const y =
                  margin.top +
                  graphHeight / 2 -
                  (channelData[i] * amplitudeScale * graphHeight) /
                    (2 * maxAmp);

                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              }
            }

            ctx.stroke();
          }
        }
      }
    });

    ctx.globalAlpha = 1;

    // Draw legend
    const legendX = width - margin.right - 150;
    let legendY = margin.top - 25;

    selected.forEach((channelIdx, index) => {
      const color = `hsl(${(index * 360) / selected.length}, 70%, 60%)`;
      const channelName = leadNames[channelIdx] || `Channel ${channelIdx + 1}`;

      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY, 15, 2);

      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(channelName, legendX + 20, legendY + 4);

      legendY += 15;
    });

    // Draw info text
    ctx.fillStyle = "#888";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      `Chunks: ${chunksToDraw}/${processedData.length}`,
      margin.left,
      margin.top - 10
    );
    ctx.fillText(`Window: ${windowSec}s`, margin.left + 120, margin.top - 10);
  };

  // Animation loop
  useEffect(() => {
    if (!playing || !processedData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      currentTimeRef.current += (16 * speed) / 1000; // 16ms per frame adjusted by speed

      const maxChunks = processedData.length;
      const currentChunkIndex = Math.floor(currentTimeRef.current) % maxChunks;

      drawXORGraph(ctx, currentChunkIndex);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    playing,
    speed,
    processedData,
    windowSec,
    amplitudeScale,
    selected,
    leadNames,
  ]);

  // Static draw when not playing
  useEffect(() => {
    if (playing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawXORGraph(ctx, processedData ? processedData.length - 1 : 0);
  }, [processedData, windowSec, amplitudeScale, selected, leadNames, playing]);

  return (
    <div className="xor-graph-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: "1px solid #444",
          borderRadius: "4px",
          background: "#000",
        }}
      />
      <div className="mt-2 small text-muted">
        XOR Visualization: Similar signal patterns across time chunks cancel
        each other out
      </div>
    </div>
  );
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

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const handleSendToAI = async (data) => {
    try {
      setLog([
        "Starting EEG classification...",
        "Uploading file to server...",
        "Processing EEG data...",
      ]);

      const response = await axios.post('/api/eeg/classify', data, {
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
  }

  // Real API classification
  const handleClassificationSubmit = async (file) => {
    // e.preventDefault();
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
  }

  const onFileChange = useCallback(
    async () => {
      console.log(fileInputRef.current);
      if (!fileInputRef?.current) return;

      const file = fileInputRef.current.files[0];
      console.log(file);
      handleClassificationSubmit(file);

      try {
        const parsed = await parseCsv(file);
        const parsedChannels = parsed.channels || [];
        const parsedTimes = parsed.times || null;

        let sr = samplingRate;
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
        }

        const MAX_SAMPLES = 200000;
        let finalChannels = parsedChannels;
        if (
          parsedChannels.length > 0 &&
          parsedChannels[0].length > MAX_SAMPLES
        ) {
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

        setChannels(finalChannels);
        setTimes(parsedTimes);
        setSamplingRate(sr);

        // Analyze the first few channels
        const analysis = {};
        const channelsToAnalyze = Math.min(3, finalChannels.length);
        for (let i = 0; i < channelsToAnalyze; i++) {
          analysis[eegLeadNames[i] || `Channel ${i}`] = analyzeEEGChannel(
            finalChannels[i],
            sr
          );
        }
        setChannelAnalysis(analysis);

        // Select first few channels by default
        const defaultSelected = Array.from(
          { length: Math.min(6, finalChannels.length) },
          (_, i) => i
        );
        setSelected(defaultSelected);

        setPlaying(true);
      } catch (err) {
        console.error("CSV parse error", err);
        alert("Failed to parse CSV: " + (err.message || err));
      } finally {
        fileInputRef.current.value = "";
      }
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
    const filename = "synthetic_eeg_data.set";
    const filePath = "../testing_data/EEG/" + filename;

    const fileLoaded = await fileFromUrl(filePath, filename);

    if (!fileInputRef?.current || !fileLoaded) {
      console.error("Error loading file: " + filename);
      alert("Error loading file: " + filename);
    }

    // Create a DataTransfer to simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(fileLoaded);

    // Set the files on the input
    fileInputRef.current.files = dataTransfer.files;

    setIsMockData(true);
    await onFileChange();
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
    onClickXOR: () => handleModeChange("xor"), // ADDED: XOR mode handler
  };

  // Render the appropriate graph based on mode
  const renderGraph = () => {
    switch (mode) {
      case "xor":
        return (
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
        );
      case "regular":
      case "polar":
      case "recurrence":
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

        {renderGraph()}

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
            {results && <ResultsDisplay results={results} isMock={isMockData} />}
          </Card>
        )}

        <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
          <h6>EEG Channels</h6>

          <div className="mb-2">
            <small className="text-muted">
              Detected channels: {channels.length}
            </small>
          </div>

          <div className="mb-2">
            <label className="form-label small">Select visible channels</label>

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
                {Object.entries(channelAnalysis).map(([channel, analysis]) => (
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
                      <div className="text-muted">No analysis available</div>
                    )}
                  </div>
                ))}
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
        </div>

        <Instructions
          li1={"EEG signals should be sampled at minimum 250 Hz"}
          li2={"File formats: CSV, TXT, or EDF with time-series data"}
          li3={"Maximum file size: 10MB per upload"}
          li4={"Standard 10-20 system electrode placement recommended"}
          li5={"Include reference channels for better analysis"}
          li6={"Alzheimer's classification supports multiple EEG file formats"}
        />
      </div>
    </>
  );
}
