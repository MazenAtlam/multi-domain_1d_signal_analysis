// import React, { useRef, useState, useCallback } from "react";
// import { Link } from "react-router-dom";
// import Card from "../src/Components/ui/card";
// import Button from "../src/Components/ui/button";
// import Footer from "../src/Components/Footer";
// import {
//   ArrowLeft,
//   Upload,
//   Activity,
//   ExclamationCircle,
//   CheckCircleFill,
//   PauseFill,
//   PlayFill,
//   ArrowsAngleExpand,
//   ArrowsAngleContract,
// } from "react-bootstrap-icons";
// import "../styles/ecg.css";

// import RegularMode from "../src/Components/ECG/Modes/RegularMode";
// import PolarMode from "../src/Components/ECG/Modes/PolarMode";
// import { parseCsvFile } from "../src/utils/parseCsv";
// import { detectMainChannels } from "../src/utils/detectMainChannels";

// function median(arr) {
//   if (!arr || arr.length === 0) return 0;
//   const s = [...arr].sort((a, b) => a - b);
//   const mid = Math.floor(s.length / 2);
//   return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
// }

// function estimateHRFromChannel(channel, sr) {
//   // Simple peak detector for an estimate — works for reasonably clean ECG
//   if (!channel || channel.length < Math.min(200, sr * 2)) return null;
//   const data = channel.slice(-Math.min(channel.length, sr * 10)); // last 10s or less
//   const mean = data.reduce((a, b) => a + b, 0) / data.length;
//   const sq = Math.sqrt(
//     Math.max(
//       0,
//       data.reduce((a, b) => a + (b - mean) * (b - mean), 0) / data.length
//     )
//   );
//   const threshold = mean + Math.max(0.25 * sq, 0.1 * Math.abs(mean));
//   const peaks = [];
//   const minGap = Math.floor(0.25 * sr); // 250 ms refractory

//   for (let i = 1; i < data.length - 1; i++) {
//     if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
//       if (peaks.length === 0 || i - peaks[peaks.length - 1] > minGap) {
//         peaks.push(i);
//       }
//     }
//   }
//   if (peaks.length < 2) return null;
//   const diffs = [];
//   for (let i = 1; i < peaks.length; i++) diffs.push(peaks[i] - peaks[i - 1]);
//   const medRR = median(diffs);
//   if (medRR <= 0) return null;
//   const hr = Math.round((60 * sr) / medRR);
//   return hr;
// }

// function generateSyntheticECG(times, numChannels = 12) {
//   const heartRate = 72; // bpm
//   const period = 60 / heartRate; // طول beat بالثواني
//   const signals = [];

//   for (let ch = 0; ch < numChannels; ch++) {
//     const signal = times.map((t) => {
//       // اختلاف بسيط في كل قناة علشان تحاكي leads مختلفة
//       const phase = (t + ch * 0.015) % period;
//       let value = 0;

//       // P wave
//       if (phase > 0.1 && phase < 0.2) {
//         value += 0.15 * Math.sin((Math.PI * (phase - 0.1)) / 0.1);
//       }

//       // QRS complex
//       if (phase > 0.2 && phase < 0.25) {
//         value += -1.2 * Math.exp(-Math.pow((phase - 0.22) / 0.015, 2));
//       }
//       if (phase > 0.23 && phase < 0.27) {
//         value += 2.5 * Math.exp(-Math.pow((phase - 0.24) / 0.01, 2));
//       }
//       if (phase > 0.25 && phase < 0.3) {
//         value += -0.7 * Math.exp(-Math.pow((phase - 0.27) / 0.02, 2));
//       }

//       // T wave
//       if (phase > 0.35 && phase < 0.5) {
//         value += 0.35 * Math.sin((Math.PI * (phase - 0.35)) / 0.15);
//       }

//       // اختلاف amplitude بسيط بين القنوات
//       value *= 1 + ch * 0.05;

//       // Noise
//       value += 0.02 * (Math.random() - 0.5);

//       return value;
//     });

//     signals.push(signal);
//   }

//   return signals;
// }

// const ECG = () => {
//   const fileInputRef = useRef(null);
//   const leadNames = [
//     "I",
//     "II",
//     "III",
//     "aVR",
//     "aVL",
//     "aVF",
//     "V1",
//     "V2",
//     "V3",
//     "V4",
//     "V5",
//     "V6",
//   ];

