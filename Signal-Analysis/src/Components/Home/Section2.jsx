import { Activity, Brain, Waves, Radar } from "lucide-react";
import Section2Card from "./Cards/Section2Card";

export default function Section2() {
  const services = [
    {
      id: "ecg",
      title: "ECG Analysis",
      description:
        "Advanced electrocardiogram signal processing for cardiac diagnosis. Our AI models analyse heart rhythm patterns to detect arrhythmias, cardiac abnormalities, and provide comprehensive cardiovascular assessments.",
      icon: Activity,
      path: "/ecg",
      color: "red",
      capabilities: [
        "Arrhythmia Detection",
        "Cardiac Risk Assessment",
        "Real-time Monitoring",
      ],
      buttonText: "Explore ECG Analysis",
    },
    {
      id: "eeg",
      title: "EEG Analysis",
      description:
        "Sophisticated electroencephalogram processing for neurological diagnosis. Machine learning algorithms interpret brainwave patterns to identify seizures, sleep disorders, and cognitive conditions.",
      icon: Brain,
      path: "/eeg",
      color: "purple",
      capabilities: [
        "Seizure Detection",
        "Sleep Pattern Analysis",
        "Cognitive Assessment",
      ],
      buttonText: "Explore EEG Analysis",
    },
    {
      id: "doppler",
      title: "Doppler Effect",
      description:
        "Comprehensive Doppler signal analysis for velocity and frequency detection. Generate Doppler effects and extract motion parameters from acoustic signals with high precision.",
      icon: Waves,
      path: "/doppler",
      color: "orange",
      capabilities: [
        "Velocity Detection",
        "Frequency Analysis",
        "Motion Tracking",
      ],
      buttonText: "Explore Doppler Effect",
    },
    {
      id: "radar",
      title: "Radar Detection",
      description:
        "Multi-purpose radar signal processing for drone detection and seismic analysis. Advanced algorithms identify aerial threats and earthquake signatures from SAR data.",
      icon: Radar,
      path: "/radar",
      color: "green",
      capabilities: [
        "Drone Identification",
        "Earthquake Detection",
        "Threat Assessment",
      ],
      buttonText: "Explore Radar Detection",
    },
  ];

  return (
    <section className="section2 py-5">
      <div className="container">
        {/* Header Section */}
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-dark mb-3">
            Advanced Signal Processing
          </h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "800px" }}>
            Our comprehensive digital signal processing platform combines
            cutting-edge AI models with advanced signal analysis techniques to
            provide accurate diagnoses and detections across multiple domains.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="row g-4">
          {services.map((service) => (
            <div key={service.id} className="col-lg-6 col-md-12">
              <Section2Card
                id={service.id}
                path={service.path}
                color={service.color}
                title={service.title}
                description={service.description}
                icon={service.icon}
                capabilities={service.capabilities}
                buttonText={service.buttonText}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
