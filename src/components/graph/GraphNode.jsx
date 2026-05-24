import React, { memo, useRef, useCallback } from 'react';

const STATE = {
  start:     { fill: 'rgba(251,191,36,0.18)',  stroke: '#fbbf24' },
  visit:     { fill: 'rgba(34,211,238,0.18)',  stroke: '#22d3ee' },
  discover:  { fill: 'rgba(99,102,241,0.18)',  stroke: '#818cf8' },
  backtrack: { fill: 'rgba(99,102,241,0.08)',  stroke: '#6366f1' },
};

const DEFAULT = {
  fill:   'var(--node-bg)',
  stroke: 'var(--node-border)',
};

const R = 24;

const GraphNode = memo(function GraphNode({ node, state, onDrag }) {
  const c = STATE[state] || DEFAULT;
  const active = !!state;
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    e.stopPropagation();
    dragging.current = true;

    const svg = e.target.closest('svg');
    const toSVG = (cx, cy) => {
      const pt = svg.createSVGPoint();
      pt.x = cx; pt.y = cy;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const origin = toSVG(e.clientX, e.clientY);
    offset.current = { x: origin.x - node.x, y: origin.y - node.y };

    const onMove = (e2) => {
      if (!dragging.current) return;
      const p = toSVG(e2.clientX, e2.clientY);
      onDrag(node.id, p.x - offset.current.x, p.y - offset.current.y);
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [node.id, node.x, node.y, onDrag]);

  return (
    <g onMouseDown={onMouseDown} style={{ cursor: 'grab' }}>
      {/* State ring — single, crisp */}
      {active && (
        <circle
          cx={node.x} cy={node.y} r={R + 7}
          fill="none"
          stroke={c.stroke}
          strokeWidth={1}
          opacity={0.18}
        />
      )}

      {/* Main node */}
      <circle
        cx={node.x} cy={node.y} r={R}
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth={active ? 2 : 1.5}
        style={{ transition: 'fill 0.22s ease, stroke 0.22s ease, stroke-width 0.18s ease' }}
      />

      {/* Label */}
      <text
        x={node.x} y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={active ? c.stroke : 'var(--node-text)'}
        fontSize="13"
        fontWeight="600"
        fontFamily="var(--font-mono)"
        style={{ userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.22s ease' }}
      >
        {node.label}
      </text>
    </g>
  );
});

export default GraphNode;