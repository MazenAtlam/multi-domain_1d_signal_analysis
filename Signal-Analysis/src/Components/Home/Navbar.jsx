import { Link } from "react-router-dom";
export default function Navbar() {
  return (
    <div className="homePage">
      <nav
        id="navbar-example2"
        className="navbar bg-body-tertiary px-3 mb-3 justify-content-lg-around"
      >
        <Link to="/" className="navbar-brand">
          <span className="bg-primary p-1 rounded-2 text-light me-3 fs-6 fw-bold  ">
            DSP
          </span>
          <b>Medical Signals</b>
        </Link>
        <ul className="nav nav-pills text-dark">
          <li className="nav-item">
            <a className="nav-link" href="#scrollspyHeading1">
              Home
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#scrollspyHeading2">
              About
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#scrollspyHeading2">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
