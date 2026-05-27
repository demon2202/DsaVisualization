import { useState, useCallback, useRef } from 'react';

class BSTNode {
  constructor(value) {
    this.value = value;
    this.left  = null;
    this.right = null;
    this.id    = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  }
}

function height(n)  { return n ? 1 + Math.max(height(n.left), height(n.right)) : 0; }
function count(n)   { return n ? 1 + count(n.left) + count(n.right) : 0; }
function minNode(n) { let c = n; while (c?.left) c = c.left; return c; }
function maxNode(n) { let c = n; while (c?.right) c = c.right; return c; }
function balanced(n) {
  if (!n) return true;
  return Math.abs(height(n.left) - height(n.right)) <= 1 && balanced(n.left) && balanced(n.right);
}

function subtreeWidth(n) {
  if (!n) return 0;
  return Math.max(56, subtreeWidth(n.left) + subtreeWidth(n.right) + 28);
}

function buildLayout(n, x, y, avail, positions, edges, depth) {
  if (!n) return;
  positions.push({ id: n.id, value: n.value, x, y, depth });
  const cy = y + 80;
  const lw = subtreeWidth(n.left), rw = subtreeWidth(n.right);
  const tot = Math.max(lw + rw, 70);
  const half = avail / 2, min = 38;
  if (n.left) {
    const lx = x - Math.max(half * (lw / tot || 0.5), min);
    edges.push({ id: `${n.id}__${n.left.id}`, fromId: n.id, toId: n.left.id, x1: x, y1: y, x2: lx, y2: cy, side: 'left' });
    buildLayout(n.left, lx, cy, half * 0.85, positions, edges, depth + 1);
  }
  if (n.right) {
    const rx = x + Math.max(half * (rw / tot || 0.5), min);
    edges.push({ id: `${n.id}__${n.right.id}`, fromId: n.id, toId: n.right.id, x1: x, y1: y, x2: rx, y2: cy, side: 'right' });
    buildLayout(n.right, rx, cy, half * 0.85, positions, edges, depth + 1);
  }
}

