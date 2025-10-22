import hero from "../../assets/hero.jpg";
import { Activity, Brain, Radar, Waves, Mic } from "lucide-react";
import FirstSectionCard from "./Cards/FirstSectionCard";
import "../../../styles/firstSection.css";

export default function Section1() {
  const signalTypes = [
    {
      id: "ecg",
      title: "ECG Analysis",
      description: "Electrocardiogram signal diagnosis",
      icon: Activity,
      path: "/ecg",
      color: "red",
    },
    {
      id: "eeg",
      title: "EEG Analysis",
      description: "Electroencephalogram signal diagnosis",
      icon: Brain,
      path: "/eeg",
      color: "purple",
    },
    {
      id: "doppler",
      title: "Doppler Effect",
      description: "Frequency & velocity analysis",
      icon: Waves,
      path: "/doppler",
      color: "orange",
    },
    {
      id: "radar",
      title: "Radar Detection",
      description: "Drone & earthquake detection",
      icon: Radar,
      path: "/radar",
      color: "green",
    },
    {
      id: "recognition",
      title: "Voice Recognition",
      description: "Voice Recognition & Anti-aliasing",
      icon: Mic,
      path: "/recognition",
      color: "blue",
    },
  ];

  return (
    <>
      <div className="position-relative">
        {/* Hero Background */}
        <div className="position-absolute top-0 left-0 w-100 h-100">
          <img
            src={hero}
            alt="Background"
            className="w-100 h-100 object-fit-cover"
          />
          <div className="hero-overlay position-absolute top-0 left-0 w-100 h-100"></div>
        </div>

        <div className="position-relative min-vh-100 d-flex flex-column justify-content-center align-items-center text-center text-light py-5">
          <div className="mb-5">
            <h1 className="display-2 fw-bold mb-3">
              Digital Signal
              <br />
              <span className="text-primary">Processing</span>
            </h1>
            <p className="lead mb-5">
              Advanced medical signal analysis and AI-powered diagnosis platform
            </p>
          </div>

          <div className="container">
            <div className="row justify-content-center g-4">
              {signalTypes.map((signal) => {
                return (
                  <div key={signal.id} className="col-lg-3 col-md-6 col-sm-12">
                    <FirstSectionCard
                      id={signal.id}
                      path={signal.path}
                      color={signal.color}
                      title={signal.title}
                      description={signal.description}
                      icon={signal.icon}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
