import './App.css';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Play, Pause, RotateCcw, Search, Plus, Trash2, Zap, Activity, GitBranch, Share2, Grid3X3, ArrowRight, ArrowLeft } from 'lucide-react';

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.x = 0;
    this.y = 0;
    this.isNew = true;
    this.isVisited = false;
    this.isHighlighted = false;
    this.balanceFactor = 0;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.isNew = true;
    this.isVisited = false;
    this.isHighlighted = false;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class GraphNode {
  constructor(value) {
    this.value = value;
    this.adjacents = new Set();
    this.isVisited = false;
    this.isHighlighted = false;
    this.x = Math.random() * 400 + 100;
    this.y = Math.random() * 300 + 100;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class BST {
  constructor() {
    this.root = null;
    this.nodeCount = 0;
    this.traversalOrder = [];
    this.maxValue = -Infinity;
    this.minValue = Infinity;
  }

  insert(value) {
    if (value < this.minValue) this.minValue = value;
    if (value > this.maxValue) this.maxValue = value;

    const newNode = new TreeNode(value);
    this.nodeCount++;

    if (!this.root) {
      this.root = newNode;
      this.updateHeights();
      return;
    }

    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          break;
        }
        current = current.right;
      }
    }
    this.updateHeights();
  }

  delete(value) {
    const deleteNode = (node, val) => {
      if (!node) return null;

      if (val < node.value) {
        node.left = deleteNode(node.left, val);
      } else if (val > node.value) {
        node.right = deleteNode(node.right, val);
      } else {
        if (!node.left && !node.right) {
            this.nodeCount--;
            return null;
        }
        if (!node.left) {
            this.nodeCount--;
            return node.right;
        }
        if (!node.right) {
            this.nodeCount--;
            return node.left;
        }

        let temp = node.right;
        while (temp.left) temp = temp.left;
        node.value = temp.value;
        node.right = deleteNode(node.right, temp.value);
      }
      return node;
    };
    
    if (this.search(value, false).found) {
        this.root = deleteNode(this.root, value);
        this.updateHeights();
        return true;
    }
    return false;
  }

  search(value, trackPath = true) {
    let path = [];
    let current = this.root;
    
    while (current) {
      if(trackPath) {
        path.push(current);
      }
      if (value === current.value) return { found: true, path };
      current = value < current.value ? current.left : current.right;
    }
    return { found: false, path };
  }

  updateHeights(node = this.root) {
    if (!node) return 0;
    const leftHeight = this.updateHeights(node.left);
    const rightHeight = this.updateHeights(node.right);
    node.height = Math.max(leftHeight, rightHeight) + 1;
    node.balanceFactor = leftHeight - rightHeight;
    return node.height;
  }

  inorderTraversal() {
    this.traversalOrder = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      this.traversalOrder.push(node);
      traverse(node.right);
    };
    traverse(this.root);
    return this.traversalOrder;
  }

  preorderTraversal() {
    this.traversalOrder = [];
    const traverse = (node) => {
      if (!node) return;
      this.traversalOrder.push(node);
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);
    return this.traversalOrder;
  }

  postorderTraversal() {
    this.traversalOrder = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      traverse(node.right);
      this.traversalOrder.push(node);
    };
    traverse(this.root);
    return this.traversalOrder;
  }

  clearNodeStates(node = this.root) {
    if (!node) return;
    node.isVisited = false;
    node.isNew = false;
    node.isHighlighted = false;
    this.clearNodeStates(node.left);
    this.clearNodeStates(node.right);
  }

  reset() {
    this.root = null;
    this.nodeCount = 0;
    this.traversalOrder = [];
    this.maxValue = -Infinity;
    this.minValue = Infinity;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  append(value) {
    const newNode = new ListNode(value);
    this.size++;
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }

  prepend(value) {
    const newNode = new ListNode(value);
    newNode.next = this.head;
    this.head = newNode;
    this.size++;
  }

  delete(value) {
    if (!this.head) return false;
    if (this.head.value === value) {
      this.head = this.head.next;
      this.size--;
      return true;
    }
    let current = this.head;
    while (current.next && current.next.value !== value) {
      current = current.next;
    }
    if (current.next) {
      current.next = current.next.next;
      this.size--;
      return true;
    }
    return false;
  }

  search(value) {
    let current = this.head;
    let index = 0;
    const path = [];
    while (current) {
      path.push(current);
      if (current.value === value) {
        return { found: true, index, path };
      }
      current = current.next;
      index++;
    }
    return { found: false, index: -1, path };
  }

  toArray() {
    const result = [];
    let current = this.head;
    while (current) {
      result.push(current);
      current = current.next;
    }
    return result;
  }

  clearNodeStates() {
    let current = this.head;
    while (current) {
      current.isVisited = false;
      current.isNew = false;
      current.isHighlighted = false;
      current = current.next;
    }
  }

  reset() {
    this.head = null;
    this.size = 0;
  }
}

