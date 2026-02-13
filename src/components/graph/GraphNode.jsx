import React, { memo, useCallback, useRef } from 'react';

const stateMap = {
  start: { fill: 'rgba(245,158,11,0.25)', stroke: '#f59e0b' },
  visit: { fill: 'rgba(34,211,238,0.25)', stroke: '#22d3ee' },
  discover: { fill: 'rgba(168,85,247,0.2)', stroke: '#a78bfa' },
  backtrack: { fill: 'rgba(99,102,241,0.15)', stroke: '#818cf8' },
};

const defaultColors = { fill: 'var(--node-bg)', stroke: 'var(--node-border)' };

const NODE_R = 26;

const GraphNode = memo(function GraphNode({ node, state, onDrag }) {
  const c = stateMap[state] || defaultColors;
  const isActive = !!state;
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    e.stopPropagation();
    dragging.current = true;
    const svg = e.target.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    offset.current = { x: svgPt.x - node.x, y: svgPt.y - node.y };

    const onMove = (e2) => {
      if (!dragging.current) return;
      const pt2 = svg.createSVGPoint();
      pt2.x = e2.clientX;
      pt2.y = e2.clientY;
      const svgPt2 = pt2.matrixTransform(svg.getScreenCTM().inverse());
      onDrag(node.id, svgPt2.x - offset.current.x, svgPt2.y - offset.current.y);
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
      {/* Outer glow */}
      {isActive && (
        <>
          <circle cx={node.x} cy={node.y} r={NODE_R + 10}
            fill="none" stroke={c.stroke} strokeWidth={1.2} opacity={0.2}
            style={{ animation: 'rippleOut 1.2s ease-out forwards' }}
          />
          <circle cx={node.x} cy={node.y} r={NODE_R + 3}
            fill={c.stroke} opacity={0.06}
            style={{ filter: 'blur(6px)' }}
          />
        </>
      )}

      {/* Main circle */}
      <circle
        cx={node.x} cy={node.y} r={NODE_R}
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth={isActive ? 2.5 : 1.8}
        style={{
          filter: isActive ? `drop-shadow(0 0 12px ${c.stroke})` : 'none',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Glass highlight */}
      <ellipse
        cx={node.x} cy={node.y - 8}
        rx={NODE_R - 8} ry={6}
        fill="rgba(255,255,255,0.06)"
      />

      {/* Label */}
      <text
        x={node.x} y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isActive ? c.stroke : 'var(--text-primary)'}
        fontSize="13"
        fontWeight="800"
        fontFamily="'Inter', sans-serif"
        style={{ userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.3s ease' }}
      >
        {node.label}
      </text>
    </g>
  );
});

export default GraphNode;