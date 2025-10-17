import React, { useRef, useEffect, useMemo, useState } from "react";

const XORGraph = ({
  channels,
  samplingRate,
  selected,
  windowSec,
  amplitudeScale,
  leadNames = [],
  playing = false,
  speed = 1,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: forward, 1: inverted, 2: xor only
  const [drawProgress, setDrawProgress] = useState(0);

  // Dimensions
  const dimensions = useMemo(
    () => ({
      width: 900,
      height: 500,
      margin: { top: 50, right: 40, bottom: 70, left: 70 },
    }),
    []
  );

  // Process XOR data for ECG
  const processedXORData = useMemo(() => {
    if (!channels.length || !samplingRate || selected.length === 0) return null;

    const samplesPerWindow = Math.floor(windowSec * samplingRate);
    const channelIndex = selected[0]; // Use first selected channel for XOR
    const channelData = channels[channelIndex];

    if (!channelData || channelData.length < samplesPerWindow * 2) return null;

    // Take first chunk for forward direction
    const forwardData = channelData.slice(0, samplesPerWindow);

    // Take second chunk for inverted direction
    const invertedData = channelData
      .slice(samplesPerWindow, samplesPerWindow * 2)
      .map((val) => -val); // Invert the signal

    // Apply XOR logic: compare and remove similar points, keep different ones
    const xorResult = [];
    const minLength = Math.min(forwardData.length, invertedData.length);

    for (let i = 0; i < minLength; i++) {
      const forwardVal = forwardData[i];
      const invertedVal = invertedData[i];
      const difference = Math.abs(forwardVal - invertedVal);

      // ECG-optimized threshold (slightly higher for cardiac signals)
      if (difference > 0.15 * amplitudeScale) {
        xorResult.push({
          index: i,
          value: invertedVal,
          forwardValue: forwardVal,
          difference: difference,
          time: i / samplingRate,
        });
      }
    }

    return {
      forwardData,
      invertedData,
      xorResult,
      samplesPerWindow,
      channelName: leadNames[channelIndex] || `Lead ${channelIndex + 1}`,
    };
  }, [channels, samplingRate, selected, windowSec, amplitudeScale, leadNames]);

  // Draw the XOR visualization with sequential animation
  const drawXORGraph = (ctx, phase, progress) => {
    const { width, height, margin } = dimensions;
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Clear canvas with dark background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!processedXORData) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "No ECG data available for XOR visualization",
        width / 2,
        height / 2
      );
      return;
    }

    const {
      forwardData,
      invertedData,
      xorResult,
      samplesPerWindow,
      channelName,
    } = processedXORData;

    // Draw title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`ECG XOR Analysis - ${channelName}`, width / 2, 25);

    // Update subtitle based on animation phase
    let subtitle = "";
    if (phase === 0) subtitle = "Drawing Forward Signal (Blue) →";
    else if (phase === 1) subtitle = "Drawing Inverted Signal (Red) ←";
    else subtitle = "XOR Result - Only Different Points Remain (Gold)";

    ctx.font = "14px Arial";
    ctx.fillText(subtitle, width / 2, 45);

    // Draw axes
    ctx.strokeStyle = "#4a4a6a";
    ctx.lineWidth = 1;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = "#888";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Time (s)", width / 2, height - 15);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Amplitude (mV)", 0, 0);
    ctx.restore();

    // Calculate visible range based on animation phase and progress
    let visibleForwardSamples = 0;
    let visibleInvertedSamples = 0;
    let showXORPoints = false;

    if (phase === 0) {
      // Phase 1: Draw forward signal left to right
      visibleForwardSamples = Math.floor(progress * samplesPerWindow);
    } else if (phase === 1) {
      // Phase 2: Draw inverted signal right to left (forward signal stays)
      visibleForwardSamples = samplesPerWindow;
      visibleInvertedSamples = Math.floor(progress * samplesPerWindow);
    } else {
      // Phase 3: Show ONLY XOR points (both signals removed)
      showXORPoints = true;
    }

    // Draw forward signal (blue) - only in phases 0 and 1
    if (visibleForwardSamples > 0 && phase !== 2) {
      ctx.strokeStyle = "#007bff";
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < visibleForwardSamples; i++) {
        const x = margin.left + (i / samplesPerWindow) * graphWidth;
        const y =
          margin.top +
          graphHeight / 2 -
          (forwardData[i] * amplitudeScale * graphHeight) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw inverted signal (red) - only in phase 1
    if (visibleInvertedSamples > 0 && phase === 1) {
      ctx.strokeStyle = "#dc3545";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();

      // Draw from right to left based on progress
      for (let i = 0; i < visibleInvertedSamples; i++) {
        // Calculate position from right (inverted drawing direction)
        const drawIndex = samplesPerWindow - 1 - i;
        const x = margin.left + (drawIndex / samplesPerWindow) * graphWidth;
        const y =
          margin.top +
          graphHeight / 2 -
          (invertedData[drawIndex] * amplitudeScale * graphHeight) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw XOR result points (gold) - only in phase 2
    if (showXORPoints) {
      ctx.fillStyle = "#ffd700";
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;

      // Draw connecting lines between XOR points
      ctx.beginPath();
      let firstPoint = true;

      for (let i = 0; i < xorResult.length; i++) {
        const point = xorResult[i];
        const x = margin.left + (point.index / samplesPerWindow) * graphWidth;
        const y =
          margin.top +
          graphHeight / 2 -
          (point.value * amplitudeScale * graphHeight) / 2;

        // Draw connecting line
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }

        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Stroke the connecting line
      if (xorResult.length > 1) {
        ctx.stroke();
      }
    }

    // Draw ECG-optimized grid and labels
    ctx.strokeStyle = "#4a4a6a";
    ctx.setLineDash([2, 2]);

    // Time grid (ECG-specific intervals)
    for (let i = 0; i <= 5; i++) {
      const x = margin.left + (i / 5) * graphWidth;
      const time = (i / 5) * windowSec;

      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();

      ctx.fillStyle = "#888";
      ctx.textAlign = "center";
      ctx.fillText(time.toFixed(1) + "s", x, margin.top + graphHeight + 20);
    }

    // Amplitude grid (ECG voltage scale)
    for (let i = -2; i <= 2; i++) {
      const y = margin.top + graphHeight / 2 - (i * graphHeight) / 4;

      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + graphWidth, y);
      ctx.stroke();

      ctx.fillStyle = "#888";
      ctx.textAlign = "right";
      ctx.fillText(i.toFixed(1) + "mV", margin.left - 10, y + 4);
    }
    ctx.setLineDash([]);

    // Draw legend
    const legendX = width - margin.right - 180;
    let legendY = margin.top - 10;

    if (phase !== 2) {
      const legends = [
        { color: "#007bff", text: "Forward ECG" },
        { color: "#dc3545", text: "Inverted ECG" },
        { color: "#ffd700", text: "XOR Points" },
      ];

      legends.forEach((legend, index) => {
        ctx.fillStyle = legend.color;
        if (index === 1) {
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(legendX, legendY + 5);
          ctx.lineTo(legendX + 20, legendY + 5);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (index === 2) {
          ctx.beginPath();
          ctx.arc(legendX + 10, legendY + 5, 3, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.fillRect(legendX, legendY, 20, 2);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(legend.text, legendX + 25, legendY + 7);

        legendY += 20;
      });
    } else {
      // Simplified legend for XOR-only phase
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(legendX + 10, legendY + 5, 3, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText("ECG XOR Result", legendX + 25, legendY + 7);
    }

    // Draw phase indicator and ECG stats
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    const phases = [
      "Phase 1: Forward ECG",
      "Phase 2: Inverted ECG",
      "Phase 3: XOR Result Only",
    ];
    ctx.fillText(phases[phase], margin.left, margin.top - 10);

    if (phase !== 2) {
      ctx.fillText(
        `Progress: ${Math.round(progress * 100)}%`,
        margin.left + 180,
        margin.top - 10
      );
    }

    ctx.fillText(
      `XOR Points: ${xorResult.length}`,
      margin.left + 320,
      margin.top - 10
    );
    ctx.fillText(
      `Threshold: ${(0.15 * amplitudeScale).toFixed(2)}mV`,
      margin.left + 480,
      margin.top - 10
    );
  };

  // Sequential animation effect
  useEffect(() => {
    if (!playing || !processedXORData) return;

    const startTime = Date.now();
    const phaseDuration =
      ((processedXORData.samplesPerWindow / samplingRate) * 500) / speed;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const phaseTime = elapsed % (phaseDuration * 3); // 3 phases total
      const currentPhase = Math.floor(phaseTime / phaseDuration);
      const phaseProgress = (phaseTime % phaseDuration) / phaseDuration;

      setAnimationPhase(currentPhase);
      setDrawProgress(phaseProgress);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      drawXORGraph(ctx, currentPhase, phaseProgress);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, speed, processedXORData, samplingRate]);

  // Static draw when not playing
  useEffect(() => {
    if (playing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawXORGraph(ctx, 2, 1); // Show only XOR points when not playing
  }, [processedXORData, playing]);

  return (
    <div className="xor-graph-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: "2px solid #444",
          borderRadius: "8px",
          background: "#000",
        }}
      />
      <div className="mt-3 small text-muted text-center">
        <strong>ECG XOR Analysis:</strong>
        Sequential comparison of forward and inverted ECG signals. Phase 1:
        Forward ECG draws left to right → Phase 2: Inverted ECG draws right to
        left ← Phase 3: Only XOR result points remain (similar ECG patterns
        removed)
        {processedXORData &&
          ` Detected ${processedXORData.xorResult.length} different cardiac patterns.`}
      </div>
    </div>
  );
};

export default XORGraph;
