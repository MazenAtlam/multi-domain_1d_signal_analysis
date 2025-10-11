import {useState, useRef, useEffect} from 'react';
import Card from '../src/Components/ui/card';
import Button from '../src/Components/ui/button';
import Input from '../src/Components/ui/input';
import SignalViewer from '../src/Components/Radar/SignalViewer.jsx';
import Footer from '../src/Components/Footer';
// import { formatTime } from '../src/utils/audioUtils';
import '../styles/radar.css';

const Radar = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Microphone: Inactive');
  const [predictions, setPredictions] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [classLabels, setClassLabels] = useState([]);
  const recognizerRef = useRef(null);
  const modelURL = "https://teachablemachine.withgoogle.com/models/nuedEJ711/";

  const [droneIsUsed, setDroneIsUsed] = useState(false);
  const [sarIsUsed, setSarIsUsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [sarData, setSarData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // const [duration, setDuration] = useState('');
  const [sarFileIndex, setSarFileIndex] = useState(0);
  const sarFilesNumber = 0;
  const [message, setMessage] = useState('');
  const [errorHappened, setErrorHappened] = useState(false);

  const createModel = async () => {
    // Check if speechCommands is available
    if (!window.speechCommands || !window.speechCommands.create) {
      setMessage('Speech Commands library not loaded. Please check if TensorFlow.js scripts are properly imported.');
      setErrorHappened(true);
      return;
    }

    const checkpointURL = modelURL + "model.json";
    const metadataURL = modelURL + "metadata.json";

    try {
      const recognizer = window.speechCommands.create(
          "BROWSER_FFT",
          undefined,
          checkpointURL,
          metadataURL
      );

      await recognizer.ensureModelLoaded();
      return recognizer;
    } catch (error) {
      console.error('Error creating speech recognition model:', error);
      setMessage(`Failed to load model: ${error.message}`);
      setErrorHappened(true);
    }
  };

  const initDroneDetection = async () => {
    resetParameters();
    if (isListening) return;

    // Check if TensorFlow.js is available
    if (!window.tf) {
      setMessage('Error: TensorFlow.js not loaded. Please refresh the page.');
      setErrorHappened(true);
      return;
    }

    // Check if speechCommands is available
    if (!window.speechCommands) {
      setMessage('Error: Speech Commands library not loaded. Please refresh the page.');
      setErrorHappened(true);
      return;
    }

    try {
      setDroneIsUsed(true);
      setIsListening(true);
      setStatus('Loading model...');

      const recognizer = await createModel();
      recognizerRef.current = recognizer;

      const labels = recognizer.wordLabels();
      setClassLabels(labels);

      // Initialize predictions with zero values
      const initialPredictions = labels.map(label => ({
        label,
        probability: 0,
        percentage: '0%'
      }));
      setPredictions(initialPredictions);

      recognizer.listen(result => {
        const scores = result.scores;
        let maxScore = 0;
        let maxIndex = 0;

        const updatedPredictions = labels.map((label, index) => {
          const probability = scores[index];
          const percentage = (probability * 100).toFixed(1) + '%';

          if (probability > maxScore) {
            maxScore = probability;
            maxIndex = index;
          }

          return {
            label,
            probability,
            percentage
          };
        });

        setPredictions(updatedPredictions);

        // Alert if drone detected with high confidence
        if (labels[maxIndex].toLowerCase().includes('drone') && maxScore > 0.75) {
          setShowAlert(true);
        } else {
          setShowAlert(false);
        }
      }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.5,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50
      });

      setStatus('Microphone: Active - Listening...');
    } catch (error) {
      console.error('Error initializing:', error);
      setMessage('Error: ' + error.message + '\n\nPlease make sure to allow microphone access and check your internet connection.');
      setIsListening(false);
      setErrorHappened(true);
      setStatus('Error - Click Start to try again');
    }
  };

  const stopDroneDetection = () => {
    if (recognizerRef.current && isListening) {
      recognizerRef.current.stopListening();
      setIsListening(false);
      setStatus('Microphone: Inactive');
      setShowAlert(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopListening();
      }
    };
  }, []);

  const getPredictionClassName = (probability) => {
    if (probability > 0.75) return 'prediction detected';
    if (probability > 0.5) return 'prediction high-confidence';
    return 'prediction';
  };

  const getProgressFillClassName = (probability) => {
    return probability > 0.75 ? 'progress-fill high' : 'progress-fill';
  };

  const isSarFile = (file) => {
    if (!file) return false;

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // Check by file extension
    const allowedExtensions = ['.txt', '.csv', '.dat'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    // Check by MIME type (optional additional validation)
    const allowedMimeTypes = [
      'text/plain',
      'text/csv',
      'application/csv',
      'text/comma-separated-values'
    ];
    const hasValidMimeType = allowedMimeTypes.includes(fileType) || fileType === '';

    return hasValidExtension && hasValidMimeType;
  };

  const resetParameters = () => {
    setCurrentFile(null);
    setCurrentTime(0);
    setErrorHappened(false);
    setIsPlaying(false);
    setDroneIsUsed(false);
    setSarIsUsed(false);
    setMessage('');
  }

  const handleSarFileChange = async (event) => {
    resetParameters();

    const file = event.target.files[0];
    event.target.value = '';
    if (file === undefined || !isSarFile(file)) {
      setMessage('Please select a valid SAR file (TXT, CSV, DAT)');
      setErrorHappened(true);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const parsedData = await parseSarFile(file);
      setSarData(parsedData);
      setCurrentFile(file);
      setFileType('sar');

      const analysisResult = await analyzeSarData(file);
      console.log('SAR analysis result:', analysisResult);
      setMessage("SAR analysis completed successfully.");
    } catch (error) {
      console.error('Error parsing SAR file:', error);
      setMessage('Error parsing SAR file:' + error);
      setErrorHappened(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle audio play
  const handlePlay = () => {
    setIsPlaying(true);

    // if (audioRef.current && audioUrl) {
    //   audioRef.current.play()
    //       .then(() => {
    //         setIsPlaying(true);
    //         // startProgressUpdate();
    //       })
    //       .catch(error => {
    //         console.error('Error playing audio:', error);
    //         setMessage('Error playing audio: ' + error.message);
    //       });
    // }
  };

  // Function to handle audio pause
  const handlePause = () => {
    setIsPlaying(false);

    // if (audioRef.current) {
    //   audioRef.current.pause();
    //   setIsPlaying(false);
    //   stopProgressUpdate();
    // }
  };

  const parseSarFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let parsedData;

          if (file.name.endsWith('.csv')) {
            parsedData = parseCSV(content);
          } else if (file.name.endsWith('.txt') || file.name.endsWith('.dat')) {
            parsedData = parseTextData(content);
          } else {
            throw new Error('Unsupported file format');
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseCSV = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const entry = {};

      headers.forEach((header, index) => {
        let value = values[index];
        if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        entry[header] = value;
      });

      data.push(entry);
    }

    return {
      type: 'csv',
      headers,
      data,
      rawData: content
    };
  };

  const parseTextData = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];

    lines.forEach((line, index) => {
      const values = line.split(/\s+/).filter(v => v.trim());

      if (values.length >= 2) {
        const time = parseFloat(values[0]) || index;
        const amplitude = parseFloat(values[1]);

        if (!isNaN(amplitude)) {
          data.push({ time, amplitude });
        }
      }
    });

    return {
      type: 'text',
      data,
      rawData: content
    };
  };

  const fileFromReference = async (fileUrl, filename, fileType) => {
    if (!fileUrl) return null;
    const response = await fetch(fileUrl);
    const data = await response.blob();
    return new File([data], filename, { type: fileType });
  };

  const handleLoadSampleSar = async () => {
    resetParameters();

    setSarIsUsed(true);
    setLoading(true);
    setMessage('');

    // Get sample data from dataset folder
    const fileNameFromIndex = sarFileIndex + '.csv';
    const fileUrl = '../testing_data/SAR/' + fileNameFromIndex;

    // Update the index
    setSarFileIndex(sarFileIndex >= sarFilesNumber - 1 ? 0 : sarFileIndex + 1);

    try {
      const loaded = await fileFromReference(fileUrl, fileNameFromIndex, 'text/csv');
      setCurrentFile(loaded);

      const parsedData = await parseSarFile(loaded);
      setSarData(parsedData);
      setFileType('sar');

      const analysisResult = await analyzeSarData(loaded);
      console.log('SAR analysis result:', analysisResult);
      setMessage("SAR analysis completed successfully.");

    } catch (error) {
      console.error('Error loading sample SAR data:', error);
      setMessage(`Failed to load sample SAR data: ${error.message}`);
      setErrorHappened(true);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSarData = async (fileToAnalyze) => {
    const formData = new FormData();
    formData.append('file', fileToAnalyze);

    // Optional: Add additional parameters if needed
    formData.append('filename', fileToAnalyze.name);
    formData.append('filetype', fileToAnalyze.type);
    formData.append('filesize', fileToAnalyze.size.toString());

    console.log('Sending SAR file to analysis:', {
      name: fileToAnalyze.name,
      type: fileToAnalyze.type,
      size: fileToAnalyze.size
    });

    // Make the API request
    const response = await fetch('/api/sar', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      setMessage(`Failed to fetch! status: ${response.status}`);
      console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      setErrorHappened(true);
    }

    // Parse the JSON response
    return await response.json();
  };

  return (
      <div className="radar-container">
        <div className="bg-card/50 border-b border-border">
          <div className="container px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a href="/">
                  <Button className="button-scientific bg-background border-input rounded-md">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 mr-2"
                    >
                      <path d="m12 19-7-7 7-7"></path>
                      <path d="M19 12H5"></path>
                    </svg>
                    Back to Home
                  </Button>
                </a>

                <div className="flex items-center space-x-3 justify-between">
                  <div className="w-10 h-10 radar-icon rounded-lg flex items-center justify-center">
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

                  <div className="ms-3">
                    <h1 className="text-2xl font-bold text-foreground">Radar Detection</h1>
                    <p className="text-muted-foreground">Drone & SAR Signal Processing</p>
                  </div>
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
                  <div className={`status ${isListening ? 'active' : 'inactive'} mb-3`}>
                    {status}
                  </div>

                  <div className="controls text-center">
                    <Button
                        onClick={initDroneDetection}
                        disabled={isListening}
                        className="button player-btn button-scientific"
                    >
                      Start Detection
                    </Button>
                    <Button
                        onClick={stopDroneDetection}
                        disabled={!isListening}
                        className="button btn btn-outline-danger ms-4"
                    >
                      Stop Detection
                    </Button>
                  </div>

                  {/* Alert */}
                  {showAlert && (
                      <div className="alert show mt-3">
                        <strong>⚠ DRONE DETECTED!</strong>
                        <p className="mb-0">High confidence drone sound detected in the area.</p>
                      </div>
                  )}
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
                        <p className="upload-title">Load SAR data file</p>
                        <p className="upload-subtitle">TXT, CSV, or DAT formats</p>
                      </div>
                      <div className="upload-actions">
                        <Input
                            type="file"
                            accept=".txt,.csv,.dat"
                            onChange={handleSarFileChange}
                            className="file-input"
                        />
                        <p>or</p>
                        <Button
                            className="load-sample-btn warning-btn"
                            onClick={handleLoadSampleSar}
                            disabled={loading}
                        >
                          Load Some Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {droneIsUsed
                ? (
                    <>
                      {/* Drone Results Card */}
                      <Card className="signal-viewer-card" padding="p-8">
                        <div className="signal-header">
                          <div className="w-12 h-12 radar-icon rounded-lg flex items-center justify-center mx-auto">
                            {loading ? (
                                <svg className="animate-spin" width="24" height="24"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
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
                            )}
                          </div>
                          <h2>Detection Results</h2>
                          {/* Message Display */}
                          {message && (
                              <div className={`p-4 rounded-lg ${
                                  message.includes('successfully')
                                      ? 'message-success bg-green-100 text-green-800 border border-green-200'
                                      : 'message-error bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {message}
                              </div>
                          )}
                        </div>

                        <div id="label-container">
                          {predictions.map((prediction, index) => (
                              <div
                                  key={index}
                                  className={getPredictionClassName(prediction.probability)}
                              >
                                <span className="label">{prediction.label}</span>
                                <div className="d-flex align-items-center">
                                  <span className="probability me-2">{prediction.percentage}</span>
                                  <div className="progress-bar">
                                    <div
                                        className={getProgressFillClassName(prediction.probability)}
                                        style={{ width: prediction.percentage }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                      </Card>
                    </>
                ) : sarIsUsed ? (
                    <>
                      {/*SAR Signal Viewer*/}
                      <Card className="signal-viewer-card" padding="p-8">
                        <div className="signal-viewer-content">
                          <div className="signal-header">
                            <div className="w-12 h-12 radar-icon rounded-lg flex items-center justify-center mx-auto">
                              {loading ? (
                                  <svg className="animate-spin" width="24" height="24"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                              ) : (
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
                              )}
                            </div>
                            <h2>SAR Signal Analysis</h2>
                            <p className="signal-subtitle">RF Signal Visualization - Target regions highlighted in red</p>
                            {currentFile && (
                                <p className="file-name">File: {currentFile.name}</p>
                            )}
                            {fileType === 'sar' && sarData && (
                                <p className="data-info">
                                  Samples: {sarData.data?.length || 0} | Type: {sarData.type}
                                </p>
                            )}
                          </div>

                          {/* Message Display */}
                          {message && (
                              <div className={`p-4 rounded-lg ${
                                  message.includes('successfully')
                                      ? 'message-success bg-green-100 text-green-800 border border-green-200'
                                      : 'message-error bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {message}
                              </div>
                          )}

                          <div className="audio-player">
                            <div className="text-center space-y-4">
                              <div className="space-y-2">
                                {/* Unified Signal Viewer */}
                                <SignalViewer
                                    file={currentFile}
                                    fileType={fileType}
                                    sarData={sarData}
                                    isPlaying={isPlaying}
                                    currentTime={currentTime}
                                    onTimeUpdate={setCurrentTime}
                                />
                                {/*<p className="text-sm text-muted-foreground">{formatTime(currentTime)} / {duration ? formatTime(parseFloat(duration)) : formatTime(0)}</p>*/}
                              </div>

                              <div className="flex justify-center space-x-4">
                                {fileType === 'sar' && sarData && (
                                    isPlaying ? (
                                        <Button
                                            className="button btn btn-outline-danger"
                                            onClick={handlePause}
                                        >
                                          ⏸️ Pause Signal
                                        </Button>
                                    ) : (
                                        <Button
                                            className="button player-btn button-scientific"
                                            onClick={handlePlay}
                                        >
                                          ▶️ Play Signal
                                        </Button>
                                    )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* SAR Analysis Results */}
                      {fileType === 'sar' && !errorHappened && (
                          <Card className="analysis-results-card sar-results" padding="p-6">
                            <div className="analysis-results">
                              <h2>SAR Analysis Results</h2>
                              <div className="results-grid">
                                <div className="analysis-section">
                                  <h3>Terrain Analysis</h3>
                                  <div className="result-item">
                                    <span className="label">Terrain Type:</span>
                                    <span className="value">terrainType</span>
                                  </div>
                                  <div className="result-item">
                                    <span className="label">Signal Strength:</span>
                                    <span className="value">signalStrength</span>
                                  </div>
                                  <div className="result-item">
                                    <span className="label">Potential Targets:</span>
                                    <span className="value">potentialTargets</span>
                                  </div>
                                </div>

                                <div className="analysis-section">
                                  <h3>Signal Statistics</h3>
                                  <div className="result-item">
                                    <span className="label">Sample Count:</span>
                                    <span className="value">sampleCount</span>
                                  </div>
                                  <div className="result-item">
                                    <span className="label">Max Amplitude:</span>
                                    <span className="value">maxAmplitude</span>
                                  </div>
                                  <div className="result-item">
                                    <span className="label">Signal Variance:</span>
                                    <span className="value">signalVariance</span>
                                  </div>
                                  <div className="result-item">
                                    <span className="label">Estimated Resolution:</span>
                                    <span className="value">estimatedResolution</span>
                                  </div>
                                </div>
                              </div>

                              <div className="recommendations-section">
                                <h3>Recommendations</h3>
                                recommendations list
                                {/*<ul className="recommendations-list">*/}
                                {/*  {recommendations.map((rec, index) => (*/}
                                {/*      <li key={index}>{rec}</li>*/}
                                {/*  ))}*/}
                                {/*</ul>*/}
                              </div>
                            </div>
                          </Card>
                      )}
                    </>
                ) : (
                    <Card className="signal-viewer-card" padding="p-8">
                      <div className="signal-header">
                        <div className="w-12 h-12 radar-icon rounded-lg flex items-center justify-center mx-auto">
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
                        <h2>Radar Analysis Platform</h2>
                        <p>Choose the type of signal analysis you want to perform: Drone Detection or SAR Classification</p>
                      </div>
                    </Card>
                ) }

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
                        <li>• Click "Start Detection" to begin listening</li>
                        <li>• Allow microphone access when prompted</li>
                        <li>• The system will analyze sounds in real-time</li>
                        <li>• Green bars indicate detected sounds with high confidence</li>
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