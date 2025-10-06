import React, { useRef, useEffect } from 'react';

const ReverseMode = ({
  channels,
  selected,
  samplingRate,
  amplitudeScale,
  playing,
  speed,
  windowSec = 5,
}) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animationRef = useRef();
  const chunkHistoryRef = useRef([]);

  useEffect(() => {
    frameRef.current = 0;
    chunkHistoryRef.current = [];
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    drawFrame();
    // eslint-disable-next-line
  }, [channels, selected, samplingRate, amplitudeScale, windowSec, speed, playing]);

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !channels.length || selected.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Calculate window samples based on windowSec
    const windowSamples = Math.round(windowSec * samplingRate);
    let startIdx = frameRef.current;
    const channel = channels[selected[0]];

    // Get current chunk
    const currentChunk = channel.slice(startIdx, startIdx + windowSamples);

    // Add current chunk to history for XOR
    if (playing && currentChunk.length > 0) {
      chunkHistoryRef.current.push(currentChunk);
      
      // Keep only last 2 chunks for XOR comparison
      if (chunkHistoryRef.current.length > 2) {
        chunkHistoryRef.current.shift();
      }
    }

    if (startIdx + windowSamples > channel.length) {
      startIdx = 0;
      frameRef.current = 0;
    }

    // Animation: move window if playing
    if (playing) {
      animationRef.current = requestAnimationFrame(() => {
        frameRef.current += Math.round(speed);
        if (frameRef.current + windowSamples > channel.length) {
          frameRef.current = 0; // Loop
        }
        drawFrame();
      });
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    for (let x = 0; x < width; x += width / 20) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += height / 20) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw center line
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // XOR Visualization Logic
    if (chunkHistoryRef.current.length >= 2) {
      const currentData = chunkHistoryRef.current[chunkHistoryRef.current.length - 1];
      const previousData = chunkHistoryRef.current[chunkHistoryRef.current.length - 2];

      // Draw current wave (left to right)
      ctx.beginPath();
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;

      for (let i = 0; i < currentData.length; i++) {
        const x = (i / currentData.length) * width;
        const y = height / 2 - (currentData[i] * amplitudeScale * height / 4);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Apply XOR: Erase points that are identical between current and previous chunks
      ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;

      for (let i = 0; i < Math.min(currentData.length, previousData.length); i++) {
        const tolerance = 0.01; // Adjust this value for sensitivity
        if (Math.abs(currentData[i] - previousData[i]) < tolerance) {
          const x = (i / currentData.length) * width;
          const y = height / 2 - (currentData[i] * amplitudeScale * height / 4);
          
          // Draw white dots to "erase" identical points
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }
    } else if (currentChunk.length > 0) {
      // Draw initial wave if no history yet
      ctx.beginPath();
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;

      for (let i = 0; i < currentChunk.length; i++) {
        const x = (i / currentChunk.length) * width;
        const y = height / 2 - (currentChunk[i] * amplitudeScale * height / 4);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw moving cursor to show real-time progress
    if (playing && currentChunk.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      const cursorX = ((frameRef.current % windowSamples) / windowSamples) * width;
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();
    }

    // Draw info
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText(`Frame: ${frameRef.current}`, 10, 20);
    ctx.fillText(`Chunks: ${chunkHistoryRef.current.length}`, 10, 35);
    ctx.fillText('XOR Mode: Identical points erased in white', 10, 50);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{
        width: '100%',
        height: '400px',
        border: '1px solid #ccc',
        background: '#fff'
      }}
    />
  );
};

export default ReverseMode;