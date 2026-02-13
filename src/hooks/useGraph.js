import { useState, useCallback, useRef } from 'react';

export default function useGraph() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeStates, setNodeStates] = useState({});
  const [edgeStates, setEdgeStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const adj = useRef(new Map());
  const nodeCounter = useRef(0);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setEdgeStates({});
    setCurrentMessage('');
  }, []);

  const addNode = useCallback((label) => {
    const id = `g_${nodeCounter.current++}`;
    const angle = (nodeCounter.current * 2.4) + Math.random() * 0.5;
    const r = 90 + Math.random() * 110;
    const x = 350 + Math.cos(angle) * r;
    const y = 210 + Math.sin(angle) * r;

    adj.current.set(id, new Set());
    setNodes(prev => [...prev, { id, label: label || `N${nodeCounter.current - 1}`, x, y }]);
    return { ok: true, msg: `Added node "${label || `N${nodeCounter.current - 1}`}"`, id };
  }, []);

  const addEdge = useCallback((fromId, toId, weight = 1) => {
    if (fromId === toId) return { ok: false, msg: 'Self-loops not allowed' };
    if (!adj.current.has(fromId) || !adj.current.has(toId))
      return { ok: false, msg: 'One or both nodes not found' };
    if (adj.current.get(fromId).has(toId))
      return { ok: false, msg: 'Edge already exists' };

    adj.current.get(fromId).add(toId);
    adj.current.get(toId).add(fromId);

    const edgeId = `${fromId}__${toId}`;
    setEdges(prev => [...prev, { id: edgeId, from: fromId, to: toId, weight }]);
    return { ok: true, msg: `Edge added` };
  }, []);

  const removeNode = useCallback((id) => {
    if (!adj.current.has(id)) return { ok: false, msg: 'Node not found' };
    const neighbors = adj.current.get(id);
    neighbors.forEach(nid => adj.current.get(nid)?.delete(id));
    adj.current.delete(id);
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    return { ok: true, msg: `Removed node` };
  }, []);

  const removeEdge = useCallback((fromId, toId) => {
    if (!adj.current.has(fromId) || !adj.current.has(toId)) return { ok: false, msg: 'Node not found' };
    adj.current.get(fromId).delete(toId);
    adj.current.get(toId).delete(fromId);
    setEdges(prev => prev.filter(e =>
      !(e.from === fromId && e.to === toId) && !(e.from === toId && e.to === fromId)
    ));
    return { ok: true, msg: 'Edge removed' };
  }, []);

  const bfs = useCallback((startId) => {
    if (!adj.current.has(startId)) return { steps: [], result: [] };
    const visited = new Set([startId]);
    const queue = [startId];
    const steps = [];
    const result = [];

    steps.push({ nodeId: startId, action: 'start', msg: 'Starting BFS' });

    while (queue.length > 0) {
      const id = queue.shift();
      steps.push({ nodeId: id, action: 'visit', msg: `Visiting ${id}` });
      result.push(id);

      const neighbors = Array.from(adj.current.get(id) || []).sort();
      for (const nb of neighbors) {
        const eid = `${id}__${nb}`;
        const eidR = `${nb}__${id}`;
        if (!visited.has(nb)) {
          visited.add(nb);
          steps.push({ edgeId: eid, edgeIdR: eidR, action: 'edge-visit', msg: `Exploring edge to ${nb}` });
          steps.push({ nodeId: nb, action: 'discover', msg: `Discovered ${nb}` });
          queue.push(nb);
        }
      }
    }
    return { steps, result };
  }, []);

  const dfs = useCallback((startId) => {
    if (!adj.current.has(startId)) return { steps: [], result: [] };
    const visited = new Set();
    const steps = [];
    const result = [];

    steps.push({ nodeId: startId, action: 'start', msg: 'Starting DFS' });

    function visit(id) {
      if (visited.has(id)) return;
      visited.add(id);
      steps.push({ nodeId: id, action: 'visit', msg: `Visiting ${id}` });
      result.push(id);

      const neighbors = Array.from(adj.current.get(id) || []).sort();
      for (const nb of neighbors) {
        if (!visited.has(nb)) {
          const eid = `${id}__${nb}`;
          const eidR = `${nb}__${id}`;
          steps.push({ edgeId: eid, edgeIdR: eidR, action: 'edge-visit', msg: `Traversing to ${nb}` });
          visit(nb);
          steps.push({ nodeId: id, action: 'backtrack', msg: `Backtracking to ${id}` });
        }
      }
    }

    visit(startId);
    return { steps, result };
  }, []);

  const clear = useCallback(() => {
    adj.current = new Map();
    nodeCounter.current = 0;
    setNodes([]);
    setEdges([]);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => {
    const nc = adj.current.size;
    const ec = edges.length;
    const maxE = nc > 1 ? (nc * (nc - 1)) / 2 : 0;
    const density = maxE > 0 ? +(ec / maxE).toFixed(3) : 0;

    let components = 0;
    const seen = new Set();
    for (const [id] of adj.current) {
      if (!seen.has(id)) {
        components++;
        const stack = [id];
        while (stack.length) {
          const curr = stack.pop();
          if (seen.has(curr)) continue;
          seen.add(curr);
          for (const nb of adj.current.get(curr)) {
            if (!seen.has(nb)) stack.push(nb);
          }
        }
      }
    }

    return { nodeCount: nc, edgeCount: ec, density, components, isEmpty: nc === 0 };
  }, [edges]);

  const moveNode = useCallback((id, x, y) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  return {
    nodes, edges,
    addNode, addEdge, removeNode, removeEdge,
    bfs, dfs, clear, getMetrics, moveNode,
    nodeStates, setNodeStates,
    edgeStates, setEdgeStates,
    currentMessage, setCurrentMessage,
    clearStates,
  };
}