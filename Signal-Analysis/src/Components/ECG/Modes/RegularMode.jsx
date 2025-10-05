// src/Components/ECG/modes/RegularMode.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";

const RegularMode = ({
  channels = [],
  samplingRate = 250,
  selected = [0],
  playing = false,
  speed = 1,
  windowSec = 5,
  amplitudeScale = 1,
  onFinish = () => {},
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const lastIdxRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 });

  const bufLen = Math.max(32, Math.floor(windowSec * samplingRate));
  const buffersRef = useRef([]);

  // responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(400, width),
          height: Math.max(150, height - 20),
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // initialize buffers on selected change or bufLen change
  useEffect(() => {
    buffersRef.current = selected.map((_, si) => {
      const old = buffersRef.current[si] || [];
      return old.slice(-bufLen); // احتفظ بالقديم واقطع حسب الطول الجديد
    });
    lastIdxRef.current = Math.max(lastIdxRef.current, 0); // ما ترجّعش للصفر
    startRef.current = null;
    initChart();
  }, [selected, bufLen]);

  const initChart = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
    svg.append("g").attr("class", "lines");
    svg.append("g").attr("class", "axis-y");
    svg.append("g").attr("class", "axis-x");
  }, [dimensions]);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleLinear()
      .domain([0, bufLen - 1])
      .range([40, width - 10]);

    // prepare displayed buffers (last bufLen)
    const displayed = buffersRef.current.map((buf) => {
      const b = buf.slice(-bufLen);
      if (b.length < bufLen) {
        const pad = new Array(bufLen - b.length).fill(0);
        return pad.concat(b);
      }
      return b;
    });

    // compute y domain on displayed values (apply amplitudeScale)
    const allValues = displayed
      .flat()
      .map((v) => (isFinite(v) ? v * amplitudeScale : 0));
    let yMin = d3.min(allValues);
    let yMax = d3.max(allValues);

    if (!isFinite(yMin) || !isFinite(yMax)) {
      yMin = -1;
      yMax = 1;
    }
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }

    const yPadding = (yMax - yMin) * 0.08;
    const y = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([height - 20, 10]);

    const line = d3
      .line()
      .x((d, i) => x(i))
      .y((d) => y((isFinite(d) ? d : 0) * amplitudeScale))
      .curve(d3.curveMonotoneX);

    // draw lines
    const g = svg.select(".lines");
    const paths = g.selectAll("path").data(displayed);

    paths
      .enter()
      .append("path")
      .merge(paths)
      .attr("d", (d) => line(d))
      .attr("fill", "none")
      .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
      .attr("stroke-width", 1.5)
      .attr("class", "ecg-line");

    paths.exit().remove();

    // y axis
    const yAxis = d3.axisLeft(y).ticks(5);
    svg.select(".axis-y").attr("transform", `translate(35,0)`).call(yAxis);

    // x axis: show seconds for window
    const totalTime = bufLen / samplingRate;
    const xTime = d3
      .scaleLinear()
      .domain([0, totalTime])
      .range([40, width - 10]);
    const xAxis = d3
      .axisBottom(xTime)
      .ticks(5)
      .tickFormat((d) => `${d.toFixed(1)}s`);
    svg
      .select(".axis-x")
      .attr("transform", `translate(0,${height - 15})`)
      .call(xAxis);
  }, [dimensions, bufLen, samplingRate, amplitudeScale]);

  // animation loop
  useEffect(() => {
    let animationId = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsedMs = timestamp - startRef.current;
      const desiredSample = Math.floor(
        (elapsedMs / 1000) * samplingRate * speed
      );
      const last = lastIdxRef.current;

      // compute max available index among selected channels
      const lengths = selected
        .map((si) => (channels[si] ? channels[si].length : 0))
        .filter((l) => l > 0);
      const maxIdx = lengths.length > 0 ? Math.min(...lengths) - 1 : -1;

      if (desiredSample > last && channels.length > 0 && maxIdx >= 0) {
        const upto = Math.min(desiredSample, maxIdx);

        if (upto > last) {
          // for each selected channel, push samples chunk (بدل loop وحدة وحدة)
          selected.forEach((chanIdx, si) => {
            const buf = buffersRef.current[si] || (buffersRef.current[si] = []);
            const channelData = channels[chanIdx] || [];
            const newSlice = channelData
              .slice(last + 1, upto + 1)
              .map((v) => (v != null && isFinite(v) ? v : 0));
            buf.push(...newSlice);
            if (buf.length > bufLen) {
              buf.splice(0, buf.length - bufLen); // قص من البداية بدل shift
            }
          });

          lastIdxRef.current = upto;
          draw();
        }
      }

      if (
        lastIdxRef.current >= 0 &&
        maxIdx >= 0 &&
        lastIdxRef.current >= maxIdx
      ) {
        onFinish();
        return;
      }

      if (playing) {
        animationId = requestAnimationFrame(step);
        rafRef.current = animationId;
      }
    };

    if (playing) {
      startRef.current = null;
      animationId = requestAnimationFrame(step);
      rafRef.current = animationId;
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    playing,
    channels,
    selected,
    samplingRate,
    speed,
    bufLen,
    draw,
    onFinish,
  ]);

  // redraw on resize / amplitude change
  useEffect(() => {
    if (buffersRef.current[0] && buffersRef.current[0].length >= 0) {
      draw();
    }
  }, [dimensions, draw, amplitudeScale]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", marginBlock: "10px" }}
    >
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#f8f9fa",
          borderRadius: "4px",
        }}
      />
      <div className="d-flex gap-2 mt-2 justify-content-center">
        <small className="text-muted">
          Window: {Math.round(bufLen / samplingRate)}s | Samples: {bufLen} |
          Rate: {samplingRate}Hz
        </small>
      </div>
    </div>
  );
};

export default RegularMode;
