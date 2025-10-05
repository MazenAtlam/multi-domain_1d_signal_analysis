import { useEffect, useRef } from 'react';
import Card from '../ui/Card';
import '../../../styles/SignalViewer.css';

const SignalViewer = ({ file, fileType }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !file) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (fileType === 'audio') {
            drawAudioSignal(ctx, width, height);
        } else if (fileType === 'rf') {
            drawRfSignal(ctx, width, height);
        }
    }, [file, fileType]);

    const drawAudioSignal = (ctx, width, height) => {
        // Draw magnitude bars for audio signal
        const barCount = 64;
        const barWidth = width / barCount;
        const maxBarHeight = height * 0.8;

        ctx.fillStyle = '#3b82f6'; // Blue color for audio

        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.random() * maxBarHeight;
            const x = i * barWidth;
            const y = height - barHeight;

            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }

        // Draw time axis
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 5);
        ctx.lineTo(width, height - 5);
        ctx.stroke();
    };

    const drawRfSignal = (ctx, width, height) => {
        // Draw RF signal as a continuous waveform
        const centerY = height / 2;
        const amplitude = height * 0.4;
        const frequency = 0.02;

        ctx.strokeStyle = '#10b981'; // Green color for RF
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
            // Simulate RF signal with some noise
            const y = centerY + amplitude * Math.sin(x * frequency) +
                (Math.random() - 0.5) * amplitude * 0.3;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Draw center line
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
    };

    return (
        <Card className="signal-viewer-card" padding="p-8">
            <div className="signal-viewer-content">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto signal-viewer-icon">
                    {/*{audioUrl ? (*/}
                    {/*    <div className="text-signal-doppler text-4xl">*/}
                    {/*        {isPlaying ? '🔊' : '🎵'}*/}
                    {/*    </div>*/}
                    {/*) : (*/}
                        <svg width="44"
                             height="44"
                             viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor"
                             strokeWidth="2"
                             strokeLinecap="round"
                             strokeLinejoin="round">

                            <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"></path>
                            <path d="M4 6h.01"></path>
                            <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"></path>
                            <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"></path>
                            <path d="M12 18h.01"></path>
                            <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"></path>
                            <circle cx="12" cy="12" r="2"></circle>
                            <path d="m13.41 10.59 5.66-5.66"></path>
                        </svg>
                    {/*)}*/}
                </div>

                <div className="signal-header">
                    <h2>Signal Viewer</h2>
                    <p className="signal-subtitle">
                        {fileType === 'audio' ? 'Audio Signal - Magnitude Bars' :
                            fileType === 'rf' ? 'RF Signal - Waveform' :
                                'Load a file to view signal'}
                    </p>
                    {file && (
                        <p className="file-name">File: {file.name}</p>
                    )}
                </div>

                <div className="signal-canvas-container">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={300}
                        className="signal-canvas"
                    />
                </div>

                {!file && (
                    <div className="no-signal">
                        <p>No signal data loaded. Please upload a file or load sample data.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default SignalViewer;