import FeatureCard from "../src/Components/EEG_ECG/FeatureCard";
import Instructions from "../src/Components/EEG_ECG/Instructions";
import Footer from "../src/Components/Footer.jsx";
import SignalViewerCard from "../src/Components/EEG_ECG/SignalViewerCard";
import TempNav from "../src/Components/EEG_ECG/TempNav";
import ECGClassifierPanel from "../src/Components/EEG_ECG/ECGClassifierClient";
import React, { useRef, useState, useCallback, useEffect } from "react";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import "../styles/ecg.css";
import { parseCsv } from "../src/utils/parseCsv";
import { detectMainChannels } from "../src/utils/detectMainChannels";
import { Activity as LucideActivity } from "lucide-react";


function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function estimateHRFromChannel(channel, sr) {
  if (!channel || channel.length < Math.min(200, sr * 2)) return null;
  const data = channel.slice(-Math.min(channel.length, sr * 10));
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const sq = Math.sqrt(
    Math.max(
      0,
      data.reduce((a, b) => a + (b - mean) * (b - mean), 0) / data.length
    )
  );
  const threshold = mean + Math.max(0.25 * sq, 0.1 * Math.abs(mean));
  const peaks = [];
  const minGap = Math.floor(0.25 * sr);

  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] > minGap) {
        peaks.push(i);
      }
    }
  }
  if (peaks.length < 2) return null;
  const diffs = [];
  for (let i = 1; i < peaks.length; i++) diffs.push(peaks[i] - peaks[i - 1]);
  const medRR = median(diffs);
  if (medRR <= 0) return null;
  const hr = Math.round((60 * sr) / medRR);
  return hr;
}

function generateSyntheticECG(times, numChannels = 12) {
  const heartRate = 72;
  const period = 60 / heartRate;
  const signals = [];

  for (let ch = 0; ch < numChannels; ch++) {
    const signal = times.map((t) => {
      const phase = (t + ch * 0.015) % period;
      let value = 0;

      if (phase > 0.1 && phase < 0.2) {
        value += 0.15 * Math.sin((Math.PI * (phase - 0.1)) / 0.1);
      }

      if (phase > 0.2 && phase < 0.25) {
        value += -1.2 * Math.exp(-Math.pow((phase - 0.22) / 0.015, 2));
      }
      if (phase > 0.23 && phase < 0.27) {
        value += 2.5 * Math.exp(-Math.pow((phase - 0.24) / 0.01, 2));
      }
      if (phase > 0.25 && phase < 0.3) {
        value += -0.7 * Math.exp(-Math.pow((phase - 0.27) / 0.02, 2));
      }

      if (phase > 0.35 && phase < 0.5) {
        value += 0.35 * Math.sin((Math.PI * (phase - 0.35)) / 0.15);
      }

      value *= 1 + ch * 0.05;
      value += 0.02 * (Math.random() - 0.5);

      return value;
    });

    signals.push(signal);
  }

  return signals;
}

// Add XOR Graph Component for ECG
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

  // Simple XOR visualization for ECG
  const drawXORGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ECG XOR Visualization", width / 2, 30);

    if (!channels.length || !selected.length) {
      ctx.fillStyle = "#666";
      ctx.fillText("No ECG data available", width / 2, height / 2);
      return;
    }

    // Simple XOR visualization
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const samplesToShow = Math.min(500, channels[0]?.length || 0);

    for (let i = 0; i < samplesToShow; i++) {
      let xorValue = 0;

      // Calculate XOR between selected channels
      selected.forEach((channelIdx, idx) => {
        if (channels[channelIdx] && channels[channelIdx][i]) {
          xorValue ^= channels[channelIdx][i] * 1000; // Scale for visibility
        }
      });

      const x = (i / samplesToShow) * width;
      const y = height / 2 + xorValue * 0.1;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  // FIXED: Correct useEffect syntax
  useEffect(() => {
    drawXORGraph();
  }, [channels, selected, windowSec, amplitudeScale, playing]);

  return (
    <div className="xor-graph-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{
          border: "1px solid #444",
          borderRadius: "4px",
          background: "#000",
        }}
      />
      <div className="mt-2 small text-muted">
        ECG XOR Visualization: Shows XOR pattern between selected channels
      </div>
    </div>
  );
};

