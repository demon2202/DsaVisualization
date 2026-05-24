import React, { memo } from 'react';

const GraphEdge = memo(function GraphEdge({ from, to, highlighted }) {
  if (!from || !to) return null;
  return (
    <line
      x1={from.x} y1={from.y}
      x2={to.x}   y2={to.y}
      stroke={highlighted ? 'var(--edge-visited)' : 'var(--edge-default)'}
      strokeWidth={highlighted ? 2.5 : 1.5}
      strokeLinecap="round"
      strokeDasharray={highlighted ? '5 3' : undefined}
      style={{
        transition: 'stroke 0.22s ease, stroke-width 0.18s ease',
        animation: highlighted ? 'edgeTravel 0.8s linear infinite' : undefined,
        opacity: highlighted ? 1 : 0.45,
      }}
    />
  );
});

export default GraphEdge;