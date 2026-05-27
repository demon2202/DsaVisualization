import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { useAppContext } from '../../hooks/useAppState';

/* ─── State color palette ─────────────────────────────────────────────────── */
const STATE_COLORS = {
  compare:       { fill: 'rgba(251,191,36,0.22)',  stroke: '#fbbf24', text: '#fbbf24', glow: 'rgba(251,191,36,0.5)'  },
  'go-left':     { fill: 'rgba(99,102,241,0.22)',  stroke: '#818cf8', text: '#a5b4fc', glow: 'rgba(99,102,241,0.4)'  },
  'go-right':    { fill: 'rgba(139,92,246,0.22)',  stroke: '#a78bfa', text: '#c4b5fd', glow: 'rgba(139,92,246,0.4)'  },
  found:         { fill: 'rgba(52,211,153,0.28)',  stroke: '#34d399', text: '#6ee7b7', glow: 'rgba(52,211,153,0.6)'  },
  'found-delete':{ fill: 'rgba(248,113,113,0.22)', stroke: '#f87171', text: '#fca5a5', glow: 'rgba(248,113,113,0.5)' },
  insert:        { fill: 'rgba(52,211,153,0.32)',  stroke: '#34d399', text: '#fff',    glow: 'rgba(52,211,153,0.7)'  },
  delete:        { fill: 'rgba(248,113,113,0.28)', stroke: '#f87171', text: '#fff',    glow: 'rgba(248,113,113,0.6)' },
  visit:         { fill: 'rgba(34,211,238,0.25)',  stroke: '#22d3ee', text: '#67e8f9', glow: 'rgba(34,211,238,0.55)' },
  successor:     { fill: 'rgba(236,72,153,0.22)',  stroke: '#ec4899', text: '#f9a8d4', glow: 'rgba(236,72,153,0.5)'  },
  'not-found':   { fill: 'rgba(248,113,113,0.1)',  stroke: '#f87171', text: '#f87171', glow: 'none'                  },
  visited:       { fill: 'rgba(34,211,238,0.12)',  stroke: '#22d3ee', text: '#22d3ee', glow: 'none'                  },
};

const DEFAULT_COLOR = {
  fill: 'var(--node-bg)', stroke: 'var(--node-border)', text: 'var(--text-primary)', glow: 'none',
};

const R = 23; // node radius

