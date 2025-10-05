import { Link } from "react-router-dom";

export default function Section2Card(props) {
  const IconComponent = props.icon;

  // Color mapping with all your specified colors
  const colorStyles = {
    red: {
      backgroundColor: "rgba(238, 43, 43, 0.1)",
      color: "#EE2B2B",
    },
    purple: {
      backgroundColor: "rgba(108, 43, 238, 0.1)",
      color: "#6C2BEE",
    },
    orange: {
      backgroundColor: "rgba(238, 189, 43, 0.1)",
      color: "#EEBD2B",
    },
    green: {
      backgroundColor: "rgba(18, 212, 18, 0.1)",
      color: "#12D412",
    },
  };

  const styles = colorStyles[props.color] || colorStyles.red;

  return (
    <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="card-body p-4 d-flex flex-column h-100">
        {/* Header with Icon and Title */}
        <div className="d-flex align-items-center mb-4">
          <div
            style={{ backgroundColor: styles.backgroundColor }}
            className="rounded-circle p-3 d-flex align-items-center justify-content-center me-4"
          >
            <IconComponent size={32} style={{ color: styles.color }} />
          </div>
          <h3 className="card-title fw-bold text-dark mb-0">{props.title}</h3>
        </div>

        {/* Description */}
        <p className="card-text text-muted mb-4 flex-grow-1">
          {props.description}
        </p>

        {/* Capabilities List */}
        <div className="mb-4">
          <h6 className="fw-semibold text-dark mb-3">Key Capabilities:</h6>
          <ul className="list-unstyled mb-0">
            {props.capabilities.map((capability, index) => (
              <li key={index} className="d-flex align-items-center mb-2">
                <span
                  className="rounded-circle me-3"
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: styles.color,
                  }}
                ></span>
                <span className="text-muted">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Button */}
        <div className="mt-auto">
          <Link
            to={props.path}
            className="btn btn-lg w-100 text-decoration-none"
            style={{
              backgroundColor: styles.color,
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: "500",
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = "0.9";
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = "1";
            }}
          >
            {props.buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
}