//   // Shared state for all modes
//   const [channels, setChannels] = useState([]); // array of arrays
//   const [times, setTimes] = useState(null);
//   const [samplingRate, setSamplingRate] = useState(250);
//   const [selected, setSelected] = useState([0]);
//   const [playing, setPlaying] = useState(false);
//   const [speed, setSpeed] = useState(1);
//   const [windowSec, setWindowSec] = useState(5);
//   const [amplitudeScale, setAmplitudeScale] = useState(1);
//   const [mode, setMode] = useState("regular");
//   const [measuredHR, setMeasuredHR] = useState(null);
//   const [targetHR, setTargetHR] = useState("");
//   const [autoPlayOnLoad, setAutoPlayOnLoad] = useState(true);

//   const handleFileButtonClick = () => fileInputRef.current.click();

//   const onFileChange = useCallback(
//     async (e) => {
//       const file = e.target.files && e.target.files[0];
//       if (!file) return;
//       try {
//         const parsed = await parseCsvFile(file);
//         const parsedChannels = parsed.channels || [];
//         const parsedTimes = parsed.times || null;

//         // Estimate sampling rate if `times` is present:
//         let sr = samplingRate;
//         if (parsedTimes && parsedTimes.length > 2) {
//           const diffs = [];
//           for (let i = 1; i < parsedTimes.length; i++)
//             diffs.push(Math.abs(parsedTimes[i] - parsedTimes[i - 1]));
//           const md = median(diffs);
//           if (md > 0) {
//             // guard: times might be seconds or milliseconds
//             if (md > 1) {
//               // likely ms
//               sr = Math.round(1000 / md);
//             } else {
//               // likely seconds
//               sr = Math.round(1 / md);
//             }
//             if (!isFinite(sr) || sr <= 0) sr = 250;
//           }
//         }

//         // If file has many samples, consider downsampling for display performance
//         const MAX_SAMPLES = 200000;
//         let finalChannels = parsedChannels;
//         if (
//           parsedChannels.length > 0 &&
//           parsedChannels[0].length > MAX_SAMPLES
//         ) {
//           // do naive downsample by averaging groups
//           const factor = Math.ceil(parsedChannels[0].length / MAX_SAMPLES);
//           finalChannels = parsedChannels.map((col) => {
//             const out = [];
//             for (let i = 0; i < col.length; i += factor) {
//               const chunk = col.slice(i, i + factor);
//               const avg =
//                 chunk.reduce((a, b) => a + (isFinite(b) ? b : 0), 0) /
//                 chunk.length;
//               out.push(avg);
//             }
//             return out;
//           });
//           // times if exists - create coarse times
//         }

//         setChannels(finalChannels);
//         setTimes(parsedTimes);
//         setSamplingRate(sr);

//         // choose top channels
//         const det = detectMainChannels(finalChannels, 3);
//         if (det.indices && det.indices.length > 0) setSelected(det.indices);

//         // quick HR estimation
//         const primary =
//           finalChannels[
//             det.indices && det.indices.length > 0 ? det.indices[0] : 0
//           ];
//         const hr = estimateHRFromChannel(primary, sr);
//         setMeasuredHR(hr);

//         // if user set a target HR, compute speed to reach that (optional)
//         if (targetHR && hr) {
//           const t = Number(targetHR);
//           if (t > 0) {
//             setSpeed(t / hr);
//           }
//         }

//         // optionally auto play
//         if (autoPlayOnLoad) setPlaying(true);
//       } catch (err) {
//         console.error("CSV parse error", err);
//         alert("Failed to parse CSV: " + (err.message || err));
//       } finally {
//         // reset file input so same file can be reloaded
//         e.target.value = "";
//       }
//     },
//     [samplingRate, targetHR, autoPlayOnLoad]
//   );

//   const handleApplyTargetHR = () => {
//     const t = Number(targetHR);
//     if (!t || t <= 0 || !measuredHR) {
//       alert(
//         "Provide a valid target heart rate and make sure a file with measurable ECG is loaded."
//       );
//       return;
//     }
//     // speed scales playback so that measuredHR * speed == targetHR
//     setSpeed(t / measuredHR);
//   };

