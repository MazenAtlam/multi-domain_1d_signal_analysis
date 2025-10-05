import { useRef, useEffect, useState } from "react";

const SoundVisualizer = ({ file, audioRef }) => {
  const canvasRef = useRef(null);
  const [audioData, setAudioData] = useState([]);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) return;

    const processAudioFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get the first channel (mono) for visualization
        const channelData = audioBuffer.getChannelData(0);
        setAudioData(Array.from(channelData));
        setDuration(audioBuffer.duration);

        // Set up audio element source if audioRef is provided
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
  }, [file, audioRef]);

  // Draw the waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData.length) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height, "#333333");

    // Draw waveform
    drawWaveform(ctx, audioData, duration, width, height, "#f59e0b");
  }, [audioData, duration]);

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

      // Draw magnitude labels
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

      // Draw time labels
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

  const drawWaveform = (ctx, audioData, duration, width, height, waveColor) => {
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const centerY = height / 2;
    const samplesPerPixel = Math.max(1, audioData.length / width);

    for (let x = 0; x < width; x++) {
      const startSample = Math.floor(x * samplesPerPixel);
      const endSample = Math.floor((x + 1) * samplesPerPixel);

      // Find min and max in this segment for a traditional waveform look
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

  const handleCanvasClick = (event) => {
    if (!audioRef?.current || !duration) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    audioRef.current.currentTime = (x / canvas.width) * duration;
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: "800px",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          color: "#f59e0b",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        Processing audio file...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "800px",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          color: "#ff4444",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!file) {
    return (
      <div
        style={{
          width: "800px",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          color: "#666",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        No audio file selected
      </div>
    );
  }

  return (
    <div className="sound-visualizer">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        onClick={handleCanvasClick}
        style={{
          border: "1px solid #444",
          borderRadius: "8px",
          cursor: audioRef?.current ? "pointer" : "default",
        }}
      />
    </div>
  );
};

export default SoundVisualizer;