export default function useBST() {
  const [treeVersion, setTreeVersion] = useState(0);
  const [nodeStates,  setNodeStates]  = useState({});
  const [traversalResult, setTraversalResult] = useState([]);
  const [currentMessage,  setCurrentMessage]  = useState('');
  // pointer = { x, y } — the animated "cursor" dot moving through the tree
  const [pointer, setPointer] = useState(null);
  // visitedPath = array of node ids highlighted as "already visited" during traversal
  const [visitedPath, setVisitedPath] = useState([]);
  const rootRef = useRef(null);

  const bumpTree = useCallback(() => setTreeVersion(v => v + 1), []);
  const clearStates = useCallback(() => {
    setNodeStates({});
    setCurrentMessage('');
    setPointer(null);
    setVisitedPath([]);
  }, []);

  const has = useCallback((value) => {
    let n = rootRef.current;
    while (n) {
      if (value === n.value) return true;
      n = value < n.value ? n.left : n.right;
    }
    return false;
  }, []);

  /* ─── INSERT ─────────────────────────────────────────────────────────────
     Each step now carries:
       action  — what visual state to show on the node
       id      — which node
       msg     — human-readable explanation
       pointerX/Y — where the animated pointer ball should move to
       direction — 'left'|'right'|null for the edge arrow glow
       newNode — true when this is the freshly inserted node
  */
  const insert = useCallback((value) => {
    if (typeof value !== 'number' || isNaN(value))
      return { ok: false, msg: 'Value must be a number', steps: [] };
    if (has(value))
      return { ok: false, msg: `${value} already exists in the tree`, steps: [] };

    const node  = new BSTNode(value);
    const steps = [];

    if (!rootRef.current) {
      rootRef.current = node;
      bumpTree();
      // Layout so we know where root is
      const pos = []; buildLayout(rootRef.current, 200, 48, 200, pos, [], 0);
      const p = pos[0];
      steps.push({ action: 'insert', id: node.id, msg: `Tree is empty — ${value} becomes the root`, pointerX: p?.x, pointerY: p?.y, newNode: true });
      return { ok: true, msg: `Inserted ${value} as root`, steps };
    }

    let curr = rootRef.current;
    // Pre-compute layout so we have positions for pointer movement
    const allPos = []; buildLayout(rootRef.current, 0, 0, 0, allPos, [], 0);
    const posMap = Object.fromEntries(allPos.map(p => [p.id, p]));

    while (curr) {
      const cp = posMap[curr.id] || {};
      steps.push({
        action: 'compare', id: curr.id,
        msg: `Comparing ${value} with node ${curr.value} — which direction?`,
        pointerX: cp.x, pointerY: cp.y,
      });

      if (value < curr.value) {
        steps.push({
          action: 'go-left', id: curr.id,
          msg: `${value} < ${curr.value} → go LEFT`,
          pointerX: cp.x, pointerY: cp.y, direction: 'left',
        });
        if (!curr.left) {
          curr.left = node;
          bumpTree();
          const newPos = []; buildLayout(rootRef.current, 0, 0, 0, newPos, [], 0);
          const np = Object.fromEntries(newPos.map(p => [p.id, p]));
          const inserted = np[node.id] || {};
          steps.push({
            action: 'insert', id: node.id,
            msg: `Empty slot found! Inserting ${value} as LEFT child of ${curr.value}`,
            pointerX: inserted.x, pointerY: inserted.y, newNode: true,
          });
          break;
        }
        curr = curr.left;
      } else {
        steps.push({
          action: 'go-right', id: curr.id,
          msg: `${value} > ${curr.value} → go RIGHT`,
          pointerX: cp.x, pointerY: cp.y, direction: 'right',
        });
        if (!curr.right) {
          curr.right = node;
          bumpTree();
          const newPos2 = []; buildLayout(rootRef.current, 0, 0, 0, newPos2, [], 0);
          const np2 = Object.fromEntries(newPos2.map(p => [p.id, p]));
          const inserted2 = np2[node.id] || {};
          steps.push({
            action: 'insert', id: node.id,
            msg: `Empty slot found! Inserting ${value} as RIGHT child of ${curr.value}`,
            pointerX: inserted2.x, pointerY: inserted2.y, newNode: true,
          });
          break;
        }
        curr = curr.right;
      }
    }

    return { ok: true, msg: `Inserted ${value}`, steps };
  }, [has, bumpTree]);

  /* ─── DELETE ─────────────────────────────────────────────────────────────*/
  const remove = useCallback((value) => {
    if (!rootRef.current) return { ok: false, msg: 'Tree is empty', steps: [] };
    if (!has(value))      return { ok: false, msg: `${value} not found in tree`, steps: [] };

    const steps = [];
    const allPos = []; buildLayout(rootRef.current, 0, 0, 0, allPos, [], 0);
    const posMap = Object.fromEntries(allPos.map(p => [p.id, p]));

    function del(n, val) {
      if (!n) return null;
      const cp = posMap[n.id] || {};
      steps.push({ action: 'compare', id: n.id, msg: `Examining node ${n.value}`, pointerX: cp.x, pointerY: cp.y });

      if (val < n.value) {
        steps.push({ action: 'go-left',  id: n.id, msg: `${val} < ${n.value} → search LEFT`, direction: 'left', pointerX: cp.x, pointerY: cp.y });
        n.left = del(n.left, val);
      } else if (val > n.value) {
        steps.push({ action: 'go-right', id: n.id, msg: `${val} > ${n.value} → search RIGHT`, direction: 'right', pointerX: cp.x, pointerY: cp.y });
        n.right = del(n.right, val);
      } else {
        steps.push({ action: 'found-delete', id: n.id, msg: `Found ${val}! Determining deletion strategy…`, pointerX: cp.x, pointerY: cp.y });
        if (!n.left && !n.right) {
          steps.push({ action: 'delete', id: n.id, msg: `${val} is a leaf → simply remove it`, pointerX: cp.x, pointerY: cp.y });
          return null;
        }
        if (!n.left)  { steps.push({ action: 'delete', id: n.id, msg: `One child only → replace with right subtree` }); return n.right; }
        if (!n.right) { steps.push({ action: 'delete', id: n.id, msg: `One child only → replace with left subtree`  }); return n.left;  }
        const succ = minNode(n.right);
        const sp   = posMap[succ.id] || {};
        steps.push({ action: 'successor', id: succ.id, msg: `Two children → find in-order successor (smallest in right subtree): ${succ.value}`, pointerX: sp.x, pointerY: sp.y });
        steps.push({ action: 'delete',    id: n.id,    msg: `Copy successor value ${succ.value} here, then delete successor` });
        n.value = succ.value;
        n.right = del(n.right, succ.value);
      }
      return n;
    }

    rootRef.current = del(rootRef.current, value);
    bumpTree();
    return { ok: true, msg: `Deleted ${value}`, steps };
  }, [has, bumpTree]);

  /* ─── SEARCH ─────────────────────────────────────────────────────────────*/
  const search = useCallback((value) => {
    if (!rootRef.current) return { ok: false, msg: 'Tree is empty', steps: [] };

    const steps  = [];
    const allPos = []; buildLayout(rootRef.current, 0, 0, 0, allPos, [], 0);
    const posMap = Object.fromEntries(allPos.map(p => [p.id, p]));

    let n = rootRef.current, depth = 0;
    while (n) {
      const cp = posMap[n.id] || {};
      steps.push({ action: 'compare', id: n.id, msg: `Depth ${depth}: is ${value} == ${n.value}?`, pointerX: cp.x, pointerY: cp.y });
      if (value === n.value) {
        steps.push({ action: 'found', id: n.id, msg: `✓ Found ${value} at depth ${depth}!`, pointerX: cp.x, pointerY: cp.y });
        return { ok: true, msg: `Found ${value} at depth ${depth}`, steps };
      }
      if (value < n.value) {
        steps.push({ action: 'go-left',  id: n.id, msg: `${value} < ${n.value} → go left`, direction: 'left',  pointerX: cp.x, pointerY: cp.y });
        n = n.left;
      } else {
        steps.push({ action: 'go-right', id: n.id, msg: `${value} > ${n.value} → go right`, direction: 'right', pointerX: cp.x, pointerY: cp.y });
        n = n.right;
      }
      depth++;
    }
    steps.push({ action: 'not-found', id: null, msg: `Reached null — ${value} is NOT in the tree` });
    return { ok: false, msg: `${value} not found`, steps };
  }, []);

  /* ─── TRAVERSE ───────────────────────────────────────────────────────────
     visitedIds tracks accumulation so already-visited nodes stay colored
  */
  const traverse = useCallback((type) => {
    if (!rootRef.current) return { steps: [], result: [] };

    const steps = [], result = [];
    const allPos = []; buildLayout(rootRef.current, 0, 0, 0, allPos, [], 0);
    const posMap = Object.fromEntries(allPos.map(p => [p.id, p]));

    const visit = (n, extra = '') => {
      const cp = posMap[n.id] || {};
      steps.push({
        action: 'visit', id: n.id,
        msg: `Visit ${n.value}${extra}`,
        pointerX: cp.x, pointerY: cp.y,
        accumulateVisited: true,
      });
      result.push(n.value);
    };
    const moveTo = (n, msg) => {
      const cp = posMap[n.id] || {};
      steps.push({ action: 'compare', id: n.id, msg, pointerX: cp.x, pointerY: cp.y });
    };

    const inorder = n => {
      if (!n) return;
      if (n.left)  moveTo(n.left,  `Go left from ${n.value}`);
      inorder(n.left);
      visit(n, ' (Left done → visiting Node)');
      if (n.right) moveTo(n.right, `Go right from ${n.value}`);
      inorder(n.right);
    };
    const preorder = n => {
      if (!n) return;
      visit(n, ' (Node first)');
      if (n.left)  moveTo(n.left,  `Now explore left of ${n.value}`);
      preorder(n.left);
      if (n.right) moveTo(n.right, `Now explore right of ${n.value}`);
      preorder(n.right);
    };
    const postorder = n => {
      if (!n) return;
      if (n.left)  moveTo(n.left,  `Go left first from ${n.value}`);
      postorder(n.left);
      if (n.right) moveTo(n.right, `Go right from ${n.value}`);
      postorder(n.right);
      visit(n, ' (Both children done → visit)');
    };
    const levelorder = n => {
      const q = [{ n, lv: 0 }];
      while (q.length) {
        const { n: curr, lv } = q.shift();
        visit(curr, ` — level ${lv}`);
        if (curr.left)  q.push({ n: curr.left,  lv: lv + 1 });
        if (curr.right) q.push({ n: curr.right, lv: lv + 1 });
      }
    };

    ({ inorder, preorder, postorder, levelorder })[type]?.(rootRef.current);
    return { steps, result };
  }, []);

  const clear = useCallback(() => {
    rootRef.current = null;
    bumpTree(); clearStates(); setTraversalResult([]);
  }, [bumpTree, clearStates]);

  const getLayout = useCallback(() => {
    const positions = [], edges = [];
    if (!rootRef.current) return { positions, edges };
    const h = height(rootRef.current);
    const base = Math.max(320, Math.pow(2, h) * 46);
    buildLayout(rootRef.current, base / 2 + 52, 52, base / 2, positions, edges, 0);
    return { positions, edges };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  const getMetrics = useCallback(() => {
    const r = rootRef.current;
    return {
      height: height(r), nodeCount: count(r),
      isBalanced: balanced(r),
      balanceFactor: r ? height(r.left) - height(r.right) : 0,
      min: minNode(r)?.value ?? null, max: maxNode(r)?.value ?? null,
      isEmpty: !r,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  return {
    treeVersion,
    insert, remove, search, traverse, clear, has,
    getLayout, getMetrics,
    nodeStates,  setNodeStates,
    traversalResult, setTraversalResult,
    currentMessage,  setCurrentMessage,
    pointer,  setPointer,
    visitedPath, setVisitedPath,
    clearStates,
  };
}