export default function ECG() {
  const fileInputRef = useRef(null);
  const leadNames = [
    "I",
    "II",
    "III",
    "aVR",
    "aVL",
    "aVF",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
  ];
  const [channels, setChannels] = useState([]);
  const [times, setTimes] = useState(null);
  const [samplingRate, setSamplingRate] = useState(250);
  const [selected, setSelected] = useState([0]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [windowSec, setWindowSec] = useState(5);
  const [amplitudeScale, setAmplitudeScale] = useState(1);
  const [mode, setMode] = useState("regular");
  const [measuredHR, setMeasuredHR] = useState(null);
  const [targetHR, setTargetHR] = useState("");
  const [autoPlayOnLoad, setAutoPlayOnLoad] = useState(true);

  // ADDED: Classification states
  const [classificationResults, setClassificationResults] = useState(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [classificationError, setClassificationError] = useState(null);
  const [classificationLog, setClassificationLog] = useState([]);

  const handleFileButtonClick = () => fileInputRef.current?.click();

  // ADDED: Classification function
  const handleClassificationSubmit = async (file) => {
    if (!file) return;

    setClassificationError(null);
    setClassificationLog([]);
    setClassificationLoading(true);

    try {
      setClassificationLog((prev) => [
        ...prev,
        "Starting ECG classification...",
      ]);

      const formData = new FormData();
      formData.append("file", file);

      setClassificationLog((prev) => [
        ...prev,
        "Uploading ECG data to AI model...",
      ]);

      // Replace with your actual ECG classification API endpoint
      const response = await fetch("/api/ecg/classify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const results = await response.json();
      setClassificationLog((prev) => [...prev, "Classification complete!"]);
      setClassificationResults(results);

      console.log("AI Classification Results:", results);
    } catch (err) {
      console.error("Classification error:", err);
      setClassificationError(err.message);
      setClassificationLog((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setClassificationLoading(false);
    }
  };

  const onFileChange = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        console.log("Loading ECG CSV file:", file.name);
        const parsed = await parseCsv(file);
        console.log("Parsed data:", parsed);

        const parsedChannels = parsed.channels || [];
        const parsedTimes = parsed.times || null;

        console.log(`Found ${parsedChannels.length} channels in CSV`);

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
        console.log("Calculated sampling rate:", sr);

        const MAX_SAMPLES = 200000;
        let finalChannels = parsedChannels;
        if (
          parsedChannels.length > 0 &&
          parsedChannels[0].length > MAX_SAMPLES
        ) {
          const factor = Math.ceil(parsedChannels[0].length / MAX_SAMPLES);
          console.log(`Downsampling by factor ${factor}`);
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

        // FIXED: Always select up to 12 channels for ECG
        const availableChannels = finalChannels.length;
        const channelsToSelect = Math.min(12, availableChannels);

        // If we have exactly 12 channels, select all 12
        // If we have fewer, select all available
        // If we have more, select first 12
        const selectedChannels = Array.from(
          { length: channelsToSelect },
          (_, i) => i
        );
        setSelected(selectedChannels);

        console.log(
          `Selected ${selectedChannels.length} channels:`,
          selectedChannels
        );

        // For ECG, still detect main channels for HR measurement
        const det = detectMainChannels(finalChannels, 1); // Just get primary channel for HR
        const primaryChannel =
          det.indices && det.indices.length > 0 ? det.indices[0] : 0;
        const hr = estimateHRFromChannel(finalChannels[primaryChannel], sr);
        setMeasuredHR(hr);
        console.log("Estimated HR:", hr);

        if (targetHR && hr) {
          const t = Number(targetHR);
          if (t > 0) {
            setSpeed(t / hr);
          }
        }

        if (autoPlayOnLoad) {
          setPlaying(true);
          console.log("Auto-playing signals");
        }

        // Make sure we're in regular mode for ECG display
        setMode("regular");

        console.log("ECG CSV file loaded successfully!");
        console.log(`- Channels: ${finalChannels.length}`);
        console.log(`- Samples per channel: ${finalChannels[0]?.length || 0}`);
        console.log(`- Sampling rate: ${sr}Hz`);
        console.log(`- Selected channels: ${selectedChannels.length}`);

        // ADDED: Automatic AI classification after file load
        console.log("Starting automatic AI classification...");
        await handleClassificationSubmit(file);
      } catch (err) {
        console.error("CSV parse error", err);
        alert(
          "Failed to parse CSV file. Please check the file format.\nError: " +
            (err.message || err)
        );
      } finally {
        e.target.value = "";
      }
    },
    [samplingRate, targetHR, autoPlayOnLoad]
  );

  const handleApplyTargetHR = () => {
    const t = Number(targetHR);
    if (!t || t <= 0 || !measuredHR) {
      alert(
        "Provide a valid target heart rate and make sure a file with measurable ECG is loaded."
      );
      return;
    }
    setSpeed(t / measuredHR);
  };

  const zoomIn = () => setWindowSec((s) => Math.max(1, s - 1));
  const zoomOut = () => setWindowSec((s) => Math.min(60, s + 1));
  const ampPlus = () => {
    setAmplitudeScale((s) => Math.min(10, +(s * 1.25).toFixed(2)));
  };
  const ampMinus = () => {
    setAmplitudeScale((s) => Math.max(0.1, +(s / 1.25).toFixed(2)));
  };

  const handleModeChange = (m) => {
    console.log("Changing mode to:", m);
    setMode(m);
  };

  const onFinish = () => {
    setPlaying(false);
  };

  const loadSyntheticData = () => {
    const samplingRate = 250;
    const t = Array.from(
      { length: 30 * samplingRate },
      (_, i) => i / samplingRate
    );
    const signals = generateSyntheticECG(t, 12);
    setChannels(signals);
    setSamplingRate(samplingRate);
    setSelected(Array.from({ length: 12 }, (_, i) => i));
    setMeasuredHR(72);
    setPlaying(true);
    setMode("regular"); // Explicitly set to regular mode when loading data
  };

  const clearData = () => {
    setChannels([]);
    setSelected([0]);
    setPlaying(false);
    setMode("regular");
    // ADDED: Clear classification results
    setClassificationResults(null);
    setClassificationError(null);
    setClassificationLog([]);
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
    measuredHR,
    leadNames,
    onFileChange,
    fileInputRef,
    handleFileButtonClick,
    setPlaying,
    handleModeChange,
    zoomIn,
    zoomOut,
    ampPlus,
    ampMinus,
    setSpeed,
    setSelected,
    targetHR,
    setTargetHR,
    handleApplyTargetHR,
    autoPlayOnLoad,
    setAutoPlayOnLoad,
    onFinish,
    onClickXOR: () => handleModeChange("xor"), // Add XOR handler
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
            leadNames={leadNames}
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
            signalType="ecg"
            icon={LucideActivity}
            title1="ECG Signal Viewer"
            describtion="Visualize ECG signals from dataset with different graph modes"
            title2="ECG Signal Visualization"
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
        title="ECG Analysis"
        describtion="Electrocardiogram Signal Processing"
      />
      <div className="page bg-body-tertiary py-5">
        {renderGraph()}

        {/* ADDED: Classification Results Display */}
        {classificationResults && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            <h6>AI Classification Results</h6>

            {classificationLog.length > 0 && (
              <div className="mb-3">
                <h6>Classification Process</h6>
                <div
                  className="terminal p-2 bg-dark text-light rounded small"
                  style={{
                    height: "100px",
                    overflowY: "auto",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8rem",
                  }}
                >
                  {classificationLog.join("\n")}
                </div>
              </div>
            )}

            <div className="alert alert-info">
              <strong>Diagnosis:</strong>{" "}
              {classificationResults.diagnosis || "Analysis complete"}
            </div>

            {classificationResults.confidence && (
              <div className="mb-2">
                <strong>Confidence:</strong>{" "}
                {(classificationResults.confidence * 100).toFixed(1)}%
                <div className="progress mt-1">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${classificationResults.confidence * 100}%`,
                    }}
                  >
                    {(classificationResults.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {classificationResults.riskLevel && (
              <div className="mb-2">
                <strong>Risk Level:</strong>
                <span
                  className={`badge ${
                    classificationResults.riskLevel === "High"
                      ? "bg-danger"
                      : classificationResults.riskLevel === "Medium"
                      ? "bg-warning"
                      : "bg-success"
                  } ms-2`}
                >
                  {classificationResults.riskLevel}
                </span>
              </div>
            )}

            {classificationError && (
              <div className="alert alert-danger">
                <strong>Classification Error:</strong> {classificationError}
              </div>
            )}
          </Card>
        )}

        {classificationLoading && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0">Analyzing ECG with AI...</p>
            </div>
          </Card>
        )}

        <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
          <h6>Channels</h6>

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
                  {leadNames[idx] || `Channel ${idx + 1}`}
                </option>
              ))}
            </select>
            <small className="text-muted">Ctrl+click to multi-select</small>
          </div>

          <hr />

          <div className="mb-2">
            <label className="form-label small">Measured HR (estimate)</label>
            <div>
              <strong>{measuredHR ? `${measuredHR} BPM` : "—"}</strong>
            </div>
            <small className="text-muted">Estimated from primary channel</small>
          </div>

          <div className="mb-2">
            <label className="form-label small">Target HR (BPM)</label>
            <input
              type="number"
              className="form-control"
              value={targetHR}
              onChange={(e) => setTargetHR(e.target.value)}
            />
            <div className="d-flex gap-2 mt-2">
              <Button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleApplyTargetHR}
              >
                Apply HR
              </Button>
              <Button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setTargetHR("");
                  setSpeed(1);
                }}
              >
                Reset
              </Button>
            </div>
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
            fetTitle={"Arrhythmia Detection"}
            fetDes={
              "Identify irregular heart rhythms and abnormal cardiac patterns"
            }
          />
          <FeatureCard
            fetTitle={"Heart Rate Analysis"}
            fetDes={"Comprehensive heart rate variability and rhythm analysis"}
          />
          <FeatureCard
            fetTitle={"Risk Assessment"}
            fetDes={
              "AI-powered cardiovascular risk evaluation and recommendations"
            }
          />
          <FeatureCard
            fetTitle={"Real-time Processing"}
            fetDes={"Instant signal processing and diagnostic feedback"}
          />
        </div>

        <Instructions
          li1={"ECG signals should be sampled at minimum 250 Hz"}
          li2={"File formats: CSV, TXT, or DAT with time-series data"}
          li4={"For best results, use 12-lead ECG recordings"}
        />
      </div>
      <Footer />
    </>
  );
}
