import "../../../styles/eeg.css";
export default function SignalViewerCard(props) {
  const IconComponent = props.icon;
  return (
    <>
      <div className="border col-10 col-xl-6 mx-auto bg-light text-center py-3 rounded-4 signalViewer">
        <IconComponent
          className={"mb-3 rounded-circle brain"}
          style={{
            width: "47px",
            height: "47px",
            padding: "8px",
            marginBottom: "10px",
          }}
        />
        <h3>{props.title}</h3>
        <p style={{ color: "#656565ff" }} className="col-sm-12 col-8 mx-auto">
          {props.describtion}
        </p>
        <div className="modes d-flex justify-content-center flex-wrap gap-2">
          <div className="btn bg-body-tertiary mx-3 border rounded-4">
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
          <div className="btn bg-body-tertiary mx-3 border rounded-4">
            Polar Graph
          </div>
          <div className="btn bg-body-tertiary mx-3 border rounded-4">
            Recurrence Graph
          </div>
        </div>
        <div className="view col-10 col-xl-10 mx-auto mt-4 py-5 rounded-3">
          <IconComponent
            className={"mb-3 mt-3"}
            style={{
              width: "55px",
              height: "55px",
              padding: "0px",
              color: "#6c2beea8",
            }}
          />
          <h5 style={{ color: "#232323ee" }}>{props.title}</h5>
          <p style={{ color: "#999999" }}>{props.describtion}</p>
        </div>
        <div className="data my-3">
          <button className="btn p-2 rounded-3 mx-5 file">Choose file</button>
          or
          <button className="btn p-2 rounded-3 mx-5 bg-body-tertiary fs-6">
            Load some data
          </button>
        </div>
        <button className="btn sendData">Send to AI model for Analysis</button>
      </div>
    </>
  );
}
