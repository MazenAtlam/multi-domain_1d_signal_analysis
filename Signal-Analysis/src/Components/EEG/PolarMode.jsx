import React, { useRef, useEffect, useMemo, useState } from "react";
import * as d3 from "d3";

const PolarMode = ({
  channels,
  samplingRate,
  selected,
  windowSec,
  amplitudeScale,
  leadNames = [],
  playing = false,
  speed = 1,
}) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Dimensions
  const dimensions = useMemo(
    () => ({
      width: 900,
      height: 600,
      margin: { top: 60, right: 40, bottom: 80, left: 80 },
    }),
    []
  );

  // Process data for polar visualization
  const polarData = useMemo(() => {
    if (!channels.length || !samplingRate || selected.length === 0) return null;

    // Always show from beginning, not sliding window
    const startSample = 0;
    const endSample = Math.min(
      channels[0].length,
      Math.floor(windowSec * samplingRate)
    );

    // Get data for selected channels
    const channelData = selected
      .map((channelIdx) => {
        const channel = channels[channelIdx];
        if (!channel || channel.length < endSample) return null;

        return {
          data: channel.slice(startSample, endSample),
          name: leadNames[channelIdx] || `Channel ${channelIdx + 1}`,
          index: channelIdx,
        };
      })
      .filter(Boolean);

    return {
      channelData,
      startSample,
      endSample,
      currentTime,
    };
  }, [channels, samplingRate, selected, windowSec, leadNames, currentTime]);

  // Initialize D3 visualization
  useEffect(() => {
    if (!polarData || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const { width, height, margin } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;

    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // DARK BLUE GRADIENT BACKGROUND (restored)
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "polar-bg-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#1a1a2e");

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#16213e");

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#polar-bg-gradient)");

    const g = svg
      .append("g")
      .attr("transform", `translate(${centerX},${centerY})`);

    // Calculate radius step for each channel (concentric circles)
    const radiusStep = maxRadius / (polarData.channelData.length + 1);
    const baseRadius = radiusStep;

    // Draw polar grid (FULL CIRCLE)
    const gridGroup = g.append("g").attr("class", "polar-grid");

    // Draw concentric circles for channels
    for (let i = 1; i <= polarData.channelData.length + 1; i++) {
      const radius = baseRadius * i;
      gridGroup
        .append("circle")
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "#4a4a6a") // Dark blue grid lines
        .attr("stroke-width", 1);
    }

    // Draw radial lines (FULL CIRCLE - 12 lines for hours)
    for (let i = 0; i < 12; i++) {
      const angle = (i * 2 * Math.PI) / 12;
      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", maxRadius * 1.1 * Math.cos(angle))
        .attr("y2", maxRadius * 1.1 * Math.sin(angle))
        .attr("stroke", "#4a4a6a") // Dark blue grid lines
        .attr("stroke-width", 1);
    }

    // Draw angle labels
    const labelGroup = svg.append("g").attr("class", "angle-labels");
    for (let i = 0; i < 12; i++) {
      const angle = (i * 2 * Math.PI) / 12;
      const degrees = i * 30;
      const labelRadius = maxRadius * 1.15;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);

      labelGroup
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#888") // Light gray for labels
        .attr("font-size", "12px")
        .text(`${degrees}°`);
    }

    // Draw title
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff") // White text
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .text("EEG Polar Plot - Concentric Channels");

    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", 55)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff") // White text
      .attr("font-size", "14px")
      .text(
        `${polarData.channelData.length} channels displayed as concentric circles`
      );

    // Draw each channel as a concentric FULL circle - FIXED: No rotation
    const channelGroup = g.append("g").attr("class", "channels");

    polarData.channelData.forEach((channel, channelIndex) => {
      const { data, name, index } = channel;
      const radius = baseRadius * (channelIndex + 1);
      const color = d3.schemeCategory10[channelIndex % 10];

      // Get current progress based on playing state
      const progress = playing ? (currentTime * samplingRate) / data.length : 1;
      const pointsToShow = Math.floor(data.length * progress);

      // Create scales for this channel - FIXED: Static mapping, no rotation
      const ampExtent = d3.extent(data);
      const rScale = d3
        .scaleLinear()
        .domain(ampExtent)
        .range([radius * 0.8, radius * 1.2 * amplitudeScale]);

      // FIXED: Map time to angle statically (no rotation over time)
      const theta = d3
        .scaleLinear()
        .domain([0, data.length])
        .range([0, 2 * Math.PI]);

      // Create line generator
      const line = d3
        .lineRadial()
        .angle((d, i) => theta(i))
        .radius((d) => rScale(d))
        .curve(d3.curveNatural);

      // Draw the channel path with current progress
      const currentData = data.slice(0, pointsToShow);

      channelGroup
        .append("path")
        .datum(currentData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", line);

      // Draw channel labels at four cardinal points
      const labelPoints = [
        { angle: 0, textAnchor: "start", dx: 5 }, // Right
        { angle: Math.PI / 2, textAnchor: "start", dx: 5 }, // Bottom
        { angle: Math.PI, textAnchor: "end", dx: -5 }, // Left
        { angle: (3 * Math.PI) / 2, textAnchor: "start", dx: 5 }, // Top
      ];

      labelPoints.forEach((point, i) => {
        const labelRadius = radius + 20;
        const x = labelRadius * Math.cos(point.angle);
        const y = labelRadius * Math.sin(point.angle);

        channelGroup
          .append("text")
          .attr("x", x)
          .attr("y", y)
          .attr("text-anchor", point.textAnchor)
          .attr("dominant-baseline", "middle")
          .attr("fill", color)
          .attr("font-size", "10px")
          .attr("dx", point.dx)
          .text(i === 0 ? name : ""); // Only show name once
      });
    });

    // Draw center point
    g.append("circle").attr("r", 2).attr("fill", "#ffffff"); // White center point

    // Draw time and amplitude info
    const infoGroup = svg.append("g").attr("class", "info");

    infoGroup
      .append("text")
      .attr("x", centerX)
      .attr("y", height - 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff") // White text
      .attr("font-size", "14px")
      .text(
        `Time: ${currentTime.toFixed(1)}s / ${(
          channels[0].length / samplingRate
        ).toFixed(1)}s`
      );

    infoGroup
      .append("text")
      .attr("x", centerX)
      .attr("y", height - 50)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff") // White text
      .attr("font-size", "14px")
      .text(`Amplitude Scale: ${amplitudeScale}`);

    // Draw legend
    const legendGroup = svg.append("g").attr("class", "legend");
    const legendX = width - margin.right - 180;
    let legendY = margin.top;

    legendGroup
      .append("text")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("fill", "#ffffff") // White text
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Channel Legend");

    legendY += 20;

    polarData.channelData.forEach((channel, index) => {
      const color = d3.schemeCategory10[index % 10];

      legendGroup
        .append("line")
        .attr("x1", legendX)
        .attr("y1", legendY)
        .attr("x2", legendX + 15)
        .attr("y2", legendY)
        .attr("stroke", color)
        .attr("stroke-width", 2);

      legendGroup
        .append("text")
        .attr("x", legendX + 20)
        .attr("y", legendY)
        .attr("fill", "#ffffff") // White text
        .attr("font-size", "12px")
        .attr("dominant-baseline", "middle")
        .text(channel.name);

      legendY += 18;
    });

    // Draw explanation
    infoGroup
      .append("text")
      .attr("x", centerX)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#888") // Light gray
      .attr("font-size", "12px")
      .text(
        "Each channel is displayed as a concentric circle with radius proportional to channel order"
      );
  }, [
    polarData,
    dimensions,
    amplitudeScale,
    playing,
    currentTime,
    samplingRate,
  ]);

  // Real-time animation for playing mode - ADJUSTED SPEED: Changed from 0.1 to 0.3
  useEffect(() => {
    if (!playing) return;

    const animate = () => {
      setCurrentTime((prev) => {
        const newTime = prev + (16 * speed * 0.3) / 1000; // CHANGED: 0.1 → 0.3 (3x faster)
        const maxTime = channels[0]?.length / samplingRate || 0;
        return newTime >= maxTime ? 0 : newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, speed, channels, samplingRate]);

  // Reset time when stopping or when data changes
  useEffect(() => {
    if (!playing) {
      setCurrentTime(0);
    }
  }, [playing, channels]);

  return (
    <div className="polar-mode-container">
      <div
        ref={containerRef}
        style={{
          border: "2px solid #444",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#000",
        }}
      />
      <div className="mt-3 small text-muted text-center">
        <strong>Polar Visualization:</strong> Each EEG channel is displayed as a
        concentric FULL circle. Inner circles represent lower channel numbers,
        outer circles represent higher channel numbers. Signal amplitude
        modulates the radius of each channel's path.
      </div>
    </div>
  );
};

export default PolarMode;
