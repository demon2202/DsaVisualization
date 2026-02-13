import React, { memo, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import GraphNode from './GraphNode';
import GraphEdge from './GraphEdge';

const GraphVisualizer = memo(function GraphVisualizer() {
  const { graph } = useAppContext();

  const handleDrag = useCallback((id, x, y) => {
    graph.moveNode(id, x, y);
  }, [graph]);

  if (graph.nodes.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">🕸️</div>
        <div className="empty-state-title">Empty Graph</div>
        <div className="empty-state-hint">
          Add nodes and connect them with edges. Drag nodes to rearrange. Run BFS or DFS traversals!
        </div>
      </div>
    );
  }

  const isEdgeHighlighted = (edge) => {
    return graph.edgeStates[edge.id] === 'active' ||
      graph.edgeStates[`${edge.to}__${edge.from}`] === 'active' ||
      graph.edgeStates[edge.id] ||
      graph.edgeStates[`${edge.to}__${edge.from}`];
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 700 440" style={{ display: 'block', minHeight: '300px' }}>
      <defs>
        <radialGradient id="graphBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-1)" stopOpacity="0.02" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="700" height="440" fill="url(#graphBg)" />

      {/* Edges */}
      {graph.edges.map(edge => {
        const fromNode = graph.nodes.find(n => n.id === edge.from);
        const toNode = graph.nodes.find(n => n.id === edge.to);
        return (
          <GraphEdge
            key={edge.id}
            from={fromNode}
            to={toNode}
            highlighted={isEdgeHighlighted(edge)}
          />
        );
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