import { Link } from "react-router-dom";

export default function FirstSectionCard(props) {
  const IconComponent = props.icon;

  // Exact color mapping with your specified colors
  const colorStyles = {
    red: {
      backgroundColor: "rgba(238, 43, 43, 0.1)", // Light red background
      color: "#EE2B2B", // Red icon color - ECG
    },
    purple: {
      backgroundColor: "rgba(108, 43, 238, 0.1)", // Light purple background
      color: "#6C2BEE", // Purple icon color - EEG
    },
    orange: {
      backgroundColor: "rgba(238, 189, 43, 0.1)", // Light orange background
      color: "#EEBD2B", // Orange icon color - Doppler
    },
    green: {
      backgroundColor: "rgba(18, 212, 18, 0.1)", // Light green background
      color: "#12D412", // Green icon color - Radar
    },
  };

  const styles = colorStyles[props.color] || colorStyles.red;

  return (
    <div className="card h-100 shadow-lg border-0 rounded-3 overflow-hidden">
      <Link
        to={props.path}
        className="text-decoration-none text-dark d-flex flex-column h-100"
      >
        {/* Icon Section with colored background and icon */}
        <div
          style={{ backgroundColor: styles.backgroundColor }}
          className="py-4 d-flex justify-content-center align-items-center"
        >
          <div className="rounded-circle p-3">
            <IconComponent
              className="w-8 h-8"
              style={{ color: styles.color }}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="card-body d-flex flex-column flex-grow-1 text-center py-4">
          <h3 className="card-title fw-bold mb-2">{props.title}</h3>
          <p className="card-text text-muted mb-4 flex-grow-1">
            {props.description}
          </p>
          <button className="btn btn-outline-primary w-100 mt-auto">
            Analyze Signal
          </button>
        </div>
      </Link>
    </div>
  );
}
