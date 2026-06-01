import React, { memo, useCallback, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const GNS = {
  start:     { fill:'rgba(244,166,35,0.18)',  stroke:'#f4a623' },
  visit:     { fill:'rgba(54,188,247,0.18)',  stroke:'#36bcf7' },
  discover:  { fill:'rgba(108,99,255,0.18)',  stroke:'#9d8ffa' },
  backtrack: { fill:'rgba(108,99,255,0.07)',  stroke:'#6c63ff' },
};
const GND = { fill:'var(--node-bg)', stroke:'var(--node-border)' };
const GR = 24;

const GraphVisualizer = memo(function GraphVisualizer() {
  const { graph } = useAppContext();

  const handleDrag = useCallback((id, x, y) => graph.moveNode(id, x, y), [graph.moveNode]);

  const litEdges = useMemo(() => {
    const s = new Set();
    for (const [id, state] of Object.entries(graph.edgeStates)) { if (state) s.add(id); }
    return s;
  }, [graph.edgeStates]);

  const nodeMap = useMemo(() => new Map(graph.nodes.map(n => [n.id, n])), [graph.nodes]);

  if (!graph.nodes.length) return (
    <div className="empty-state">
      <div className="empty-icon">◎</div>
      <div className="empty-title">empty graph</div>
      <div className="empty-hint">Add nodes, connect them with edges, drag to rearrange. Run BFS or DFS.</div>
    </div>
  );

  return (
    <svg width="100%" height="100%" viewBox="0 0 700 440" style={{ display:'block', minHeight:'280px' }}>
      {graph.edges.map(edge => {
        const from = nodeMap.get(edge.from), to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const lit = litEdges.has(edge.id) || litEdges.has(`${edge.to}__${edge.from}`);
        return (
          <line key={edge.id}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={lit ? '#36bcf7' : 'var(--edge-default)'}
            strokeWidth={lit ? 2.5 : 1.4}
            strokeLinecap="round"
            strokeDasharray={lit ? '5 3' : undefined}
            opacity={lit ? 1 : 0.45}
            style={{ transition:'stroke 0.2s,stroke-width 0.2s' }}
          />
        );
      })}
      {graph.nodes.map(node => {
        const c = GNS[graph.nodeStates[node.id]] || GND;
        const active = !!graph.nodeStates[node.id];
        return (
          <g key={node.id} style={{ cursor:'grab' }}
            onMouseDown={e => {
              e.stopPropagation();
              const svg = e.target.closest('svg');
              const toSVG = (cx, cy) => { const pt = svg.createSVGPoint(); pt.x=cx; pt.y=cy; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
              const origin = toSVG(e.clientX, e.clientY);
              const offset = { x: origin.x - node.x, y: origin.y - node.y };
              let dragging = true;
              const onMove = ev => { if (!dragging) return; const p = toSVG(ev.clientX, ev.clientY); handleDrag(node.id, p.x - offset.x, p.y - offset.y); };
              const onUp   = () => { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          >
            {active && <circle cx={node.x} cy={node.y} r={GR+7} fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.18" />}
            <circle cx={node.x} cy={node.y} r={GR} fill={c.fill} stroke={c.stroke} strokeWidth={active ? 2 : 1.5} style={{ transition:'fill 0.2s,stroke 0.2s' }} />
            <text x={node.x} y={node.y+1} textAnchor="middle" dominantBaseline="middle"
              fill={active ? c.stroke : 'var(--node-text)'} fontSize="13" fontWeight="600" fontFamily="var(--mono)"
              style={{ userSelect:'none', pointerEvents:'none', transition:'fill 0.2s' }}
            >{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
});

export default GraphVisualizer;
