import React, { memo } from 'react';

const GraphEdge = memo(function GraphEdge({ from, to, highlighted }) {
  if (!from || !to) return null;

  return (
    <g>
      {highlighted && (
        <line
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke="var(--accent-cyan)" strokeWidth={5} opacity={0.15}
          strokeLinecap="round"
          style={{ filter: 'blur(3px)' }}
        />
      )}
      <line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke={highlighted ? 'var(--edge-visited)' : 'var(--edge-default)'}
        strokeWidth={highlighted ? 2.5 : 1.8}
        strokeLinecap="round"
        style={{
          transition: 'all 0.35s ease',
          strokeDasharray: highlighted ? '6 4' : 'none',
          animation: highlighted ? 'edgeTravel 1s linear infinite' : 'none',
        }}
      />
    </g>
  );
});

export default GraphEdge;