class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(value) {
    if (this.nodes.has(value)) return false;
    this.nodes.set(value, new GraphNode(value));
    return true;
  }

  addEdge(from, to) {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);
    if (!fromNode || !toNode) return false;
    fromNode.adjacents.add(to);
    toNode.adjacents.add(from);
    if (!this.edges.find(edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) {
      this.edges.push({ from, to });
    }
    return true;
  }

  removeNode(value) {
    const node = this.nodes.get(value);
    if (!node) return false;
    node.adjacents.forEach(adjValue => {
      const adjNode = this.nodes.get(adjValue);
      if (adjNode) adjNode.adjacents.delete(value);
    });
    this.edges = this.edges.filter(edge => edge.from !== value && edge.to !== value);
    this.nodes.delete(value);
    return true;
  }

  dfs(startValue) {
    const visited = new Set();
    const path = [];
    const dfsHelper = (value) => {
      if (visited.has(value)) return;
      visited.add(value);
      const node = this.nodes.get(value);
      if (node) path.push(node);
      const adjacents = this.nodes.get(value)?.adjacents || new Set();
      adjacents.forEach(adjValue => {
        if (!visited.has(adjValue)) dfsHelper(adjValue);
      });
    };
    dfsHelper(startValue);
    return path;
  }

  bfs(startValue) {
    const visited = new Set();
    const queue = [startValue];
    const path = [];
    while (queue.length > 0) {
      const currentValue = queue.shift();
      if (visited.has(currentValue)) continue;
      visited.add(currentValue);
      const node = this.nodes.get(currentValue);
      if (node) path.push(node);
      const adjacents = this.nodes.get(currentValue)?.adjacents || new Set();
      adjacents.forEach(adjValue => {
        if (!visited.has(adjValue)) queue.push(adjValue);
      });
    }
    return path;
  }

  clearNodeStates() {
    this.nodes.forEach(node => {
      node.isVisited = false;
      node.isHighlighted = false;
    });
  }

  reset() {
    this.nodes.clear();
    this.edges = [];
  }

  getNodesArray() {
    return Array.from(this.nodes.values());
  }
}

const GridBackground = React.memo(() => {
  const squares = useMemo(() => {
    const SQUARES = 500;
    return Array.from(Array(SQUARES)).map((_, i) => (
      <div 
        className="grid-square" 
        key={i} 
        style={{ '--delay': `${Math.random() * 5}s`, '--duration': `${Math.random() * 5 + 3}s` }}
      />
    ));
  }, []);

  return <div className="grid-background">{squares}</div>;
});

