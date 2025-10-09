import "../../../styles/eeg.css";
import Button from "../ui/button.jsx";
export default function tempNav(props) {
  const IconComponent = props.icon;
  console.log(props.icon.render.displayName);
  return (
    <>
      <div className="tempNav d-flex py-3 align-items-center bg-body-tertiary container w-100 border-bottom">
        <a href="/">
          <Button className="button-scientific bg-background border-input rounded-md">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 mr-2"
            >
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
            Back to Home
          </Button>
        </a>
        <div className="content d-flex align-items-center gap-4 my-auto ms-3">
          <IconComponent
            className={`${props.icon.render.displayName} rounded-4`}
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
