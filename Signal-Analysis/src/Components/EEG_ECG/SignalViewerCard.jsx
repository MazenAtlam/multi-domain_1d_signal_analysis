// import "../../../styles/eeg.css";
// import RegularMode from "../../Components/ECG/Modes/RegularMode";
// import PolarMode from "../../Components/ECG/Modes/PolarMode";
// import RecurrenceMode from "../../Components/EEG/RecurrenceMode";
// import ReverseMode from "../../Components/ECG/Modes/ReverseMode";
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

// export default function SignalViewerCard(props) {
//   const {
//     mode,
//     channels,
//     samplingRate,
//     selected,
//     playing,
//     speed,
//     windowSec,
//     amplitudeScale,
//     setPlaying,
//     leadNames,
//     onFinish,
//     zoomIn,
//     zoomOut,
//     ampPlus,
//     ampMinus,
//     signalType = "ecg",
//     onClick1,
//     onClick2,
//     onClick3,
//     onClick4,
//     onClick5,
//     fileInputRef,
//     onFileChange,
//   } = props;

//   const IconComponent = props.icon;

//   // Add debug handlers
//   // New function for file upload
//   const handleChooseFile = () => {
//     if (fileInputRef && fileInputRef.current) {
//       fileInputRef.current.click();
//     } else {
//       console.error("fileInputRef is not defined");
//     }
//   };
//   const handleClick1 = () => {
//     console.log("Button 1 clicked - Regular Mode");
//     if (onClick1) {
//       onClick1();
//     } else {
//       console.error("onClick1 is not defined");
//     }
//   };

//   const handleClick2 = () => {
//     console.log("Button 2 clicked - Reverse Mode");
//     if (onClick2) {
//       onClick2();
//     } else {
//       console.error("onClick2 is not defined");
//     }
//   };

//   const handleClick3 = () => {
//     console.log("Button 3 clicked - Polar Graph");
//     if (onClick3) {
//       onClick3();
//     } else {
//       console.error("onClick3 is not defined");
//     }
//   };

//   const handleClick4 = () => {
//     console.log("Button 4 clicked - Recurrence Graph");
//     if (onClick4) {
//       onClick4();
//     } else {
//       console.error("onClick4 is not defined");
//     }
//   };

//   const handleClick5 = () => {
//     console.log("Button 5 clicked - Load Data");
//     if (onClick5) {
//       onClick5();
//     } else {
//       console.error("onClick5 is not defined");
//     }
//   };


//   // EEG channel display like in the reference image
//   const renderEEGChannels = () => {
//     if (!channels || channels.length === 0) {
//       return (
//         <div className="text-center text-muted py-5">
//           <IconComponent
//             className={"mb-3"}
//             style={{
//               width: "55px",
//               height: "55px",
//               padding: "0px",
//               color: "#ee2b2b6b",
//             }}
//           />
//           <h5 style={{ color: "#232323ee" }}>No EEG Data Loaded</h5>
//           <p style={{ color: "#999999" }}>
//             Upload a file or load synthetic data to view EEG signals
//           </p>
//         </div>
//       );
//     }

//     return (
//       <div
//         className="eeg-channels-container"
//         style={{
//           height: "800px",
//           overflowY: "auto",
//           border: "1px solid #e0e0e0",
//           borderRadius: "8px",
//           backgroundColor: "#fafafa",
//         }}
//       >
//         {selected.map((channelIndex, displayIndex) => (
//           <div
//             key={channelIndex}
//             className="eeg-channel-row"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               borderBottom: "1px solid #e0e0e0",
//               minHeight: "100px",
//               padding: "0 10px",
//               backgroundColor: displayIndex % 2 === 0 ? "#ffffff" : "#f8f9fa",
//             }}
//           >
//             {/* Channel name and value - left side */}
//             <div
//               className="eeg-channel-info"
//               style={{
//                 width: "150px",
//                 minWidth: "150px",
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "flex-start",
//                 justifyContent: "center",
//                 padding: "12px 15px",
//                 borderRight: "1px solid #e0e0e0",
//               }}
//             >
//               <div
//                 className="channel-name"
//                 style={{
//                   fontWeight: "bold",
//                   fontSize: "16px",
//                   color: "#333",
//                 }}
//               >
//                 {leadNames[channelIndex] || `CH${channelIndex + 1}`}
//               </div>
//               <div
//                 className="channel-value"
//                 style={{
//                   fontSize: "14px",
//                   color: "#666",
//                   marginTop: "4px",
//                 }}
//               >
//                 {channels[channelIndex] && channels[channelIndex].length > 0
//                   ? `${(channels[channelIndex][0] * 1000000).toFixed(2)} μV`
//                   : "0.00 μV"}
//               </div>
//             </div>

