import Home from "./Home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EEG from "./../Pages/EEG";
import ECG from "./../Pages/ECG";
import Radar from "../Pages/Radar";
import Doppler from "./../Pages/Doppler";
import Recognition from "../Pages/Recognition.jsx";
import "../styles/index.css"
import "../styles/doppler.css"
import "../styles/radar.css"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/EEG" element={<EEG />} />
          <Route path="/ECG" element={<ECG />} />
          <Route path="/Radar" element={<Radar />} />
          <Route path="/Doppler" element={<Doppler />} />
          <Route path="/Recognition" element={<Recognition />} />
          <Route path="/Home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
