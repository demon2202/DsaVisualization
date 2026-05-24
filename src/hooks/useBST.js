import { useState, useCallback, useRef, useMemo } from 'react';

// ─── Node class ──────────────────────────────────────────────────────────────

class BSTNode {
  constructor(value) {
    this.value = value;
    this.left  = null;
    this.right = null;
    this.id    = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }
}

// ─── Pure tree helpers (no React, no closures) ───────────────────────────────

function height(n)    { return n ? 1 + Math.max(height(n.left), height(n.right)) : 0; }
function count(n)     { return n ? 1 + count(n.left) + count(n.right) : 0; }
function minNode(n)   { let c = n; while (c?.left) c = c.left; return c; }
function maxNode(n)   { let c = n; while (c?.right) c = c.right; return c; }
function balanced(n)  {
  if (!n) return true;
  return Math.abs(height(n.left) - height(n.right)) <= 1 && balanced(n.left) && balanced(n.right);
}

// Subtree width used by layout
function subtreeWidth(n) {
  if (!n) return 0;
  return Math.max(48, subtreeWidth(n.left) + subtreeWidth(n.right) + 24);
}

function buildLayout(n, x, y, avail, positions, edges, depth) {
  if (!n) return;
  positions.push({ id: n.id, value: n.value, x, y, depth });

  const gap = 76;
  const cy  = y + gap;
  const lw  = subtreeWidth(n.left);
  const rw  = subtreeWidth(n.right);
  const tot = Math.max(lw + rw, 60);
  const half = avail / 2;
  const min  = 32;

  if (n.left) {
    const lx = x - Math.max(half * (lw / tot || 0.5), min);
    edges.push({ id: `${n.id}__${n.left.id}`, fromId: n.id, toId: n.left.id, x1: x, y1: y, x2: lx, y2: cy });
    buildLayout(n.left,  lx, cy, half * 0.85, positions, edges, depth + 1);
  }
  if (n.right) {
    const rx = x + Math.max(half * (rw / tot || 0.5), min);
    edges.push({ id: `${n.id}__${n.right.id}`, fromId: n.id, toId: n.right.id, x1: x, y1: y, x2: rx, y2: cy });
    buildLayout(n.right, rx, cy, half * 0.85, positions, edges, depth + 1);
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export default function useBST() {
  // treeVersion bumps only on structural changes (insert/delete/clear)
  const [treeVersion, setTreeVersion] = useState(0);
  const [nodeStates,  setNodeStates]  = useState({});
  const [edgeStates,  setEdgeStates]  = useState({});
  const [traversalResult, setTraversalResult] = useState([]);
  const [currentMessage,  setCurrentMessage]  = useState('');
  const rootRef = useRef(null);

  const bumpTree = useCallback(() => setTreeVersion(v => v + 1), []);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setEdgeStates({});
    setCurrentMessage('');
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const has = useCallback((value) => {
    let n = rootRef.current;
    while (n) {
      if (value === n.value) return true;
      n = value < n.value ? n.left : n.right;
    }
    return false;
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const insert = useCallback((value) => {
    if (typeof value !== 'number' || isNaN(value))
      return { ok: false, msg: 'Value must be a number', steps: [] };
    if (has(value))
      return { ok: false, msg: `${value} already exists`, steps: [] };

    const node  = new BSTNode(value);
    const steps = [];

    if (!rootRef.current) {
      rootRef.current = node;
      steps.push({ id: node.id, action: 'insert', msg: `${value} inserted as root` });
      bumpTree();
      return { ok: true, msg: `Inserted ${value} as root`, steps };
    }

    let curr = rootRef.current;
    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Compare ${value} with ${curr.value}` });
      if (value < curr.value) {
        steps.push({ id: curr.id, action: 'go-left', msg: `${value} < ${curr.value} → left` });
        if (!curr.left) { curr.left = node; break; }
        curr = curr.left;
      } else {
        steps.push({ id: curr.id, action: 'go-right', msg: `${value} > ${curr.value} → right` });
        if (!curr.right) { curr.right = node; break; }
        curr = curr.right;
      }
    }
    steps.push({ id: node.id, action: 'insert', msg: `Inserted ${value}` });
    bumpTree();
    return { ok: true, msg: `Inserted ${value}`, steps };
  }, [has, bumpTree]);

  const remove = useCallback((value) => {
    if (!rootRef.current) return { ok: false, msg: 'Tree is empty', steps: [] };
    if (!has(value))      return { ok: false, msg: `${value} not found`, steps: [] };

    const steps = [];

    function del(n, val) {
      if (!n) return null;
      steps.push({ id: n.id, action: 'compare', msg: `Examining ${n.value}` });
      if (val < n.value) {
        steps.push({ id: n.id, action: 'go-left',  msg: `${val} < ${n.value} → left` });
        n.left = del(n.left, val);
      } else if (val > n.value) {
        steps.push({ id: n.id, action: 'go-right', msg: `${val} > ${n.value} → right` });
        n.right = del(n.right, val);
      } else {
        steps.push({ id: n.id, action: 'found-delete', msg: `Found ${val} — deleting` });
        if (!n.left && !n.right) { steps.push({ id: n.id, action: 'delete', msg: 'Leaf — removed' }); return null; }
        if (!n.left)  { steps.push({ id: n.id, action: 'delete', msg: 'One child — replaced by right' }); return n.right; }
        if (!n.right) { steps.push({ id: n.id, action: 'delete', msg: 'One child — replaced by left' });  return n.left; }
        const succ = minNode(n.right);
        steps.push({ id: succ.id, action: 'successor', msg: `Successor is ${succ.value}` });
        steps.push({ id: n.id,    action: 'delete',    msg: `Replace ${val} → ${succ.value}` });
        n.value = succ.value;
        n.right = del(n.right, succ.value);
      }
      return n;
    }

    rootRef.current = del(rootRef.current, value);
    bumpTree();
    return { ok: true, msg: `Deleted ${value}`, steps };
  }, [has, bumpTree]);

  const search = useCallback((value) => {
    if (!rootRef.current) return { ok: false, msg: 'Tree is empty', steps: [] };
    const steps = [];
    let n = rootRef.current, depth = 0;
    while (n) {
      steps.push({ id: n.id, action: 'compare', msg: `d${depth}: compare with ${n.value}` });
      if (value === n.value) {
        steps.push({ id: n.id, action: 'found', msg: `Found ${value} at depth ${depth}` });
        return { ok: true, msg: `Found ${value} at depth ${depth}`, steps };
      }
      if (value < n.value) { steps.push({ id: n.id, action: 'go-left',  msg: `${value} < ${n.value}` }); n = n.left; }
      else                 { steps.push({ id: n.id, action: 'go-right', msg: `${value} > ${n.value}` }); n = n.right; }
      depth++;
    }
    return { ok: false, msg: `${value} not found`, steps };
  }, []);

  const traverse = useCallback((type) => {
    if (!rootRef.current) return { steps: [], result: [] };
    const steps = [], result = [];

    const visit = (n, msg) => { steps.push({ id: n.id, action: 'visit', msg }); result.push(n.value); };

    const inorder    = n => { if (!n) return; inorder(n.left);    visit(n, `Visit ${n.value}`);  inorder(n.right); };
    const preorder   = n => { if (!n) return; visit(n, `Visit ${n.value}`);  preorder(n.left);   preorder(n.right); };
    const postorder  = n => { if (!n) return; postorder(n.left);  postorder(n.right);  visit(n, `Visit ${n.value}`); };
    const levelorder = n => {
      const q = [{ n, lv: 0 }];
      while (q.length) {
        const { n: curr, lv } = q.shift();
        visit(curr, `Level ${lv}: ${curr.value}`);
        if (curr.left)  q.push({ n: curr.left,  lv: lv + 1 });
        if (curr.right) q.push({ n: curr.right, lv: lv + 1 });
      }
    };

    ({ inorder, preorder, postorder, levelorder })[type]?.(rootRef.current);
    return { steps, result };
  }, []);

  const clear = useCallback(() => {
    rootRef.current = null;
    bumpTree();
    clearStates();
    setTraversalResult([]);
  }, [bumpTree, clearStates]);

  // ── Derived data — memoized on treeVersion only, not on nodeStates ─────────
  // This means highlighting nodes during animation does NOT re-run layout/metrics

  const getLayout = useCallback(() => {
    const positions = [], edges = [];
    if (!rootRef.current) return { positions, edges };
    const h    = height(rootRef.current);
    const base = Math.max(280, Math.pow(2, h) * 42);
    buildLayout(rootRef.current, base / 2 + 48, 48, base / 2, positions, edges, 0);
    return { positions, edges };
  // treeVersion is the only thing that should trigger layout recalc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  const getMetrics = useCallback(() => {
    const r = rootRef.current;
    return {
      height:        height(r),
      nodeCount:     count(r),
      isBalanced:    balanced(r),
      balanceFactor: r ? height(r.left) - height(r.right) : 0,
      min:           minNode(r)?.value ?? null,
      max:           maxNode(r)?.value ?? null,
      isEmpty:       !r,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  return {
    treeVersion,
    insert, remove, search, traverse, clear, has,
    getLayout, getMetrics,
    nodeStates, setNodeStates,
    edgeStates, setEdgeStates,
    traversalResult, setTraversalResult,
    currentMessage,  setCurrentMessage,
    clearStates,
  };
}