/* ─── BSTNode — SVG group with full CSS transitions ──────────────────────── */
function BSTNode({ x, y, value, state, depth, isNew, isVisited }) {
  const circleRef = useRef(null);

  // Entrance animation for newly inserted nodes
  useEffect(() => {
    if (!isNew || !circleRef.current) return;
    circleRef.current.animate(
      [
        { opacity: 0, transform: `translate(${x}px,${y}px) scale(0)` },
        { opacity: 1, transform: `translate(${x}px,${y}px) scale(1.18)` },
        { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)` },
      ],
      { duration: 450, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const s = isVisited && !state
    ? STATE_COLORS.visited
    : (STATE_COLORS[state] || DEFAULT_COLOR);
  const active = !!state;

  return (
    <g>
      {/* Glow ring — rendered as a blurred larger circle behind */}
      {(active || isVisited) && s.glow !== 'none' && (
        <circle
          cx={x} cy={y} r={R + 10}
          fill={s.glow}
          opacity={0.18}
          style={{ filter: 'blur(6px)', pointerEvents: 'none' }}
        />
      )}

      {/* Outer pulse ring when active */}
      {active && (
        <circle
          cx={x} cy={y} r={R + 7}
          fill="none"
          stroke={s.stroke}
          strokeWidth={1.2}
          opacity={0.3}
          style={{ animation: 'bstPulseRing 1.2s ease-out infinite' }}
        />
      )}

      {/* Main circle */}
      <circle
        ref={circleRef}
        cx={x} cy={y} r={R}
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={active ? 2.5 : isVisited ? 1.8 : 1.5}
        style={{
          transition: 'fill 0.3s ease, stroke 0.3s ease, stroke-width 0.2s ease',
          filter: active ? `drop-shadow(0 0 8px ${s.glow})` : 'none',
        }}
      />

      {/* Value text */}
      <text
        x={x} y={y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={s.text}
        fontSize={String(value).length > 2 ? '10' : '13'}
        fontWeight="700"
        fontFamily="var(--font-mono)"
        style={{ transition: 'fill 0.3s ease', userSelect: 'none', pointerEvents: 'none' }}
      >
        {value}
      </text>

      {/* Depth badge */}
      {depth > 0 && (
        <text
          x={x} y={y + R + 12}
          textAnchor="middle"
          fill="var(--text-dim)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          opacity={0.45}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          d{depth}
        </text>
      )}
    </g>
  );
}

/* ─── Edge with draw-on animation ────────────────────────────────────────── */
function BSTEdge({ x1, y1, x2, y2, fromId, toId, nodeStates, visitedPath, isNew }) {
  const fromActive = nodeStates[fromId];
  const toActive   = nodeStates[toId];
  const fromVisited = visitedPath.includes(fromId);
  const toVisited   = visitedPath.includes(toId);
  const isLit   = fromActive || toActive;
  const isDone  = fromVisited && toVisited;

  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  return (
    <g>
      {/* Glow duplicate behind for active edges */}
      {isLit && (
        <line
          x1={x1} y1={y1 + R} x2={x2} y2={y2 - R}
          stroke={fromActive ? (STATE_COLORS[fromActive]?.stroke || '#6366f1') : '#6366f1'}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.15}
          style={{ filter: 'blur(3px)' }}
        />
      )}

      {/* Main edge line */}
      <line
        x1={x1} y1={y1 + R} x2={x2} y2={y2 - R}
        stroke={
          isLit  ? (STATE_COLORS[fromActive]?.stroke || '#818cf8')
        : isDone ? '#22d3ee'
        :          'var(--edge-default)'
        }
        strokeWidth={isLit ? 2.2 : isDone ? 1.8 : 1.4}
        strokeLinecap="round"
        strokeDasharray={isLit ? `${len} ${len}` : 'none'}
        strokeDashoffset={isLit ? 0 : 'none'}
        opacity={isLit ? 1 : isDone ? 0.55 : 0.35}
        style={{
          transition: 'stroke 0.3s ease, stroke-width 0.2s ease, opacity 0.3s ease',
          animation: isNew ? `edgeDrawOn 0.5s ease-out forwards` : 'none',
        }}
      />
    </g>
  );
}

/* ─── Animated pointer ball ──────────────────────────────────────────────── */
function PointerBall({ pointer }) {
  if (!pointer) return null;
  const { x, y, state } = pointer;
  const color = STATE_COLORS[state]?.stroke || '#6366f1';

  return (
    <g style={{ transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none' }}>
      {/* Outer ripple */}
      <circle cx={x} cy={y} r={R + 14}
        fill="none" stroke={color} strokeWidth={1}
        opacity={0.3}
        style={{ animation: 'pointerRipple 1s ease-out infinite' }}
      />
      {/* Core dot */}
      <circle cx={x} cy={y} r={7}
        fill={color} opacity={0.9}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      {/* Inner bright spot */}
      <circle cx={x - 2} cy={y - 2} r={2.5}
        fill="rgba(255,255,255,0.7)"
      />
    </g>
  );
}

/* ─── Main Visualizer ────────────────────────────────────────────────────── */
const BSTVisualizer = memo(function BSTVisualizer() {
  const { bst } = useAppContext();
  const { positions, edges } = useMemo(() => bst.getLayout(), [bst.treeVersion]);
  const prevNodeIds = useRef(new Set());
  const newNodeIds  = useRef(new Set());
  const prevEdgeIds = useRef(new Set());
  const newEdgeIds  = useRef(new Set());

  // Detect newly added nodes and edges each render
  const curNodeIds = new Set(positions.map(p => p.id));
  const curEdgeIds = new Set(edges.map(e => e.id));
  newNodeIds.current = new Set([...curNodeIds].filter(id => !prevNodeIds.current.has(id)));
  newEdgeIds.current = new Set([...curEdgeIds].filter(id => !prevEdgeIds.current.has(id)));
  prevNodeIds.current = curNodeIds;
  prevEdgeIds.current = curEdgeIds;

  const viewBox = useMemo(() => {
    if (!positions.length) return '0 0 640 400';
    const pad = 60;
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad + 20;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [positions]);

  if (!positions.length) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">⬡</div>
        <div className="empty-state-title">empty tree</div>
        <div className="empty-state-hint">Insert numbers — watch the pointer navigate and find the right spot</div>
      </div>
    );
  }

  const visitedSet = new Set(bst.visitedPath || []);

  return (
    <>
      <style>{`
        @keyframes bstPulseRing {
          0%   { r: 30; opacity: 0.4; }
          100% { r: 44; opacity: 0; }
        }
        @keyframes pointerRipple {
          0%   { r: 30; opacity: 0.4; }
          100% { r: 50; opacity: 0; }
        }
        @keyframes edgeDrawOn {
          from { stroke-dashoffset: 200; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes nodePopIn {
          0%   { transform: scale(0);    opacity: 0; }
          70%  { transform: scale(1.2);  opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>

      <svg
        width="100%" height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', minHeight: '280px', transition: 'viewBox 0.5s ease' }}
      >
        <defs>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map(e => (
          <BSTEdge
            key={e.id}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            fromId={e.fromId} toId={e.toId}
            nodeStates={bst.nodeStates}
            visitedPath={bst.visitedPath || []}
            isNew={newEdgeIds.current.has(e.id)}
          />
        ))}

        {/* Nodes */}
        {positions.map(p => (
          <BSTNode
            key={p.id}
            x={p.x} y={p.y}
            value={p.value}
            state={bst.nodeStates[p.id]}
            depth={p.depth}
            isNew={newNodeIds.current.has(p.id)}
            isVisited={visitedSet.has(p.id)}
          />
        ))}

        {/* Animated pointer ball — moves to current node being examined */}
        <PointerBall pointer={bst.pointer} />
      </svg>
    </>
  );
});

export default BSTVisualizer;