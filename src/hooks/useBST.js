import { useState, useCallback, useRef } from 'react';

class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.id = `bst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
}

function deepClone(node) {
  if (!node) return null;
  const clone = new BSTNode(node.value);
  clone.id = node.id;
  clone.left = deepClone(node.left);
  clone.right = deepClone(node.right);
  return clone;
}

function calcHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(calcHeight(node.left), calcHeight(node.right));
}

function countNodes(node) {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function checkBalanced(node) {
  if (!node) return true;
  const diff = Math.abs(calcHeight(node.left) - calcHeight(node.right));
  return diff <= 1 && checkBalanced(node.left) && checkBalanced(node.right);
}

function getMin(node) {
  let current = node;
  while (current.left) current = current.left;
  return current;
}

function getMax(node) {
  let current = node;
  while (current.right) current = current.right;
  return current;
}

function layoutTree(node, x, y, hSpacing, positions, edges, depth) {
  if (!node) return;
  positions.push({ id: node.id, value: node.value, x, y, depth });

  const childY = y + 85;
  const childSpacing = hSpacing * 0.58;

  if (node.left) {
    const lx = x - hSpacing;
    edges.push({
      id: `${node.id}-${node.left.id}`,
      fromId: node.id, toId: node.left.id,
      x1: x, y1: y, x2: lx, y2: childY,
    });
    layoutTree(node.left, lx, childY, childSpacing, positions, edges, depth + 1);
  }
  if (node.right) {
    const rx = x + hSpacing;
    edges.push({
      id: `${node.id}-${node.right.id}`,
      fromId: node.id, toId: node.right.id,
      x1: x, y1: y, x2: rx, y2: childY,
    });
    layoutTree(node.right, rx, childY, childSpacing, positions, edges, depth + 1);
  }
}

export default function useBST() {
  const [treeVersion, setTreeVersion] = useState(0);
  const [nodeStates, setNodeStates] = useState({});
  const [edgeStates, setEdgeStates] = useState({});
  const [traversalResult, setTraversalResult] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const rootRef = useRef(null);

  const refresh = useCallback(() => setTreeVersion(v => v + 1), []);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setEdgeStates({});
  }, []);

  const has = useCallback((value) => {
    let node = rootRef.current;
    while (node) {
      if (value === node.value) return true;
      node = value < node.value ? node.left : node.right;
    }
    return false;
  }, []);

  const insert = useCallback((value) => {
    if (has(value)) {
      return { ok: false, msg: `${value} already exists in the tree`, steps: [] };
    }

    const fresh = new BSTNode(value);
    const steps = [];

    if (!rootRef.current) {
      rootRef.current = fresh;
      steps.push({ id: fresh.id, action: 'insert', msg: `${value} inserted as root` });
      refresh();
      return { ok: true, msg: `Inserted ${value} as root`, steps };
    }

    let curr = rootRef.current;
    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Comparing ${value} with ${curr.value}` });
      if (value < curr.value) {
        steps.push({ id: curr.id, action: 'go-left', msg: `${value} < ${curr.value}, going left` });
        if (!curr.left) {
          curr.left = fresh;
          steps.push({ id: fresh.id, action: 'insert', msg: `Inserted ${value} as left child of ${curr.value}` });
          break;
        }
        curr = curr.left;
      } else {
        steps.push({ id: curr.id, action: 'go-right', msg: `${value} > ${curr.value}, going right` });
        if (!curr.right) {
          curr.right = fresh;
          steps.push({ id: fresh.id, action: 'insert', msg: `Inserted ${value} as right child of ${curr.value}` });
          break;
        }
        curr = curr.right;
      }
    }

    refresh();
    return { ok: true, msg: `Inserted ${value}`, steps };
  }, [has, refresh]);

  const remove = useCallback((value) => {
    if (!rootRef.current) {
      return { ok: false, msg: 'Tree is empty', steps: [] };
    }

    const steps = [];
    let found = false;

    function deleteRec(node, val) {
      if (!node) return null;

      steps.push({ id: node.id, action: 'compare', msg: `Checking node ${node.value}` });

      if (val < node.value) {
        steps.push({ id: node.id, action: 'go-left', msg: `${val} < ${node.value}, searching left` });
        node.left = deleteRec(node.left, val);
      } else if (val > node.value) {
        steps.push({ id: node.id, action: 'go-right', msg: `${val} > ${node.value}, searching right` });
        node.right = deleteRec(node.right, val);
      } else {
        found = true;
        steps.push({ id: node.id, action: 'found-delete', msg: `Found ${val}, removing...` });

        if (!node.left && !node.right) {
          steps.push({ id: node.id, action: 'delete', msg: `${val} is a leaf — removed` });
          return null;
        }
        if (!node.left) {
          steps.push({ id: node.id, action: 'delete', msg: `${val} has right child — replacing` });
          return node.right;
        }
        if (!node.right) {
          steps.push({ id: node.id, action: 'delete', msg: `${val} has left child — replacing` });
          return node.left;
        }

        const successor = getMin(node.right);
        steps.push({ id: successor.id, action: 'successor', msg: `In-order successor is ${successor.value}` });
        node.value = successor.value;
        node.right = deleteRec(node.right, successor.value);
      }
      return node;
    }

    rootRef.current = deleteRec(rootRef.current, value);
    refresh();

    if (found) return { ok: true, msg: `Deleted ${value}`, steps };
    return { ok: false, msg: `${value} not found in tree`, steps };
  }, [refresh]);

  const search = useCallback((value) => {
    const steps = [];
    let curr = rootRef.current;

    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Comparing with ${curr.value}` });

      if (value === curr.value) {
        steps.push({ id: curr.id, action: 'found', msg: `Found ${value}!` });
        return { ok: true, msg: `Found ${value}`, steps };
      }

      if (value < curr.value) {
        steps.push({ id: curr.id, action: 'go-left', msg: `${value} < ${curr.value}, going left` });
        curr = curr.left;
      } else {
        steps.push({ id: curr.id, action: 'go-right', msg: `${value} > ${curr.value}, going right` });
        curr = curr.right;
      }
    }

    steps.push({ id: null, action: 'not-found', msg: `${value} is not in the tree` });
    return { ok: false, msg: `${value} not found`, steps };
  }, []);

  const traverse = useCallback((type) => {
    const steps = [];
    const result = [];

    function inorder(node) {
      if (!node) return;
      inorder(node.left);
      steps.push({ id: node.id, action: 'visit', msg: `Visit ${node.value}` });
      result.push(node.value);
      inorder(node.right);
    }
    function preorder(node) {
      if (!node) return;
      steps.push({ id: node.id, action: 'visit', msg: `Visit ${node.value}` });
      result.push(node.value);
      preorder(node.left);
      preorder(node.right);
    }
    function postorder(node) {
      if (!node) return;
      postorder(node.left);
      postorder(node.right);
      steps.push({ id: node.id, action: 'visit', msg: `Visit ${node.value}` });
      result.push(node.value);
    }
    function levelorder(node) {
      if (!node) return;
      const queue = [node];
      while (queue.length) {
        const curr = queue.shift();
        steps.push({ id: curr.id, action: 'visit', msg: `Visit ${curr.value}` });
        result.push(curr.value);
        if (curr.left) queue.push(curr.left);
        if (curr.right) queue.push(curr.right);
      }
    }

    switch (type) {
      case 'inorder': inorder(rootRef.current); break;
      case 'preorder': preorder(rootRef.current); break;
      case 'postorder': postorder(rootRef.current); break;
      case 'levelorder': levelorder(rootRef.current); break;
    }
    return { steps, result };
  }, []);

  const clear = useCallback(() => {
    rootRef.current = null;
    refresh();
    clearStates();
    setTraversalResult([]);
    setCurrentMessage('');
  }, [refresh, clearStates]);

  const getLayout = useCallback(() => {
    const positions = [];
    const edges = [];
    layoutTree(rootRef.current, 400, 55, 170, positions, edges, 0);
    return { positions, edges };
  }, [treeVersion]);

  const getMetrics = useCallback(() => {
    const r = rootRef.current;
    return {
      height: calcHeight(r),
      nodeCount: countNodes(r),
      isBalanced: checkBalanced(r),
      balanceFactor: r ? calcHeight(r.left) - calcHeight(r.right) : 0,
      min: r ? getMin(r).value : null,
      max: r ? getMax(r).value : null,
      isEmpty: !r,
    };
  }, [treeVersion]);

  return {
    treeVersion,
    insert, remove, search, traverse, clear, has,
    getLayout, getMetrics,
    nodeStates, setNodeStates,
    edgeStates, setEdgeStates,
    traversalResult, setTraversalResult,
    currentMessage, setCurrentMessage,
    clearStates,
  };
}