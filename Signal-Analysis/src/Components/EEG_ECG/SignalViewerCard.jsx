import "../../../styles/eeg.css";
import RegularMode from "../../Components/ECG/Modes/RegularMode";
import PolarMode from "../../Components/ECG/Modes/PolarMode";
import RecurrenceMode from "../../Components/EEG/RecurrenceMode";
import XORGraph from "../../Components/EEG/XORGraph";
import {
  PauseFill,
  PlayFill,
  ArrowsAngleExpand,
  ArrowsAngleContract,
} from "react-bootstrap-icons";

export default function SignalViewerCard(props) {
  const {
    mode,
    channels,
    samplingRate,
    selected,
    playing,
    speed,
    loading,
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
    onFileChange,
  } = props;

  const IconComponent = props.icon;

  // Add debug handlers
  const handleClick1 = () => {
    console.log("Button 1 clicked - Regular Mode");
    if (onClick1) {
      onClick1();
    } else {
      console.error("onClick1 is not defined");
    }
  };

  const handleClick2 = () => {
    console.log("Button 2 clicked - Polar Graph");
    if (onClick2) {
      onClick2();
    } else {
      console.error("onClick2 is not defined");
    }
  };

  const handleClick3 = () => {
    console.log("Button 3 clicked - Recurrence Graph");
    if (onClick3) {
      onClick3();
    } else {
      console.error("onClick3 is not defined");
    }
  };

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

  const handleClick5 = () => {
    console.log("Button 5 clicked - Load Data");
    if (onClick5) {
      onClick5();
    } else {
      console.error("onClick5 is not defined");
    }
  };

  // EEG channel display like in the reference image
  const renderEEGChannels = () => {
    if (!channels || channels.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <IconComponent
            className={"mb-3"}
            style={{
              width: "55px",
              height: "55px",
              padding: "0px",
              color: "#ee2b2b6b",
            }}
          />
          <h5 style={{ color: "#232323ee" }}>No EEG Data Loaded</h5>
          <p style={{ color: "#999999" }}>
            Upload a file or load synthetic data to view EEG signals
          </p>
        </div>
      );
    }

    return (
      <div
        className="eeg-channels-container"
        style={{
          height: "800px",
          overflowY: "auto",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        {selected.map((channelIndex, displayIndex) => (
          <div
            key={channelIndex}
            className="eeg-channel-row"
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
              minHeight: "100px",
              padding: "0 10px",
              backgroundColor: displayIndex % 2 === 0 ? "#ffffff" : "#f8f9fa",
            }}
          >
            {/* Channel name and value - left side */}
            <div
              className="eeg-channel-info"
              style={{
                width: "150px",
                minWidth: "150px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "12px 15px",
                borderRight: "1px solid #e0e0e0",
              }}
            >
              <div
                className="channel-name"
                style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  color: "#333",
                }}
              >
                {leadNames[channelIndex] || `CH${channelIndex + 1}`}
              </div>
              <div
                className="channel-value"
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginTop: "4px",
                }}
              >
                {channels[channelIndex] && channels[channelIndex].length > 0
                  ? `${(channels[channelIndex][0] * 1000000).toFixed(2)} μV`
                  : "0.00 μV"}
              </div>
            </div>

            {/* Signal display - right side */}
            <div
              className="eeg-signal-display"
              style={{
                flex: 1,
                height: "80px",
                position: "relative",
                overflow: "hidden",
                margin: "10px 0",
              }}
            >
              <RegularMode
                channels={channels}
                samplingRate={samplingRate}
                selected={[channelIndex]}
                playing={playing}
                speed={speed}
                windowSec={windowSec}
                amplitudeScale={amplitudeScale}
                onFinish={onFinish}
                compact={true}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ECG channel display (original layout)
  const renderECGChannels = () => {
    return (
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
  };

  // Render Regular Mode Only
  const renderRegularMode = () => {
    return (
      <div className="mode-fade">
        {signalType === "eeg" ? renderEEGChannels() : renderECGChannels()}
      </div>
    );
  };

  // Render Polar Mode Only
  const renderPolarMode = () => {
    return (
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
  };

  // Render Recurrence Mode Only
  const renderRecurrenceMode = () => {
    return (
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
  };

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
      <div className="border col-10 col-xl-8 mx-auto mb-3 bg-light text-center p-6 rounded-4 signalViewer">
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
              <IconComponent
                className={"mb-3"}
                style={{
                  width: "55px",
                  height: "55px",
                  padding: "0px",
                  color: "#ee2b2b6b",
                }}
              />
              <h5 style={{ color: "#232323ee" }}>{props.title2}</h5>
              <p style={{ color: "#999999" }}>{props.describtion2}</p>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
            <div className="d-flex gap-2 align-items-center col-12 justify-content-around">
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary mx-2"
                  onClick={zoomIn}
                  disabled={loading}
                >
                  <ArrowsAngleContract />
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary mx-2"
                  onClick={zoomOut}
                  disabled={loading}
                >
                  <ArrowsAngleExpand />
                </button>
                <span className="text-muted small">
                  Time window: {windowSec}s
                </span>
              </div>
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary ms-3 mx-2"
                  onClick={ampMinus}
                  disabled={loading}
                >
                  -amp
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary mx-2"
                  onClick={ampPlus}
                  disabled={loading}
                >
                  +amp
                </button>
                <span className="text-muted small">Amp x{amplitudeScale}</span>
              </div>
            </div>
          </div>

          <div className="data my-3">
            <input
              type="file"
              className="btn p-2 rounded-3 mx-5 file"
              onChange={onFileChange}
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".csv,.txt,.edf,.dat, .set"
            />
            <button
              className="btn p-2 rounded-3 mx-5 file"
              onClick={handleClick4}
              disabled={loading}
            >
              Choose file
            </button>
            or
            <button
              className="btn p-2 rounded-3 mx-5 bg-body-tertiary fs-6 activity"
              onClick={handleClick5}
              disabled={loading}
            >
              Load some data
            </button>
          </div>

          {props.playButton && (
            <button
              className="btn sendData mx-3"
              style={{ backgroundColor: "#EE2B2B" }}
              onClick={() => setPlaying(!playing)}
              disabled={loading}
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
    </>
  );
}
