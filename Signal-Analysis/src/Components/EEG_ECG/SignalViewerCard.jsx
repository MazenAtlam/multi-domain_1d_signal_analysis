import "../../../styles/eeg.css";
import RegularMode from "../../Components/ECG/Modes/RegularMode";
import PolarMode from "../../Components/ECG/Modes/PolarMode";
import {
  ArrowLeft,
  Upload,
  Activity,
  ExclamationCircle,
  CheckCircleFill,
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
    windowSec,
    amplitudeScale,
    setPlaying,
    leadNames,
    onFinish,
  } = props;

  const IconComponent = props.icon;

  return (
    <>
      <div className="border col-10 col-xl-6 mx-auto bg-light text-center py-3 rounded-4 signalViewer">
        <IconComponent
          className={`mb-3 rounded-circle ${props.icon.render.displayName}`}
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
            onClick={props.onClick1}
          >
            <IconComponent
              style={{
                width: "27px",
                height: "27px",
                padding: "4px",
                marginRight: "5px",
              }}
            />
            Regular Mode
          </div>
          <div
            className="btn bg-body-tertiary mx-3 border rounded-4"
            onClick={props.onClick2}
          >
            Polar Graph
          </div>
          <div
            className="btn bg-body-tertiary mx-3 border rounded-4"
            onClick={props.onClick3}
          >
            Recurrence Graph
          </div>
        </div>
        <div className="view col-10 col-xl-10 mx-auto mt-4 py-5 rounded-3">
          {mode === "regular" ? (
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
          ) : mode === "polar" ? (
            <div className={`mode-fade`}>
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
          ) : (
            <div>
              <IconComponent
                className={"mb-3 mt-3 "}
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
        </div>
        <div className="data my-3">
          <button
            className="btn p-2 rounded-3 mx-5 file"
            onClick={props.onClick4}
          >
            Choose file
          </button>
          or
          <button
            className="btn p-2 rounded-3 mx-5 bg-body-tertiary fs-6 activity"
            onClick={props.onClick5}
          >
            Load some data
          </button>
        </div>
        <button className="btn sendData" style={{ backgroundColor: "#EE2B2B" }}>
          Send to AI model for Analysis
        </button>
        {props.playButton && (
          <button
            className="btn sendData mx-3"
            style={{ backgroundColor: "#EE2B2B" }}
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
    </>
  );
}