//             {/* Signal display - right side */}
//             <div
//               className="eeg-signal-display"
//               style={{
//                 flex: 1,
//                 height: "80px",
//                 position: "relative",
//                 overflow: "hidden",
//                 margin: "10px 0",
//               }}
//             >
//               <RegularMode
//                 channels={channels}
//                 samplingRate={samplingRate}
//                 selected={[channelIndex]}
//                 playing={playing}
//                 speed={speed}
//                 windowSec={windowSec}
//                 amplitudeScale={amplitudeScale}
//                 onFinish={onFinish}
//                 compact={true}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // ECG channel display (original layout)
//   const renderECGChannels = () => {
//     return (
//       <div className={`mode-fade`}>
//         <div
//           className="d-flex flex-column gap-5"
//           style={{ maxHeight: "450px", overflowY: "auto" }}
//         >
//           {selected.map((idx) => (
//             <div key={idx} style={{ height: "350px" }}>
//               <h6 className="text-center text-muted mb-1">
//                 {leadNames[idx] || `Channel ${idx + 1}`}
//               </h6>
//               <RegularMode
//                 channels={channels}
//                 samplingRate={samplingRate}
//                 selected={[idx]}
//                 playing={playing}
//                 speed={speed}
//                 windowSec={windowSec}
//                 amplitudeScale={amplitudeScale}
//                 onFinish={onFinish}
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Render Regular Mode Only
//   const renderRegularMode = () => {
//     return (
//       <div className="mode-fade">
//         {signalType === "eeg" ? renderEEGChannels() : renderECGChannels()}
//       </div>
//     );
//   };

//   // Render Reverse Mode Only
//   const renderReverseMode = () => {
//     return (
//       <div className="mode-fade">
//         <h6 className="text-center text-muted mb-3">Reverse Plot</h6>
//         <ReverseMode
//           channels={channels}
//           samplingRate={samplingRate}
//           selected={selected}
//           playing={playing}
//           speed={speed}
//           windowSec={windowSec}
//           amplitudeScale={amplitudeScale}
//         />
//       </div>
//     );
//   };

//   // Render Polar Mode Only
//   const renderPolarMode = () => {
//     return (
//       <div className="mode-fade">
//         <h6 className="text-center text-muted mb-3">Polar Plot</h6>
//         <PolarMode
//           channels={channels}
//           samplingRate={samplingRate}
//           selected={selected}
//           playing={playing}
//           speed={speed}
//           windowSec={windowSec}
//           amplitudeScale={amplitudeScale}
//         />
//       </div>
//     );
//   };

//   // Render Recurrence Mode Only
//   const renderRecurrenceMode = () => {
//     return (
//       <div className="mode-fade">
//         <h6 className="text-center text-muted mb-3">
//           Recurrence Plot Analysis
//         </h6>
//         <RecurrenceMode
//           channels={channels}
//           samplingRate={samplingRate}
//           selected={selected}
//           playing={playing}
//           speed={speed}
//           windowSec={windowSec}
//           amplitudeScale={amplitudeScale}
//         />
//       </div>
//     );
//   };

//   return (
//     <>
//       <div className="border col-10 col-xl-8 mx-auto bg-light text-center py-3 rounded-4 signalViewer">
//         <IconComponent
//           className={`mb-3 rounded-circle ${
//             props.icon.render?.displayName || ""
//           }`}
//           style={{
//             width: "47px",
//             height: "47px",
//             padding: "8px",
//             marginBottom: "10px",
//           }}
//         />
//         <h3>{props.title1}</h3>
//         <p style={{ color: "#656565ff" }} className="col-sm-12 col-8 mx-auto">
//           {props.describtion}
//         </p>
//         <div className="modes d-flex justify-content-center flex-wrap gap-2">
//           <div
//             className="btn bg-body-tertiary mx-3 border rounded-4"
//             onClick={handleClick1}
//           >
//             <IconComponent
//               style={{
//                 width: "27px",
//                 height: "27px",
//                 padding: "4px",
//                 marginRight: "5px",
//               }}
//             />
//             Standard Mode
//           </div>
//           <div
//             className="btn bg-body-tertiary mx-3 border rounded-4"
//             onClick={handleClick2}
//           >
//             Reverse Mode
//           </div>
//           <div
//             className="btn bg-body-tertiary mx-3 border rounded-4"
//             onClick={handleClick3}
//           >
//             Polar Graph
//           </div>
//           <div
//             className="btn bg-body-tertiary mx-3 border rounded-4"
//             onClick={handleClick4}
//           >
//             Recurrence Graph
//           </div>
//           {/* Removed extra Choose File button from modes bar */}
//         </div>
//         <div className="view col-12 col-xl-12 mx-auto mt-4 py-5 rounded-3">
//           {mode === "regular" ? (
//             renderRegularMode()
//           ) : mode === "polar" ? (
//             renderPolarMode()
//           ) : mode === "reverse" ? (
//             renderReverseMode()
//           ) : mode === "recurrence" ? (
//             renderRecurrenceMode()
//           ) : (
//             <div className="text-center text-muted py-5">
//               <IconComponent
//                 className={"mb-3"}
//                 style={{
//                   width: "55px",
//                   height: "55px",
//                   padding: "0px",
//                   color: "#ee2b2b6b",
//                 }}
//               />
//               <h5 style={{ color: "#232323ee" }}>{props.title2}</h5>
//               <p style={{ color: "#999999" }}>{props.describtion2}</p>
//             </div>
//           )}

