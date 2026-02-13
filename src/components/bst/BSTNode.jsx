import React, { memo } from 'react';

const stateMap = {
  compare: {
    fill: 'rgba(245,158,11,0.2)',
    stroke: '#f59e0b',
    glow: '0 0 18px rgba(245,158,11,0.5)',
    textColor: '#fbbf24',
  },
  'go-left': {
    fill: 'rgba(99,102,241,0.2)',
    stroke: '#818cf8',
    glow: '0 0 14px rgba(99,102,241,0.4)',
    textColor: '#a5b4fc',
  },
  'go-right': {
    fill: 'rgba(139,92,246,0.2)',
    stroke: '#a78bfa',
    glow: '0 0 14px rgba(139,92,246,0.4)',
    textColor: '#c4b5fd',
  },
  found: {
    fill: 'rgba(16,185,129,0.25)',
    stroke: '#10b981',
    glow: '0 0 22px rgba(16,185,129,0.5)',
    textColor: '#34d399',
  },
  'found-delete': {
    fill: 'rgba(244,63,94,0.2)',
    stroke: '#f43f5e',
    glow: '0 0 18px rgba(244,63,94,0.45)',
    textColor: '#fb7185',
  },
  insert: {
    fill: 'rgba(16,185,129,0.25)',
    stroke: '#10b981',
    glow: '0 0 24px rgba(16,185,129,0.55)',
    textColor: '#34d399',
  },
  delete: {
    fill: 'rgba(244,63,94,0.25)',
    stroke: '#f43f5e',
    glow: '0 0 22px rgba(244,63,94,0.5)',
    textColor: '#fb7185',
  },
  visit: {
    fill: 'rgba(34,211,238,0.2)',
    stroke: '#22d3ee',
    glow: '0 0 20px rgba(34,211,238,0.5)',
    textColor: '#67e8f9',
  },
  successor: {
    fill: 'rgba(236,72,153,0.2)',
    stroke: '#ec4899',
    glow: '0 0 16px rgba(236,72,153,0.4)',
    textColor: '#f472b6',
  },
};

const defaultState = {
  fill: 'var(--node-bg)',
  stroke: 'var(--node-border)',
  glow: 'none',
  textColor: 'var(--text-primary)',
};

const NODE_R = 24;

const BSTNode = memo(function BSTNode({ x, y, value, state, depth }) {
  const s = stateMap[state] || defaultState;
  const isActive = !!state;

  return (
    <g style={{ transition: 'all 0.35s ease' }}>
      {/* Outer glow ring when active */}
      {isActive && (
        <>
          <circle
            cx={x} cy={y} r={NODE_R + 8}
            fill="none"
            stroke={s.stroke}
            strokeWidth={1.5}
            opacity={0.25}
            style={{ animation: 'rippleOut 1s ease-out forwards' }}
          />
          <circle
            cx={x} cy={y} r={NODE_R + 4}
            fill="none"
            stroke={s.stroke}
            strokeWidth={1}
            opacity={0.4}
          />
        </>
      )}

      {/* Background glow */}
      {isActive && (
        <circle
          cx={x} cy={y} r={NODE_R + 2}
          fill={s.stroke}
          opacity={0.08}
          style={{ filter: `blur(8px)` }}
        />
      )}

      {/* Main node circle */}
      <circle
        cx={x} cy={y} r={NODE_R}
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={isActive ? 2.5 : 1.8}
        style={{
          filter: isActive ? `drop-shadow(${s.glow})` : 'none',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Inner highlight arc */}
      <path
        d={`M ${x - NODE_R + 6} ${y - 6} A ${NODE_R - 4} ${NODE_R - 4} 0 0 1 ${x + NODE_R - 6} ${y - 6}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Value text */}
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={s.textColor}
        fontSize="14"
        fontWeight="800"
        fontFamily="'Inter', sans-serif"
        style={{ transition: 'fill 0.3s ease', userSelect: 'none' }}
      >
        {value}
      </text>

      {/* Depth label below node */}
      {depth !== undefined && depth > 0 && (
        <text
          x={x} y={y + NODE_R + 14}
          textAnchor="middle"
          fill="var(--text-dim)"
          fontSize="9"
          fontWeight="600"
          fontFamily="'JetBrains Mono', monospace"
          opacity={0.5}
        >
          d={depth}
        </text>
      )}
    </g>
  );
});

export default BSTNode;