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

  // Improved positioning: place nodes in a circle or force-directed pattern
  const getNodePosition = useCallback((existingNodes) => {
    const count = existingNodes.length;
    const cx = 350;
    const cy = 210;

    if (count === 0) return { x: cx, y: cy };

    // Place in expanding circles
    const ring = Math.floor(count / 6);
    const posInRing = count % 6;
    const baseRadius = 100 + ring * 80;
    const angleOffset = ring * 0.5; // Rotate each ring
    const angle = (posInRing / 6) * Math.PI * 2 + angleOffset;

    let x = cx + Math.cos(angle) * baseRadius;
    let y = cy + Math.sin(angle) * baseRadius;

    // Avoid overlap with existing nodes
    const minDist = 65;
    let attempts = 0;
    while (attempts < 20) {
      let tooClose = false;
      for (const n of existingNodes) {
        const dx = n.x - x;
        const dy = n.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) break;
      // Nudge position
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      attempts++;
    }

    // Clamp to viewBox
    x = Math.max(40, Math.min(660, x));
    y = Math.max(40, Math.min(400, y));

    return { x, y };
  }, []);

  const addNode = useCallback((label) => {
    const trimmed = (label || '').trim();
    if (!trimmed) {
      return { ok: false, msg: 'Node label cannot be empty' };
    }

    // Check for duplicate labels
    const existing = nodes.find(n => n.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return { ok: false, msg: `Node "${trimmed}" already exists` };
    }

    const id = `g_${nodeCounter.current++}`;
    const { x, y } = getNodePosition(nodes);

    adj.current.set(id, new Set());
    const newNode = { id, label: trimmed, x, y };
    setNodes(prev => [...prev, newNode]);

    return { ok: true, msg: `Added node "${trimmed}"`, id };
  }, [nodes, getNodePosition]);

  const addEdge = useCallback((fromId, toId) => {
    if (!fromId || !toId) {
      return { ok: false, msg: 'Select both nodes' };
    }
    if (fromId === toId) {
      return { ok: false, msg: 'Self-loops are not allowed' };
    }
    if (!adj.current.has(fromId) || !adj.current.has(toId)) {
      return { ok: false, msg: 'One or both nodes not found' };
    }
    if (adj.current.get(fromId).has(toId)) {
      return { ok: false, msg: 'Edge already exists between these nodes' };
    }

    adj.current.get(fromId).add(toId);
    adj.current.get(toId).add(fromId);

    const edgeId = `${fromId}__${toId}`;
    setEdges(prev => [...prev, { id: edgeId, from: fromId, to: toId }]);

    const fromLabel = nodes.find(n => n.id === fromId)?.label || fromId;
    const toLabel = nodes.find(n => n.id === toId)?.label || toId;

    return { ok: true, msg: `Connected ${fromLabel} ↔ ${toLabel}` };
  }, [nodes]);

  const removeNode = useCallback((id) => {
    if (!adj.current.has(id)) return { ok: false, msg: 'Node not found' };

    const label = nodes.find(n => n.id === id)?.label || id;
    const neighbors = adj.current.get(id);
    neighbors.forEach(nid => adj.current.get(nid)?.delete(id));
    adj.current.delete(id);

    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));

    return { ok: true, msg: `Removed node "${label}" and its edges` };
  }, [nodes]);

  const removeEdge = useCallback((fromId, toId) => {
    if (!adj.current.has(fromId) || !adj.current.has(toId)) {
      return { ok: false, msg: 'Node not found' };
    }
    if (!adj.current.get(fromId).has(toId)) {
      return { ok: false, msg: 'Edge does not exist' };
    }

    adj.current.get(fromId).delete(toId);
    adj.current.get(toId).delete(fromId);
    setEdges(prev => prev.filter(e =>
      !(e.from === fromId && e.to === toId) &&
      !(e.from === toId && e.to === fromId)
    ));
    return { ok: true, msg: 'Edge removed' };
  }, []);

  const getNodeLabel = useCallback((id) => {
    return nodes.find(n => n.id === id)?.label || id;
  }, [nodes]);

  const bfs = useCallback((startId) => {
    if (!adj.current.has(startId)) return { steps: [], result: [] };

    const visited = new Set([startId]);
    const queue = [startId];
    const steps = [];
    const result = [];

    const startLabel = getNodeLabel(startId);
    steps.push({ nodeId: startId, action: 'start', msg: `Starting BFS from "${startLabel}"` });

    while (queue.length > 0) {
      const id = queue.shift();
      const label = getNodeLabel(id);
      steps.push({ nodeId: id, action: 'visit', msg: `Dequeue and visit "${label}"` });
      result.push(id);

      const neighbors = Array.from(adj.current.get(id) || []).sort();
      for (const nb of neighbors) {
        const nbLabel = getNodeLabel(nb);
        const eid = `${id}__${nb}`;
        const eidR = `${nb}__${id}`;

        if (!visited.has(nb)) {
          visited.add(nb);
          steps.push({ edgeId: eid, edgeIdR: eidR, action: 'edge-visit', msg: `Exploring edge "${label}" → "${nbLabel}"` });
          steps.push({ nodeId: nb, action: 'discover', msg: `Discovered "${nbLabel}" — adding to queue` });
          queue.push(nb);
        }
      }
    }

    const unvisited = nodes.filter(n => !visited.has(n.id));
    if (unvisited.length > 0) {
      steps.push({
        nodeId: null, action: 'info',
        msg: `${unvisited.length} node(s) unreachable from "${startLabel}"`
      });
    }

    return { steps, result };
  }, [nodes, getNodeLabel]);

  const dfs = useCallback((startId) => {
    if (!adj.current.has(startId)) return { steps: [], result: [] };

    const visited = new Set();
    const steps = [];
    const result = [];

    const startLabel = getNodeLabel(startId);
    steps.push({ nodeId: startId, action: 'start', msg: `Starting DFS from "${startLabel}"` });

    function visit(id, depth) {
      if (visited.has(id)) return;
      visited.add(id);

      const label = getNodeLabel(id);
      steps.push({ nodeId: id, action: 'visit', msg: `${'  '.repeat(depth)}Visit "${label}" (depth ${depth})` });
      result.push(id);

      const neighbors = Array.from(adj.current.get(id) || []).sort();
      for (const nb of neighbors) {
        if (!visited.has(nb)) {
          const nbLabel = getNodeLabel(nb);
          const eid = `${id}__${nb}`;
          const eidR = `${nb}__${id}`;
          steps.push({ edgeId: eid, edgeIdR: eidR, action: 'edge-visit', msg: `${'  '.repeat(depth)}Traversing edge → "${nbLabel}"` });
          visit(nb, depth + 1);
          steps.push({ nodeId: id, action: 'backtrack', msg: `${'  '.repeat(depth)}Backtrack to "${label}"` });
        }
      }
    }

    visit(startId, 0);

    const unvisited = nodes.filter(n => !visited.has(n.id));
    if (unvisited.length > 0) {
      steps.push({
        nodeId: null, action: 'info',
        msg: `${unvisited.length} node(s) unreachable from "${startLabel}"`
      });
    }

    return { steps, result };
  }, [nodes, getNodeLabel]);

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

    // Count connected components
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
          for (const nb of adj.current.get(curr) || []) {
            if (!seen.has(nb)) stack.push(nb);
          }
        }
      }
    }

    // Calculate average degree
    let totalDegree = 0;
    for (const [, neighbors] of adj.current) {
      totalDegree += neighbors.size;
    }
    const avgDegree = nc > 0 ? +(totalDegree / nc).toFixed(1) : 0;

    return {
      nodeCount: nc,
      edgeCount: ec,
      density,
      components,
      avgDegree,
      isEmpty: nc === 0,
    };
  }, [edges]);

  const moveNode = useCallback((id, x, y) => {
    setNodes(prev => prev.map(n =>
      n.id === id ? { ...n, x: Math.max(30, Math.min(670, x)), y: Math.max(30, Math.min(410, y)) } : n
    ));
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