//           <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
//             <div className="d-flex gap-2 align-items-center col-12 justify-content-around">
//               <div>
//                 <button
//                   className="btn btn-sm btn-outline-secondary mx-2"
//                   onClick={zoomIn}
//                 >
//                   <ArrowsAngleContract />
//                 </button>
//                 <button
//                   className="btn btn-sm btn-outline-secondary mx-2"
//                   onClick={zoomOut}
//                 >
//                   <ArrowsAngleExpand />
//                 </button>
//                 <span className="text-muted small">
//                   Time window: {windowSec}s
//                 </span>
//               </div>
//               <div>
//                 <button
//                   className="btn btn-sm btn-outline-secondary ms-3 mx-2"
//                   onClick={ampMinus}
//                 >
//                   -amp
//                 </button>
//                 <button
//                   className="btn btn-sm btn-outline-secondary mx-2"
//                   onClick={ampPlus}
//                 >
//                   +amp
//                 </button>
//                 <span className="text-muted small">Amp x{amplitudeScale}</span>
//               </div>
//             </div>
//           </div>

//           <div className="data my-3">
//             <input
//               type="file"
//               className="btn p-2 rounded-3 mx-5 file"
//               onChange={onFileChange}
//               ref={fileInputRef}
//               style={{ display: "none" }}
//               accept=".csv,.txt,.edf,.dat"
//             />
//             <button
//               className="btn p-2 rounded-3 mx-5 file"
//               onClick={handleChooseFile}
//             >
//               Choose file
//             </button>
//             or
//             <button
//               className="btn p-2 rounded-3 mx-5 bg-body-tertiary fs-6 activity"
//               onClick={handleClick5}
//             >
//               Load some data
//             </button>
//           </div>

//           <button
//             className="btn sendData"
//             style={{ backgroundColor: "#EE2B2B" }}
//           >
//             Send to AI model for Analysis
//           </button>
//           {props.playButton && (
//             <button
//               className="btn sendData mx-3"
//               style={{ backgroundColor: "#EE2B2B" }}
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
//             </button>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

import "../../../styles/eeg.css";
import RegularMode from "../../Components/ECG/Modes/RegularMode";
import PolarMode from "../../Components/ECG/Modes/PolarMode";
import RecurrenceMode from "../../Components/EEG/RecurrenceMode";
import ReverseMode from "../../Components/ECG/Modes/ReverseMode";
import XORGraph from "../../Components/EEG/XORGraph";
import {
  PauseFill,
  PlayFill,
  ArrowsAngleExpand,
  ArrowsAngleContract,
} from "react-bootstrap-icons";
import React, { useState } from "react";

