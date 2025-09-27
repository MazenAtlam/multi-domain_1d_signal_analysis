import React, { useRef } from "react";
import { Link } from "react-router-dom";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import Footer from "../src/Components/Footer";
import {
  ArrowLeft,
  Upload,
  Activity,
  ExclamationCircle,
  CheckCircleFill,
} from "react-bootstrap-icons";
import "../styles/ecg.css"

const ECG = () => {
  const fileInputRef = useRef(null);

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <div className="border-bottom bg-light">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="text-decoration-none">
              <Button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <ArrowLeft size={16} />
                Back to Home
              </Button>
            </Link>
            <div className="d-flex align-items-center gap-2">
              <div className="bg-light rounded p-2">
                <Activity size={24} className="text-danger" />
              </div>
              <div>
                <h1 className="h4 mb-0">ECG Analysis</h1>
                <p className="text-muted mb-0">
                  Electrocardiogram Signal Processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container flex-grow-1 py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Signal Viewer */}
            <Card className="p-4 mb-5">
              <div className="text-center mb-4">
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: "64px", height: "64px" }}>
                  <Activity size={32} className="text-danger" />
                </div>
                <h2 className="h5">ECG Signal Viewer</h2>
                <p className="text-muted">
                  Visualize ECG signals from dataset with different graph modes
                </p>
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
                <Button className="btn btn-outline-secondary">
                  <Activity size={16} /> Regular Mode
                </Button>
                <Button className="btn btn-outline-secondary">Polar Graph</Button>
                <Button className="btn btn-outline-secondary">Recurrence Graph</Button>
              </div>

              {/* Signal Display */}
              <div className="border rounded p-5 text-center mb-4">
                <Activity size={40} className="text-secondary mb-3" />
                <p className="mb-1">ECG Signal Visualization</p>
                <small className="text-muted">
                  Select a graph mode to view the signal
                </small>
              </div>

              {/* File Upload + Load */}
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
                <input
                  type="file"
                  accept=".csv,.txt,.dat"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                <Button
                  className="btn btn-primary"
                  onClick={handleFileButtonClick}
                >
                  Upload ECG File
                </Button>
                <span className="text-muted">or</span>
                <Button className="btn btn-outline-secondary">Load Some Data</Button>
              </div>

              {/* Send to AI */}
              <div className="text-center mt-4">
                <Button className="btn btn-danger">
                  Send to AI Model for Analysis
                </Button>
              </div>
            </Card>

            {/* Features */}
            <div className="row g-4 mb-5">
              {[
                {
                  title: "Arrhythmia Detection",
                  desc: "Identify irregular heart rhythms and abnormal cardiac patterns",
                },
                {
                  title: "Heart Rate Analysis",
                  desc: "Comprehensive heart rate variability and rhythm analysis",
                },
                {
                  title: "Risk Assessment",
                  desc: "AI-powered cardiovascular risk evaluation and recommendations",
                },
                {
                  title: "Real-time Processing",
                  desc: "Instant signal processing and diagnostic feedback",
                },
              ].map((f, i) => (
                <div className="col-md-6" key={i}>
                  <Card className="p-3 feature-card">
                    <div className="d-flex gap-3 align-items-start">
                      <CheckCircleFill className="feature-icon" />
                      <div>
                        <h5 className="mb-2">{f.title}</h5>
                        <p className="text-muted mb-0">{f.desc}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Data Requirements */}
            <Card className="p-4 bg-light">
              <div className="d-flex gap-3">
                <ExclamationCircle
                  size={20}
                  className="text-warning flex-shrink-0"
                />
                <div>
                  <h5>Data Requirements</h5>
                  <ul className="mb-0 text-muted">
                    <li>ECG signals should be sampled at minimum 250 Hz</li>
                    <li>File formats: CSV, TXT, or DAT with time-series data</li>
                    <li>Maximum file size: 10MB per upload</li>
                    <li>For best results, use 12-lead ECG recordings</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ECG;
