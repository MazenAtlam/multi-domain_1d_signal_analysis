import React, { useRef, useEffect, useState, useMemo } from "react";

const RecurrenceMode = ({
  channels,
  samplingRate,
  selected,
  playing,
  speed,
  windowSec,
  leadNames = [],
  compact = false,
  onFinish,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dimension, setDimension] = useState(2);
  const [delay, setDelay] = useState(1);
  const [threshold, setThreshold] = useState(0.1);
  const [recurrenceStats, setRecurrenceStats] = useState(null);

  // Memoized phase space reconstruction for ECG
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

    // Normalize ECG signal
    const min = Math.min(...windowData);
    const max = Math.max(...windowData);
    const range = max - min;
    const normalized =
      range === 0
        ? windowData.map(() => 0.5)
        : windowData.map((val) => (val - min) / range);

    // Create delay vectors for recurrence analysis
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

    // Build recurrence matrix and calculate ECG-specific statistics
    for (let i = 0; i < N; i++) {
      let currentLineLength = 0;

      for (let j = 0; j < N; j++) {
        // Calculate Euclidean distance for ECG signals
        let sumSq = 0;
        for (let k = 0; k < dimension; k++) {
          sumSq += Math.pow(vectors[i][k] - vectors[j][k], 2);
        }
        const dist = Math.sqrt(sumSq);

        // ECG-optimized thresholding
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

    // Calculate recurrence rate for ECG
    const recurrenceRate = recurrencePoints / (N * N);

    // Calculate determinism (important for ECG rhythm analysis)
    const diagonalLines = lineLengths.filter((len) => len > 1);
    const determinism =
      diagonalLines.length > 0
        ? diagonalLines.reduce((a, b) => a + b, 0) / recurrencePoints
        : 0;

    // Calculate entropy (Shannon entropy for ECG complexity)
    const lineLengthCounts = {};
    lineLengths.forEach((len) => {
      lineLengthCounts[len] = (lineLengthCounts[len] || 0) + 1;
    });

    let entropy = 0;
    Object.values(lineLengthCounts).forEach((count) => {
      const p = count / lineLengths.length;
      entropy -= p * Math.log(p);
    });

    // ECG-specific metrics
    const laminarity = diagonalLines.length / Math.max(lineLengths.length, 1);
    const trappingTime =
      diagonalLines.length > 0
        ? diagonalLines.reduce((a, b) => a + b, 0) / diagonalLines.length
        : 0;

    setRecurrenceStats({
      recurrenceRate: (recurrenceRate * 100).toFixed(2),
      determinism: (determinism * 100).toFixed(2),
      entropy: entropy.toFixed(3),
      laminarity: (laminarity * 100).toFixed(2),
      trappingTime: trappingTime.toFixed(2),
      totalPoints: recurrencePoints,
      matrixSize: N,
    });

    return matrix;
  }, [phaseSpaceData, threshold, dimension]);

  // Drawing function with ECG-optimized visualization
  const drawRecurrencePlot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !recurrenceData) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear with dark background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const matrix = recurrenceData;
    const N = matrix.length;
    const cellSize = Math.min(width, height) / N;

    // Draw recurrence plot with ECG-optimized color coding
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (matrix[i][j] === 1) {
          const distanceFromDiagonal = Math.abs(i - j);
          const intensity = Math.max(0, 1 - distanceFromDiagonal / N);

          // Color gradient optimized for ECG visualization
          // Red tones for recent recurrences (cardiac rhythm patterns)
          // Blue tones for distant recurrences (long-term patterns)
          const red = Math.floor(200 + 55 * intensity);
          const green = Math.floor(100 * intensity);
          const blue = Math.floor(200 * (1 - intensity));

          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw main diagonal (important for ECG rhythm analysis)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Draw info text
    if (!compact) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.fillText(
        `ECG Recurrence Analysis | Dimension: ${dimension} | Delay: ${delay}`,
        10,
        15
      );
      ctx.fillText(
        `Threshold: ${threshold.toFixed(
          2
        )} | Matrix: ${N}×${N} | Window: ${windowSec}s`,
        10,
        30
      );

      if (recurrenceStats) {
        ctx.fillText(
          `Recurrence Rate: ${recurrenceStats.recurrenceRate}% | Determinism: ${recurrenceStats.determinism}%`,
          10,
          45
        );
      }
    }
  };

  // Animation for real-time ECG analysis
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
    border: "2px solid #444",
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
            <div className="col-md-3">
              <label className="form-label small text-white">
                Dimension: {dimension}
              </label>
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
            <div className="col-md-3">
              <label className="form-label small text-white">
                Delay: {delay}
              </label>
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
            <div className="col-md-3">
              <label className="form-label small text-white">
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
            <div className="col-md-3">
              <label className="form-label small text-white">Channel</label>
              <select
                className="form-select form-select-sm"
                value={selected[0] || 0}
                onChange={(e) => setSelected([parseInt(e.target.value)])}
              >
                {channels?.map((_, idx) => (
                  <option key={idx} value={idx}>
                    {leadNames[idx] || `Ch ${idx + 1}`}
                  </option>
                ))}
              </select>
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
        <div className="info-panel mt-3 p-3 bg-dark rounded">
          <h6 className="text-white mb-3">
            ECG Recurrence Quantification Analysis
          </h6>
          <div className="row text-center small text-white">
            <div className="col-md-2 mb-2">
              <div className="fw-bold">Recurrence Rate</div>
              <div className="text-primary">
                {recurrenceStats.recurrenceRate}%
              </div>
            </div>
            <div className="col-md-2 mb-2">
              <div className="fw-bold">Determinism</div>
              <div className="text-success">{recurrenceStats.determinism}%</div>
            </div>
            <div className="col-md-2 mb-2">
              <div className="fw-bold">Entropy</div>
              <div className="text-warning">{recurrenceStats.entropy}</div>
            </div>
            <div className="col-md-2 mb-2">
              <div className="fw-bold">Laminarity</div>
              <div className="text-info">{recurrenceStats.laminarity}%</div>
            </div>
            <div className="col-md-2 mb-2">
              <div className="fw-bold">Trapping Time</div>
              <div className="text-danger">{recurrenceStats.trappingTime}</div>
            </div>
            <div className="col-md-2 mb-2">
              <div className="fw-bold">Points</div>
              <div className="text-muted">{recurrenceStats.totalPoints}</div>
            </div>
          </div>
        </div>
      )}

      <div className="color-legend mt-2 text-center small text-muted">
        <span style={{ color: "#ff6464" }}>●</span> Recent recurrence (Rhythm) |
        <span style={{ color: "#6464ff" }}>●</span> Distant recurrence (Pattern)
        |<span style={{ color: "#ffffff" }}>─</span> Main diagonal
      </div>

      {!compact && (
        <div className="mt-3 p-3 bg-dark rounded">
          <h6 className="text-white">ECG Recurrence Analysis Guide</h6>
          <div className="row small text-muted">
            <div className="col-md-6">
              <ul className="mb-0">
                <li>
                  <strong>Recurrence Rate:</strong> Percentage of recurrent
                  points
                </li>
                <li>
                  <strong>Determinism:</strong> Predictability of cardiac rhythm
                </li>
                <li>
                  <strong>Entropy:</strong> Complexity of ECG signal patterns
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="mb-0">
                <li>
                  <strong>Laminarity:</strong> Stability of cardiac cycles
                </li>
                <li>
                  <strong>Trapping Time:</strong> Duration of stable states
                </li>
                <li>
                  <strong>Color Code:</strong> Red (recent) to Blue (distant)
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrenceMode;
