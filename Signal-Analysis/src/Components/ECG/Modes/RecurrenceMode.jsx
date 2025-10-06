import React from 'react';

const RecurrenceMode = ({ data, width = 400, height = 400 }) => {
  // Minimal rendering logic for recurrence plot
  // Assume 'data' is a 2D array or matrix

  return (
    <div style={{ width, height, overflow: 'auto', border: '1px solid #ccc' }}>
      <svg width={width} height={height}>
        {data &&
          data.map((row, i) =>
            row.map((val, j) =>
              val ? (
                <rect
                  key={`${i}-${j}`}
                  x={(j / data.length) * width}
                  y={(i / data.length) * height}
                  width={width / data.length}
                  height={height / data.length}
                  fill="#222"
                />
              ) : null
            )
          )}
      </svg>
    </div>
  );
};

export default RecurrenceMode;