//   const zoomIn = () => setWindowSec((s) => Math.max(1, s - 1));
//   const zoomOut = () => setWindowSec((s) => Math.min(60, s + 1));
//   const ampPlus = () =>
//     setAmplitudeScale((s) => Math.min(10, +(s * 1.25).toFixed(2)));
//   const ampMinus = () =>
//     setAmplitudeScale((s) => Math.max(0.1, +(s / 1.25).toFixed(2)));

//   const handleModeChange = (m) => {
//     setMode(m);
//     // optional: add CSS fade classes to mode container for smooth transition
//   };

//   // onFinish callback from RegularMode
//   const onFinish = () => {
//     setPlaying(false);
//   };

//   return (
//     <div className="d-flex flex-column min-vh-100">
//       {/* Header */}
//       <div className="border-bottom bg-light">
//         <div className="container py-3 d-flex justify-content-between align-items-center">
//           <div className="d-flex align-items-center gap-3">
//             <Link to="/" className="text-decoration-none">
//               <Button className="btn btn-outline-secondary d-flex align-items-center gap-2">
//                 <ArrowLeft size={16} />
//                 Back to Home
//               </Button>
//             </Link>
//             <div className="d-flex align-items-center gap-2">
//               <div className="bg-light rounded p-2">
//                 <Activity size={24} className="text-danger" />
//               </div>
//               <div>
//                 <h1 className="h4 mb-0">ECG Analysis</h1>
//                 <p className="text-muted mb-0">
//                   Electrocardiogram Signal Processing
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Quick controls */}
//           <div className="d-flex align-items-center gap-2">
//             <input
//               type="file"
//               accept=".csv,.txt,.dat"
//               ref={fileInputRef}
//               style={{ display: "none" }}
//               onChange={onFileChange}
//             />
//             <Button className="btn btn-primary" onClick={handleFileButtonClick}>
//               <Upload size={16} /> Upload ECG File
//             </Button>

//             <Button
//               className={`btn ${
//                 playing ? "btn-outline-secondary" : "btn-danger"
//               }`}
//               onClick={() => setPlaying((p) => !p)}
//             >
//               {playing ? (
//                 <>
//                   <PauseFill /> Pause
//                 </>
//               ) : (
//                 <>
//                   <PlayFill /> Play
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="container flex-grow-1 py-4">
//         <div className="row">
//           <div className="col-lg-8">
//             <Card className="p-3 mb-3">
//               <div className="d-flex justify-content-between align-items-center">
//                 <div>
//                   <h5 className="mb-1">Signal Viewer — {mode}</h5>
//                   <small className="text-muted">
//                     Sampling: {samplingRate}Hz | Window: {windowSec}s | Speed:{" "}
//                     {speed.toFixed(2)}x
//                   </small>
//                 </div>

//                 <div className="d-flex gap-2">
//                   <Button
//                     className="btn btn-outline-secondary"
//                     onClick={() => handleModeChange("regular")}
//                   >
//                     Regular
//                   </Button>
//                   <Button
//                     className="btn btn-outline-secondary"
//                     onClick={() => handleModeChange("polar")}
//                   >
//                     Polar
//                   </Button>
//                   <Button
//                     className="btn btn-outline-secondary"
//                     onClick={() => handleModeChange("recurrence")}
//                   >
//                     Recurrence
//                   </Button>
//                 </div>
//               </div>

//               <div style={{ height: 360 }} className="mt-3 position-relative">
//                 {mode === "regular" ? <div
//                   className={`mode-fade`}
//                 >
//                   <div
//                     className="d-flex flex-column gap-3"
//                     style={{ maxHeight: "360px", overflowY: "auto" }}
//                   >
//                     {selected.map((idx) => (
//                       <div key={idx} style={{ height: "200px" }}>
//                         <h6 className="text-center text-muted mb-1">
//                           {leadNames[idx] || `Channel ${idx + 1}`}
//                         </h6>
//                         <RegularMode
//                           channels={channels}
//                           samplingRate={samplingRate}
//                           selected={[idx]} // نمرر قناة واحدة هنا
//                           playing={playing}
//                           speed={speed}
//                           windowSec={windowSec}
//                           amplitudeScale={amplitudeScale}
//                           onFinish={onFinish}
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 </div>: <div
//                   className={`mode-fade `}
//                   style={{ display: mode === "polar" ? "block" : "none" }}
//                 >
//                   <PolarMode
//                     channels={channels}
//                     samplingRate={samplingRate}
//                     selected={selected}
//                     playing={playing}
//                     speed={speed}
//                     windowSec={windowSec}
//                     amplitudeScale={amplitudeScale}
//                   />
//                 </div>}
//               </div>

