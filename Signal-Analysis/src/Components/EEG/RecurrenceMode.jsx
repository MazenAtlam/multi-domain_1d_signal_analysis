import React, { useRef, useEffect, useState, useMemo } from "react";

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
  const [dimension, setDimension] = useState(2);
  const [delay, setDelay] = useState(1);
  const [threshold, setThreshold] = useState(0.1);
  const [recurrenceStats, setRecurrenceStats] = useState(null);

  // Memoized phase space reconstruction
  const phaseSpaceData = useMemo(() => {
    if (!channels?.length || selected.length === 0) return null;

    const channelIndex = selected[0];
    const signal = channels[channelIndex];
    if (!signal || signal.length === 0) return null;

    // Get current window
    const startIndex = Math.max(
      0,
      currentIndex - Math.floor((windowSec * samplingRate) / 2)
    );
    const endIndex = Math.min(
      signal.length,
      startIndex + Math.floor(windowSec * samplingRate)
    );
    const windowData = signal.slice(startIndex, endIndex);

    if (windowData.length < dimension * delay) return null;

    // Normalize
    const min = Math.min(...windowData);
    const max = Math.max(...windowData);
    const range = max - min;
    const normalized =
      range === 0
        ? windowData.map(() => 0.5)
        : windowData.map((val) => (val - min) / range);

    // Create delay vectors
    const vectors = [];
    for (let i = 0; i <= normalized.length - (dimension - 1) * delay; i++) {
      const vector = [];
      for (let j = 0; j < dimension; j++) {
        vector.push(normalized[i + j * delay]);
      }
      vectors.push(vector);
    }

    return { vectors, normalized, windowData };
  }, [
    channels,
    selected,
    currentIndex,
    windowSec,
    samplingRate,
    dimension,
    delay,
  ]);

  // Memoized recurrence plot and statistics
  const recurrenceData = useMemo(() => {
    if (!phaseSpaceData) return null;

    const { vectors } = phaseSpaceData;
    const N = vectors.length;
    const matrix = Array(N)
      .fill()
      .map(() => Array(N).fill(0));

    let recurrencePoints = 0;
    const lineLengths = [];

    // Build recurrence matrix and calculate statistics
    for (let i = 0; i < N; i++) {
      let currentLineLength = 0;

      for (let j = 0; j < N; j++) {
        let sumSq = 0;
        for (let k = 0; k < dimension; k++) {
          sumSq += Math.pow(vectors[i][k] - vectors[j][k], 2);
        }
        const dist = Math.sqrt(sumSq);

        if (dist <= threshold) {
          matrix[i][j] = 1;
          recurrencePoints++;
          currentLineLength++;
        } else {
          if (currentLineLength > 0) {
            lineLengths.push(currentLineLength);
            currentLineLength = 0;
          }
        }
      }

      if (currentLineLength > 0) {
        lineLengths.push(currentLineLength);
      }
    }

    // Calculate recurrence rate
    const recurrenceRate = recurrencePoints / (N * N);

    // Calculate determinism (percentage of points forming diagonal lines)
    const diagonalLines = lineLengths.filter((len) => len > 1);
    const determinism =
      diagonalLines.length > 0
        ? diagonalLines.reduce((a, b) => a + b, 0) / recurrencePoints
        : 0;

    // Calculate entropy (Shannon entropy of line lengths)
    const lineLengthCounts = {};
    lineLengths.forEach((len) => {
      lineLengthCounts[len] = (lineLengthCounts[len] || 0) + 1;
    });

    let entropy = 0;
    Object.values(lineLengthCounts).forEach((count) => {
      const p = count / lineLengths.length;
      entropy -= p * Math.log(p);
    });

    setRecurrenceStats({
      recurrenceRate: (recurrenceRate * 100).toFixed(2),
      determinism: (determinism * 100).toFixed(2),
      entropy: entropy.toFixed(3),
      totalPoints: recurrencePoints,
    });

    return matrix;
  }, [phaseSpaceData, threshold, dimension]);

  // Drawing function
  const drawRecurrencePlot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !recurrenceData) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear with dark background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const matrix = recurrenceData;
    const N = matrix.length;
    const cellSize = Math.min(width, height) / N;

    // Draw recurrence plot with color coding based on distance from diagonal
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (matrix[i][j] === 1) {
          const distanceFromDiagonal = Math.abs(i - j);
          const intensity = Math.max(0, 1 - distanceFromDiagonal / N);

          // Color gradient from cyan (recent) to blue (distant)
          ctx.fillStyle = `rgb(0, ${Math.floor(200 * intensity)}, ${Math.floor(
            255 * intensity
          )})`;
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw main diagonal
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Draw info text
    if (!compact) {
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.fillText(
        `Dimension: ${dimension} | Delay: ${delay} | Threshold: ${threshold.toFixed(
          2
        )}`,
        10,
        15
      );
      ctx.fillText(`Matrix: ${N}×${N} | Window: ${windowSec}s`, 10, 30);
    }
  };

  // Animation
  useEffect(() => {
    if (!playing || !channels?.length) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const animate = () => {
      setCurrentIndex((prev) => {
        const newIndex = prev + Math.floor((speed * samplingRate) / 10);
        if (newIndex >= channels[0].length) {
          onFinish?.();
          return 0;
        }
        return newIndex;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [playing, speed, samplingRate, channels, onFinish]);

  // Redraw when dependencies change
  useEffect(() => {
    drawRecurrencePlot();
  }, [recurrenceData, compact]);

  const canvasStyle = {
    width: "100%",
    height: compact ? "200px" : "400px",
    border: "1px solid #333",
    borderRadius: compact ? "4px" : "8px",
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
              <label className="form-label small">Dimension: {dimension}</label>
              <input
                type="range"
                className="form-range"
                min="2"
                max="5"
                step="1"
                value={dimension}
                onChange={(e) => setDimension(parseInt(e.target.value))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small">Delay: {delay}</label>
              <input
                type="range"
                className="form-range"
                min="1"
                max="10"
                step="1"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small">
                Threshold: {threshold.toFixed(2)}
              </label>
              <input
                type="range"
                className="form-range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
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

      {!compact && recurrenceStats && (
        <div className="info-panel mt-3 p-2 bg-dark rounded">
          <div className="row text-center small text-white">
            <div className="col-md-3">
              <strong>Recurrence Rate</strong>
              <div>{recurrenceStats.recurrenceRate}%</div>
            </div>
            <div className="col-md-3">
              <strong>Determinism</strong>
              <div>{recurrenceStats.determinism}%</div>
            </div>
            <div className="col-md-3">
              <strong>Entropy</strong>
              <div>{recurrenceStats.entropy}</div>
            </div>
            <div className="col-md-3">
              <strong>Points</strong>
              <div>{recurrenceStats.totalPoints}</div>
            </div>
          </div>
        </div>
      )}

      <div className="color-legend mt-2 text-center small text-muted">
        <span style={{ color: "#00ffff" }}>●</span> Recent recurrence |
        <span style={{ color: "#0000ff" }}>●</span> Distant recurrence
      </div>
    </div>
  );
}
