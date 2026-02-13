import React, { memo, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import BSTNode from './BSTNode';

const BSTVisualizer = memo(function BSTVisualizer() {
  const { bst } = useAppContext();
  const { positions, edges } = useMemo(() => bst.getLayout(), [bst.treeVersion]);

  if (positions.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">🌳</div>
        <div className="empty-state-title">Empty Tree</div>
        <div className="empty-state-hint">
          Insert numeric values to build your binary search tree and watch it grow!
        </div>
      </div>
    );
  }

  const allX = positions.map(p => p.x);
  const allY = positions.map(p => p.y);
  const pad = 50;
  const minX = Math.min(...allX) - pad;
  const maxX = Math.max(...allX) + pad;
  const minY = Math.min(...allY) - pad;
  const maxY = Math.max(...allY) + pad;
  const vw = maxX - minX;
  const vh = maxY - minY;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${minX} ${minY} ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', minHeight: '280px' }}
    >
      <defs>
        <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="edgeActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent-1)" stopOpacity="0.6" />
        </linearGradient>
        <filter id="edgeGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((e) => {
        const fromState = bst.nodeStates[e.fromId];
        const toState = bst.nodeStates[e.toId];
        const isActive = fromState || toState;
        const edgeState = bst.edgeStates[e.id];

        return (
          <g key={e.id}>
            {isActive && (
              <line
                x1={e.x1} y1={e.y1 + 24}
                x2={e.x2} y2={e.y2 - 24}
                stroke={edgeState === 'active' ? 'var(--accent-cyan)' : 'var(--accent-1)'}
                strokeWidth={4}
                opacity={0.15}
                strokeLinecap="round"
                filter="url(#edgeGlow)"
              />
            )}
            <line
              x1={e.x1} y1={e.y1 + 24}
              x2={e.x2} y2={e.y2 - 24}
              stroke={isActive ? 'url(#edgeActiveGrad)' : 'url(#edgeGrad)'}
              strokeWidth={isActive ? 2.5 : 1.8}
              strokeLinecap="round"
              style={{
                transition: 'all 0.35s ease',
                strokeDasharray: isActive ? '6 3' : 'none',
                animation: isActive ? 'edgeTravel 1s linear infinite' : 'none',
              }}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {positions.map((p) => (
        <BSTNode
          key={p.id}
          x={p.x}
          y={p.y}
          value={p.value}
          state={bst.nodeStates[p.id]}
          depth={p.depth}
        />
      ))}
    </svg>
  );
});

export default BSTVisualizer;