//               {/* Controls under the viewer */}
//               <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
//                 <div className="d-flex gap-2 align-items-center">
//                   <Button
//                     className="btn btn-sm btn-outline-secondary"
//                     onClick={zoomIn}
//                   >
//                     <ArrowsAngleContract />
//                   </Button>
//                   <Button
//                     className="btn btn-sm btn-outline-secondary"
//                     onClick={zoomOut}
//                   >
//                     <ArrowsAngleExpand />
//                   </Button>
//                   <span className="text-muted small">
//                     Time window: {windowSec}s
//                   </span>

//                   <Button
//                     className="btn btn-sm btn-outline-secondary ms-3"
//                     onClick={ampMinus}
//                   >
//                     -amp
//                   </Button>
//                   <Button
//                     className="btn btn-sm btn-outline-secondary"
//                     onClick={ampPlus}
//                   >
//                     +amp
//                   </Button>
//                   <span className="text-muted small">
//                     Amp x{amplitudeScale}
//                   </span>
//                 </div>

//                 <div className="d-flex align-items-center gap-2">
//                   <label className="small text-muted mb-0">Speed</label>
//                   <input
//                     type="range"
//                     min="0.1"
//                     max="4"
//                     step="0.05"
//                     value={speed}
//                     onChange={(e) => setSpeed(Number(e.target.value))}
//                   />
//                 </div>
//               </div>
//             </Card>

//             {/* Features */}
//             <div className="row g-4 mb-5">
//               {[
//                 {
//                   title: "Arrhythmia Detection",
//                   desc: "Identify irregular heart rhythms and abnormal cardiac patterns",
//                 },
//                 {
//                   title: "Heart Rate Analysis",
//                   desc: "Comprehensive heart rate variability and rhythm analysis",
//                 },
//                 {
//                   title: "Risk Assessment",
//                   desc: "AI-powered cardiovascular risk evaluation and recommendations",
//                 },
//                 {
//                   title: "Real-time Processing",
//                   desc: "Instant signal processing and diagnostic feedback",
//                 },
//               ].map((f, i) => (
//                 <div className="col-md-6" key={i}>
//                   <Card className="p-3 feature-card">
//                     <div className="d-flex gap-3 align-items-start">
//                       <CheckCircleFill className="feature-icon" />
//                       <div>
//                         <h5 className="mb-2">{f.title}</h5>
//                         <p className="text-muted mb-0">{f.desc}</p>
//                       </div>
//                     </div>
//                   </Card>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Right column: data requirements + HR and channel picks */}
//           <div className="col-lg-4">
//             <Card className="p-4 bg-light mb-3">
//               <div className="d-flex gap-3">
//                 <ExclamationCircle
//                   size={20}
//                   className="text-warning flex-shrink-0"
//                 />
//                 <div>
//                   <h5>Data Requirements</h5>
//                   <ul className="mb-0 text-muted">
//                     <li>ECG signals sampled at minimum 250 Hz recommended</li>
//                     <li>
//                       File formats: CSV, TXT, or DAT (time-series columns)
//                     </li>
//                     <li>
//                       Maximum file size: 10MB per upload (front-end limit)
//                     </li>
//                     <li>For best results, use 12-lead ECG recordings</li>
//                   </ul>
//                 </div>
//               </div>
//             </Card>

//             <Card className="p-3 mb-3">
//               <h6>Channels</h6>
//               <div className="mb-2">
//                 <small className="text-muted">
//                   Detected channels: {channels.length}
//                 </small>
//               </div>

//               <div className="mb-2">
//                 <label className="form-label small">
//                   Select visible channels
//                 </label>
//                 <select
//                   className="form-select"
//                   multiple
//                   value={selected.map(String)}
//                   onChange={(e) => {
//                     const opts = Array.from(e.target.selectedOptions).map((o) =>
//                       Number(o.value)
//                     );
//                     setSelected(opts);
//                   }}
//                 >
//                   {channels.map((ch, idx) => (
//                     <option key={idx} value={idx}>
//                       {leadNames[idx] || `Channel ${idx + 1}`}
//                     </option>
//                   ))}
//                 </select>
//                 <small className="text-muted">Ctrl+click to multi-select</small>
//               </div>

//               <hr />

