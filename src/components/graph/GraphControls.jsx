import React, { memo, useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import SelectField from '../SelectField';
import OperationButton from '../OperationButton';

const GraphControls = memo(function GraphControls() {
  const { app, graph, animator } = useAppContext();
  const [nodeLabel, setNodeLabel] = useState('');
  const [fromNode, setFromNode] = useState('');
  const [toNode, setToNode] = useState('');
  const [startNode, setStartNode] = useState('');
  const isAnimating = app.state.isAnimating;

  const nodeOptions = [
    { value: '', label: 'Select node...' },
    ...graph.nodes.map(n => ({ value: n.id, label: n.label })),
  ];

  const handleAddNode = useCallback(() => {
    if (!nodeLabel.trim()) {
      app.setStatus({ type: 'error', message: 'Enter a label for the node' });
      return;
    }
    const result = graph.addNode(nodeLabel.trim());
    app.setStatus({ type: result.ok ? 'success' : 'error', message: result.msg });
    app.addHistory({ success: result.ok, message: result.msg });
    setNodeLabel('');
  }, [nodeLabel, graph, app]);

  const handleAddEdge = useCallback(() => {
    if (!fromNode || !toNode) {
      app.setStatus({ type: 'error', message: 'Select both From and To nodes' });
      return;
    }
    const result = graph.addEdge(fromNode, toNode);
    app.setStatus({ type: result.ok ? 'success' : 'error', message: result.msg });
    app.addHistory({ success: result.ok, message: result.msg });
  }, [fromNode, toNode, graph, app]);

  const handleTraversal = useCallback(async (type) => {
    if (!startNode) {
      app.setStatus({ type: 'error', message: 'Select a starting node' });
      return;
    }

    app.setAnimating(true);
    app.setStatus({ type: 'running', message: `Running ${type.toUpperCase()}...` });
    graph.clearStates();

    const { steps, result } = type === 'bfs' ? graph.bfs(startNode) : graph.dfs(startNode);

    try {
      await animator.animate(steps, async (step) => {
        if (step.nodeId) {
          graph.setNodeStates(prev => ({ ...prev, [step.nodeId]: step.action }));
        }
        if (step.edgeId) {
          graph.setEdgeStates(prev => ({ ...prev, [step.edgeId]: 'active' }));
          if (step.edgeIdR) {
            graph.setEdgeStates(prev => ({ ...prev, [step.edgeIdR]: 'active' }));
          }
        }
        if (step.msg) graph.setCurrentMessage(step.msg);
      });
    } catch (e) { /* cancelled */ }

    setTimeout(() => graph.clearStates(), 1200);
    app.setAnimating(false);

    const labels = result.map(id => graph.nodes.find(n => n.id === id)?.label || id);
    const path = labels.join(' → ');
    app.setStatus({ type: 'success', message: `${type.toUpperCase()} complete`, detail: path });
    app.addHistory({ success: true, message: `${type.toUpperCase()}: ${path}` });
  }, [startNode, graph, app, animator]);

  const handleRandomGraph = useCallback(() => {
    graph.clear();
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const ids = [];
    for (const l of labels) {
      const r = graph.addNode(l);
      ids.push(r.id);
    }

    setTimeout(() => {
      const pairs = [[0,1],[0,2],[1,3],[2,4],[3,5],[1,4],[2,3]];
      for (const [a, b] of pairs) {
        if (ids[a] && ids[b]) graph.addEdge(ids[a], ids[b]);
      }
      app.setStatus({ type: 'success', message: 'Random graph generated' });
      app.addHistory({ success: true, message: 'Random graph generated (6 nodes, 7 edges)' });
    }, 100);
  }, [graph, app]);

  return (
    <div style={styles.container}>
      {/* Add node */}
      <div style={styles.section}>
        <span className="section-label">Add Node</span>
        <InputField
          value={nodeLabel}
          onChange={setNodeLabel}
          onKeyDown={e => e.key === 'Enter' && handleAddNode()}
          placeholder="Node label..."
          disabled={isAnimating}
          type="text"
          icon="⬡"
        />
        <OperationButton label="Add Node" icon="➕" onClick={handleAddNode} disabled={isAnimating} variant="success" />
      </div>

      <div className="divider" />

      {/* Add edge */}
      <div style={styles.section}>
        <span className="section-label">Add Edge</span>
        <SelectField
          value={fromNode}
          onChange={setFromNode}
          options={[{ value: '', label: 'From node...' }, ...graph.nodes.map(n => ({ value: n.id, label: n.label }))]}
          disabled={isAnimating}
          icon="🔵"
        />
        <SelectField
          value={toNode}
          onChange={setToNode}
          options={[{ value: '', label: 'To node...' }, ...graph.nodes.map(n => ({ value: n.id, label: n.label }))]}
          disabled={isAnimating}
          icon="🟣"
        />
        <OperationButton label="Add Edge" icon="🔗" onClick={handleAddEdge} disabled={isAnimating} variant="primary" />
      </div>

      <div className="divider" />

      {/* Traversals */}
      <div style={styles.section}>
        <span className="section-label">Traversal</span>
        <SelectField
          value={startNode}
          onChange={setStartNode}
          options={[{ value: '', label: 'Start node...' }, ...graph.nodes.map(n => ({ value: n.id, label: n.label }))]}
          disabled={isAnimating}
          icon="🏁"
        />
        <div style={styles.row}>
          <OperationButton label="BFS" icon="🌊" onClick={() => handleTraversal('bfs')} disabled={isAnimating || !startNode} variant="warning" />
          <OperationButton label="DFS" icon="🔍" onClick={() => handleTraversal('dfs')} disabled={isAnimating || !startNode} variant="cyan" />
        </div>
      </div>

      <div className="divider" />

      {/* Actions */}
      <div style={styles.section}>
        <span className="section-label">Actions</span>
        <OperationButton label="Random Graph" icon="🎲" onClick={handleRandomGraph} disabled={isAnimating} variant="warning" />
        <OperationButton
          label="Clear Graph"
          icon="💥"
          onClick={() => { graph.clear(); app.setStatus({ type: 'info', message: 'Graph cleared' }); app.addHistory({ success: true, message: 'Graph cleared' }); }}
          disabled={isAnimating}
          variant="secondary"
        />
      </div>
    </div>
  );
});

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '12px' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', gap: '6px' },
};

export default GraphControls;