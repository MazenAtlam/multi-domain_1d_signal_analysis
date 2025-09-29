// src/Components/ECG/modes/PolarMode.jsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * Props:
 * - channels: number[][]    (each channel array)
 * - times: number[] | null
 * - samplingRate: number (Hz)
 * - selected: number[] (indices to display)
 * - playing: boolean
 * - speed: number
 * - amplitudeScale: number
 * - zoom: number
 */
const PolarMode = ({
//   channels,
//   times,
//   samplingRate,
//   selected,
//   playing,
//   speed,
//   amplitudeScale,
//   zoom,
  channels,
  times,
  samplingRate,
  selected,
  playing,
  speed,
  amplitudeScale,
  windowSec,
}) => {
  const containerRef = useRef();
  const animationRef = useRef();

  useEffect(() => {
    if (!channels || selected.length === 0) return;

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove(); // clear old render

    const heightPerChannel = 250;
    const width = containerRef.current.clientWidth || 800;

    // لكل قناة selected نعمل svg
    selected.forEach((chIdx, i) => {
      const signal = channels[chIdx];
      if (!signal) return;

      const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", heightPerChannel)
        .style("border-bottom", "1px solid #ccc");

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${heightPerChannel / 2})`);

      const radius = Math.min(width, heightPerChannel) / 2 - 20;

      // extent بتاع amplitude
      const ampExtent = d3.extent(signal);
      const r = d3
        .scaleLinear()
        .domain(ampExtent)
        .range([20, radius * amplitudeScale]);

      // θ يعتمد على الزمن
      const totalDuration =
        times && times.length > 0
          ? times[times.length - 1]
          : signal.length / samplingRate;

      const theta = d3
        .scaleLinear()
        .domain([0, totalDuration])
        .range([0, 2 * Math.PI * windowSec]);

      const line = d3
        .lineRadial()
        .angle((d, idx) => {
          const t = times ? times[idx] : idx / samplingRate;
          return theta(t);
        })
        .radius((d) => r(d));

      // label
      svg
        .append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("fill", "#333")
        .text(`Channel ${chIdx + 1}`);

      // animation
      let startTime = Date.now();

      function renderFrame() {
        const elapsed = ((Date.now() - startTime) / 1000) * speed; // elapsed seconds × speed
        const maxIdx = Math.min(
          signal.length,
          Math.floor(elapsed * samplingRate)
        );

        const currentSignal = signal.slice(0, maxIdx);

        g.selectAll("path").remove();

        g.append("path")
          .datum(currentSignal)
          .attr("fill", "none")
          .attr("stroke", d3.schemeCategory10[i % 10])
          .attr("stroke-width", 1.2)
          .attr("d", line);

        if (playing && maxIdx < signal.length) {
          animationRef.current = requestAnimationFrame(renderFrame);
        }
      }

      if (playing) {
        renderFrame();
      } else {
        // لو متوقف، نرسم السيجنال كله مرة واحدة
        g.append("path")
          .datum(signal)
          .attr("fill", "none")
          .attr("stroke", d3.schemeCategory10[i % 10])
          .attr("stroke-width", 1.2)
          .attr("d", line);
      }
    });

    return () => cancelAnimationFrame(animationRef.current);
  }, [channels, selected, windowSec, amplitudeScale, playing, speed]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    />
  );
};

export default PolarMode;
