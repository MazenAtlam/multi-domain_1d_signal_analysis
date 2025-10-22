import {useState, useRef} from "react";
import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import Input from "../src/Components/ui/input";
import Footer from "../src/Components/Footer";
import Slider from "../src/Components/aliasing/slider";
import {isAudioFile} from "../src/utils/AudioUtils.js";

const Recognition = () => {
    // State for voice recognition
    const [selectedFile, setSelectedFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [recognitionResult, setRecognitionResult] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false);

    // State for anti-aliasing
    const [antiAliasFile, setAntiAliasFile] = useState(null);
    const [antiAliasAudioUrl, setAntiAliasAudioUrl] = useState(null);
    const [antiAliasLoading, setAntiAliasLoading] = useState(false);
    const [antiAliasMessage, setAntiAliasMessage] = useState('');
    const [samplingFrequency, setSamplingFrequency] = useState(40000);

    // Refs
    const audioRef = useRef(null);
    const antiAliasAudioRef = useRef(null);

    // Voice Recognition Functions
    const handleVoiceRecognition = async (fileToRecognize) => {
        const formData = new FormData();
        formData.append('file', fileToRecognize);

        return await fetch('/api/recognition/classify', {
            method: 'POST',
            body: formData
        });
    };

    const handleChooseVoiceFile = async (e) => {
        const fileSelected = e.target.files[0];
        e.target.value = '';
        setLoading(true);
        setMessage('');
        setRecognitionResult(null);

        if (fileSelected === undefined || !isAudioFile(fileSelected)) {
            setMessage('The file should be an audio file. Only .wav and .mp3 are supported.');
            return;
        }

        const fileUrl = URL.createObjectURL(fileSelected);
        setAudioUrl(fileUrl);
        setSelectedFile(fileSelected);

        try {
            const response = await handleVoiceRecognition(fileSelected);

            if (!response.ok) {
                const errorText = await response.text();
                setMessage(`Failed to analyze voice! status: ${response.status}`);
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                return;
            }

            const result = await response.json();
            setRecognitionResult(result);
            setMessage("Voice analysis completed successfully.");

        } catch (error) {
            console.error('Error analyzing voice:', error);
            setMessage(`Failed to analyze voice: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadSampleVoiceData = async () => {
        setLoading(true);
        setMessage('');
        setRecognitionResult(null);

        // Simulate loading sample data
        setTimeout(() => {
            setRecognitionResult({
                gender: "male",
                confidence: 0.87,
                features: {
                    pitch: "Low frequency range",
                    timbre: "Rich and resonant"
                }
            });
            setMessage("Sample voice data analyzed successfully.");
            setLoading(false);
        }, 1500);
    };

    // Anti-Aliasing Functions
    const handleAntiAliasing = async (fileToProcess) => {
        const formData = new FormData();
        formData.append('file', fileToProcess);
        formData.append('sampling_frequency', samplingFrequency);

        return await fetch('/api/anti-aliasing/process', {
            method: 'POST',
            body: formData
        });
    };

    const handleChooseAntiAliasFile = async (e) => {
        const fileSelected = e.target.files[0];
        e.target.value = '';
        setAntiAliasLoading(true);
        setAntiAliasMessage('');

        if (fileSelected === undefined || !isAudioFile(fileSelected)) {
            setAntiAliasMessage('The file should be an audio file. Only .wav and .mp3 are supported.');
            return;
        }

        const fileUrl = URL.createObjectURL(fileSelected);
        setAntiAliasAudioUrl(fileUrl);
        setAntiAliasFile(fileSelected);

        try {
            const response = await handleAntiAliasing(fileSelected);

            if (!response.ok) {
                const errorText = await response.text();
                setAntiAliasMessage(`Failed to process audio! status: ${response.status}`);
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                return;
            }

            const audioBlob = await response.blob();
            const processedUrl = URL.createObjectURL(audioBlob);
            setAntiAliasAudioUrl(processedUrl);
            setAntiAliasMessage("Anti-aliasing completed successfully. Audio is ready to play.");

        } catch (error) {
            console.error('Error processing audio:', error);
            setAntiAliasMessage(`Failed to process audio: ${error.message}`);
        } finally {
            setAntiAliasLoading(false);
        }
    };

    const handleLoadSampleAntiAliasData = async () => {
        setAntiAliasLoading(true);
        setAntiAliasMessage('');

        // Simulate loading sample data
        setTimeout(() => {
            setAntiAliasMessage("Sample anti-aliasing data loaded successfully. Adjust sampling frequency to hear the effect.");
            setAntiAliasLoading(false);
        }, 1500);
    };

    // Audio control functions
    const handlePlayAudio = (audioRef, setIsPlaying) => {
        if (audioRef.current && audioRef.current.src) {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(error => {
                    console.error('Error playing audio:', error);
                    setMessage('Error playing audio: ' + error.message);
                });
        }
    };

    const handlePauseAudio = (audioRef, setIsPlaying) => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleAudioLoaded = (setAudioLoaded) => {
        setAudioLoaded(true);
    };

    const handleSamplingFrequencyChange = (frequency) => {
        setSamplingFrequency(frequency);
        console.log(`Sampling Frequency changed to: ${frequency} Hz`);
    };

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
                                <div className="w-10 h-10 bg-signal-recognition/10 rounded-lg flex items-center justify-center">
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
                                        className="w-6 h-6 text-signal-recognition"
                                    >
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" x2="12" y1="19" y2="22"></line>
                                    </svg>
                                </div>

                                <div className="ms-3">
                                    <h1 className="text-2xl font-bold text-foreground">Voice Recognition</h1>
                                    <p className="text-muted-foreground">Advanced Voice Classification & Anti-Aliasing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-recognition mx-auto px-0 py-12 flex-1">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Voice Recognition Card */}
                        <Card className="d-flex align-items-center">
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 bg-signal-recognition/10 rounded-lg flex items-center justify-center mx-auto">
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
                                        className="w-6 h-6 text-signal-recognition"
                                    >
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" x2="12" y1="19" y2="22"></line>
                                    </svg>
                                </div>

                                <h3>Voice Recognition</h3>
                                <p className="text-muted-foreground text-sm">
                                    Upload audio to classify voice as male or female using advanced machine learning
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
                                            className="w-8 h-8 text-signal-recognition mx-auto"
                                        >
                                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                            <line x1="12" x2="12" y1="19" y2="22"></line>
                                        </svg>

                                        <div>
                                            <p className="font-medium text-foreground">Upload audio for voice classification</p>
                                            <p className="text-muted-foreground text-sm">Accurate male/female voice detection</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Input
                                                type="file"
                                                accept=".wav,.mp3"
                                                className="input-file"
                                                onChange={handleChooseVoiceFile}
                                            />
                                            <p className="text-muted-foreground text-sm">or</p>
                                            <Button
                                                className="border-0 button-primary"
                                                onClick={handleLoadSampleVoiceData}
                                                disabled={loading}
                                            >
                                                Load Sample Data
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recognition Results */}
                                {recognitionResult && (
                                    <Card className="mt-4 p-4 bg-success/10 border-success/20">
                                        <div className="text-center space-y-2">
                                            <h4 className="font-semibold text-foreground">Recognition Results</h4>
                                            <div className="text-2xl font-bold text-success">
                                                {recognitionResult.gender === 'male' ? '♂ Male' : '♀ Female'} Voice
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Confidence: {(recognitionResult.confidence * 100).toFixed(1)}%
                                            </div>
                                            {recognitionResult.features && (
                                                <div className="text-xs text-muted-foreground">
                                                    Features: {recognitionResult.features.pitch}, {recognitionResult.features.timbre}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </Card>

                        {/* Anti-Aliasing Card */}
                        <Card>
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 bg-signal-anti-aliasing/10 rounded-lg flex items-center justify-center mx-auto">
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
                                        className="w-6 h-6 text-signal-anti-aliasing"
                                    >
                                        <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"></path>
                                    </svg>
                                </div>

                                <h3>Anti-Aliasing</h3>
                                <p className="text-muted-foreground text-sm">
                                    Recover and restore audio to original quality with intelligent algorithms
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
                                            className="w-8 h-8 text-signal-anti-aliasing mx-auto"
                                        >
                                            <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"></path>
                                        </svg>

                                        <div>
                                            <p className="font-medium text-foreground">Upload audio for anti-aliasing</p>
                                            <p className="text-muted-foreground text-sm">Restore under-sampled audio quality</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Input
                                                type="file"
                                                accept=".wav,.mp3"
                                                className="input-file"
                                                onChange={handleChooseAntiAliasFile}
                                            />
                                            <p className="text-muted-foreground text-sm">or</p>
                                            <Button
                                                className="border-0 button-warning"
                                                onClick={handleLoadSampleAntiAliasData}
                                                disabled={antiAliasLoading}
                                            >
                                                Load Sample Data
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        {/* Sampling Frequency Slider */}
                        <div className="mt-4">
                        <Slider
                            loading={antiAliasLoading}
                            label="Sampling Frequency"
                            unit="Hz"
                            min={20000}
                            max={40000}
                            initialValue={0}
                            OnChange={handleSamplingFrequencyChange}
                            handleClearAliasing={() => setSamplingFrequency(40000)}
                            className="w-full"
                        />
                    </div>
                    </Card>

                    {/* Audio Players Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Voice Recognition Audio Player */}
                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold mb-3">Voice Recognition Audio</h3>

                                    {message && (
                                        <div className={`p-3 rounded-lg mb-3 ${
                                            message.includes('successfully')
                                                ? 'message-success bg-green-100 text-green-800 border border-green-200'
                                                : 'message-error bg-red-100 text-red-800 border border-red-200'
                                        }`}>
                                            {message}
                                        </div>
                                    )}

                                    <div className="audio-player">
                                        <div className="text-center space-y-3">
                                            <div className="w-16 h-16 bg-signal-recognition/10 rounded-full flex items-center justify-center mx-auto">
                                                {loading ? (
                                                    <svg className="animate-spin" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : audioUrl ? (
                                                    <div className="text-signal-recognition text-2xl">
                                                        {isPlaying ? '🔊' : '🎵'}
                                                    </div>
                                                ) : (
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
                                                        className="w-6 h-6 text-signal-recognition"
                                                    >
                                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                                        <line x1="12" x2="12" y1="19" y2="22"></line>
                                                    </svg>
                                                )}
                                            </div>

                                            <div className="flex justify-center space-x-3">
                                                {isPlaying ? (
                                                    <Button
                                                        className="button btn btn-outline-danger"
                                                        onClick={() => handlePauseAudio(audioRef, setIsPlaying)}
                                                    >
                                                        ⏸️ Pause
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="button player-btn button-scientific"
                                                        onClick={() => handlePlayAudio(audioRef, setIsPlaying)}
                                                        disabled={!audioLoaded}
                                                    >
                                                        ▶️ Play Audio
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <audio
                                    ref={audioRef}
                                    src={audioUrl || null}
                                    onLoadedMetadata={() => handleAudioLoaded(setAudioLoaded)}
                                    preload="metadata"
                                />
                            </div>
                        </Card>

                        {/* Anti-Aliasing Audio Player */}
                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold mb-3">Anti-Aliasing Audio</h3>

                                    {antiAliasMessage && (
                                        <div className={`p-3 rounded-lg mb-3 ${
                                            antiAliasMessage.includes('successfully')
                                                ? 'message-success bg-green-100 text-green-800 border border-green-200'
                                                : 'message-error bg-red-100 text-red-800 border border-red-200'
                                        }`}>
                                            {antiAliasMessage}
                                        </div>
                                    )}

                                    <div className="audio-player">
                                        <div className="text-center space-y-3">
                                            <div className="w-16 h-16 bg-signal-anti-aliasing/10 rounded-full flex items-center justify-center mx-auto">
                                                {antiAliasLoading ? (
                                                    <svg className="animate-spin" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : antiAliasAudioUrl ? (
                                                    <div className="text-signal-anti-aliasing text-2xl">
                                                        🔊
                                                    </div>
                                                ) : (
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
                                                        className="w-6 h-6 text-signal-anti-aliasing"
                                                    >
                                                        <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"></path>
                                                    </svg>
                                                )}
                                            </div>

                                            <div className="flex justify-center space-x-3">
                                                <Button
                                                    className="button player-btn button-scientific"
                                                    onClick={() => handlePlayAudio(antiAliasAudioRef, () => {})}
                                                    disabled={!antiAliasAudioUrl}
                                                >
                                                    ▶️ Play Processed Audio
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <audio
                                    ref={antiAliasAudioRef}
                                    src={antiAliasAudioUrl || null}
                                    preload="metadata"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Voice Classification",
                                description: "Accurately classify voices as male or female using advanced machine learning",
                                icon: "mic"
                            },
                            {
                                title: "Real-Time Processing",
                                description: "Adjust sampling frequencies in real-time and hear the effects immediately",
                                icon: "waveform"
                            },
                            {
                                title: "Anti-Aliasing Recovery",
                                description: "Restore under-sampled audio to its original quality with intelligent algorithms",
                                icon: "upload"
                            }
                        ].map((feature, index) => (
                            <Card key={index}>
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-primary"
                                        >
                                            {feature.icon === "mic" && (
                                                <>
                                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                                    <line x1="12" x2="12" y1="19" y2="22"></line>
                                                </>
                                            )}
                                            {feature.icon === "waveform" && (
                                                <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"></path>
                                            )}
                                            {feature.icon === "upload" && (
                                                <>
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" x2="12" y1="3" y2="15"></line>
                                                </>
                                            )}
                                        </svg>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-foreground">{feature.title}</h3>
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
                                    <li>Audio signals should be sampled at minimum 44.1 kHz for best results</li>
                                    <li>For voice recognition: Upload clear speech with minimal background noise</li>
                                    <li>For anti-aliasing: Adjust sampling frequency to hear aliasing effects</li>
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

export default Recognition;