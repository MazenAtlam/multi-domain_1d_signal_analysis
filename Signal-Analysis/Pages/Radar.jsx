import { useState } from 'react';
import Card from '../src/Components/ui/Card';
import Button from '../src/Components/ui/Button';
import Input from '../src/Components/ui/Input';
import SignalViewer from '../src/Components/Radar/SignalViewer';
import Footer from '../src/Components/Footer';
import '../styles/Radar.css';

const Radar = () => {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileType, setFileType] = useState(null);

  const handleAudioFileChange = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) {
      setCurrentFile(file);
      setFileType('audio');
    }
  };

  const handleRfFileChange = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) {
      setCurrentFile(file);
      setFileType('rf');
    }
  };

  const handleLoadSampleAudio = () => {
    setCurrentFile({ name: 'sample_audio.wav' });
    setFileType('audio');
  };

  const handleLoadSampleRf = () => {
    setCurrentFile({ name: 'sample_rf.dat' });
    setFileType('rf');
  };

  return (
      <div className="radar-container">
        <div className="radar-header">
          <div className="header-content">
            <div className="header-left">
              <a href="/">
                <Button className="back-button">
                  <svg className="arrow-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 19-7-7 7-7"></path>
                    <path d="M19 12H5"></path>
                  </svg>
                  Back to Home
                </Button>
              </a>
              <div className="header-title">
                <div className="icon-container radar-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"></path>
                    <path d="M4 6h.01"></path>
                    <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"></path>
                    <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"></path>
                    <path d="M12 18h.01"></path>
                    <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"></path>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="m13.41 10.59 5.66-5.66"></path>
                  </svg>
                </div>
                <div>
                  <h1>Radar Detection</h1>
                  <p>Drone & SAR Signal Processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="radar-content">
          <div className="content-wrapper">
            <div className="detection-cards">
              <Card className="detection-card" padding="p-6">
                <div className="card-content">
                  <div className="icon-container radar-icon-large">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"></path>
                      <path d="M4 6h.01"></path>
                      <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"></path>
                      <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"></path>
                      <path d="M12 18h.01"></path>
                      <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"></path>
                      <circle cx="12" cy="12" r="2"></circle>
                      <path d="m13.41 10.59 5.66-5.66"></path>
                    </svg>
                  </div>
                  <h3>Drone Detection</h3>
                  <p>Identify drones from audio signatures</p>
                  <div className="file-upload-area">
                    <div className="upload-content">
                      <svg className="upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"></path>
                        <path d="M4 6h.01"></path>
                        <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"></path>
                        <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"></path>
                        <path d="M12 18h.01"></path>
                        <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"></path>
                        <circle cx="12" cy="12" r="2"></circle>
                        <path d="m13.41 10.59 5.66-5.66"></path>
                      </svg>
                      <div>
                        <p className="upload-title">Load drone audio data</p>
                        <p className="upload-subtitle">From audio dataset</p>
                      </div>
                      <div className="upload-actions">
                        <Input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioFileChange}
                            className="file-input"
                        />
                        <p>or</p>
                        <Button
                            className="load-sample-btn radar-btn"
                            onClick={handleLoadSampleAudio}
                        >
                          Load Some Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="detection-card" padding="p-6">
                <div className="card-content">
                  <div className="icon-container warning-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                    </svg>
                  </div>
                  <h3>SAR Signal Detection</h3>
                  <p>Analyze SAR signals for seismic activity detection</p>
                  <div className="upload-area">
                    <div className="upload-content">
                      <svg className="upload-icon warning" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                      </svg>
                      <div>
                        <p className="upload-title">Load SAR data</p>
                        <p className="upload-subtitle">From SAR dataset</p>
                      </div>
                      <div className="upload-actions">
                        <Input
                            type="file"
                            accept=".txt,.csv,.dat"
                            onChange={handleRfFileChange}
                            className="file-input"
                        />
                        <p>or</p>
                        <Button
                            className="load-sample-btn warning-btn"
                            onClick={handleLoadSampleRf}
                        >
                          Load Some Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <SignalViewer file={currentFile} fileType={fileType} />

            <div className="feature-cards">
              <Card className="feature-card" padding="p-6">
                <div className="feature-content">
                  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                  <div>
                    <h3>Drone Classification</h3>
                    <p>Identify different drone types and flight patterns</p>
                  </div>
                </div>
              </Card>

              <Card className="feature-card" padding="p-6">
                <div className="feature-content">
                  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                  <div>
                    <h3>Seismic Analysis</h3>
                    <p>Detect SAR signal signatures and magnitude estimation</p>
                  </div>
                </div>
              </Card>

              <Card className="feature-card" padding="p-6">
                <div className="feature-content">
                  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                  <div>
                    <h3>Threat Assessment</h3>
                    <p>Risk evaluation and alert system for detected threats</p>
                  </div>
                </div>
              </Card>

              <Card className="feature-card" padding="p-6">
                <div className="feature-content">
                  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                  <div>
                    <h3>Real-time Monitoring</h3>
                    <p>Continuous signal monitoring and automated detection</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="guidelines-card" padding="p-6">
              <div className="guidelines-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-warning mt-1" data--h-bstatus="0OBSERVED"><circle cx="12" cy="12" r="10" data--h-bstatus="0OBSERVED"></circle><line x1="12" x2="12" y1="8" y2="12" data--h-bstatus="0OBSERVED"></line><line x1="12" x2="12.01" y1="16" y2="16" data--h-bstatus="0OBSERVED"></line></svg>
                <div>
                  <h3>Detection Guidelines</h3>
                  <div className="guidelines-grid">
                    <div>
                      <h4>Drone Detection:</h4>
                      <ul>
                        <li>• Audio signals at 44.1 kHz or higher</li>
                        <li>• Clear outdoor recordings preferred</li>
                        <li>• Duration: 5-60 seconds optimal</li>
                        <li>• Minimal background noise</li>
                      </ul>
                    </div>
                    <div>
                      <h4>SAR Signal Detection:</h4>
                      <ul>
                        <li>• SAR data with temporal information</li>
                        <li>• Sampling rate: 100 Hz minimum</li>
                        <li>• Include GPS coordinates if available</li>
                        <li>• Maximum file size: 100MB</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
  );
};

export default Radar;