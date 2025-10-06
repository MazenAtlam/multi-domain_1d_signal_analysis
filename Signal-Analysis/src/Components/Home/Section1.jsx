import hero from "../../assets/hero.jpg";
import { Activity, Brain, Radar, Waves } from "lucide-react";
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
      color: "bg-blue-500",
    },
    {
      id: "eeg",
      title: "EEG Analysis",
      description: "Electroencephalogram signal diagnosis",
      icon: Brain,
      path: "/eeg",
      color: "bg-green-500",
    },
    {
      id: "doppler",
      title: "Doppler Effect",
      description: "Frequency & velocity analysis",
      icon: Waves,
      path: "/doppler",
      color: "bg-purple-500",
    },
    {
      id: "radar",
      title: "Radar Detection",
      description: "Drone & earthquake detection",
      icon: Radar,
      path: "/radar",
      color: "bg-orange-500",
    },
  ];
  console.log(hero);
  return (
    <>
      <div>
        <div>
          <div className="hero-overlay"></div>
        </div>

        <div className="my-auto">
          <div className="position-relative text-light">
            <h1>
              Digital Signal
              <span>Processing</span>
            </h1>
            <p>
              Advanced medical signal analysis and AI-powered diagnosis platform
            </p>
          </div>

          <div className="d-flex  justify-content-evenly">
            {signalTypes.map((signal) => {
              return (
                <FirstSectionCard
                  key={signal.id}
                  id={signal.id}
                  path={signal.path}
                  color={signal.color}
                  title={signal.title}
                  description={signal.description}
                  icon={signal.icon}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