const DataStructuresVisualizer = () => {
  const [activeStructure, setActiveStructure] = useState('tree');
  const [treeType, setTreeType] = useState('bst');
  const [inputValue, setInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  
  const [bst] = useState(new BST());
  const [linkedList] = useState(new LinkedList());
  const [graph] = useState(new Graph());

  const [treeStats, setTreeStats] = useState({ height: 0, nodeCount: 0, isBalanced: true });

  const currentTree = bst;

  const showMessage = useCallback((text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }, []);
  
  const TreeVisualization = () => {
    const svgRef = useRef(null);
    const [_, forceUpdate] = useState(0);

    const updateTreeVisualization = useCallback(() => {
        forceUpdate(c => c + 1);
    }, []);

    useEffect(() => {
        const draw = () => {
            const svg = svgRef.current;
            if (!svg) return;

            const treeGroup = svg.querySelector('#treeGroup') || document.createElementNS('http://www.w3.org/2000/svg', 'g');
            treeGroup.id = 'treeGroup';
            treeGroup.innerHTML = '';
            
            if (!svg.querySelector('#treeGroup')) {
                svg.appendChild(treeGroup);
            }

            const drawNodeAndEdges = (node, x, y, level = 1) => {
                if (!node) return;

                const baseSeparation = 180;
                const levelFactor = 1.1;

                if (node.left) {
                    const childX = x - (baseSeparation / Math.pow(level, levelFactor));
                    const childY = y + 80;
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x);
                    line.setAttribute('y1', y);
                    line.setAttribute('x2', childX);
                    line.setAttribute('y2', childY);
                    line.classList.add('tree-edge');
                    treeGroup.appendChild(line);
                    drawNodeAndEdges(node.left, childX, childY, level + 1);
                }

                if (node.right) {
                    const childX = x + (baseSeparation / Math.pow(level, levelFactor));
                    const childY = y + 80;
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x);
                    line.setAttribute('y1', y);
                    line.setAttribute('x2', childX);
                    line.setAttribute('y2', childY);
                    line.classList.add('tree-edge');
                    treeGroup.appendChild(line);
                    drawNodeAndEdges(node.right, childX, childY, level + 1);
                }
                
                const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                nodeGroup.classList.add('tree-node');
                
                let stateClass = '';
                if (node.isVisited) stateClass = 'visited';
                else if (node.isNew) stateClass = 'new';
                else if (node.isHighlighted) stateClass = 'highlighted';
                if(stateClass) nodeGroup.classList.add(stateClass);

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', '24');
                circle.classList.add('node-circle');
                nodeGroup.appendChild(circle);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y);
                text.textContent = node.value;
                text.classList.add('node-text');
                nodeGroup.appendChild(text);

                treeGroup.appendChild(nodeGroup);
            };

            if (currentTree.root) {
              drawNodeAndEdges(currentTree.root, svg.clientWidth / 2, 60);
            }

            setTreeStats({
                height: currentTree.root ? currentTree.root.height : 0,
                nodeCount: currentTree.nodeCount,
                isBalanced: Math.abs(currentTree.root?.balanceFactor || 0) <= 1
            });
        };

        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);

    }, [currentTree.root, _]);


    return (
        <div className="visualization-area theme-tree">
            <svg ref={svgRef} width="100%" height="100%"></svg>
            {!currentTree.root && (
                <div className="placeholder">
                    <GitBranch className="placeholder-icon" />
                    <p>No tree data</p>
                    <span>Insert nodes to begin visualization</span>
                </div>
            )}
        </div>
    );
  };

  const LinkedListVisualization = () => {
    const nodes = linkedList.toArray();
    
    return (
      <div className="visualization-area theme-list">
        <div className="list-container">
          {nodes.length === 0 ? (
            <div className="placeholder">
              <Share2 className="placeholder-icon" />
              <p>Empty list</p>
              <span>Add nodes to see the linked structure</span>
            </div>
          ) : (
            <div className="list-nodes-wrapper">
              {nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  <div className={`list-node ${node.isVisited ? 'visited' : ''} ${node.isNew ? 'new' : ''} ${node.isHighlighted ? 'highlighted' : ''}`}>
                    {node.value}
                    {index === 0 && <div className="head-label">HEAD</div>}
                  </div>
                  {index < nodes.length && <ArrowRight className="list-arrow" />}
                </React.Fragment>
              ))}
              <div className="list-null">NULL</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const GraphVisualization = () => {
    const svgRef = useRef(null);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [_, forceUpdate] = useState(0);

    const updateGraphVisualization = useCallback(() => {
      forceUpdate(c => c+1);
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const graphGroup = svg.querySelector('#graphGroup') || document.createElementNS('http://www.w3.org/2000/svg', 'g');
        graphGroup.id = 'graphGroup';
        graphGroup.innerHTML = '';
        if (!svg.querySelector('#graphGroup')) svg.appendChild(graphGroup);

        graph.edges.forEach(edge => {
            const fromNode = graph.nodes.get(edge.from);
            const toNode = graph.nodes.get(edge.to);
            if (!fromNode || !toNode) return;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromNode.x);
            line.setAttribute('y1', fromNode.y);
            line.setAttribute('x2', toNode.x);
            line.setAttribute('y2', toNode.y);
            line.classList.add('graph-edge');
            graphGroup.appendChild(line);
        });

        graph.getNodesArray().forEach(node => {
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.classList.add('graph-node');
            
            let stateClass = '';
            if (node.isVisited) stateClass = 'visited';
            else if (node.isHighlighted) stateClass = 'highlighted';
            if(stateClass) nodeGroup.classList.add(stateClass);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', '28');
            circle.classList.add('node-circle');
            nodeGroup.appendChild(circle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y);
            text.textContent = node.value;
            text.classList.add('node-text');
            nodeGroup.appendChild(text);

            nodeGroup.addEventListener('mousedown', (e) => {
                setDraggedNode(node);
                const rect = svg.getBoundingClientRect();
                setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
            });
            graphGroup.appendChild(nodeGroup);
        });

    }, [graph.nodes.size, graph.edges.length, _]);

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!draggedNode) return;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        draggedNode.x = Math.max(28, Math.min(rect.width - 28, e.clientX - rect.left - dragOffset.x));
        draggedNode.y = Math.max(28, Math.min(rect.height - 28, e.clientY - rect.top - dragOffset.y));
        updateGraphVisualization();
      };
      const handleMouseUp = () => setDraggedNode(null);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [draggedNode, dragOffset, updateGraphVisualization]);

    return (
      <div className="visualization-area theme-graph">
        <svg ref={svgRef} width="100%" height="100%"></svg>
        {graph.nodes.size === 0 && (
          <div className="placeholder">
            <Grid3X3 className="placeholder-icon" />
            <p>Empty graph</p>
            <span>Add nodes and edges to explore</span>
          </div>
        )}
      </div>
    );
  };
  
  const handleOperation = async (operation, ...args) => {
    setIsAnimating(true);
    await operation(...args);
    setIsAnimating(false);
  };
  
  const animatePath = async (path, delay) => {
    for (const node of path) {
      await new Promise(resolve => setTimeout(resolve, delay));
      node.isVisited = true;
      forceUpdateApp();
    }
  };
  
  const forceUpdateApp = () => {
      switch (activeStructure) {
          case 'tree': setTreeStats(s => ({ ...s })); break;
          case 'list': linkedList.append(); linkedList.delete(undefined); break; // Hack to force re-render
          case 'graph': graph.addNode(); graph.removeNode(undefined); break; // Hack
      }
  };

  const handleTreeInsert = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    if (currentTree.search(value, false).found) { showMessage('Value already exists', 'error'); return; }
    currentTree.clearNodeStates();
    currentTree.insert(value);
    setInputValue('');
    showMessage('Node inserted successfully', 'success');
  };

  const handleTreeDelete = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    if (!currentTree.search(value, false).found) { showMessage('Value not found', 'error'); return; }
    currentTree.clearNodeStates();
    currentTree.delete(value);
    setInputValue('');
    showMessage('Node deleted successfully', 'success');
  };

  const handleTreeSearch = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    
    setIsAnimating(true);
    currentTree.clearNodeStates();
    const { found, path } = currentTree.search(value);
    
    await animatePath(path, 500);

    if (found) {
      path[path.length - 1].isHighlighted = true;
      showMessage('Value found!', 'success');
    } else {
      showMessage('Value not found', 'error');
    }
    
    setTimeout(() => { currentTree.clearNodeStates(); forceUpdateApp(); }, 2000);
    setIsAnimating(false);
  };

  const handleListAppend = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    linkedList.clearNodeStates();
    linkedList.append(value);
    setInputValue('');
    showMessage('Node appended to list', 'success');
  };

  const handleListPrepend = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    linkedList.clearNodeStates();
    linkedList.prepend(value);
    setInputValue('');
    showMessage('Node prepended to list', 'success');
  };

  const handleListDelete = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    linkedList.clearNodeStates();
    if (linkedList.delete(value)) {
      showMessage('Node deleted from list', 'success');
    } else {
      showMessage('Value not found in list', 'error');
    }
    setInputValue('');
  };

  const handleListSearch = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    
    setIsAnimating(true);
    linkedList.clearNodeStates();
    const { found, index, path } = linkedList.search(value);

    await animatePath(path, 300);

    if (found) {
      path[path.length-1].isHighlighted = true;
      showMessage(`Value found at index ${index}`, 'success');
    } else {
      showMessage('Value not found in list', 'error');
    }
    
    setTimeout(() => { linkedList.clearNodeStates(); forceUpdateApp(); }, 2000);
    setIsAnimating(false);
  };

  const handleGraphAddNode = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { showMessage('Please enter a valid number', 'error'); return; }
    if (graph.addNode(value)) {
      showMessage('Node added to graph', 'success');
    } else {
      showMessage('Node already exists', 'error');
    }
    setInputValue('');
  };

  const handleGraphAddEdge = () => {
    const from = parseInt(inputValue);
    const to = parseInt(secondInputValue);
    if (isNaN(from) || isNaN(to)) { showMessage('Please enter valid numbers for both nodes', 'error'); return; }
    if (graph.addEdge(from, to)) {
      showMessage('Edge added successfully', 'success');
    } else {
      showMessage('Invalid edge: check if both nodes exist', 'error');
    }
    setInputValue('');
    setSecondInputValue('');
  };

  const handleGraphTraversal = async (traversalFn) => {
    const startValue = parseInt(inputValue);
    if (isNaN(startValue) || !graph.nodes.has(startValue)) {
      showMessage('Please enter a valid starting node', 'error');
      return;
    }
    
    setIsAnimating(true);
    graph.clearNodeStates();
    const path = traversalFn(startValue);
    
    await animatePath(path, 600);
    
    showMessage(`${traversalFn.name.toUpperCase()} completed: visited ${path.length} nodes`, 'success');
    setTimeout(() => { graph.clearNodeStates(); forceUpdateApp(); }, 3000);
    setIsAnimating(false);
  };
  
  const performTreeTraversal = async (type) => {
    if (!currentTree.root) { showMessage('Tree is empty', 'error'); return; }
    setIsAnimating(true);
    currentTree.clearNodeStates();
    
    const traversalFns = {
      'inorder': () => currentTree.inorderTraversal(),
      'preorder': () => currentTree.preorderTraversal(),
      'postorder': () => currentTree.postorderTraversal()
    };
    const nodes = traversalFns[type]();
    
    await animatePath(nodes, 600);

    const traversalText = nodes.map(node => node.value).join(' → ');
    showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${traversalText}`, 'success');
    
    setTimeout(() => { currentTree.clearNodeStates(); forceUpdateApp(); }, 3000);
    setIsAnimating(false);
  };

  const resetCurrentStructure = () => {
    switch (activeStructure) {
      case 'tree': currentTree.reset(); showMessage('Tree reset', 'success'); break;
      case 'list': linkedList.reset(); showMessage('List reset', 'success'); break;
      case 'graph': graph.reset(); showMessage('Graph reset', 'success'); break;
    }
    forceUpdateApp();
  };

  const generateRandomData = () => {
    const count = 5 + Math.floor(Math.random() * 8);
    const values = new Set();
    while (values.size < count) {
      values.add(Math.floor(Math.random() * 100) + 1);
    }
    const valueArray = Array.from(values);

    switch (activeStructure) {
      case 'tree':
        currentTree.reset();
        valueArray.forEach(value => currentTree.insert(value));
        showMessage('Random tree generated', 'success');
        break;
      case 'list':
        linkedList.reset();
        valueArray.forEach(value => linkedList.append(value));
        showMessage('Random list generated', 'success');
        break;
      case 'graph':
        graph.reset();
        valueArray.forEach(value => graph.addNode(value));
        for (let i = 0; i < valueArray.length - 1; i++) {
          if (Math.random() > 0.4) {
            const from = valueArray[i];
            const to = valueArray[Math.floor(Math.random() * valueArray.length)];
            if (from !== to) graph.addEdge(from, to);
          }
        }
        showMessage('Random graph generated', 'success');
        break;
    }
    forceUpdateApp();
  };

  const renderControls = () => {
    switch(activeStructure) {
      case 'tree': return (
        <>
          <button onClick={handleTreeInsert} disabled={isAnimating} className="action-button button-insert"><Plus />Insert</button>
          <button onClick={handleTreeDelete} disabled={isAnimating} className="action-button button-delete"><Trash2 />Delete</button>
          <button onClick={handleTreeSearch} disabled={isAnimating} className="action-button button-search"><Search />Search</button>
        </>
      );
      case 'list': return (
        <>
          <button onClick={handleListAppend} disabled={isAnimating} className="action-button button-append"><ArrowRight />Append</button>
          <button onClick={handleListPrepend} disabled={isAnimating} className="action-button button-prepend"><ArrowLeft />Prepend</button>
          <button onClick={handleListDelete} disabled={isAnimating} className="action-button button-delete"><Trash2 />Delete</button>
          <button onClick={handleListSearch} disabled={isAnimating} className="action-button button-search"><Search />Search</button>
        </>
      );
      case 'graph': return (
        <>
          <button onClick={handleGraphAddNode} disabled={isAnimating} className="action-button button-add-node"><Plus />Add Node</button>
          <button onClick={handleGraphAddEdge} disabled={isAnimating || !inputValue || !secondInputValue} className="action-button button-add-edge"><Share2 />Add Edge</button>
          <button onClick={() => handleGraphTraversal(graph.dfs.bind(graph))} disabled={isAnimating} className="action-button button-dfs"><Activity />DFS</button>
          <button onClick={() => handleGraphTraversal(graph.bfs.bind(graph))} disabled={isAnimating} className="action-button button-bfs"><Zap />BFS</button>
        </>
      );
      default: return null;
    }
  };

  const renderQuickReference = () => {
    const content = {
      tree: {
        color: 'purple',
        ops: ["• Insert: O(log n) avg", "• Delete: O(log n) avg", "• Search: O(log n) avg", "• Traversal: O(n)"],
        props: ["• Left child < parent", "• Right child ≥ parent", "• Recursive structure", "• In-order gives sorted"],
        cases: ["• Database indexing", "• Expression parsing", "• File systems", "• Autocomplete"]
      },
      list: {
        color: 'emerald',
        ops: ["• Append: O(n)", "• Prepend: O(1)", "• Delete: O(n)", "• Search: O(n)"],
        props: ["• Dynamic size", "• Sequential access", "• Node-based storage", "• Efficient insertion"],
        cases: ["• Undo functionality", "• Music playlists", "• Browser history", "• Task queues"]
      },
      graph: {
        color: 'orange',
        ops: ["• Add Node: O(1)", "• Add Edge: O(1)", "• DFS: O(V + E)", "• BFS: O(V + E)"],
        props: ["• Vertices & edges", "• Can be cyclic", "• Directed/undirected", "• Flexible connections"],
        cases: ["• Social networks", "• GPS/maps", "• Recommendation engines", "• Dependency tracking"]
      }
    };
    const data = content[activeStructure];
    return (
      <>
        <ReferenceCard title="Operations" items={data.ops} color={data.color} />
        <ReferenceCard title="Properties" items={data.props} color={data.color} />
        <ReferenceCard title="Use Cases" items={data.cases} color={data.color} />
      </>
    );
  };
  
  return (
    <>
      <GridBackground />
      <div className="app-container">
        <header className="app-header">
          <h1>DATA STRUCTURES LAB</h1>
          <p>An interactive visualization and learning platform</p>
        </header>

        <div className="structure-selector">
          {[
            { id: 'tree', label: 'Binary Trees', icon: GitBranch },
            { id: 'list', label: 'Linked Lists', icon: Share2 },
            { id: 'graph', label: 'Graphs', icon: Grid3X3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveStructure(id)}
              className={`structure-button ${activeStructure === id ? 'active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`message-card message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="panel controls-panel">
          <div className="input-group">
            <div className="input-field-container">
              <label>{activeStructure === 'graph' ? 'Node Value / From' : 'Value'}</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter number"
                className="input-field"
                disabled={isAnimating}
              />
            </div>
            {activeStructure === 'graph' && (
              <div className="input-field-container">
                <label>Connect To</label>
                <input
                  type="number"
                  value={secondInputValue}
                  onChange={(e) => setSecondInputValue(e.target.value)}
                  placeholder="Target node"
                  className="input-field"
                  disabled={isAnimating}
                />
              </div>
            )}
          </div>
          <div className="button-group">
            {renderControls()}
            <div className="utility-buttons">
              <button onClick={generateRandomData} disabled={isAnimating} className="utility-button" aria-label="Generate Random Data"><Zap /></button>
              <button onClick={resetCurrentStructure} disabled={isAnimating} className="utility-button" aria-label="Reset Structure"><RotateCcw /></button>
            </div>
          </div>
          {activeStructure === 'tree' && (
            <div className="traversal-controls">
              <span>Traversals:</span>
              {['inorder', 'preorder', 'postorder'].map(type => (
                <button
                  key={type}
                  onClick={() => performTreeTraversal(type)}
                  disabled={isAnimating || !currentTree.root}
                  className="traversal-button"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="visualization-container">
          {activeStructure === 'tree' && <TreeVisualization />}
          {activeStructure === 'list' && <LinkedListVisualization />}
          {activeStructure === 'graph' && <GraphVisualization />}
        </div>
        
        <div className="panel analytics-panel">
            <div className="panel-header">
              <h3>Analytics</h3>
              <button onClick={() => setShowMetrics(!showMetrics)} className="toggle-button">
                <ChevronDown className={`transform transition-transform ${showMetrics ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showMetrics && (
              <div className="stats-grid">
                {activeStructure === 'tree' && (
                  <>
                    <StatCard label="Nodes" value={treeStats.nodeCount} color="purple" />
                    <StatCard label="Height" value={treeStats.height} color="blue" />
                    <StatCard label="Balanced" value={treeStats.isBalanced ? 'Yes' : 'No'} color={treeStats.isBalanced ? 'green' : 'red'} />
                    <StatCard label="Type" value={treeType.toUpperCase()} color="purple" />
                  </>
                )}
                {activeStructure === 'list' && (
                  <>
                    <StatCard label="Size" value={linkedList.size} color="emerald" />
                    <StatCard label="Head" value={linkedList.head?.value ?? 'null'} color="teal" />
                    <StatCard label="Type" value="Singly Linked" color="cyan" />
                  </>
                )}
                {activeStructure === 'graph' && (
                  <>
                    <StatCard label="Nodes" value={graph.nodes.size} color="orange" />
                    <StatCard label="Edges" value={graph.edges.length} color="yellow" />
                    <StatCard label="Density" value={graph.nodes.size > 1 ? `${(graph.edges.length / (graph.nodes.size * (graph.nodes.size - 1) / 2) * 100).toFixed(1)}%` : '0%'} color="red" />
                  </>
                )}
                <StatCard label="Status" value={isAnimating ? 'Running' : 'Ready'} color={isAnimating ? 'yellow' : 'green'} />
              </div>
            )}
        </div>
        
        <div className="panel learning-panel">
           <div className="panel-header"><h3>Quick Reference</h3></div>
           <div className="reference-grid">
             {renderQuickReference()}
           </div>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`stat-card stat-card-${color}`}>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const ReferenceCard = ({ title, items, color }) => (
  <div className="reference-card">
    <h4 className={`reference-title title-${color}`}>{title}</h4>
    <ul>
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  </div>
);

export default DataStructuresVisualizer; 