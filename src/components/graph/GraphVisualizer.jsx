import React, { memo, useCallback, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import GraphNode from './GraphNode';
import GraphEdge from './GraphEdge';

const GraphVisualizer = memo(function GraphVisualizer() {
  const { graph } = useAppContext();

  // Stable drag handler — graph.moveNode is already stable
  const handleDrag = useCallback((id, x, y) => {
    graph.moveNode(id, x, y);
  }, [graph.moveNode]);

  // Pre-compute a Set of highlighted edge ids — O(1) lookup per edge instead of 4 map lookups
  const litEdges = useMemo(() => {
    const s = new Set();
    for (const [id, state] of Object.entries(graph.edgeStates)) {
      if (state) s.add(id);
    }
    return s;
  }, [graph.edgeStates]);

  // Build a node position map for edge rendering
  const nodeMap = useMemo(() => {
    const m = new Map();
    for (const n of graph.nodes) m.set(n.id, n);
    return m;
  }, [graph.nodes]);

  if (graph.nodes.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">◎</div>
        <div className="empty-state-title">empty graph</div>
        <div className="empty-state-hint">Add nodes, connect them with edges, drag to rearrange. Run BFS or DFS.</div>
      </div>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 700 440" style={{ display: 'block', minHeight: '280px' }}>
      {/* Edges */}
      {graph.edges.map(edge => {
        const from = nodeMap.get(edge.from);
        const to   = nodeMap.get(edge.to);
        const lit  = litEdges.has(edge.id) || litEdges.has(`${edge.to}__${edge.from}`);
        return <GraphEdge key={edge.id} from={from} to={to} highlighted={lit} />;
      })}

      {/* Nodes */}
      {graph.nodes.map(node => (
        <GraphNode
          key={node.id}
          node={node}
          state={graph.nodeStates[node.id]}
          onDrag={handleDrag}
        />
      ))}
    </svg>
  );
});

export default GraphVisualizer;