import {useState, useRef, useEffect} from 'react';
import Card from '../src/Components/ui/card';
import Button from '../src/Components/ui/button';
import Input from '../src/Components/ui/input';
import SignalViewer from '../src/Components/Radar/SignalViewer.jsx';
import Footer from '../src/Components/Footer';
import { isAudioFile, formatTime } from '../src/utils/audioUtils';
import '../styles/radar.css';

const Radar = () => {
  const [isDrone, setIsDrone] = useState(false);
  const [object, setObject] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(0);

  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [sarData, setSarData] = useState(null);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [duration, setDuration] = useState('');
  const [audioFileIndex, setAudioFileIndex] = useState(0);
  const [sarFileIndex, setSarFileIndex] = useState(0);
  const audioFilesNumber = 5;
  const sarFilesNumber = 5;
  const [message, setMessage] = useState('');
  const [errorHappened, setErrorHappened] = useState(false);

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
    setAudioUrl(null);
    setAudioLoaded(false);
    setErrorHappened(false);
    setIsPlaying(false);
  }

  // Function to handle audio play
  const handlePlayAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            startProgressUpdate();
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setMessage('Error playing audio: ' + error.message);
          });
    }
  };

  // Function to handle audio pause
  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopProgressUpdate();
    }
  };

  // Function to update progress bar
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);

      // Check if audio ended
      if (audioRef.current.currentTime >= audioRef.current.duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        stopProgressUpdate();
      }
    }
  };

  // Start progress update interval
  const startProgressUpdate = () => {
    progressIntervalRef.current = setInterval(updateProgress, 100);
  };

  // Stop progress update interval
  const stopProgressUpdate = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Function to handle audio loaded
  const handleAudioLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioLoaded(true);
      console.log('Audio loaded, duration:', audioRef.current.duration);
    }
  };

  const handleAudioFileChange = async (event) => {
    resetParameters();

    const file = event.target.files[0];
    event.target.value = '';
    if (file === undefined || !isAudioFile(file)) {
      setMessage('Please select a valid audio file (MP3, WAV, OGG, etc.)');
      setErrorHappened(true);
      return;
    }

    // Create object URL from the file
    const fileUrl = URL.createObjectURL(file);
    setAudioUrl(fileUrl);
    console.log('Your audio uploaded successfully');
    setCurrentFile(file);
    setFileType('audio');
    setSarData(null);

    setLoading(true);
    setMessage('');

    try {
      const {isDrone, object, confidenceLevel} = await analyzeDroneAudio(file);
      setIsDrone(isDrone);
      setObject(object);
      setConfidenceLevel(confidenceLevel);

      console.log(`Drone detection results: {isDrone: ${isDrone}, object: ${object}, confidenceLevel: ${confidenceLevel}}`);
      setMessage("Drone analysis completed successfully.");
    } catch (error) {
      console.error('Error uploading signal:', error);
      setMessage(`Failed to upload signal: ${error.message}`);
      setErrorHappened(true);
    } finally {
      setLoading(false);
    }
  };

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

  const getVisualizerTitle = () => {
    switch (fileType) {
      case 'audio':
        return 'Audio Signal Analysis';
      case 'sar':
        return 'SAR Signal Analysis';
      default:
        return 'Signal Analysis';
    }
  };

  const getVisualizerSubtitle = () => {
    switch (fileType) {
      case 'audio':
        return 'Waveform Visualization - Click on waveform to seek';
      case 'sar':
        return 'RF Signal Visualization - Target regions highlighted in red';
      default:
        return 'Load data to begin analysis';
    }
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

  const handleLoadSampleAudio = async () => {
    resetParameters();

    setLoading(true);
    setMessage('');

    // Get sample data from dataset folder
    const fileNameFromIndex =  audioFileIndex + '.mp3';
    const fileUrl = '../datasets/drone/' + fileNameFromIndex;
    setAudioUrl(fileUrl);

    // Update the index
    setAudioFileIndex(audioFileIndex >= audioFilesNumber - 1 ? 0 : audioFileIndex + 1)

    console.log('Audio uploaded successfully');

    try {
      const loaded = await fileFromReference(fileUrl, fileNameFromIndex, 'audio/mpeg');
      setCurrentFile(loaded);

      const {isDrone, object, confidenceLevel} = await analyzeDroneAudio(loaded);
      setIsDrone(isDrone);
      setObject(object);
      setConfidenceLevel(confidenceLevel);
      setFileType('audio');
      setSarData(null);

      console.log(`Drone detection results: {isDrone: ${isDrone}, object: ${object}, confidenceLevel: ${confidenceLevel}}`);
      setMessage("Drone analysis completed successfully.");

    } catch (error) {
      console.error('Error uploading signal:', error);
      setMessage(`Failed to upload signal: ${error.message}`);
      setErrorHappened(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleSar = async () => {
    resetParameters();

    setLoading(true);
    setMessage('');

    // Get sample data from dataset folder
    const fileNameFromIndex = sarFileIndex + '.csv';
    const fileUrl = '../datasets/SAR/' + fileNameFromIndex;

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

  const analyzeDroneAudio = async (fileToDetect) => {
    const formData = new FormData();
    formData.append('audio', fileToDetect);

    // Optional: Add additional parameters if needed
    formData.append('filename', fileToDetect.name);
    formData.append('filetype', fileToDetect.type);
    formData.append('filesize', fileToDetect.size.toString());

    console.log('Sending audio file to drone detection:', {
      name: fileToDetect.name,
      type: fileToDetect.type,
      size: fileToDetect.size
    });

    // Make the API request
    const response = await fetch('/api/drone', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      setMessage(`HTTP error! status: ${response.status}, message: ${errorText}`);
      setErrorHappened(true);
    }

    // Parse the JSON response
    return await response.json();
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
      setMessage(`HTTP error! status: ${response.status}, message: ${errorText}`);
      setErrorHappened(true);
    }

    // Parse the JSON response
    return await response.json();
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopProgressUpdate();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        stopProgressUpdate();
      };

      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [audioUrl]);

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
                            disabled={loading}
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
                  <h2>{getVisualizerTitle()}</h2>
                  <p className="signal-subtitle">{getVisualizerSubtitle()}</p>
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
                          audioRef={audioRef}
                          isPlaying={isPlaying}
                          currentTime={currentTime}
                          onTimeUpdate={setCurrentTime}
                      />
                      <p className="text-sm text-muted-foreground">{formatTime(currentTime)} / {duration ? formatTime(parseFloat(duration)) : formatTime(0)}</p>
                    </div>

                    <div className="flex justify-center space-x-4">
                      {fileType === 'audio' && (
                          isPlaying ? (
                              <Button
                                  className="button btn btn-outline-danger"
                                  onClick={handlePauseAudio}
                              >
                                ⏸️ Pause Audio
                              </Button>
                          ) : (
                              <Button
                                  className="button player-btn button-scientific"
                                  onClick={handlePlayAudio}
                                  disabled={!audioLoaded}
                              >
                                ▶️ Play Audio
                              </Button>
                          )
                      )}
                      {fileType === 'sar' && sarData && (
                          isPlaying ? (
                              <Button
                                  className="button btn btn-outline-danger"
                                  onClick={handlePauseAudio}
                              >
                                ⏸️ Pause Signal
                              </Button>
                          ) : (
                              <Button
                                  className="button player-btn button-scientific"
                                  onClick={handlePlayAudio}
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

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={audioUrl || null}
                onLoadedMetadata={handleAudioLoaded}
                preload="metadata"
            />

            {/* Drone Analysis Results */}
            {fileType === 'audio' && !errorHappened && (
                <Card className={`analysis-results-card ${isDrone ? 'drone-detected' : 'no-drone'}`} padding="p-6">
                  <div className="analysis-results">
                    <h2>Drone Detection Results</h2>

                    <div className="detection-summary">
                      <div className={`status-indicator ${isDrone ? 'detected' : 'not-detected'}`}>
                        {isDrone ? '🚁 DRONE DETECTED' : '✅ NO DRONE DETECTED'}
                      </div>

                      <div className="confidence-level">
                        <div className="confidence-bar">
                          <div
                              className="confidence-fill"
                              style={{ width: `${confidenceLevel * 100}%` }}
                          ></div>
                        </div>
                        <span className="confidence-text">
                      Confidence: {(confidenceLevel * 100).toFixed(1)}%
                    </span>
                      </div>
                    </div>

                    <div className="results-grid">
                      <div className="analysis-section">
                        <h3>Detection Details</h3>
                        <div className="result-item">
                          <span className="label">Object Type:</span>
                          <span className="value">{object}</span>
                        </div>
                        <div className="result-item">
                          <span className="label">Detection Status:</span>
                          <span className="value">{isDrone ? 'Positive' : 'Negative'}</span>
                        </div>
                      </div>
                    </div>

                    {isDrone && (
                        <div className="alert-section">
                          <div className="alert-message">
                            ⚠️ Drone activity detected. Consider security protocols.
                          </div>
                        </div>
                    )}
                  </div>
                </Card>
            )}

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