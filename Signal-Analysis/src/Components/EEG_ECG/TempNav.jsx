import { Link } from "react-router-dom";
import "../../../styles/eeg.css";
export default function tempNav(props) {
  const IconComponent = props.icon;
  return (
    <>
      <div className="tempNav d-flex py-3 align-items-center bg-body-tertiary container w-100 border-bottom">
        <button className="btn border mx-5">
          <Link to="/home" className="text-decoration-none link">
            <i className="bi bi-arrow-left pt-3 mx-2"></i> Back To Home
          </Link>
        </button>
        <div className="content d-flex align-items-center gap-4 my-auto">
          <IconComponent
            className={"rounded-4 brain"}
            style={{ width: "48px", height: "48px", padding: "5px" }}
          />
          <div className="head">
            <h5 className="m-0">{props.title}</h5>
            <p style={{ color: "#656565ff" }} className="m-0">
              {props.describtion}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
