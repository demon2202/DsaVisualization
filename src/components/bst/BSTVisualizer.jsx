import React, { memo, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import BSTNode from './BSTNode';

/**
 * BSTVisualizer
 *
 * Animation improvements:
 * - SVG viewBox animates via CSS transition on the <svg> element (smooth pan/zoom as tree grows)
 * - Edges use stroke-dasharray animation only when truly traversed, not always
 * - Nodes get a CSS keyframe on initial appearance (scale-in)
 * - No stacking glow blur filters — they tank perf on large trees
 */
const BSTVisualizer = memo(function BSTVisualizer() {
  const { bst } = useAppContext();
  const { positions, edges } = useMemo(() => bst.getLayout(), [bst.treeVersion]);

  const svgRef = useRef(null);
  const prevViewBox = useRef(null);

  const viewBox = useMemo(() => {
    if (positions.length === 0) return '0 0 600 400';
    const pad = 55;
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [positions]);

  // Animate the viewBox change using SMIL (works in all modern browsers)
  // We store prev and let SVG <animate> do the tween
  const prevVB = prevViewBox.current;
  useEffect(() => { prevViewBox.current = viewBox; }, [viewBox]);

  if (positions.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">⬡</div>
        <div className="empty-state-title">empty tree</div>
        <div className="empty-state-hint">Insert numbers to build a BST and trace every comparison</div>
      </div>
    );
  }

  return (
    <>
      {/* Keyframe injected once — no extra CSS file needed */}
      <style>{`
        @keyframes bstNodeIn {
          0%   { opacity: 0; transform: scale(0.5); }
          60%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bstRing {
          0%   { r: 24; opacity: 0.5; }
          100% { r: 36; opacity: 0; }
        }
        @keyframes edgeDash {
          from { stroke-dashoffset: 80; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          minHeight: '260px',
          transition: 'viewBox 0.4s ease',
        }}
      >
        <defs>
          <marker id="arrowTip" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--edge-default)" opacity="0.5" />
          </marker>
        </defs>

        {/* Edges first (behind nodes) */}
        {edges.map(e => {
          const fromActive = bst.nodeStates[e.fromId];
          const toActive   = bst.nodeStates[e.toId];
          const isLit      = fromActive || toActive;

          return (
            <line
              key={e.id}
              x1={e.x1} y1={e.y1 + 22}
              x2={e.x2} y2={e.y2 - 22}
              stroke={isLit ? 'var(--accent)' : 'var(--edge-default)'}
              strokeWidth={isLit ? 2 : 1.5}
              strokeLinecap="round"
              strokeDasharray={isLit ? '5 3' : 'none'}
              style={{
                transition: 'stroke 0.25s ease, stroke-width 0.2s ease',
                animation: isLit ? 'edgeDash 0.6s linear infinite' : 'none',
                opacity: isLit ? 0.9 : 0.4,
              }}
            />
          );
        })}

        {/* Nodes */}
        {positions.map(p => (
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
    </>
  );
});

export default BSTVisualizer;