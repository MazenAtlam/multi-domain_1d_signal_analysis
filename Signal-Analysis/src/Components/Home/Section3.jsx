import { Mail, Phone, MapPin, Clock } from "lucide-react";
// import "../../../styles/section3.css"; // Optional CSS file

export default function Section3() {
  return (
    <section className="section3 py-5 bg-light">
      <div className="container">
        {/* Header Section */}
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-dark mb-3">Get In Touch</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "800px" }}>
            Need help with signal analysis or have questions about our platform?
            We're here to assist you with your digital signal processing needs.
          </p>
        </div>

        <div className="row g-5">
          {/* Left Column - Contact Information */}
          <div className="col-lg-6 col-md-12 ">
            <div className="mb-5">
              <h4 className="fw-bold text-dark mb-4 text-center">
                Contact Information
              </h4>

              {/* Email */}
              <div className="d-flex align-items-start mb-4 col-6 mx-auto">
                <div className="bg-primary rounded-circle p-2 me-3 flex-shrink-0">
                  <Mail size={20} className="text-white" />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-1">Email</h6>
                  <p className="text-primary mb-1 fw-medium">
                    support@medicalsignals.com
                  </p>
                  <p className="text-muted small">
                    Get in touch for technical support
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="d-flex align-items-start mb-4 col-6 mx-auto">
                <div className="bg-success rounded-circle p-2 me-3 flex-shrink-0">
                  <Phone size={20} className="text-white" />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-1">Phone</h6>
                  <p className="text-dark mb-1">+1 (555) 123-4567</p>
                  <p className="text-muted small">
                    Available during business hours
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="d-flex align-items-start mb-4 col-6 mx-auto">
                <div className="bg-warning rounded-circle p-2 me-3 flex-shrink-0">
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-1">Location</h6>
                  <p className="text-dark mb-1">Medical Technology Center</p>
                  <p className="text-muted small">
                    Digital Signal Processing Lab
                  </p>
                </div>
              </div>

              {/* Support Hours */}
              <div className="d-flex align-items-start col-6 mx-auto">
                <div className="bg-info rounded-circle p-2 me-3 flex-shrink-0">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-1">Support Hours</h6>
                  <p className="text-dark mb-1">Mon-Fri 9AM-5PM EST</p>
                  <p className="text-muted small">
                    24/7 emergency support available
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Compact Contact Form */}
          <div className="col-lg-6 col-md-12">
            <div className="bg-white rounded-4 p-4 shadow-sm">
              <h4 className="fw-bold text-dark mb-3">Send us a Message</h4>

              <form>
                {/* Name Row */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label
                      htmlFor="firstName"
                      className="form-label fw-semibold text-dark small"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstName"
                      placeholder="John"
                      defaultValue="John"
                      style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label
                      htmlFor="lastName"
                      className="form-label fw-semibold text-dark small"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastName"
                      placeholder="Doe"
                      defaultValue="Doe"
                      style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label
                    htmlFor="email"
                    className="form-label fw-semibold text-dark small"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="john.doe@example.com"
                    defaultValue="john.doe@example.com"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                  />
                </div>

                {/* Subject */}
                <div className="mb-3">
                  <label
                    htmlFor="subject"
                    className="form-label fw-semibold text-dark small"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    placeholder="Signal processing inquiry"
                    defaultValue="Signal processing inquiry"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                  />
                </div>

                {/* Message */}
                <div className="mb-3">
                  <label
                    htmlFor="message"
                    className="form-label fw-semibold text-dark small"
                  >
                    Message
                  </label>
                  <textarea
                    className="form-control"
                    id="message"
                    rows="3"
                    placeholder="Please describe your signal processing needs or questions..."
                    defaultValue="Please describe your signal processing needs or questions..."
                    style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 fw-semibold py-2"
                  style={{
                    backgroundColor: "#3b82f6",
                    border: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
