import React, { memo, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const SC = {
  compare:       { fill:'rgba(244,166,35,0.18)',  stroke:'#f4a623', text:'#f4a623', glow:'rgba(244,166,35,0.5)'  },
  'go-left':     { fill:'rgba(108,99,255,0.18)',  stroke:'#9d8ffa', text:'#b8acfc', glow:'rgba(108,99,255,0.4)'  },
  'go-right':    { fill:'rgba(167,139,250,0.18)', stroke:'#c4b5fd', text:'#d8ccfe', glow:'rgba(167,139,250,0.4)' },
  found:         { fill:'rgba(31,212,160,0.22)',  stroke:'#1fd4a0', text:'#6ee7c4', glow:'rgba(31,212,160,0.6)'  },
  'found-delete':{ fill:'rgba(239,96,112,0.18)',  stroke:'#ef6070', text:'#f8a0ab', glow:'rgba(239,96,112,0.5)'  },
  insert:        { fill:'rgba(31,212,160,0.3)',   stroke:'#1fd4a0', text:'#fff',    glow:'rgba(31,212,160,0.7)'  },
  delete:        { fill:'rgba(239,96,112,0.24)',  stroke:'#ef6070', text:'#fff',    glow:'rgba(239,96,112,0.6)'  },
  visit:         { fill:'rgba(54,188,247,0.2)',   stroke:'#36bcf7', text:'#7dd3fc', glow:'rgba(54,188,247,0.55)' },
  successor:     { fill:'rgba(236,72,153,0.18)',  stroke:'#f472b6', text:'#f9a8d4', glow:'rgba(236,72,153,0.5)'  },
  'not-found':   { fill:'rgba(239,96,112,0.08)',  stroke:'#ef6070', text:'#ef6070', glow:'none' },
  visited:       { fill:'rgba(54,188,247,0.10)',  stroke:'#36bcf7', text:'#36bcf7', glow:'none' },
};
const DC = { fill:'var(--node-bg)', stroke:'var(--node-border)', text:'var(--node-text)', glow:'none' };
const R = 23;

const BSTVisualizer = memo(function BSTVisualizer() {
  const { bst } = useAppContext();
  const { positions, edges } = useMemo(() => bst.getLayout(), [bst.treeVersion]);

  const viewBox = useMemo(() => {
    if (!positions.length) return '0 0 640 400';
    const pad = 60;
    const xs = positions.map(p => p.x), ys = positions.map(p => p.y);
    const minX = Math.min(...xs)-pad, maxX = Math.max(...xs)+pad;
    const minY = Math.min(...ys)-pad, maxY = Math.max(...ys)+pad+20;
    return `${minX} ${minY} ${maxX-minX} ${maxY-minY}`;
  }, [positions]);

  if (!positions.length) return (
    <div className="empty-state">
      <div className="empty-icon">⬡</div>
      <div className="empty-title">empty tree</div>
      <div className="empty-hint">Insert numbers — watch the pointer navigate and find the right spot</div>
    </div>
  );

  const visitedSet = new Set(bst.visitedPath || []);

  return (
    <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
      style={{ display:'block', minHeight:'280px' }}>
      <defs>
        <style>{`
          @keyframes bstPulseRing { 0%{r:30;opacity:0.4} 100%{r:48;opacity:0} }
          @keyframes pointerRipple { 0%{r:30;opacity:0.45} 100%{r:54;opacity:0} }
        `}</style>
      </defs>

      {/* Edges */}
      {edges.map(e => {
        const fa = bst.nodeStates[e.fromId], isLit = !!fa;
        const fv = visitedSet.has(e.fromId), tv = visitedSet.has(e.toId);
        const isDone = fv && tv;
        const sc = fa ? (SC[fa]?.stroke || '#6c63ff') : '#6c63ff';
        return (
          <g key={e.id}>
            {isLit && <line x1={e.x1} y1={e.y1+R} x2={e.x2} y2={e.y2-R} stroke={sc} strokeWidth="6" strokeLinecap="round" opacity="0.10" style={{ filter:'blur(4px)' }} />}
            <line x1={e.x1} y1={e.y1+R} x2={e.x2} y2={e.y2-R}
              stroke={isLit ? sc : isDone ? '#36bcf7' : 'var(--edge-default)'}
              strokeWidth={isLit ? 2.2 : isDone ? 1.8 : 1.2}
              strokeLinecap="round"
              opacity={isLit ? 1 : isDone ? 0.5 : 0.3}
              style={{ transition:'stroke 0.28s,opacity 0.28s' }}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {positions.map(p => {
        const st = visitedSet.has(p.id) && !bst.nodeStates[p.id]
          ? SC.visited : (SC[bst.nodeStates[p.id]] || DC);
        const active = !!bst.nodeStates[p.id];
        return (
          <g key={p.id}>
            {(active || visitedSet.has(p.id)) && st.glow !== 'none' &&
              <circle cx={p.x} cy={p.y} r={R+10} fill={st.glow} opacity="0.14" style={{ filter:'blur(7px)' }} />}
            {active &&
              <circle cx={p.x} cy={p.y} r={R+7} fill="none" stroke={st.stroke} strokeWidth="1.2" opacity="0.28"
                style={{ animation:'bstPulseRing 1.2s ease-out infinite' }} />}
            <circle cx={p.x} cy={p.y} r={R}
              fill={st.fill} stroke={st.stroke}
              strokeWidth={active ? 2.5 : 1.5}
              style={{ transition:'fill 0.28s,stroke 0.28s', filter: active && st.glow !== 'none' ? `drop-shadow(0 0 8px ${st.glow})` : 'none' }}
            />
            <text x={p.x} y={p.y+1} textAnchor="middle" dominantBaseline="middle"
              fill={st.text} fontSize={String(p.value).length > 2 ? '10' : '13'}
              fontWeight="700" fontFamily="var(--mono)"
              style={{ transition:'fill 0.28s', userSelect:'none', pointerEvents:'none' }}
            >{p.value}</text>
            {p.depth > 0 &&
              <text x={p.x} y={p.y+R+13} textAnchor="middle"
                fill="rgba(108,99,255,0.3)" fontSize="9" fontFamily="var(--mono)"
                style={{ userSelect:'none', pointerEvents:'none' }}
              >d{p.depth}</text>}
          </g>
        );
      })}

      {/* Pointer ball */}
      {bst.pointer && (() => {
        const { x, y, state } = bst.pointer;
        const col = SC[state]?.stroke || '#6c63ff';
        return (
          <g style={{ pointerEvents:'none' }}>
            <circle cx={x} cy={y} r={R+15} fill="none" stroke={col} strokeWidth="1" opacity="0.28"
              style={{ animation:'pointerRipple 1s ease-out infinite' }} />
            <circle cx={x} cy={y} r="7" fill={col} opacity="0.9"
              style={{ filter:`drop-shadow(0 0 6px ${col})` }} />
            <circle cx={x-2} cy={y-2} r="2.5" fill="rgba(255,255,255,0.65)" />
          </g>
        );
      })()}
    </svg>
  );
});

export default BSTVisualizer;
