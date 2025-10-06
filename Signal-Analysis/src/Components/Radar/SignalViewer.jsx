import { useRef, useEffect, useState } from 'react';
import { isAudioFile } from "../../utils/AudioUtils.js";
import '../../../styles/SignalViewer.css';

const SignalViewer = ({ file, fileType, sarData, audioRef }) => {
    const canvasRef = useRef(null);
    const [audioData, setAudioData] = useState([]);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Process audio files for SoundVisualizer
    useEffect(() => {
        if (!file || !isAudioFile(file)) return;

        const processAudioFile = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const arrayBuffer = await file.arrayBuffer();
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const channelData = audioBuffer.getChannelData(0);
                setAudioData(Array.from(channelData));
                setDuration(audioBuffer.duration);

                if (audioRef?.current) {
                    audioRef.current.src = URL.createObjectURL(file);
                }
            } catch (err) {
                setError("Failed to process audio file: " + err.message);
                console.error("Audio processing error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        processAudioFile();
    }, [file, fileType, audioRef]);

    // Draw the appropriate visualization based on file type
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (file && isAudioFile(file) && audioData.length > 0) {
            drawAudioWaveform(ctx, width, height);
        } else if (fileType === 'sar' && sarData) {
            drawSarSignal(ctx, width, height, sarData);
        } else {
            drawPlaceholder(ctx, width, height);
        }
    }, [fileType, audioData, sarData]);

    const drawAudioWaveform = (ctx, width, height) => {
        // Draw grid for audio visualization
        drawGrid(ctx, width, height, "#333333");

        // Draw waveform
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const centerY = height / 2;
        const samplesPerPixel = Math.max(1, audioData.length / width);

        for (let x = 0; x < width; x++) {
            const startSample = Math.floor(x * samplesPerPixel);
            const endSample = Math.floor((x + 1) * samplesPerPixel);

            let min = 1;
            let max = -1;
            for (let i = startSample; i < endSample && i < audioData.length; i++) {
                const value = audioData[i];
                if (value < min) min = value;
                if (value > max) max = value;
            }

            const minY = centerY - min * centerY;
            const maxY = centerY - max * centerY;

            ctx.moveTo(x, minY);
            ctx.lineTo(x, maxY);
        }

        ctx.stroke();
    };

    const drawSarSignal = (ctx, width, height, sarData) => {
        const data = sarData.data;
        if (!data || data.length === 0) return;

        const centerY = height / 2;
        const amplitudeScale = height * 0.4;

        // Draw SAR signal as RF waveform
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xStep = width / (data.length - 1);

        data.forEach((point, index) => {
            const x = index * xStep;
            const y = centerY - point.amplitude * amplitudeScale;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw grid and highlight targets for SAR
        drawSarGrid(ctx, width, height, centerY);
        highlightTargetRegions(ctx, data, xStep, centerY, amplitudeScale);
    };

    const drawGrid = (ctx, width, height, gridColor) => {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.fillStyle = gridColor;
        ctx.font = "12px monospace";

        // Horizontal grid lines (magnitude)
        const horizontalLines = 8;
        for (let i = 0; i <= horizontalLines; i++) {
            const y = (i / horizontalLines) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            const magnitude = (1 - (i / horizontalLines) * 2).toFixed(1);
            ctx.fillText(magnitude, 5, y - 5);
        }

        // Vertical grid lines (time)
        const verticalLines = Math.floor(duration) || 10;
        for (let i = 0; i <= verticalLines; i++) {
            const x = (i / verticalLines) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            ctx.fillText(`${i}s`, x + 5, height - 10);
        }

        // Zero line
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    };

    const drawSarGrid = (ctx, width, height, centerY) => {
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Center line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Amplitude reference lines
        const ampLines = [centerY - height * 0.25, centerY + height * 0.25];
        ampLines.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        });

        ctx.setLineDash([]);
    };

    const highlightTargetRegions = (ctx, data, xStep, centerY, amplitudeScale) => {
        const avgAmplitude = data.reduce((sum, point) => sum + Math.abs(point.amplitude), 0) / data.length;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';

        data.forEach((point, index) => {
            if (Math.abs(point.amplitude) > avgAmplitude * 1.5) {
                const x = index * xStep;
                const barHeight = Math.abs(point.amplitude) * amplitudeScale * 2;
                const y = point.amplitude > 0 ? centerY - barHeight : centerY;

                ctx.fillRect(x - 2, y, 4, barHeight);
            }
        });
    };

    const drawPlaceholder = (ctx, width, height) => {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Load data to view signal', width / 2, height / 2);
    };

    const handleCanvasClick = (event) => {
        if (!audioRef?.current || !duration || !isAudioFile(file)) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;

        audioRef.current.currentTime = (x / canvas.width) * duration;
    };

    if (isLoading) {
        return (
            <div className="signal-visualizer-loading">
                Processing {file.type} file...
            </div>
        );
    }

    if (error) {
        return (
            <div className="signal-visualizer-error">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="signal-canvas-container">
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className={`signal-canvas ${file && isAudioFile(file) ? 'clickable' : ''}`}
                onClick={handleCanvasClick}
            />
        </div>
    );
};

export default SignalViewer;