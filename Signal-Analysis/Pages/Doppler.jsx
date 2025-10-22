import {useEffect, useRef, useState} from "react";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import Input from "../src/Components/ui/input";
import Footer from "../src/Components/Footer";
import SoundVisualizer from "../src/Components/Doppler/SoundVisualizer.jsx";
import Slider from "../src/Components/aliasing/slider";
import {formatTime, isAudioFile} from "../src/utils/AudioUtils.js";

const Doppler = () => {
  // State for input fields
  const [frequency, setFrequency] = useState('');
  const [velocity, setVelocity] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [originalFile, setOriginalFile] = useState(null);
  const [resampledDownloadUrl, setResampledDownloadUrl] = useState(null);
  const [fileFormat, setFileFormat] = useState('wav');
  const [resampledFile, setResampledFile] = useState(null);

  // Audio state - separate for original and resampled
  const [originalAudioUrl, setOriginalAudioUrl] = useState('');
  const [resampledAudioUrl, setResampledAudioUrl] = useState('');
  const [originalIsPlaying, setOriginalIsPlaying] = useState(false);
  const [resampledIsPlaying, setResampledIsPlaying] = useState(false);
  const [originalCurrentTime, setOriginalCurrentTime] = useState(0);
  const [resampledCurrentTime, setResampledCurrentTime] = useState(0);
  const [originalAudioLoaded, setOriginalAudioLoaded] = useState(false);
  const [resampledAudioLoaded, setResampledAudioLoaded] = useState(false);
  const [audioFileIndex, setAudioFileIndex] = useState(0);
  const audioFilesNumber = 4;

  // Refs
  const originalAudioRef = useRef(null);
  const resampledAudioRef = useRef(null);
  const originalProgressIntervalRef = useRef(null);
  const resampledProgressIntervalRef = useRef(null);
  const frequencyRef = useRef(null);
  const velocityRef = useRef(null);
  const durationRef = useRef(null);
  const monoOptionRef = useRef(false);

  const resetInputs = () => {
    frequencyRef.current.value = '';
    velocityRef.current.value = '';
    durationRef.current.value = '';
    setFrequency('');
    setVelocity('');
    setDuration('');
  }

  const resetParameters = () => {
    setDetails(null);
    setOriginalCurrentTime(0);
    setOriginalAudioUrl('');
    setOriginalFile(null);
    setOriginalAudioLoaded(false);
    setFileFormat('wav');
    handleResetToOriginal();
  }

  // Function to get doppler car frequency and velocity
  const handleDopplerAnalysis = async (fileToDetect) => {
    const formData = new FormData();
    formData.append('file', fileToDetect);

    return await fetch('/api/doppler/analysis', {
      method: 'POST',
      body: formData
    });
  };

  // Function to handle resampling
  const handleResample = async (targetSr) => {
    if (!originalFile) {
      setMessage('No original audio file available for resampling.');
      return;
    }

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', originalFile);
    formData.append('target_sr', targetSr.toString());
    formData.append('mono', monoOptionRef.current.toString());
    formData.append('format', fileFormat);

    try {
      const response = await fetch('/api/resample/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.error || 'Resampling failed');
        return;
      }

      const resampledBlob = await response.blob();
      const resampledUrl = URL.createObjectURL(resampledBlob);
      setResampledAudioUrl(resampledUrl);
      setResampledFile(new File([resampledBlob], `resampled.${fileFormat}`));

      // Create download link
      const downloadUrl = URL.createObjectURL(resampledBlob);
      setResampledDownloadUrl({
        url: downloadUrl,
        filename: `resampled_${targetSr}Hz.${fileFormat}`
      });

      setMessage('Audio resampled successfully!');

    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to reset to original audio
  const handleResetToOriginal = () => {
    setMessage('');
    setResampledFile(null);
    setResampledDownloadUrl(null);
    setResampledAudioUrl('');
    setResampledAudioLoaded(false);
    setResampledCurrentTime(0);
    setResampledIsPlaying(false);
    stopResampledProgressUpdate();
  };

  // Function to handle choosing file
  const handleChooseFile = async (e) => {
    resetParameters();
    resetInputs();

    const fileSelected = e.target.files[0];
    e.target.value = '';
    setLoading(true);
    setMessage('');

    if (fileSelected === undefined || !isAudioFile(fileSelected)) {
      setMessage('The signal should be an audio file. Only .wav and .mp3 are supported.');
      return;
    }

    const fileUrl = URL.createObjectURL(fileSelected);
    setOriginalAudioUrl(fileUrl);
    setOriginalFile(fileSelected);
    setFileFormat(fileSelected.name.split('.').pop());

    try {
      const response = await handleDopplerAnalysis(fileSelected);

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`Failed to fetch! status: ${response.status}`);
        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        return;
      }

      const {details} = await response.json();
      setDetails(details);

      console.log(`Doppler detection results: {frequency: '${details.frequency_min}-${details.frequency_max} Hz', velocity: '${details.velocity_min_ms}-${details.velocity_max_ms} m/s'`);
      setMessage("Analysis completed successfully.");

    } catch (error) {
      console.error('Error uploading signal:', error);
      setMessage(`Failed to upload signal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fileFromAudioRef = async (audioReference, audioSrc, filename) => {
    if (!audioReference.current || !audioSrc) return null;
    const response = await fetch(audioSrc);
    const data = await response.blob();
    return new File([data], filename, { type: data.type });
  };

  // Function to handle the load some data
  const handleLoadSomeData = async () => {
    resetParameters();
    resetInputs();

    setLoading(true);
    setMessage('');

    const fileNameFromIndex = audioFileIndex + '.mp3';
    const fileUrl = '../testing_data/doppler/' + fileNameFromIndex;
    setOriginalAudioUrl(fileUrl);
    setAudioFileIndex(audioFileIndex >= audioFilesNumber - 1 ? 0 : audioFileIndex + 1);
    setFileFormat('mp3');

    try {
      const loaded = await fileFromAudioRef(originalAudioRef, fileUrl, fileNameFromIndex);
      setOriginalFile(loaded);
      const response = await handleDopplerAnalysis(loaded);

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`Failed to fetch! status: ${response.status}`);
        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        return;
      }

      const {details} = await response.json();
      setDetails(details);

      console.log(`Doppler detection results: {frequency: '${details.frequency_min.toPrecision(3)}-${details.frequency_max.toPrecision(3)} Hz', velocity: '${details.velocity_min_ms.toPrecision(3)}-${details.velocity_max_ms.toPrecision(3)} m/s'`);
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

    if (!frequency || !velocity || !duration) {
      setMessage('Please enter frequency, velocity, and duration values.');
      resetInputs();
      return;
    }

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
    setMessage('');

    try {
      const requestData = {
        frequency: freqNum,
        velocity: velNum,
        duration: durNum
      };

      console.log('Sending request data:', requestData);

      const response = await fetch('/api/doppler/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 1
        },
        body: JSON.stringify(requestData)
      });

      console.log('Doppler detection results:', response);

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`Failed to fetch! status: ${response.status}`);
        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        resetInputs();
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setOriginalAudioUrl(audioUrl);

      const generatedFile = new File([audioBlob], 'generated_doppler.wav', { type: 'audio/wav' });
      setOriginalFile(generatedFile);
      setFileFormat('wav');

      setMessage('Signal generated successfully! Audio is ready to play.');

    } catch (error) {
      console.error('Error generating signal:', error);
      setMessage(`Failed to generate signal: ${error.message}`);
      resetInputs();
    } finally {
      setLoading(false);
    }
  };

  // Original Audio Functions
  const handleOriginalAudioLoaded = () => {
    if (originalAudioRef.current) {
      setDuration(originalAudioRef.current.duration);
      setOriginalAudioLoaded(true);
      console.log('Original audio loaded, duration:', originalAudioRef.current.duration);
    }
  };

  const handlePlayOriginalAudio = () => {
    if (originalAudioRef.current && originalAudioUrl) {
      originalAudioRef.current.play()
          .then(() => {
            setOriginalIsPlaying(true);
            startOriginalProgressUpdate();
          })
          .catch(error => {
            console.error('Error playing original audio:', error);
            setMessage('Error playing original audio: ' + error.message);
          });
    }
  };

  const handlePauseOriginalAudio = () => {
    if (originalAudioRef.current) {
      originalAudioRef.current.pause();
      setOriginalIsPlaying(false);
      stopOriginalProgressUpdate();
    }
  };

  const updateOriginalProgress = () => {
    if (originalAudioRef.current) {
      setOriginalCurrentTime(originalAudioRef.current.currentTime);

      if (originalAudioRef.current.currentTime >= originalAudioRef.current.duration) {
        setOriginalIsPlaying(false);
        setOriginalCurrentTime(0);
        stopOriginalProgressUpdate();
      }
    }
  };

  const startOriginalProgressUpdate = () => {
    originalProgressIntervalRef.current = setInterval(updateOriginalProgress, 100);
  };

  const stopOriginalProgressUpdate = () => {
    if (originalProgressIntervalRef.current) {
      clearInterval(originalProgressIntervalRef.current);
      originalProgressIntervalRef.current = null;
    }
  };

  // Resampled Audio Functions
  const handleResampledAudioLoaded = () => {
    if (resampledAudioRef.current) {
      setResampledAudioLoaded(true);
      console.log('Resampled audio loaded, duration:', resampledAudioRef.current.duration);
    }
  };

  const handlePlayResampledAudio = () => {
    if (resampledAudioRef.current && resampledAudioUrl) {
      resampledAudioRef.current.play()
          .then(() => {
            setResampledIsPlaying(true);
            startResampledProgressUpdate();
          })
          .catch(error => {
            console.error('Error playing resampled audio:', error);
            setMessage('Error playing resampled audio: ' + error.message);
          });
    }
  };

  const handlePauseResampledAudio = () => {
    if (resampledAudioRef.current) {
      resampledAudioRef.current.pause();
      setResampledIsPlaying(false);
      stopResampledProgressUpdate();
    }
  };

  const updateResampledProgress = () => {
    if (resampledAudioRef.current) {
      setResampledCurrentTime(resampledAudioRef.current.currentTime);

      if (resampledAudioRef.current.currentTime >= resampledAudioRef.current.duration) {
        setResampledIsPlaying(false);
        setResampledCurrentTime(0);
        stopResampledProgressUpdate();
      }
    }
  };

  const startResampledProgressUpdate = () => {
    resampledProgressIntervalRef.current = setInterval(updateResampledProgress, 100);
  };

  const stopResampledProgressUpdate = () => {
    if (resampledProgressIntervalRef.current) {
      clearInterval(resampledProgressIntervalRef.current);
      resampledProgressIntervalRef.current = null;
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopOriginalProgressUpdate();
      stopResampledProgressUpdate();
      if (originalAudioUrl) {
        URL.revokeObjectURL(originalAudioUrl);
      }
      if (resampledAudioUrl) {
        URL.revokeObjectURL(resampledAudioUrl);
      }
    };
  }, [originalAudioUrl, resampledAudioUrl]);

  // Handle audio end for both players
  useEffect(() => {
    const originalAudio = originalAudioRef.current;
    const resampledAudio = resampledAudioRef.current;

    const handleOriginalEnded = () => {
      setOriginalIsPlaying(false);
      setOriginalCurrentTime(0);
      stopOriginalProgressUpdate();
    };

    const handleResampledEnded = () => {
      setResampledIsPlaying(false);
      setResampledCurrentTime(0);
      stopResampledProgressUpdate();
    };

    if (originalAudio) {
      originalAudio.addEventListener('ended', handleOriginalEnded);
    }
    if (resampledAudio) {
      resampledAudio.addEventListener('ended', handleResampledEnded);
    }

    return () => {
      if (originalAudio) {
        originalAudio.removeEventListener('ended', handleOriginalEnded);
      }
      if (resampledAudio) {
        resampledAudio.removeEventListener('ended', handleResampledEnded);
      }
    };
  }, [originalAudioUrl, resampledAudioUrl]);

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
          <div className="max-w-6xl mx-auto space-y-8">
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
                            accept=".wav,.mp3"
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

            {/* Audio Player Section - for dual viewers */}
            <Card className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-signal-doppler/10 rounded-full flex items-center justify-center mx-auto">
                    {loading ? (
                        <svg className="animate-spin" width="24" height="24"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : originalAudioUrl ? (
                        <div className="text-signal-doppler">
                          {originalIsPlaying || resampledIsPlaying ? '🔊' : '🎵'}
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
                      Audio Signal Comparison
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

                    <div className="w-75 h-75 mt-4 mx-auto">
                      <Slider
                          loading={loading}
                          label="Sampling Frequency"
                          unit="Hz"
                          min={20000}
                          max={40000}
                          OnChange={async (frequency) => {await handleResample(frequency);}}
                          handleClearAliasing={handleResetToOriginal}
                          className="w-full rounded-lg appearance-none cursor-pointer"
                          resampledDownloadUrl={resampledDownloadUrl}
                      >
                      </Slider>
                    </div>
                  </div>
                </div>

                {/* Dual Audio Players */}
                <div className="flex align-items-center justify-content-between">
                  {/* Original Audio Player */}
                  <Card className="w-full p-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold text-card-foreground">Original Audio</h3>

                      <div className="space-y-2">
                        <SoundVisualizer file={originalFile} audioRef={originalAudioRef} />
                        <p className="text-sm text-muted-foreground">
                          {formatTime(originalCurrentTime)} / {duration ? formatTime(parseFloat(duration)) : formatTime(0)}
                        </p>
                      </div>

                      <div className="flex justify-center space-x-4">
                        {originalIsPlaying ? (
                            <Button
                                className="button btn btn-outline-danger"
                                onClick={handlePauseOriginalAudio}
                            >
                              ⏸️ Pause
                            </Button>
                        ) : (
                            <Button
                                className="button player-btn button-scientific"
                                onClick={handlePlayOriginalAudio}
                                disabled={!originalAudioLoaded}
                            >
                              ▶️ Play Original
                            </Button>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Resampled Audio Player */}
                  {resampledAudioUrl && (
                      <Card className="w-full p-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold text-card-foreground">Resampled Audio</h3>

                          <div className="space-y-2">
                            <SoundVisualizer file={resampledFile} audioRef={resampledAudioRef} />
                            <p className="text-sm text-muted-foreground">
                              {formatTime(resampledCurrentTime)} / {duration ? formatTime(parseFloat(duration)) : formatTime(0)}
                            </p>
                          </div>

                          <div className="flex justify-center space-x-4">
                            {resampledIsPlaying ? (
                                <Button
                                    className="button btn btn-outline-danger"
                                    onClick={handlePauseResampledAudio}
                                >
                                  ⏸️ Pause
                                </Button>
                            ) : (
                                <Button
                                    className="button player-btn button-scientific"
                                    onClick={handlePlayResampledAudio}
                                    disabled={!resampledAudioLoaded}
                                >
                                  ▶️ Play Resampled
                                </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                  )}
                </div>

                {/* Hidden audio elements */}
                <audio
                    ref={originalAudioRef}
                    src={originalAudioUrl || null}
                    onLoadedMetadata={handleOriginalAudioLoaded}
                    preload="metadata"
                />
                <audio
                    ref={resampledAudioRef}
                    src={resampledAudioUrl || null}
                    onLoadedMetadata={handleResampledAudioLoaded}
                    preload="metadata"
                />

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="text-center space-y-3">
                      <h3>Velocity</h3>
                      {details ? (
                          <>
                            <div className="text-3xl font-bold text-signal-doppler">{details.velocity_min_ms.toPrecision(3) === details.velocity_max_ms.toPrecision(3)
                                ? details.velocity_min_ms.toPrecision(3)
                                : details.velocity_min_ms.toPrecision(3) + ' - ' + details.velocity_max_ms.toPrecision(3)} m/s
                            </div>
                            <p className="text-sm text-muted-foreground">({details.velocity_min_kmh.toPrecision(3) === details.velocity_max_kmh.toPrecision(3)
                                ? details.velocity_min_kmh.toPrecision(3)
                                : details.velocity_min_kmh.toPrecision(3) + ' - ' + details.velocity_max_kmh.toPrecision(3)} km/h)
                            </p>
                          </>
                      ) : (
                          <>
                            <div className="text-3xl font-bold text-signal-doppler">{velocity || '0'} m/s</div>
                            <p className="text-sm text-muted-foreground">({velocity ? (parseFloat(velocity) * 3.6).toPrecision(3) : '0'} km/h)</p>
                          </>
                      )}
                      <p className="text-sm text-muted-foreground">Calculated velocity</p>
                    </div>
                  </Card>

                  <Card>
                    <div className="text-center space-y-3">
                      <h3>Frequency</h3>
                      {details ? (
                          <div className="text-3xl font-bold text-signal-doppler">{details.frequency_min.toPrecision(3) === details.frequency_max.toPrecision(3)
                              ? details.frequency_min.toPrecision(3)
                              : details.frequency_min.toPrecision(3) + ' - ' + details.frequency_max.toPrecision(3)} Hz
                          </div>
                      ) : (
                          <div className="text-3xl font-bold text-signal-doppler">{frequency ? parseFloat(frequency).toPrecision(3) : '0'} Hz</div>
                      )}
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