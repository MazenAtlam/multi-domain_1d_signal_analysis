import FeatureCard from "../src/Components/EEG_ECG/FeatureCard";
import Instructions from "../src/Components/EEG_ECG/Instructions";
import SignalViewerCard from "../src/Components/EEG_ECG/SignalViewerCard";
import TempNav from "../src/Components/EEG_ECG/tempNav";
import React, { useRef, useState, useCallback } from "react";
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

function generateSyntheticEEG(times, numChannels = 19) {
  const signals = [];

  for (let ch = 0; ch < numChannels; ch++) {
    const signal = times.map((t) => {
      // Generate EEG-like signals with different frequency components
      let value = 0;

      // Alpha waves (8-13 Hz)
      value += 0.3 * Math.sin(2 * Math.PI * 10 * t + ch * 0.1);

      // Beta waves (13-30 Hz)
      value += 0.2 * Math.sin(2 * Math.PI * 20 * t + ch * 0.2);

      // Theta waves (4-7 Hz)
      value += 0.15 * Math.sin(2 * Math.PI * 6 * t + ch * 0.05);

      // Delta waves (0.5-4 Hz)
      value += 0.1 * Math.sin(2 * Math.PI * 2 * t + ch * 0.15);

      // Add some random noise (EEG artifacts)
      value += 0.05 * (Math.random() - 0.5);

      // Scale based on channel position (frontal channels typically have higher amplitude)
      if (ch < 2) value *= 1.5; // Fp1, Fp2
      else if (ch < 6) value *= 1.2; // F3, F4, C3, C4

      return value;
    });

    signals.push(signal);
  }

  return signals;
}

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

  const handleFileButtonClick = () => fileInputRef.current?.click();

  const onFileChange = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
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

        if (autoPlayOnLoad) setPlaying(true);
      } catch (err) {
        console.error("CSV parse error", err);
        alert("Failed to parse CSV: " + (err.message || err));
      } finally {
        e.target.value = "";
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

  const loadSyntheticData = () => {
    const samplingRate = 250;
    const t = Array.from(
      { length: 30 * samplingRate },
      (_, i) => i / samplingRate
    );
    const signals = generateSyntheticEEG(t, 19);
    setChannels(signals);
    setSamplingRate(samplingRate);
    setSelected(
      Array.from({ length: Math.min(6, signals.length) }, (_, i) => i)
    );

    // Analyze synthetic data
    const analysis = {};
    for (let i = 0; i < Math.min(3, signals.length); i++) {
      analysis[eegLeadNames[i]] = analyzeEEGChannel(signals[i], samplingRate);
    }
    setChannelAnalysis(analysis);

    setPlaying(true);
  };

  const clearData = () => {
    setChannels([]);
    setSelected([0]);
    setChannelAnalysis(null);
    setPlaying(false);
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
    setSpeed,
    setSelected,
    autoPlayOnLoad,
    setAutoPlayOnLoad,
    onFinish,
  };

  return (
    <>
      <TempNav
        icon={LucideActivity}
        title="EEG Analysis"
        describtion="Electroencephalogram Signal Processing"
      />
      <div className="page bg-body-tertiary py-5">
        <SignalViewerCard
          icon={LucideActivity}
          title1={"EEG Signal Viewer"}
          describtion={
            "Visualize EEG signals from dataset with different graph modes"
          }
          title2={"EEG Signal Visualization"}
          describtion2={"Select a graph mode to view the signal"}
          {...signalViewerProps}
          signalType="eeg"
          onClick1={() => handleModeChange("regular")}
          onClick2={() => handleModeChange("polar")}
          onClick3={() => handleModeChange("recurrence")}
          onClick4={handleFileButtonClick}
          onClick5={loadSyntheticData}
          playButton={true}
        />

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
              Clear Data
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
            fetTitle={"Real-time Monitoring"}
            fetDes={"Continuous EEG monitoring with instant feedback"}
          />
        </div>

        <Instructions
          li1={"EEG signals should be sampled at minimum 250 Hz"}
          li2={"File formats: CSV, TXT, or EDF with time-series data"}
          li3={"Maximum file size: 10MB per upload"}
          li4={"Standard 10-20 system electrode placement recommended"}
          li5={"Include reference channels for better analysis"}
        />
      </div>
    </>
  );
}
