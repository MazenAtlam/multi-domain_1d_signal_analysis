import React, { useRef, useEffect, useState } from "react";

export default function RecurrenceMode({
  channels,
  samplingRate,
  selected,
  playing,
  speed,
  windowSec,
  amplitudeScale,
  compact = false,
  onFinish,
}) {
  const canvasRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationRef = useRef(null);
  const [dimension, setDimension] = useState(2); // Embedding dimension
  const [delay, setDelay] = useState(1); // Time delay
  const [threshold, setThreshold] = useState(0.1); // Recurrence threshold

  // Function to create delay coordinates for phase space reconstruction
  const createDelayCoordinates = (signal, dimension, delay) => {
    const vectors = [];
    for (let i = 0; i <= signal.length - (dimension - 1) * delay; i++) {
      const vector = [];
      for (let j = 0; j < dimension; j++) {
        vector.push(signal[i + j * delay]);
      }
      vectors.push(vector);
    }
    return vectors;
  };

  // Function to calculate Euclidean distance between two vectors
  const euclideanDistance = (vec1, vec2) => {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += Math.pow(vec1[i] - vec2[i], 2);
    }
    return Math.sqrt(sum);
  };

  // Function to create recurrence plot matrix
  const createRecurrenceMatrix = (vectors, threshold) => {
    const N = vectors.length;
    const matrix = Array(N)
      .fill()
      .map(() => Array(N).fill(0));

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const dist = euclideanDistance(vectors[i], vectors[j]);
        matrix[i][j] = dist <= threshold ? 1 : 0;
      }
    }
    return matrix;
  };

  // Function to normalize signal
  const normalizeSignal = (signal) => {
    if (signal.length === 0) return signal;
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const range = max - min;
    if (range === 0) return signal.map(() => 0.5);
    return signal.map((val) => (val - min) / range);
  };

  // Main drawing function
  const drawRecurrencePlot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !channels || channels.length === 0 || selected.length === 0)
      return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const channelIndex = selected[0];
    const signal = channels[channelIndex];

    if (!signal || signal.length === 0) return;

    // Get current window of data
    const startIndex = Math.max(
      0,
      currentIndex - Math.floor((windowSec * samplingRate) / 2)
    );
    const endIndex = Math.min(
      signal.length,
      startIndex + Math.floor(windowSec * samplingRate)
    );
    const windowData = signal.slice(startIndex, endIndex);

    if (windowData.length < dimension * delay) return;

    // Normalize the signal window
    const normalizedSignal = normalizeSignal(windowData);

    // Create phase space vectors
    const vectors = createDelayCoordinates(normalizedSignal, dimension, delay);

    if (vectors.length === 0) return;

    // Create recurrence matrix
    const recurrenceMatrix = createRecurrenceMatrix(vectors, threshold);

    // Draw recurrence plot
    const cellSize = Math.min(width, height) / recurrenceMatrix.length;

    for (let i = 0; i < recurrenceMatrix.length; i++) {
      for (let j = 0; j < recurrenceMatrix[i].length; j++) {
        if (recurrenceMatrix[i][j] === 1) {
          // Use different colors based on distance from diagonal for better visualization
          const distanceFromDiagonal = Math.abs(i - j);
          const intensity = Math.max(
            0,
            1 - distanceFromDiagonal / recurrenceMatrix.length
          );

          ctx.fillStyle = `rgb(0, ${Math.floor(255 * intensity)}, ${Math.floor(
            255 * (1 - intensity)
          )})`;
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw diagonal line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Add labels and information
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Dimension: ${dimension}`, 10, 20);
    ctx.fillText(`Delay: ${delay}`, 10, 35);
    ctx.fillText(`Threshold: ${threshold.toFixed(2)}`, 10, 50);
    ctx.fillText(
      `Matrix: ${recurrenceMatrix.length}x${recurrenceMatrix.length}`,
      10,
      65
    );
  };

  // Animation loop
  useEffect(() => {
    if (!playing || !channels || channels.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setCurrentIndex((prev) => {
        const newIndex = prev + Math.floor((speed * samplingRate) / 10);
        if (newIndex >= channels[0].length) {
          if (onFinish) onFinish();
          return 0;
        }
        return newIndex;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, speed, samplingRate, channels, onFinish]);

  // Redraw when dependencies change
  useEffect(() => {
    drawRecurrencePlot();
  }, [
    currentIndex,
    dimension,
    delay,
    threshold,
    channels,
    selected,
    windowSec,
    amplitudeScale,
  ]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      drawRecurrencePlot();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const canvasStyle = compact
    ? {
        width: "100%",
        height: "200px",
        border: "1px solid #333",
        borderRadius: "4px",
      }
    : {
        width: "100%",
        height: "400px",
        border: "1px solid #333",
        borderRadius: "8px",
      };

  return (
    <div
      className="recurrence-mode"
      style={{ padding: compact ? "5px" : "10px" }}
    >
      {!compact && (
        <div className="controls mb-3">
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label small">Dimension</label>
              <input
                type="range"
                className="form-range"
                min="2"
                max="5"
                step="1"
                value={dimension}
                onChange={(e) => setDimension(parseInt(e.target.value))}
              />
              <div className="text-center small">{dimension}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Delay</label>
              <input
                type="range"
                className="form-range"
                min="1"
                max="10"
                step="1"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
              />
              <div className="text-center small">{delay}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Threshold</label>
              <input
                type="range"
                className="form-range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <div className="text-center small">{threshold.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={canvasStyle}
        width={compact ? 300 : 600}
        height={compact ? 200 : 400}
      />

      {!compact && (
        <div className="info-panel mt-2">
          <div className="row text-center small">
            <div className="col-md-4">
              <strong>Recurrence Rate:</strong>
              <br />
              {channels && channels.length > 0 && selected.length > 0
                ? "Calculating..."
                : "N/A"}
            </div>
            <div className="col-md-4">
              <strong>Determinism:</strong>
              <br />
              {channels && channels.length > 0 && selected.length > 0
                ? "Calculating..."
                : "N/A"}
            </div>
            <div className="col-md-4">
              <strong>Entropy:</strong>
              <br />
              {channels && channels.length > 0 && selected.length > 0
                ? "Calculating..."
                : "N/A"}
            </div>
          </div>
        </div>
      )}

      <div
        className="color-legend mt-2 text-center small"
        style={{ color: "#666" }}
      >
        <span style={{ color: "#00ffff" }}>●</span> Recent recurrence |
        <span style={{ color: "#0000ff" }}>●</span> Distant recurrence
      </div>
    </div>
  );
}
