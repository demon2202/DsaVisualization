import { useState, useCallback, useRef } from 'react';

export default function useGraph() {
  const [nodes,       setNodes]       = useState([]);
  const [edges,       setEdges]       = useState([]);
  const [nodeStates,  setNodeStates]  = useState({});
  const [edgeStates,  setEdgeStates]  = useState({});
  const [currentMessage, setCurrentMessage] = useState('');

  // Keep adjacency map in a ref — mutations don't need to trigger renders
  const adj     = useRef(new Map());
  const counter = useRef(0);
  // Keep nodes in a ref too so callbacks don't close over stale state
  const nodesRef = useRef([]);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setEdgeStates({});
    setCurrentMessage('');
  }, []);

  // ── Position — reads from ref, stable identity ─────────────────────────────

  const getPos = useCallback((existing) => {
    const n  = existing.length;
    const cx = 350, cy = 210;
    if (n === 0) return { x: cx, y: cy };

    const ring = Math.floor(n / 6);
    const slot = n % 6;
    const r    = 95 + ring * 75;
    const ang  = (slot / 6) * Math.PI * 2 + ring * 0.5;
    let x = cx + Math.cos(ang) * r;
    let y = cy + Math.sin(ang) * r;

    // Nudge away from any existing node that's too close
    const MIN = 62;
    for (let attempt = 0; attempt < 15; attempt++) {
      const clash = existing.some(en => {
        const dx = en.x - x, dy = en.y - y;
        return Math.sqrt(dx * dx + dy * dy) < MIN;
      });
      if (!clash) break;
      x += (Math.random() - 0.5) * 38;
      y += (Math.random() - 0.5) * 38;
    }

    return {
      x: Math.max(38, Math.min(662, x)),
      y: Math.max(38, Math.min(402, y)),
    };
  }, []);  // No deps — reads existing[] passed in, doesn't close over state

  // ── Label lookup — reads from ref ─────────────────────────────────────────

  const getLabel = useCallback((id) => nodesRef.current.find(n => n.id === id)?.label ?? id, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addNode = useCallback((label) => {
    const trimmed = (label ?? '').trim();
    if (!trimmed) return { ok: false, msg: 'Label cannot be empty' };
    if (nodesRef.current.some(n => n.label.toLowerCase() === trimmed.toLowerCase()))
      return { ok: false, msg: `"${trimmed}" already exists` };

    const id  = `g_${counter.current++}`;
    const pos = getPos(nodesRef.current);
    const node = { id, label: trimmed, x: pos.x, y: pos.y };

    adj.current.set(id, new Set());
    nodesRef.current = [...nodesRef.current, node];
    setNodes(nodesRef.current);
    return { ok: true, msg: `Added "${trimmed}"`, id };
  }, [getPos]);

  const addEdge = useCallback((fromId, toId) => {
    if (!fromId || !toId)             return { ok: false, msg: 'Select both nodes' };
    if (fromId === toId)              return { ok: false, msg: 'Self-loops not allowed' };
    if (!adj.current.has(fromId) || !adj.current.has(toId))
                                      return { ok: false, msg: 'Node not found' };
    if (adj.current.get(fromId).has(toId))
                                      return { ok: false, msg: 'Edge already exists' };

    adj.current.get(fromId).add(toId);
    adj.current.get(toId).add(fromId);
    const eid = `${fromId}__${toId}`;
    setEdges(prev => [...prev, { id: eid, from: fromId, to: toId }]);

    const fl = getLabel(fromId), tl = getLabel(toId);
    return { ok: true, msg: `Connected ${fl} ↔ ${tl}` };
  }, [getLabel]);

  const moveNode = useCallback((id, x, y) => {
    // Update ref synchronously (no re-render of controls)
    const clamped = { x: Math.max(30, Math.min(670, x)), y: Math.max(30, Math.min(410, y)) };
    nodesRef.current = nodesRef.current.map(n => n.id === id ? { ...n, ...clamped } : n);
    // Only update SVG (VisualizationContainer) — doesn't cause ControlPanel re-render
    setNodes(nodesRef.current);
  }, []);

  // ── Traversals ─────────────────────────────────────────────────────────────

  const bfs = useCallback((startId) => {
    if (!adj.current.has(startId)) return { steps: [], result: [] };
    const visited = new Set([startId]);
    const queue   = [startId];
    const steps   = [], result = [];
    const sl      = getLabel(startId);

    steps.push({ nodeId: startId, action: 'start', msg: `BFS from "${sl}"` });

    while (queue.length) {
      const id    = queue.shift();
      const label = getLabel(id);
      steps.push({ nodeId: id, action: 'visit', msg: `Visit "${label}"` });
      result.push(id);

      for (const nb of [...(adj.current.get(id) ?? [])].sort()) {
        const nl  = getLabel(nb);
        const eid = `${id}__${nb}`;
        if (!visited.has(nb)) {
          visited.add(nb);
          steps.push({ edgeId: eid, edgeIdR: `${nb}__${id}`, action: 'edge-visit', msg: `Edge → "${nl}"` });
          steps.push({ nodeId: nb, action: 'discover', msg: `Enqueue "${nl}"` });
          queue.push(nb);
        }
      }
    }

    const unvisited = nodesRef.current.filter(n => !visited.has(n.id));
    if (unvisited.length)
      steps.push({ action: 'info', msg: `${unvisited.length} node(s) unreachable` });

    return { steps, result };
  }, [getLabel]);

  const dfs = useCallback((startId) => {
    if (!adj.current.has(startId)) return { steps: [], result: [] };
    const visited = new Set();
    const steps   = [], result = [];

    steps.push({ nodeId: startId, action: 'start', msg: `DFS from "${getLabel(startId)}"` });

    const visit = (id, depth) => {
      if (visited.has(id)) return;
      visited.add(id);
      const label = getLabel(id);
      steps.push({ nodeId: id, action: 'visit', msg: `${'  '.repeat(depth)}Visit "${label}" (d${depth})` });
      result.push(id);

      for (const nb of [...(adj.current.get(id) ?? [])].sort()) {
        if (!visited.has(nb)) {
          const eid = `${id}__${nb}`;
          steps.push({ edgeId: eid, edgeIdR: `${nb}__${id}`, action: 'edge-visit', msg: `→ "${getLabel(nb)}"` });
          visit(nb, depth + 1);
          steps.push({ nodeId: id, action: 'backtrack', msg: `${'  '.repeat(depth)}← "${label}"` });
        }
      }
    };

    visit(startId, 0);
    const unvisited = nodesRef.current.filter(n => !visited.has(n.id));
    if (unvisited.length)
      steps.push({ action: 'info', msg: `${unvisited.length} node(s) unreachable` });

    return { steps, result };
  }, [getLabel]);

  const clear = useCallback(() => {
    adj.current    = new Map();
    counter.current = 0;
    nodesRef.current = [];
    setNodes([]);
    setEdges([]);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => {
    const nc  = adj.current.size;
    const ec  = edges.length;
    const maxE = nc > 1 ? (nc * (nc - 1)) / 2 : 0;
    const density = maxE > 0 ? +(ec / maxE).toFixed(3) : 0;

    // Connected components via iterative DFS
    let components = 0;
    const seen = new Set();
    for (const [id] of adj.current) {
      if (seen.has(id)) continue;
      components++;
      const stack = [id];
      while (stack.length) {
        const curr = stack.pop();
        if (seen.has(curr)) continue;
        seen.add(curr);
        for (const nb of adj.current.get(curr) ?? []) {
          if (!seen.has(nb)) stack.push(nb);
        }
      }
    }

    let totalDeg = 0;
    for (const [, nbrs] of adj.current) totalDeg += nbrs.size;

    return {
      nodeCount: nc, edgeCount: ec, density,
      components, avgDegree: nc > 0 ? +(totalDeg / nc).toFixed(1) : 0,
      isEmpty: nc === 0,
    };
  }, [edges.length]); // only edges.length, not whole edges array

  return {
    nodes, edges,
    addNode, addEdge, moveNode, clear, getMetrics,
    bfs, dfs,
    nodeStates, setNodeStates,
    edgeStates, setEdgeStates,
    currentMessage, setCurrentMessage,
    clearStates,
  };
}