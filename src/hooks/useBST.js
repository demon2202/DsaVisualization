import { useState, useCallback, useRef } from 'react';

class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.id = `bst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function deepClone(node) {
  if (!node) return null;
  const c = new BSTNode(node.value);
  c.id = node.id;
  c.left = deepClone(node.left);
  c.right = deepClone(node.right);
  return c;
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
  if (!node) return null;
  let c = node;
  while (c.left) c = c.left;
  return c;
}

function getMax(node) {
  if (!node) return null;
  let c = node;
  while (c.right) c = c.right;
  return c;
}

// Improved layout: calculates actual subtree widths for proper spacing
function getSubtreeWidth(node, depth = 0) {
  if (!node) return 0;
  const minSpacing = 50;
  const leftW = getSubtreeWidth(node.left, depth + 1);
  const rightW = getSubtreeWidth(node.right, depth + 1);
  return Math.max(minSpacing, leftW + rightW + minSpacing * 0.5);
}

function layoutTree(node, x, y, availableWidth, positions, edges, depth) {
  if (!node) return;

  positions.push({ id: node.id, value: node.value, x, y, depth });

  const verticalGap = 80;
  const childY = y + verticalGap;

  // Calculate proportional spacing based on subtree sizes
  const leftWidth = node.left ? getSubtreeWidth(node.left) : 0;
  const rightWidth = node.right ? getSubtreeWidth(node.right) : 0;
  const totalWidth = Math.max(leftWidth + rightWidth, 80);

  const halfAvail = availableWidth / 2;
  const minGap = 35;

  if (node.left) {
    const leftX = x - Math.max(halfAvail * (leftWidth / totalWidth || 0.5), minGap);
    edges.push({
      id: `${node.id}__${node.left.id}`,
      fromId: node.id, toId: node.left.id,
      x1: x, y1: y, x2: leftX, y2: childY,
      side: 'left',
    });
    layoutTree(node.left, leftX, childY, halfAvail * 0.85, positions, edges, depth + 1);
  }

  if (node.right) {
    const rightX = x + Math.max(halfAvail * (rightWidth / totalWidth || 0.5), minGap);
    edges.push({
      id: `${node.id}__${node.right.id}`,
      fromId: node.id, toId: node.right.id,
      x1: x, y1: y, x2: rightX, y2: childY,
      side: 'right',
    });
    layoutTree(node.right, rightX, childY, halfAvail * 0.85, positions, edges, depth + 1);
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
    setCurrentMessage('');
  }, []);

  const has = useCallback((value) => {
    let n = rootRef.current;
    while (n) {
      if (value === n.value) return true;
      n = value < n.value ? n.left : n.right;
    }
    return false;
  }, []);

  const insert = useCallback((value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return { ok: false, msg: 'Invalid value — must be a number', steps: [] };
    }
    if (has(value)) {
      return { ok: false, msg: `${value} already exists in the tree`, steps: [] };
    }

    const newNode = new BSTNode(value);
    const steps = [];

    if (!rootRef.current) {
      rootRef.current = newNode;
      steps.push({ id: newNode.id, action: 'insert', msg: `${value} inserted as root node` });
      refresh();
      return { ok: true, msg: `Inserted ${value} as root`, steps };
    }

    let curr = rootRef.current;
    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Comparing ${value} with ${curr.value}` });

      if (value < curr.value) {
        steps.push({ id: curr.id, action: 'go-left', msg: `${value} < ${curr.value} → go left` });
        if (!curr.left) {
          curr.left = newNode;
          steps.push({ id: newNode.id, action: 'insert', msg: `Inserted ${value} as left child of ${curr.value}` });
          break;
        }
        curr = curr.left;
      } else {
        steps.push({ id: curr.id, action: 'go-right', msg: `${value} > ${curr.value} → go right` });
        if (!curr.right) {
          curr.right = newNode;
          steps.push({ id: newNode.id, action: 'insert', msg: `Inserted ${value} as right child of ${curr.value}` });
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
      return { ok: false, msg: 'Cannot delete from empty tree', steps: [] };
    }
    if (!has(value)) {
      return { ok: false, msg: `${value} not found in tree`, steps: [] };
    }

    const steps = [];
    let deleted = false;

    function deleteRec(node, val) {
      if (!node) return null;

      steps.push({ id: node.id, action: 'compare', msg: `Examining node ${node.value}` });

      if (val < node.value) {
        steps.push({ id: node.id, action: 'go-left', msg: `${val} < ${node.value} → search left subtree` });
        node.left = deleteRec(node.left, val);
      } else if (val > node.value) {
        steps.push({ id: node.id, action: 'go-right', msg: `${val} > ${node.value} → search right subtree` });
        node.right = deleteRec(node.right, val);
      } else {
        deleted = true;
        steps.push({ id: node.id, action: 'found-delete', msg: `Found ${val} — preparing to delete` });

        // Case 1: No children (leaf)
        if (!node.left && !node.right) {
          steps.push({ id: node.id, action: 'delete', msg: `${val} is a leaf node — simply removed` });
          return null;
        }

        // Case 2: One child
        if (!node.left) {
          steps.push({ id: node.id, action: 'delete', msg: `${val} has only right child — replaced by right subtree` });
          return node.right;
        }
        if (!node.right) {
          steps.push({ id: node.id, action: 'delete', msg: `${val} has only left child — replaced by left subtree` });
          return node.left;
        }

        // Case 3: Two children — find in-order successor
        const successor = getMin(node.right);
        steps.push({ id: successor.id, action: 'successor', msg: `Two children — in-order successor is ${successor.value}` });
        steps.push({ id: node.id, action: 'delete', msg: `Replacing ${val} with successor ${successor.value}` });
        node.value = successor.value;
        node.right = deleteRec(node.right, successor.value);
      }
      return node;
    }

    rootRef.current = deleteRec(rootRef.current, value);
    refresh();

    return { ok: deleted, msg: deleted ? `Deleted ${value}` : `${value} not found`, steps };
  }, [has, refresh]);

  const search = useCallback((value) => {
    if (!rootRef.current) {
      return { ok: false, msg: 'Tree is empty', steps: [] };
    }

    const steps = [];
    let curr = rootRef.current;
    let depth = 0;

    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Depth ${depth}: comparing with ${curr.value}` });

      if (value === curr.value) {
        steps.push({ id: curr.id, action: 'found', msg: `Found ${value} at depth ${depth}!` });
        return { ok: true, msg: `Found ${value} at depth ${depth}`, steps };
      }

      if (value < curr.value) {
        steps.push({ id: curr.id, action: 'go-left', msg: `${value} < ${curr.value} → going left` });
        curr = curr.left;
      } else {
        steps.push({ id: curr.id, action: 'go-right', msg: `${value} > ${curr.value} → going right` });
        curr = curr.right;
      }
      depth++;
    }

    steps.push({ id: null, action: 'not-found', msg: `${value} is not in the tree (reached null)` });
    return { ok: false, msg: `${value} not found`, steps };
  }, []);

  const traverse = useCallback((type) => {
    if (!rootRef.current) {
      return { steps: [], result: [] };
    }

    const steps = [];
    const result = [];

    function inorder(node) {
      if (!node) return;
      inorder(node.left);
      steps.push({ id: node.id, action: 'visit', msg: `Visit ${node.value} (in-order: left → node → right)` });
      result.push(node.value);
      inorder(node.right);
    }

    function preorder(node) {
      if (!node) return;
      steps.push({ id: node.id, action: 'visit', msg: `Visit ${node.value} (pre-order: node → left → right)` });
      result.push(node.value);
      preorder(node.left);
      preorder(node.right);
    }

    function postorder(node) {
      if (!node) return;
      postorder(node.left);
      postorder(node.right);
      steps.push({ id: node.id, action: 'visit', msg: `Visit ${node.value} (post-order: left → right → node)` });
      result.push(node.value);
    }

    function levelorder(node) {
      if (!node) return;
      const queue = [{ node, level: 0 }];
      let prevLevel = -1;
      while (queue.length) {
        const { node: curr, level } = queue.shift();
        if (level !== prevLevel) {
          prevLevel = level;
        }
        steps.push({ id: curr.id, action: 'visit', msg: `Level ${level}: visit ${curr.value}` });
        result.push(curr.value);
        if (curr.left) queue.push({ node: curr.left, level: level + 1 });
        if (curr.right) queue.push({ node: curr.right, level: level + 1 });
      }
    }

    const labels = {
      inorder: 'In-order',
      preorder: 'Pre-order',
      postorder: 'Post-order',
      levelorder: 'Level-order',
    };

    switch (type) {
      case 'inorder': inorder(rootRef.current); break;
      case 'preorder': preorder(rootRef.current); break;
      case 'postorder': postorder(rootRef.current); break;
      case 'levelorder': levelorder(rootRef.current); break;
    }

    return { steps, result, label: labels[type] || type };
  }, []);

  const clear = useCallback(() => {
    rootRef.current = null;
    refresh();
    clearStates();
    setTraversalResult([]);
  }, [refresh, clearStates]);

  const getLayout = useCallback(() => {
    const positions = [];
    const edges = [];
    if (!rootRef.current) return { positions, edges };

    const height = calcHeight(rootRef.current);
    const baseWidth = Math.max(300, Math.pow(2, height) * 45);
    layoutTree(rootRef.current, baseWidth / 2 + 50, 50, baseWidth / 2, positions, edges, 0);
    return { positions, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  const getMetrics = useCallback(() => {
    const r = rootRef.current;
    const height = calcHeight(r);
    const nodeCount = countNodes(r);
    const minNode = getMin(r);
    const maxNode = getMax(r);
    const balanced = checkBalanced(r);
    const bf = r ? calcHeight(r.left) - calcHeight(r.right) : 0;

    return {
      height,
      nodeCount,
      isBalanced: balanced,
      balanceFactor: bf,
      min: minNode ? minNode.value : null,
      max: maxNode ? maxNode.value : null,
      isEmpty: !r,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  return {
    treeVersion, insert, remove, search, traverse, clear, has,
    getLayout, getMetrics,
    nodeStates, setNodeStates,
    edgeStates, setEdgeStates,
    traversalResult, setTraversalResult,
    currentMessage, setCurrentMessage,
    clearStates,
  };
}