import React, { useRef, useEffect, useMemo } from "react";

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
  const currentTimeRef = useRef(0);

  // Calculate dimensions and parameters
  const dimensions = useMemo(
    () => ({
      width: 900,
      height: 600,
      margin: { top: 60, right: 40, bottom: 80, left: 80 },
    }),
    []
  );

  // Calculate chunk parameters
  const chunkParams = useMemo(() => {
    if (!channels.length || !samplingRate) return null;

    const samplesPerWindow = Math.floor(windowSec * samplingRate);
    const totalSamples = channels[0]?.length || 0;
    const numChunks = Math.floor(totalSamples / samplesPerWindow);

    return { samplesPerWindow, totalSamples, numChunks };
  }, [channels, samplingRate, windowSec]);

  // Get first odd and even chunks for comparison
  const comparisonData = useMemo(() => {
    if (!channels.length || !chunkParams || selected.length === 0) return null;

    const { samplesPerWindow, numChunks } = chunkParams;

    let oddChunk = null;
    let evenChunk = null;

    // Find first odd and even chunks
    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      const startSample = chunkIndex * samplesPerWindow;
      const endSample = Math.min(
        startSample + samplesPerWindow,
        channels[0].length
      );

      const chunkData = selected.map((channelIdx) =>
        channels[channelIdx].slice(startSample, endSample)
      );

      if (chunkIndex % 2 === 1 && !oddChunk) {
        oddChunk = {
          data: chunkData,
          index: chunkIndex,
          startSample,
          endSample,
        };
      } else if (chunkIndex % 2 === 0 && !evenChunk) {
        evenChunk = {
          data: chunkData,
          index: chunkIndex,
          startSample,
          endSample,
        };
      }

      // Stop when we have both chunks
      if (oddChunk && evenChunk) break;
    }

    if (!oddChunk || !evenChunk) return null;

    return {
      oddChunk,
      evenChunk,
      samplesPerWindow,
    };
  }, [channels, selected, chunkParams]);

  // Create radial visualization
  const drawRadialComparison = (ctx) => {
    const { width, height, margin } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Clear canvas with light gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#e9ecef");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!comparisonData) {
      ctx.fillStyle = "#6c757d";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No data available for comparison", width / 2, height / 2);
      return;
    }

    const { oddChunk, evenChunk, samplesPerWindow } = comparisonData;

    // Draw title
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("EEG Radial Chunk Comparison", centerX, 30);
    ctx.font = "16px Arial";
    ctx.fillText(
      `Odd Chunk #${oddChunk.index} vs Even Chunk #${evenChunk.index}`,
      centerX,
      55
    );

    // Draw outer circle
    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw inner circles for reference
    for (let i = 1; i <= 3; i++) {
      ctx.strokeStyle = "#e9ecef";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 4, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw radial axes
    ctx.strokeStyle = "#adb5bd";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.stroke();
    }

    // Process and draw data for each channel
    selected.forEach((channelIdx, channelIndex) => {
      const oddData = oddChunk.data[channelIndex];
      const evenData = evenChunk.data[channelIndex];

      if (!oddData || !evenData) return;

      const channelAngle = (channelIndex * 2 * Math.PI) / selected.length;
      const channelRadius = radius * 0.8;

      // Draw channel label
      const labelX = centerX + (radius + 30) * Math.cos(channelAngle);
      const labelY = centerY + (radius + 30) * Math.sin(channelAngle);

      ctx.fillStyle = "#495057";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        leadNames[channelIdx] || `Ch${channelIdx + 1}`,
        labelX,
        labelY
      );

      // Draw odd chunk as outer ring
      ctx.strokeStyle = `hsla(${channelIndex * 60}, 70%, 50%, 0.8)`;
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let i = 0; i < oddData.length; i++) {
        const progress = i / oddData.length;
        const amplitude = oddData[i] * amplitudeScale;
        const pointRadius = channelRadius + amplitude * channelRadius * 0.5;
        const angle = channelAngle + progress * Math.PI * 1.5;

        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw even chunk as inner ring
      ctx.strokeStyle = `hsla(${channelIndex * 60 + 180}, 70%, 50%, 0.8)`;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();

      for (let i = 0; i < evenData.length; i++) {
        const progress = i / evenData.length;
        const amplitude = evenData[i] * amplitudeScale;
        const pointRadius =
          channelRadius * 0.6 + amplitude * channelRadius * 0.3;
        const angle = channelAngle + progress * Math.PI * 1.5;

        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw connection lines between similar points
      const minLength = Math.min(oddData.length, evenData.length);
      ctx.strokeStyle = `hsla(${channelIndex * 60 + 90}, 60%, 60%, 0.3)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < minLength; i += Math.floor(minLength / 20)) {
        const progress = i / minLength;
        const angle = channelAngle + progress * Math.PI * 1.5;

        const oddAmplitude = oddData[i] * amplitudeScale;
        const evenAmplitude = evenData[i] * amplitudeScale;

        const oddRadius = channelRadius + oddAmplitude * channelRadius * 0.5;
        const evenRadius =
          channelRadius * 0.6 + evenAmplitude * channelRadius * 0.3;

        const oddX = centerX + oddRadius * Math.cos(angle);
        const oddY = centerY + oddRadius * Math.sin(angle);
        const evenX = centerX + evenRadius * Math.cos(angle);
        const evenY = centerY + evenRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(oddX, oddY);
        ctx.lineTo(evenX, evenY);
        ctx.stroke();

        // Draw XOR difference points
        const diff = Math.abs(oddAmplitude - evenAmplitude);
        if (diff > 0.1) {
          const midX = (oddX + evenX) / 2;
          const midY = (oddY + evenY) / 2;

          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.arc(midX, midY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });

    // Draw center information
    ctx.fillStyle = "#2c3e50";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Odd Chunk", centerX - 40, centerY - 30);
    ctx.fillText("Even Chunk", centerX + 40, centerY - 30);

    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(centerX - 60, centerY - 30, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText("XOR Differences", centerX, centerY + 30);

    // Draw statistics
    ctx.fillStyle = "#6c757d";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      `Chunk Size: ${samplesPerWindow} samples`,
      margin.left,
      height - 40
    );
    ctx.fillText(
      `Amplitude Scale: ${amplitudeScale}`,
      margin.left,
      height - 25
    );
    ctx.fillText(
      `Selected Channels: ${selected.length}`,
      margin.left,
      height - 10
    );

    ctx.textAlign = "right";
    ctx.fillText(
      "Outer Ring: Odd Chunk (Solid)",
      width - margin.right,
      height - 40
    );
    ctx.fillText(
      "Inner Ring: Even Chunk (Dashed)",
      width - margin.right,
      height - 25
    );
    ctx.fillText("Lines: Point Connections", width - margin.right, height - 10);
  };

  // Create spiral visualization
  const drawSpiralComparison = (ctx) => {
    const { width, height, margin } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas with light background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (!comparisonData) {
      ctx.fillStyle = "#6c757d";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No data available for comparison", width / 2, height / 2);
      return;
    }

    const { oddChunk, evenChunk } = comparisonData;

    // Draw title
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("EEG Spiral Chunk Comparison", centerX, 40);

    // Draw spiral for odd chunk
    const spiralRadius = Math.min(width, height) * 0.35;
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 2;
    ctx.beginPath();

    selected.forEach((channelIdx, channelIndex) => {
      const data = oddChunk.data[channelIndex];
      if (!data) return;

      const angleStep = (2 * Math.PI) / data.length;
      const radiusStep = spiralRadius / data.length;

      for (let i = 0; i < data.length; i++) {
        const angle = i * angleStep;
        const radius =
          i * radiusStep + data[i] * amplitudeScale * spiralRadius * 0.5;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    // Draw spiral for even chunk (inverted)
    ctx.strokeStyle = "#e74c3c";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();

    selected.forEach((channelIdx, channelIndex) => {
      const data = evenChunk.data[channelIndex];
      if (!data) return;

      const angleStep = (2 * Math.PI) / data.length;
      const radiusStep = spiralRadius / data.length;

      for (let i = 0; i < data.length; i++) {
        const angle = i * angleStep;
        const radius =
          spiralRadius -
          i * radiusStep -
          data[i] * amplitudeScale * spiralRadius * 0.5;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw legend
    ctx.fillStyle = "#3498db";
    ctx.fillRect(width - 150, 60, 20, 3);
    ctx.fillStyle = "#2c3e50";
    ctx.fillText("Odd Chunk", width - 120, 65);

    ctx.fillStyle = "#e74c3c";
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(width - 150, 80);
    ctx.lineTo(width - 130, 80);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#2c3e50";
    ctx.fillText("Even Chunk", width - 120, 85);
  };

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      currentTimeRef.current += (16 * speed) / 1000;

      // Alternate between visualizations
      const vizType = Math.floor(currentTimeRef.current / 3) % 2;

      if (vizType === 0) {
        drawRadialComparison(ctx);
      } else {
        drawSpiralComparison(ctx);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, speed, comparisonData]);

  // Static draw when not playing
  useEffect(() => {
    if (playing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawRadialComparison(ctx);
  }, [comparisonData, playing]);

  return (
    <div className="xor-graph-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: "2px solid #dee2e6",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      />
      <div
        style={{
          marginTop: "15px",
          fontSize: "14px",
          color: "#6c757d",
          textAlign: "center",
          padding: "0 20px",
          lineHeight: "1.5",
        }}
      >
        <strong>Creative Visualization:</strong> Comparing first odd and even
        chunks using radial and spiral layouts. Outer rings show odd chunks,
        inner rings show even chunks. Red points highlight significant
        differences.
        {playing && " (Animation alternates between visualizations)"}
      </div>
    </div>
  );
};

export default XORGraph;
