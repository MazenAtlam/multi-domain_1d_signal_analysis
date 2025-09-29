import FeatureCard from "../src/Components/EEG_ECG/FeatureCard";
import Instructions from "../src/Components/EEG_ECG/Instructions";
import SignalViewerCard from "../src/Components/EEG_ECG/SignalViewerCard";
import TempNav from "../src/Components/EEG_ECG/tempNav";
import { Activity, Brain, Radar, Waves } from "lucide-react";
export default function EEG() {
  return (
    <>
      <TempNav
        icon={Brain}
        title="EEG Analysis"
        describtion="Electroencephalogram Signal Processing"
      />
      <div className="page bg-body-tertiary py-5">
        <SignalViewerCard
          icon={Brain}
          title={"EEG Signal Viewer"}
          describtion={
            "Visualize EEG signals from dataset with different graph modes"
          }
        />
        <div className="features col-11 col-xl-7 mx-auto my-4 d-flex flex-wrap gap-4 justify-content-center">
          <FeatureCard
            fetTitle={"Seizure Detection"}
            fetDes={
              "Identify epileptic seizures and abnormal brain activity patterns"
            }
          />
          <FeatureCard
            fetTitle={"Sleep Analysis"}
            fetDes={
              "Comprehensive sleep stage classification and disorder detection"
            }
          />
          <FeatureCard
            fetTitle={"Cognitive Assessment"}
            fetDes={
              "Brain function evaluation and cognitive performance analysis"
            }
          />
          <FeatureCard
            fetTitle={"Frequency Analysis"}
            fetDes={"Detailed spectral analysis of brain wave frequencies"}
          />
        </div>
        <Instructions />
      </div>
    </>
  );
}
