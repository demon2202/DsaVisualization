import React, { memo, useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import { OperationButton, InputField, SelectField, BtnRow, SectionLabel, Divider } from '../Shared';

const GraphControls = memo(function GraphControls() {
  const { app, graph, animator } = useAppContext();
  const [nodeLabel, setNodeLabel] = useState('');
  const [fromNode, setFromNode]   = useState('');
  const [toNode, setToNode]       = useState('');
  const [startNode, setStartNode] = useState('');
  const busy = app.state.isAnimating;

  const nodeOptions = [
    { value:'', label:'Select node…' },
    ...graph.nodes.map(n => ({ value:n.id, label:n.label })),
  ];

  const handleAddNode = useCallback(() => {
    if (!nodeLabel.trim()) return;
    const r = graph.addNode(nodeLabel.trim());
    app.addHistory({ success:r.ok, message:r.msg });
    setNodeLabel('');
  }, [nodeLabel, graph, app]);

  const handleAddEdge = useCallback(() => {
    if (!fromNode || !toNode) return;
    const r = graph.addEdge(fromNode, toNode);
    app.addHistory({ success:r.ok, message:r.msg });
  }, [fromNode, toNode, graph, app]);

  const handleTraversal = useCallback(async (type) => {
    if (!startNode) return;
    app.setAnimating(true);
    graph.clearStates();
    const { steps, result } = type === 'bfs' ? graph.bfs(startNode) : graph.dfs(startNode);
    await animator.animate(steps, async (step) => {
      if (step.nodeId) graph.setNodeStates(p => ({ ...p, [step.nodeId]: step.action }));
      if (step.edgeId) {
        graph.setEdgeStates(p => ({ ...p, [step.edgeId]:'active' }));
        if (step.edgeIdR) graph.setEdgeStates(p => ({ ...p, [step.edgeIdR]:'active' }));
      }
      if (step.msg) graph.setCurrentMessage(step.msg);
    });
    await new Promise(r => setTimeout(r, 1200));
    graph.clearStates();
    app.setAnimating(false);
    const path = result.map(id => graph.nodes.find(n => n.id === id)?.label || id).join(' → ');
    app.addHistory({ success:true, message:`${type.toUpperCase()}: ${path}` });
  }, [startNode, graph, app, animator]);

  const handleRandom = useCallback(() => {
    graph.clear();
    const labels = ['A','B','C','D','E','F'], ids = [];
    for (const l of labels) { const r = graph.addNode(l); ids.push(r.id); }
    setTimeout(() => {
      [[0,1],[0,2],[1,3],[2,4],[3,5],[1,4],[2,3]].forEach(([a,b]) => {
        if (ids[a] && ids[b]) graph.addEdge(ids[a], ids[b]);
      });
      app.addHistory({ success:true, message:'Random graph (6 nodes, 7 edges)' });
    }, 100);
  }, [graph, app]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <SectionLabel>Add Node</SectionLabel>
      <InputField value={nodeLabel} onChange={setNodeLabel} onKeyDown={e => e.key==='Enter' && handleAddNode()} placeholder="Node label…" disabled={busy} type="text" icon="⬡" />
      <OperationButton label="Add Node" icon="+" onClick={handleAddNode} disabled={busy} variant="success" />

      <Divider />
      <SectionLabel>Add Edge</SectionLabel>
      <SelectField value={fromNode} onChange={setFromNode} options={[{ value:'', label:'From node…' }, ...graph.nodes.map(n => ({ value:n.id, label:n.label }))]} />
      <SelectField value={toNode}   onChange={setToNode}   options={[{ value:'', label:'To node…' },   ...graph.nodes.map(n => ({ value:n.id, label:n.label }))]} />
      <OperationButton label="Add Edge" icon="🔗" onClick={handleAddEdge} disabled={busy} variant="primary" />

      <Divider />
      <SectionLabel>Traversal</SectionLabel>
      <SelectField value={startNode} onChange={setStartNode} options={[{ value:'', label:'Start node…' }, ...graph.nodes.map(n => ({ value:n.id, label:n.label }))]} />
      <BtnRow>
        <OperationButton label="BFS" icon="🌊" onClick={() => handleTraversal('bfs')} disabled={busy || !startNode} variant="warning" />
        <OperationButton label="DFS" icon="🔍" onClick={() => handleTraversal('dfs')} disabled={busy || !startNode} variant="cyan" />
      </BtnRow>

      <Divider />
      <SectionLabel>Actions</SectionLabel>
      <OperationButton label="Random Graph" icon="⊕" onClick={handleRandom} disabled={busy} variant="warning" />
      <OperationButton label="Clear" onClick={() => { graph.clear(); app.addHistory({ success:true, message:'Graph cleared' }); }} disabled={busy} variant="secondary" />
    </div>
  );
});

export default GraphControls;