//               <div className="mb-2">
//                 <label className="form-label small">
//                   Measured HR (estimate)
//                 </label>
//                 <div>
//                   <strong>{measuredHR ? `${measuredHR} BPM` : "—"}</strong>
//                 </div>
//                 <small className="text-muted">
//                   Estimated from primary channel
//                 </small>
//               </div>

//               <div className="mb-2">
//                 <label className="form-label small">Target HR (BPM)</label>
//                 <input
//                   type="number"
//                   className="form-control"
//                   value={targetHR}
//                   onChange={(e) => setTargetHR(e.target.value)}
//                 />
//                 <div className="d-flex gap-2 mt-2">
//                   <Button
//                     className="btn btn-sm btn-outline-secondary"
//                     onClick={handleApplyTargetHR}
//                   >
//                     Apply HR
//                   </Button>
//                   <Button
//                     className="btn btn-sm btn-outline-secondary"
//                     onClick={() => {
//                       setTargetHR("");
//                       setSpeed(1);
//                     }}
//                   >
//                     Reset
//                   </Button>
//                 </div>
//               </div>

//               <hr />
//               <div className="form-check mb-2">
//                 <input
//                   className="form-check-input"
//                   type="checkbox"
//                   id="autoPlay"
//                   checked={autoPlayOnLoad}
//                   onChange={(e) => setAutoPlayOnLoad(e.target.checked)}
//                 />
//                 <label className="form-check-label small" htmlFor="autoPlay">
//                   Auto play when file loads
//                 </label>
//               </div>
//             </Card>

//             <Card className="p-3">
//               <h6>Quick actions</h6>
//               <div className="d-flex gap-2">
//                 <Button
//                   className="btn btn-outline-secondary"
//                   onClick={() => {
//                     const samplingRate = 250;
//                     const t = Array.from(
//                       { length: 10 * samplingRate },
//                       (_, i) => i / samplingRate
//                     ); // 10 ثواني
//                     const signals = generateSyntheticECG(t, 12); // 12 leads

//                     setChannels(signals);
//                     setSamplingRate(samplingRate);
//                     setSelected(Array.from({ length: 12 }, (_, i) => i)); // كل القنوات
//                     setMeasuredHR(72);
//                     setPlaying(true); // autoplay
//                   }}
//                 >
//                   Load Some Data
//                 </Button>

//                 <Button
//                   className="btn btn-outline-secondary"
//                   onClick={() => {
//                     setChannels([]);
//                     setSelected([0]);
//                     setPlaying(false);
//                   }}
//                 >
//                   Clear
//                 </Button>
//               </div>
//             </Card>
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default ECG;

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

export default function EEG() {
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

        const det = detectMainChannels(finalChannels, 3);
        if (det.indices && det.indices.length > 0) setSelected(det.indices);

        const primary =
          finalChannels[
            det.indices && det.indices.length > 0 ? det.indices[0] : 0
          ];
        const hr = estimateHRFromChannel(primary, sr);
        setMeasuredHR(hr);

        if (targetHR && hr) {
          const t = Number(targetHR);
          if (t > 0) {
            setSpeed(t / hr);
          }
        }

        if (autoPlayOnLoad) setPlaying(true);
      } catch (err) {
        console.error("CSV parse error", err);
        alert("Failed to parse CSV: " + (err.message || err));
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
  };

  const clearData = () => {
    setChannels([]);
    setSelected([0]);
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
  };

  return (
    <>
      <TempNav
        icon={LucideActivity}
        title="ECG Analysis"
        describtion="Electrocardiogram Signal Processing"
      />
      <div className="page bg-body-tertiary py-5">
        <SignalViewerCard
          icon={LucideActivity}
          title1={"ECG Signal Viewer"}
          describtion={
            "Visualize ECG signals from dataset with different graph modes"
          }
          title2={"ECG Signal Visualization"}
          describtion2={"Select a graph mode to view the signal"}
          {...signalViewerProps}
          onClick1={() => handleModeChange("regular")}
          onClick2={() => handleModeChange("polar")}
          onClick3={() => handleModeChange("recurrence")}
          onClick4={handleFileButtonClick}
          onClick5={loadSyntheticData}
          playButton={true}
        />

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
              Clear Data
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
          li3={"Maximum file size: 10MB per upload"}
          li4={"For best results, use 12-lead ECG recordings"}
        />
      </div>
    </>
  );
}
