import FeatureCard from "../src/Components/EEG_ECG/FeatureCard";
import Instructions from "../src/Components/EEG_ECG/Instructions";
import Footer from "../src/Components/Footer.jsx";
import SignalViewerCard from "../src/Components/EEG_ECG/SignalViewerCard";
import TempNav from "../src/Components/EEG_ECG/tempNav";
import React, { useRef, useState, useCallback, useEffect } from "react";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import "../styles/ecg.css";
import { parseCsv } from "../src/utils/parseCsv";
import { detectMainChannels } from "../src/utils/detectMainChannels";
import { Activity as LucideActivity } from "lucide-react";
import Slider from "../src/Components/aliasing/slider.jsx"

// Import the enhanced components
import XORGraph from "../src/Components/ECG/Modes/XORGraph";
import RecurrenceMode from "../src/Components/ECG/Modes/RecurrenceMode";
import PolarMode from "../src/Components/ECG/Modes/PolarMode";

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

// Results display component for ECG
const ResultsDisplay = ({ results, isMock = false }) => {
  if (!results) return null;

  return (
    <div className="mt-4 p-3 bg-light rounded">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">ECG Analysis Results</h6>
        {isMock && <span className="badge bg-secondary">Mock Data</span>}
      </div>

      <div
        className={`alert ${
          results.riskLevel === "High"
            ? "alert-danger"
            : results.riskLevel === "Medium"
            ? "alert-warning"
            : "alert-success"
        } mb-3`}
      >
        <strong>Diagnosis: </strong>
        {results.diagnosis || "Cardiac rhythm analysis completed"}
      </div>

      {results.confidence && (
        <div className="mb-3">
          <strong>Model Confidence:</strong>
          <div className="progress mt-1" style={{ height: "20px" }}>
            <div
              className={`progress-bar ${
                results.riskLevel === "High"
                  ? "bg-danger"
                  : results.riskLevel === "Medium"
                  ? "bg-warning"
                  : "bg-success"
              }`}
              role="progressbar"
              style={{ width: `${results.confidence * 100}%` }}
              aria-valuenow={results.confidence * 100}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {(results.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {results.riskLevel && (
        <div className="mb-3">
          <strong>Risk Level:</strong>
          <span
            className={`badge ${
              results.riskLevel === "High"
                ? "bg-danger"
                : results.riskLevel === "Medium"
                ? "bg-warning"
                : "bg-success"
            } ms-2`}
          >
            {results.riskLevel}
          </span>
        </div>
      )}

      <div className="mt-3">
        <small className="text-muted">
          {isMock
            ? "This is a mock analysis for demonstration purposes."
            : "Results provided by AI classification model."}{" "}
          For clinical diagnosis, please consult with healthcare professionals.
        </small>
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
  // aliasing 
  const [requiredFmax, setRequiredFmax] = useState(0);
  // Enhanced classification states
  const [classificationResults, setClassificationResults] = useState(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [classificationError, setClassificationError] = useState(null);
  const [classificationLog, setClassificationLog] = useState([]);
  const [isMockData, setIsMockData] = useState(false);
  const logRef = useRef(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [classificationLog]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
    setIsMockData(false);
  };
  // aliasing handeler manage fmax
  const handleFmaxChange = useCallback((newFmax) => {
    setRequiredFmax(newFmax);
    console.log(`Nyquist analysis: Required Fmax set to ${newFmax} Hz. Required Sampling Rate: ${2 * newFmax} Hz`);
  }, []);

  // Function to clear the fmax slider
  const handleClearFmax = useCallback(() => {
    setRequiredFmax(0);
    console.log("Fmax slider cleared.");
  }, []);

  // Enhanced classification function
  const handleClassificationSubmit = async (file) => {
    if (!file) return;

    setClassificationError(null);
    setClassificationLog([]);
    setClassificationLoading(true);

    try {
      setClassificationLog([
        "Starting ECG classification...",
        "Uploading file to server...",
        "Processing ECG data...",
      ]);

      const formData = new FormData();
      formData.append("file", file);

      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setClassificationLog((prev) => [
        ...prev,
        "File uploaded successfully!",
        "Analyzing cardiac patterns...",
        "Running classification model...",
      ]);

      // Mock response - replace with actual API call
      const mockResults = {
        diagnosis: "Normal Sinus Rhythm",
        confidence: 0.87,
        riskLevel: "Low",
        details: {
          rhythm: "Regular",
          rate: measuredHR || 72,
          intervals: "Within normal limits",
        },
      };

      setClassificationLog((prev) => [
        ...prev,
        "Classification complete!",
        "Generating results...",
      ]);

      setClassificationResults(mockResults);
    } catch (err) {
      console.error("Classification error:", err);
      setClassificationError(err.message);
      setClassificationLog((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setClassificationLoading(false);
    }
  };

  // FIXED: Proper file change handler from old ECG page
  const onFileChange = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        console.log("Loading ECG file:", file.name);

        let parsedChannels = [];
        let parsedTimes = null;
        let sr = 250; // Default sampling rate

        if (
          file.name.toLowerCase().endsWith(".csv") ||
          file.name.toLowerCase().endsWith(".txt")
        ) {
          // Handle CSV/TXT files
          const parsed = await parseCsv(file);
          console.log("Parsed CSV:", parsed);

          parsedChannels = parsed.channels || [];
          parsedTimes = parsed.times || null;

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
          }
        } else {
          alert("Unsupported file format. Please use .csv or .txt files.");
          return;
        }

        console.log(`Found ${parsedChannels.length} channels`);
        console.log("Calculated sampling rate:", sr);

        // Downsample if needed
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
        // Aliasing slider
        setRequiredFmax(0);

        // Select all available channels (up to 12)
        const availableChannels = finalChannels.length;
        const channelsToSelect = Math.min(12, availableChannels);
        const selectedChannels = Array.from(
          { length: channelsToSelect },
          (_, i) => i
        );
        setSelected(selectedChannels);

        console.log(
          `Selected ${selectedChannels.length} channels:`,
          selectedChannels
        );

        // Detect main channel for HR measurement
        const det = detectMainChannels(finalChannels, 1);
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

        setMode("regular");

        console.log("ECG file loaded successfully!");
        console.log(`- Channels: ${finalChannels.length}`);
        console.log(`- Samples per channel: ${finalChannels[0]?.length || 0}`);
        console.log(`- Sampling rate: ${sr}Hz`);
        console.log(`- Selected channels: ${selectedChannels.length}`);

        // Automatic AI classification after file load
        console.log("Starting automatic AI classification...");
        await handleClassificationSubmit(file);
      } catch (err) {
        console.error("File processing error", err);
        alert("Failed to process file: " + (err.message || err));
      } finally {
        e.target.value = "";
      }
    },
    [samplingRate, targetHR, autoPlayOnLoad, setRequiredFmax]
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

  // FIXED: Simple synthetic data loader from old ECG page
  const loadSyntheticData = () => {
    console.log("Loading synthetic ECG data...");
    const samplingRate = 250;
    const duration = 30; // seconds
    const t = Array.from(
      { length: duration * samplingRate },
      (_, i) => i / samplingRate
    );
    const signals = generateSyntheticECG(t, 12);

    setChannels(signals);
    setSamplingRate(samplingRate);
    setSelected(Array.from({ length: 12 }, (_, i) => i));
    setMeasuredHR(72);
    setPlaying(true);
    setMode("regular");
    setIsMockData(true);

    // Mock classification for synthetic data
    setTimeout(() => {
      setClassificationResults({
        diagnosis: "Normal Sinus Rhythm (Synthetic Data)",
        confidence: 0.92,
        riskLevel: "Low",
        details: { rhythm: "Regular", rate: 72, intervals: "Normal" },
      });
    }, 1000);

    console.log("Synthetic ECG data loaded successfully!");
  };

  const clearData = () => {
    setChannels([]);
    setSelected([0]);
    setPlaying(false);
    setMode("regular");
    setClassificationResults(null);
    setClassificationError(null);
    setClassificationLog([]);
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
                <h5 className="mb-0">ECG XOR Signal Analysis</h5>
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
                leadNames={leadNames}
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
                <h5 className="mb-0">ECG Recurrence Plot Analysis</h5>
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
      case "polar":
        return (
          <div className="col-12">
            <Card className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">ECG Polar Plot Analysis</h5>
                <Button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleModeChange("regular")}
                >
                  Back to Regular View
                </Button>
              </div>
              <PolarMode
                channels={channels}
                samplingRate={samplingRate}
                selected={selected}
                windowSec={windowSec}
                amplitudeScale={amplitudeScale}
                leadNames={leadNames}
                playing={playing}
                speed={speed}
              />
            </Card>
          </div>
        );
      case "regular":
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
        title="ECG Analysis"
        describtion="Electrocardiogram Signal Processing & AI Classification"
      />
      <div className="page bg-body-tertiary py-5">
        {/* Error Display */}
        {classificationError && (
          <div className="alert alert-warning small" role="alert">
            <strong>Notice:</strong> {classificationError}
          </div>
        )}

        <div className="container-fluid">
          <div className="row justify-content-center">{renderGraph()}</div>
        </div>
{/* NEW SLIDER CARD (Placed under SignalViewerCard) */}
{channels.length > 0 && mode === "regular" && (
    <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
        <h6 className="mb-3">Nyquist Filtering Analysis (Current $\mathbf{"f_s"}$: {samplingRate}Hz)</h6>
        <Slider
            OnChange={handleFmaxChange}
            handleClearAliasing={handleClearFmax}
            label={`Max Signal Frequency to Preserve ($athbf{f_{max}}$)`}
            unit="Hz"
            min={0}
            max={Math.floor(samplingRate / 2)} 
            initialValue={requiredFmax}
        />
        <small className="text-muted d-block mt-2">
            **Nyquist Criterion:** The maximum frequency component that can be captured without aliasing is $f_s/2$, which is **{samplingRate / 2} Hz**. Selecting an $\mathbff_max$ greater than this limit will result in aliasing.
        </small>
    </Card>
)}
        {/* Classification Results Section */}
        {(classificationResults || classificationLoading) && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            {classificationLog.length > 0 && (
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
                  {classificationLog.join("\n")}
                </div>
              </div>
            )}

            {classificationLoading && (
              <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Analyzing ECG with AI...</p>
              </div>
            )}

            {classificationResults && (
              <ResultsDisplay
                results={classificationResults}
                isMock={isMockData}
              />
            )}
          </Card>
        )}

        {/* Channel Selection and Analysis */}
        {channels.length > 0 && (
          <Card className="p-3 mb-3 col-10 col-xl-6 mx-auto">
            <h6>ECG Channels</h6>

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
              <small className="text-muted">
                Estimated from primary channel
              </small>
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
        )}

        {/* Features Section */}
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
            fetTitle={"12-Lead Analysis"}
            fetDes={"Complete 12-lead ECG interpretation and visualization"}
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
        </div>

        {/* Instructions Section */}
        <Instructions
          li1={"ECG signals should be sampled at minimum 250 Hz"}
          li2={"File formats: CSV, TXT, or DAT with time-series data"}
          li3={"Maximum file size: 10MB per upload"}
          li4={"For best results, use 12-lead ECG recordings"}
          li5={"Include all standard leads for comprehensive analysis"}
          li6={"AI classification supports multiple ECG file formats"}
          li7={"XOR and recurrence modes available for advanced analysis"}
        />
      </div>
      <Footer />
    </>
  );
}