export default function SignalViewerCard(props) {
  const {
    mode,
    channels,
    samplingRate,
    selected,
    playing,
    speed,
    windowSec,
    amplitudeScale,
    setPlaying,
    leadNames,
    onFinish,
    zoomIn,
    zoomOut,
    ampPlus,
    ampMinus,
    signalType = "ecg",
    onClick1,
    onClick2,
    onClick3,
    onClick4,
    onClick5,
    onClickXOR,
    fileInputRef,
  } = props;

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const IconComponent = props.icon;

  // ✅ New: upload directly to AI model when file chosen
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("useEnsemble", "true");
      formData.append("modelType", "main");
      formData.append("threshold", "0.5");

      const response = await fetch(
        "https://fleshier-alvin-appealingly.ngrok-free.dev/api/ecg/classify",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }

      const result = await response.json();
      setAiResult(result);
      console.log("AI model response:", result);
    } catch (err) {
      console.error("Error uploading to AI model:", err);
      setAiResult({ error: err.message });
    } finally {
      setAiLoading(false);
  const handleClickXOR = () => {
    console.log("XOR Mode button clicked");
    if (onClickXOR) {
      onClickXOR();
    } else {
      console.error("onClickXOR is not defined");
    }
  };

  const handleClick4 = () => {
    console.log("Button 4 clicked - Choose File");
    if (onClick4) {
      onClick4(); // This calls handleFileButtonClick from parent
    } else {
      console.error("onClick4 is not defined");
    }
  };

  // Trigger file input
  const handleChooseFile = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  const renderRegularMode = () => (
    <div className="mode-fade">
      {signalType === "eeg" ? renderEEGChannels() : renderECGChannels()}
    </div>
  );

  const renderECGChannels = () => (
    <div className={`mode-fade`}>
      <div
        className="d-flex flex-column gap-5"
        style={{ maxHeight: "450px", overflowY: "auto" }}
      >
        {selected.map((idx) => (
          <div key={idx} style={{ height: "350px" }}>
            <h6 className="text-center text-muted mb-1">
              {leadNames[idx] || `Channel ${idx + 1}`}
            </h6>
            <RegularMode
              channels={channels}
              samplingRate={samplingRate}
              selected={[idx]}
              playing={playing}
              speed={speed}
              windowSec={windowSec}
              amplitudeScale={amplitudeScale}
              onFinish={onFinish}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderReverseMode = () => (
    <div className="mode-fade">
      <h6 className="text-center text-muted mb-3">Reverse Plot</h6>
      <ReverseMode
        channels={channels}
        samplingRate={samplingRate}
        selected={selected}
        playing={playing}
        speed={speed}
        windowSec={windowSec}
        amplitudeScale={amplitudeScale}
      />
    </div>
  );

  const renderPolarMode = () => (
    <div className="mode-fade">
      <h6 className="text-center text-muted mb-3">Polar Plot</h6>
      <PolarMode
        channels={channels}
        samplingRate={samplingRate}
        selected={selected}
        playing={playing}
        speed={speed}
        windowSec={windowSec}
        amplitudeScale={amplitudeScale}
      />
    </div>
  );

  const renderRecurrenceMode = () => (
    <div className="mode-fade">
      <h6 className="text-center text-muted mb-3">
        Recurrence Plot Analysis
      </h6>
      <RecurrenceMode
        channels={channels}
        samplingRate={samplingRate}
        selected={selected}
        playing={playing}
        speed={speed}
        windowSec={windowSec}
        amplitudeScale={amplitudeScale}
      />
    </div>
  );

  return (
    <div className="border col-10 col-xl-8 mx-auto bg-light text-center py-3 rounded-4 signalViewer">
      <IconComponent
        className="mb-3 rounded-circle"
        style={{
          width: "47px",
          height: "47px",
          padding: "8px",
          marginBottom: "10px",
        }}
      />
      <h3>{props.title1}</h3>
      <p style={{ color: "#656565ff" }} className="col-sm-12 col-8 mx-auto">
        {props.describtion}
      </p>

      {/* Mode buttons */}
      <div className="modes d-flex justify-content-center flex-wrap gap-2 mb-3">
        <button className="btn bg-body-tertiary border rounded-4" onClick={onClick1}>
          Standard Mode
        </button>
        <button className="btn bg-body-tertiary border rounded-4" onClick={onClick2}>
          Reverse Mode
        </button>
        <button className="btn bg-body-tertiary border rounded-4" onClick={onClick3}>
          Polar Graph
        </button>
        <button className="btn bg-body-tertiary border rounded-4" onClick={onClick4}>
          Recurrence Graph
        </button>
      </div>

      {/* Main viewer */}
      <div className="view col-12 mx-auto mt-4 py-4 rounded-3">
        {mode === "regular"
          ? renderRegularMode()
          : mode === "polar"
          ? renderPolarMode()
          : mode === "reverse"
          ? renderReverseMode()
          : mode === "recurrence"
          ? renderRecurrenceMode()
          : (
  // Render XOR Mode Only
  const renderXORMode = () => {
    return (
      <div className="mode-fade">
        <h6 className="text-center text-muted mb-3">
          XOR Pattern Visualization
        </h6>
        <XORGraph
          channels={channels}
          samplingRate={samplingRate}
          selected={selected}
          playing={playing}
          speed={speed}
          windowSec={windowSec}
          amplitudeScale={amplitudeScale}
          leadNames={leadNames}
        />
      </div>
    );
  };

  return (
    <>
      <div className="border col-10 col-xl-8 mx-auto bg-light text-center py-3 rounded-4 signalViewer">
        <IconComponent
          className="mb-3 rounded-circle"
          style={{
            width: "47px",
            height: "47px",
            padding: "8px",
            marginBottom: "10px",
          }}
        />
        <h3>{props.title1}</h3>
        <p style={{ color: "#656565ff" }} className="col-sm-12 col-8 mx-auto">
          {props.describtion}
        </p>
        <div className="modes d-flex justify-content-center flex-wrap gap-2">
          <div
            className="btn bg-body-tertiary mx-3 border rounded-4"
            onClick={handleClick1}
          >
            <IconComponent
              style={{
                width: "27px",
                height: "27px",
                padding: "4px",
                marginRight: "5px",
              }}
            />
            Standard Mode
          </div>
          <div
            className="btn bg-body-tertiary mx-3 border rounded-4"
            onClick={handleClick2}
          >
            Polar Graph
          </div>
          <div
            className="btn bg-body-tertiary mx-3 border rounded-4"
            onClick={handleClick3}
          >
            Recurrence Graph
          </div>
          <div
            className="btn bg-body-tertiary mx-3 border rounded-4"
            onClick={handleClickXOR}
          >
            XOR Graph
          </div>
        </div>
        <div className="view col-12 col-xl-12 mx-auto mt-4 py-5 rounded-3">
          {mode === "regular" ? (
            renderRegularMode()
          ) : mode === "polar" ? (
            renderPolarMode()
          ) : mode === "recurrence" ? (
            renderRecurrenceMode()
          ) : mode === "xor" ? (
            renderXORMode()
          ) : (
            <div className="text-center text-muted py-5">
              <h5>No ECG Data Loaded</h5>
              <p>Upload a file to view and analyze ECG signals.</p>
            </div>
          )}

        {/* Zoom and amp controls */}
        <div className="d-flex justify-content-around align-items-center gap-3 mt-4">
          <div>
            <button className="btn btn-sm btn-outline-secondary mx-2" onClick={zoomIn}>
              <ArrowsAngleContract />
            </button>
            <button className="btn btn-sm btn-outline-secondary mx-2" onClick={zoomOut}>
              <ArrowsAngleExpand />
            </button>
            <span className="text-muted small">Time window: {windowSec}s</span>
          </div>
          <div>
            <button className="btn btn-sm btn-outline-secondary mx-2" onClick={ampMinus}>
              -amp
            </button>
            <button className="btn btn-sm btn-outline-secondary mx-2" onClick={ampPlus}>
              +amp
            </button>
            <span className="text-muted small">Amp x{amplitudeScale}</span>
          </div>
        </div>

        {/* File input */}
        <div className="data my-4">
          <input
            type="file"
            className="btn p-2 rounded-3 mx-5 file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".csv,.txt,.edf,.dat"
          />
          <button className="btn p-2 rounded-3 mx-5 file" onClick={handleChooseFile}>
            Choose file
          </button>
          or
          <button
            className="btn p-2 rounded-3 mx-5 bg-body-tertiary fs-6 activity"
            onClick={onClick5}
          >
            Load some data
          </button>
        </div>

        {/* 🔍 AI Analysis Result */}
        {aiLoading && (
          <div className="text-center mt-3 text-muted">
            <div className="spinner-border spinner-border-sm me-2"></div>
            Analyzing ECG with AI model...
          </div>
        )}

        {aiResult && (
          <div className="mt-4 p-3 bg-white border rounded">
            {aiResult.error ? (
              <div className="alert alert-danger">{aiResult.error}</div>
            ) : aiResult.result ? (
              <>
                <h6>
                  Diagnosis:{" "}
                  {aiResult.result.summary.is_normal
                    ? "✅ Normal"
                    : "⚠️ Abnormalities Detected"}
                </h6>
                <p>
                  Total abnormalities:{" "}
                  {aiResult.result.summary.total_detected}
                  {aiResult.result.summary.confidence &&
                    ` (Confidence: ${aiResult.result.summary.confidence})`}
                </p>
              </>
            ) : (
              <div className="text-muted">No results received from model.</div>
            )}
          </div>
        )}

        {/* Play/Pause */}
        {props.playButton && (
          <button
            className="btn btn-danger mt-4"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? (
              <>
                <PauseFill /> Pause
              </>
            ) : (
              <>
                <PlayFill /> Play
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
