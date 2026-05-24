import React, { memo, useEffect, useRef } from 'react';

/**
 * State → visual mapping.
 * Each state gets a distinct fill + stroke + label color.
 * No glow spam — just clean, readable color changes.
 */
const STATE = {
  compare:      { fill: 'rgba(251,191,36,0.15)',  stroke: '#fbbf24', text: '#fbbf24' },
  'go-left':    { fill: 'rgba(99,102,241,0.15)',  stroke: '#818cf8', text: '#a5b4fc' },
  'go-right':   { fill: 'rgba(139,92,246,0.15)',  stroke: '#a78bfa', text: '#c4b5fd' },
  found:        { fill: 'rgba(52,211,153,0.18)',  stroke: '#34d399', text: '#6ee7b7' },
  'found-delete':{ fill:'rgba(248,113,113,0.15)', stroke: '#f87171', text: '#fca5a5' },
  insert:       { fill: 'rgba(52,211,153,0.2)',   stroke: '#34d399', text: '#6ee7b7' },
  delete:       { fill: 'rgba(248,113,113,0.18)', stroke: '#f87171', text: '#fca5a5' },
  visit:        { fill: 'rgba(34,211,238,0.15)',  stroke: '#22d3ee', text: '#67e8f9' },
  successor:    { fill: 'rgba(236,72,153,0.15)',  stroke: '#ec4899', text: '#f9a8d4' },
};

const DEFAULT = {
  fill:   'var(--node-bg)',
  stroke: 'var(--node-border)',
  text:   'var(--text-primary)',
};

const R = 22;

/**
 * BSTNode renders an SVG group.
 * Position transitions are handled by the SVG viewBox changing smoothly via CSS,
 * and each node uses a CSS `transform` transition so it glides when the tree
 * re-layout happens (insert/delete moves siblings).
 */
const BSTNode = memo(function BSTNode({ x, y, value, state, depth }) {
  const s = STATE[state] || DEFAULT;
  const active = !!state;

  // Track previous position for smooth glide
  const gRef = useRef(null);

  return (
    <g
      ref={gRef}
      style={{
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Outer pulse ring — only on active, no stacking rings */}
      {active && (
        <circle
          cx={x} cy={y} r={R + 6}
          fill="none"
          stroke={s.stroke}
          strokeWidth={1}
          opacity={0.2}
          style={{ animation: 'bstRing 0.5s ease-out both' }}
        />
      )}

      {/* Main circle */}
      <circle
        cx={x} cy={y} r={R}
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={active ? 2 : 1.5}
        style={{ transition: 'fill 0.25s ease, stroke 0.25s ease, stroke-width 0.2s ease' }}
      />

      {/* Value */}
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={s.text}
        fontSize={String(value).length > 2 ? '11' : '13'}
        fontWeight="600"
        fontFamily="var(--font-mono)"
        style={{ transition: 'fill 0.25s ease', userSelect: 'none', pointerEvents: 'none' }}
      >
        {value}
      </text>

      {/* Depth tag — only below root */}
      {depth > 0 && (
        <text
          x={x} y={y + R + 11}
          textAnchor="middle"
          fill="var(--text-dim)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          opacity={0.5}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          d{depth}
        </text>
      )}
    </g>
  );
});

export default BSTNode;