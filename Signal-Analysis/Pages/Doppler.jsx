import { useState, useRef, useEffect } from "react";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import Input from "../src/Components/ui/input";
import Footer from "../src/Components/Footer";
import SoundVisualizer from "../src/Components/Doppler/SoundVisualizer.jsx";
import { isAudioFile, formatTime } from "../src/utils/AudioUtils.js";

const Doppler = () => {
  // State for input fields
  const [frequency, setFrequency] = useState('');
  const [velocity, setVelocity] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Audio state
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioFileIndex, setAudioFileIndex] = useState(0);
  const audioFilesNumber = 4;

  // Refs
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const frequencyRef = useRef(null);
  const velocityRef = useRef(null);
  const durationRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const resetInputs = () => {
    setFrequency('');
    frequencyRef.current.value = '';
    setVelocity('');
    velocityRef.current.value = '';
    setDuration('');
    durationRef.current.value = '';
  }

  const resetParameters = () => {
    setSelectedFile(null);
    setCurrentTime(0);
    setAudioUrl(null);
    setAudioLoaded(false);
  }

  // Function to get doppler car frequency and velocity
  const handleDopplerAnalysis = async (fileToDetect) => {
    // Create FormData object
    const formData = new FormData();
    formData.append('audio', fileToDetect);

    // Optional: Add additional parameters if needed
    formData.append('filename', fileToDetect.name);
    formData.append('filetype', fileToDetect.type);
    formData.append('filesize', fileToDetect.size.toString());

    console.log('Sending audio file to doppler detection:', {
      name: fileToDetect.name,
      type: fileToDetect.type,
      size: fileToDetect.size
    });

    // Make the API request
    const response = await fetch('/api/doppler/analysis', {
      method: 'POST',
      body: formData
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      setMessage(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Parse the JSON response
    return await response.json();
  };

  // Function to handle choosing file
  const handleChooseFile = async (e) => {
    resetParameters();

    const fileSelected = e.target.files[0];
    e.target.value = '';
    setLoading(true);
    // Delay
    setMessage('');

    if (fileSelected === undefined || !isAudioFile(fileSelected))
    {
      setMessage('The signal should be an audio file.')
      return;
    }

    // Create object URL from the file
    const fileUrl = URL.createObjectURL(fileSelected);
    setAudioUrl(fileUrl);

    console.log('Your audio uploaded successfully');
    setSelectedFile(fileSelected);

    // Analyze doppler parameters: frequency and velocity
    try {
      const {frequency, velocity} = await handleDopplerAnalysis(fileSelected);
      setFrequency(frequency);
      setVelocity(velocity);

      console.log(`Doppler detection results: {frequency: ${frequency}, velocity: ${velocity}}`);
      setMessage("Analysis completed successfully.");

    } catch (error) {
      console.error('Error uploading signal:', error);
      setMessage(`Failed to upload signal: ${error.message}`);

    } finally {
      setLoading(false);
    }
  };

  const fileFromAudioRef = async (audioReference, audioSrc, filename) => {
    console.log(audioReference.current);
    console.log(audioSrc);
    if (!audioReference.current || !audioSrc) return null;
    const response = await fetch(audioSrc);
    const data = await response.blob();
    return new File([data], filename, { type: data.type });
  };

  // Function to handle the load some data
  const handleLoadSomeData = async () => {
    resetParameters();

    setLoading(true);
    // Delay
    setMessage('');

    // Get sample data from dataset folder
    const fileNameFromIndex =  audioFileIndex + '.mp3';
    const fileUrl = '../testing_data/doppler/' + fileNameFromIndex;
    setAudioUrl(fileUrl);

    // Update the index
    setAudioFileIndex(audioFileIndex >= audioFilesNumber - 1 ? 0 : audioFileIndex + 1)

    console.log('Audio uploaded successfully');

    // Analyze doppler parameters: frequency and velocity
    try {
      const loaded = await fileFromAudioRef(audioRef, fileUrl, fileNameFromIndex);
      setSelectedFile(loaded);
      const {frequency_2, velocity_2} = await handleDopplerAnalysis(loaded);
      setFrequency(frequency_2);
      setVelocity(velocity_2);

      console.log(`Doppler detection results: {frequency: ${frequency_2}, velocity: ${velocity_2}}`);
      setMessage("Analysis completed successfully.");

    } catch (error) {
      console.error('Error uploading signal:', error);
      setMessage(`Failed to upload signal: ${error.message}`);

    } finally {
      setLoading(false);
    }
  };

  // Function to handle the API request
  const handleGenerateSignal = async () => {
    resetParameters();

    // Validate inputs
    if (!frequency || !velocity || !duration) {
      setMessage('Please enter frequency, velocity, and duration values.');
      resetInputs();
      return;
    }

    // Convert to numbers and validate
    const freqNum = parseFloat(frequency);
    const velNum = parseFloat(velocity);
    const durNum = parseFloat(duration);

    if (isNaN(freqNum) || isNaN(velNum) || isNaN(durNum)) {
      setMessage('Please enter valid numbers for frequency, velocity, and duration.');
      resetInputs();
      return;
    }

    if (freqNum < 100 || freqNum > 800 ||
        velNum < 5 || velNum > 60 ||
        durNum < 1 || durNum > 8) {
      setMessage('- Frequency must be in range 100-800 Hz\n' +
                       '- Velocity must be in range 5-60 m/s\n' +
                       '- Duration must be in range 1-8 sec');
      resetInputs();
      return;
    }

    setLoading(true);
    // Delay
    setMessage('');

    try {
      // Create the request data object
      const requestData = {
        frequency: freqNum,
        velocity: velNum,
        duration: durNum
      };

      console.log('Sending request data:', requestData);

      // Make the API request
      const response = await fetch('/api/doppler/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 1
        },
        body: JSON.stringify(requestData)
      });

      console.log('Doppler detection results:', response);
      // Check if the request was successful
      if (!response.ok) {
        setMessage(`Failed to fetch! status: ${response.status}`);
        resetInputs();
        return;
      }

      // Get the audio blob from response
      const audioBlob = await response.blob();

      // Create a URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

      console.log('Audio generated successfully');
      setSelectedFile(audioBlob);
      setMessage('Signal generated successfully! Audio is ready to play.');

    } catch (error) {
      console.error('Error generating signal:', error);
      setMessage(`Failed to generate signal: ${error.message}`);
      resetInputs();
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
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
                  <div className="w-10 h-10 bg-signal-doppler/10 rounded-lg flex items-center justify-center">
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
                        className="w-6 h-6 text-signal-doppler"
                    >
                      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    </svg>
                  </div>

                  <div className="ms-3">
                    <h1 className="text-2xl font-bold text-foreground">Doppler Analysis</h1>
                    <p className="text-muted-foreground">Frequency & Velocity Signal Processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-doppler mx-auto px-0 py-12 flex-1">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generate Doppler Effect Card */}
              <Card className="d-flex align-items-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-signal-doppler/10 rounded-lg flex items-center justify-center mx-auto">
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
                        className="w-6 h-6 text-signal-doppler"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>

                  <h3>Generate Doppler Effect</h3>
                  <p className="text-muted-foreground text-sm">
                    Simulate Doppler shift using custom velocity and frequency parameters
                  </p>

                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Source Frequency (Hz)
                      </label>
                      <Input ref={frequencyRef} type="number" onChange={(e) => setFrequency(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Velocity (m/s)
                      </label>
                      <Input ref={velocityRef} type="number" onChange={(e) => setVelocity(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Duration (sec)
                      </label>
                      <Input ref={durationRef} type="number" onChange={(e) => setDuration(e.target.value)} />
                    </div>

                    <Button
                        className="button-primary w-full border-0"
                        onClick={handleGenerateSignal}
                        disabled={loading}
                    >
                      Generate Doppler Car Signal
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Analyze Doppler Signal Card */}
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-signal-doppler/10 rounded-lg flex items-center justify-center mx-auto">
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
                        className="w-6 h-6 text-signal-doppler"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" x2="12" y1="3" y2="15"></line>
                    </svg>
                  </div>

                  <h3>Analyze Doppler Signal</h3>
                  <p className="text-muted-foreground text-sm">
                    Extract velocity and frequency information from audio signals
                  </p>

                  <div className="upload-area">
                    <div className="text-center space-y-3">
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
                          className="w-8 h-8 text-signal-doppler mx-auto"
                      >
                        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      </svg>

                      <div>
                        <p className="font-medium text-foreground">Load audio signal data</p>
                        <p className="text-muted-foreground text-sm">From audio dataset</p>
                      </div>

                      <div className="space-y-3">
                        <Input
                            type="file"
                            accept="audio/*"
                            className="input-file"
                            onChange={handleChooseFile}
                        />
                        <p className="text-muted-foreground text-sm">or</p>
                        <Button className="border-0 button-warning"
                                onClick={handleLoadSomeData}
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

            {/* Audio Player Section */}
            <Card className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-signal-doppler/10 rounded-full flex items-center justify-center mx-auto">
                    {loading ? (
                        <svg className="animate-spin" width="24" height="24"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : audioUrl ? (
                        <div className="text-signal-doppler text-4xl">
                          {isPlaying ? '🔊' : '🎵'}
                        </div>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="44"
                            height="44"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-14 h-14 text-signal-doppler"
                        >
                          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        </svg>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                      Audio Signal Player
                    </h2>

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
                </div>

                <div className="audio-player">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <SoundVisualizer file={selectedFile} audioRef={audioRef} />
                      <p className="text-sm text-muted-foreground">{formatTime(currentTime)} / {duration ? formatTime(parseFloat(duration)) : formatTime(0)}</p>
                    </div>

                    <div className="flex justify-center space-x-4">
                          {isPlaying ? (
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
                          )}
                        </div>
                  </div>
                </div>

                {/* Hidden audio element */}
                <audio
                    ref={audioRef}
                    src={audioUrl || null}
                    onLoadedMetadata={handleAudioLoaded}
                    preload="metadata"
                />

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="text-center space-y-3">
                      <h3>Velocity</h3>
                      <div className="text-3xl font-bold text-signal-doppler">{velocity || '0'} m/s</div>
                      <p className="text-sm text-muted-foreground">({(parseFloat(velocity) * 3.6) || '0'} km/h)</p>
                      <p className="text-sm text-muted-foreground">Calculated velocity</p>
                    </div>
                  </Card>

                  <Card>
                    <div className="text-center space-y-3">
                      <h3>Frequency</h3>
                      <div className="text-3xl font-bold text-signal-doppler">{frequency || '0'} Hz</div>
                      <p className="text-sm text-muted-foreground">Source frequency</p>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Velocity Detection",
                  description: "Precise velocity measurement from Doppler-shifted signals",
                  icon: "check"
                },
                {
                  title: "Frequency Analysis",
                  description: "Detailed spectral analysis and frequency shift calculation",
                  icon: "check"
                },
                {
                  title: "Motion Tracking",
                  description: "Track moving objects and analyze motion patterns",
                  icon: "check"
                },
                {
                  title: "Real-time Processing",
                  description: "Live Doppler analysis and parameter estimation",
                  icon: "check"
                }
              ].map((feature, index) => (
                  <Card key={index}>
                    <div className="flex items-start space-x-4">
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
                          className="w-6 h-6 text-success mt-1"
                      >
                        <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                        <path d="m9 11 3 3L22 4"></path>
                      </svg>

                      <div>
                        <h3>{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
              ))}
            </div>

            {/* Usage Guidelines */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start space-x-3">
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
                    className="w-5 h-5 text-warning mt-1"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>

                <div className="ms-3">
                  <h3>Usage Guidelines</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Audio signals should be sampled at minimum 44.1 kHz</li>
                    <li>For generation: Enter source frequency (100-800 Hz) and velocity (5 to 60 m/s)</li>
                    <li>For analysis: Upload clear audio with minimal background noise</li>
                    <li>Maximum file size: 25MB per upload</li>
                    <li>Best results with mono audio recordings</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
  );
};

export default Doppler;