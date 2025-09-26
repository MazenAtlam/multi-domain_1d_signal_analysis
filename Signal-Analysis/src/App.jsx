import Home from "./Home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EEG from "./../Pages/EEG";
import ECG from "./../Pages/ECG";
import Sound from "./../Pages/Sound";
import Doppler from "./../Pages/Doppler";
function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/EEG" element={<EEG />} />
          <Route path="/ECG" element={<ECG />} />
          <Route path="/Sound" element={<Sound />} />
          <Route path="/Doppler" element={<Doppler />} />
          <Route path="/Home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
