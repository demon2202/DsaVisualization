import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronDown, Play, Pause, RotateCcw, Search, Plus, Trash2, Zap, Activity, 
  GitBranch, Share2, Grid3X3, ArrowRight, ArrowLeft, Moon, Sun, Settings,
  Maximize, Download, Upload, Code, SkipForward, SkipBack, StepForward,
  StepBack, Sliders, Eye, EyeOff, Target, Trophy, Shuffle, BarChart3,
  Hash, Layers, CircleDot, ListOrdered, ArrowUp, ArrowDown
} from 'lucide-react';
import './App.css'

// Enhanced Node Classes
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.x = 0;
    this.y = 0;
    this.isNew = false;
    this.isVisited = false;
    this.isHighlighted = false;
    this.isActive = false;
    this.balanceFactor = 0;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.isNew = false;
    this.isVisited = false;
    this.isHighlighted = false;
    this.isActive = false;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class GraphNode {
  constructor(value) {
    this.value = value;
    this.adjacents = new Set();
    this.isVisited = false;
    this.isHighlighted = false;
    this.isActive = false;
    this.x = Math.random() * 400 + 100;
    this.y = Math.random() * 300 + 100;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class StackNode {
  constructor(value) {
    this.value = value;
    this.isNew = false;
    this.isActive = false;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

class QueueNode {
  constructor(value) {
    this.value = value;
    this.isNew = false;
    this.isActive = false;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

// Enhanced Data Structure Classes
class BST {
  constructor() {
    this.root = null;
    this.nodeCount = 0;
    this.traversalOrder = [];
    this.maxValue = -Infinity;
    this.minValue = Infinity;
    this.operationSteps = 0;
  }

  insert(value) {
    this.operationSteps = 0;
    if (value < this.minValue) this.minValue = value;
    if (value > this.maxValue) this.maxValue = value;

    const newNode = new TreeNode(value);
    newNode.isNew = true;
    this.nodeCount++;
    this.operationSteps++;

    if (!this.root) {
      this.root = newNode;
      this.updateHeights();
      return;
    }

    let current = this.root;
    while (true) {
      this.operationSteps++;
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
    this.operationSteps = 0;
    const deleteNode = (node, val) => {
      if (!node) return null;
      this.operationSteps++;

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
        while (temp.left) {
          temp = temp.left;
          this.operationSteps++;
        }
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
    this.operationSteps = 0;
    let path = [];
    let current = this.root;
    
    while (current) {
      this.operationSteps++;
      if (trackPath) path.push(current);
      if (value === current.value) return { found: true, path, steps: this.operationSteps };
      current = value < current.value ? current.left : current.right;
    }
    return { found: false, path, steps: this.operationSteps };
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
    this.operationSteps = 0;
    const traverse = (node) => {
      if (!node) return;
      this.operationSteps++;
      traverse(node.left);
      this.traversalOrder.push(node);
      traverse(node.right);
    };
    traverse(this.root);
    return this.traversalOrder;
  }

  preorderTraversal() {
    this.traversalOrder = [];
    this.operationSteps = 0;
    const traverse = (node) => {
      if (!node) return;
      this.operationSteps++;
      this.traversalOrder.push(node);
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);
    return this.traversalOrder;
  }

  postorderTraversal() {
    this.traversalOrder = [];
    this.operationSteps = 0;
    const traverse = (node) => {
      if (!node) return;
      this.operationSteps++;
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
    node.isActive = false;
    this.clearNodeStates(node.left);
    this.clearNodeStates(node.right);
  }

  reset() {
    this.root = null;
    this.nodeCount = 0;
    this.traversalOrder = [];
    this.maxValue = -Infinity;
    this.minValue = Infinity;
    this.operationSteps = 0;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
    this.operationSteps = 0;
  }

  append(value) {
    this.operationSteps = 0;
    const newNode = new ListNode(value);
    newNode.isNew = true;
    this.size++;
    this.operationSteps++;
    
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) {
      current = current.next;
      this.operationSteps++;
    }
    current.next = newNode;
  }

  prepend(value) {
    this.operationSteps = 1;
    const newNode = new ListNode(value);
    newNode.isNew = true;
    newNode.next = this.head;
    this.head = newNode;
    this.size++;
  }

  delete(value) {
    this.operationSteps = 0;
    if (!this.head) return false;
    this.operationSteps++;
    
    if (this.head.value === value) {
      this.head = this.head.next;
      this.size--;
      return true;
    }
    let current = this.head;
    while (current.next && current.next.value !== value) {
      current = current.next;
      this.operationSteps++;
    }
    if (current.next) {
      current.next = current.next.next;
      this.size--;
      return true;
    }
    return false;
  }

  search(value) {
    this.operationSteps = 0;
    let current = this.head;
    let index = 0;
    const path = [];
    while (current) {
      this.operationSteps++;
      path.push(current);
      if (current.value === value) {
        return { found: true, index, path, steps: this.operationSteps };
      }
      current = current.next;
      index++;
    }
    return { found: false, index: -1, path, steps: this.operationSteps };
  }

  sort() {
    if (!this.head || !this.head.next) return;
    
    // Bubble sort for visualization
    let swapped;
    do {
      swapped = false;
      let current = this.head;
      while (current.next) {
        if (current.value > current.next.value) {
          // Swap values
          const temp = current.value;
          current.value = current.next.value;
          current.next.value = temp;
          swapped = true;
        }
        current = current.next;
      }
    } while (swapped);
  }

  reverse() {
    let prev = null;
    let current = this.head;
    let next = null;
    
    while (current) {
      next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    this.head = prev;
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
      current.isActive = false;
      current = current.next;
    }
  }

  reset() {
    this.head = null;
    this.size = 0;
    this.operationSteps = 0;
  }
}

class Stack {
  constructor() {
    this.items = [];
    this.operationSteps = 0;
  }

  push(value) {
    this.operationSteps = 1;
    const node = new StackNode(value);
    node.isNew = true;
    this.items.push(node);
  }

  pop() {
    this.operationSteps = 1;
    return this.items.pop();
  }

  peek() {
    this.operationSteps = 1;
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  clearNodeStates() {
    this.items.forEach(item => {
      item.isNew = false;
      item.isActive = false;
    });
  }

  reset() {
    this.items = [];
    this.operationSteps = 0;
  }
}

class Queue {
  constructor() {
    this.items = [];
    this.operationSteps = 0;
  }

  enqueue(value) {
    this.operationSteps = 1;
    const node = new QueueNode(value);
    node.isNew = true;
    this.items.push(node);
  }

  dequeue() {
    this.operationSteps = 1;
    return this.items.shift();
  }

  front() {
    this.operationSteps = 1;
    return this.items[0];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  clearNodeStates() {
    this.items.forEach(item => {
      item.isNew = false;
      item.isActive = false;
    });
  }

  reset() {
    this.items = [];
    this.operationSteps = 0;
  }
}

class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.operationSteps = 0;
  }

  addNode(value) {
    this.operationSteps = 1;
    if (this.nodes.has(value)) return false;
    this.nodes.set(value, new GraphNode(value));
    return true;
  }

  addEdge(from, to) {
    this.operationSteps = 1;
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);
    if (!fromNode || !toNode) return false;
    fromNode.adjacents.add(to);
    toNode.adjacents.add(from);
    if (!this.edges.find(edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) {
      this.edges.push({ from, to, isNew: true });
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
    this.operationSteps = 0;
    const visited = new Set();
    const path = [];
    const dfsHelper = (value) => {
      if (visited.has(value)) return;
      this.operationSteps++;
      visited.add(value);
      const node = this.nodes.get(value);
      if (node) path.push(node);
      const adjacents = this.nodes.get(value)?.adjacents || new Set();
      adjacents.forEach(adjValue => {
        if (!visited.has(adjValue)) dfsHelper(adjValue);
      });
    };
    dfsHelper(startValue);
    return { path, steps: this.operationSteps };
  }

  bfs(startValue) {
    this.operationSteps = 0;
    const visited = new Set();
    const queue = [startValue];
    const path = [];
    while (queue.length > 0) {
      this.operationSteps++;
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
    return { path, steps: this.operationSteps };
  }

  clearNodeStates() {
    this.nodes.forEach(node => {
      node.isVisited = false;
      node.isHighlighted = false;
      node.isActive = false;
    });
    this.edges.forEach(edge => {
      edge.isNew = false;
      edge.isActive = false;
    });
  }

  reset() {
    this.nodes.clear();
    this.edges = [];
    this.operationSteps = 0;
  }

  getNodesArray() {
    return Array.from(this.nodes.values());
  }
}

// Animation Controller
class AnimationController {
  constructor() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.animationQueue = [];
    this.speed = 800; // milliseconds
    this.onStepChange = null;
  }

  setAnimationQueue(queue) {
    this.animationQueue = queue;
    this.totalSteps = queue.length;
    this.currentStep = 0;
  }

  play() {
    this.isPlaying = true;
    this.isPaused = false;
    this.executeStep();
  }

  pause() {
    this.isPaused = true;
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
  }

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.executeCurrentStep();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.executeCurrentStep();
    }
  }

  executeStep() {
    if (!this.isPlaying || this.isPaused || this.currentStep >= this.totalSteps) {
      this.stop();
      return;
    }

    this.executeCurrentStep();
    this.currentStep++;

    if (this.currentStep < this.totalSteps) {
      setTimeout(() => this.executeStep(), this.speed);
    } else {
      this.stop();
    }
  }

  executeCurrentStep() {
    if (this.currentStep < this.animationQueue.length) {
      const step = this.animationQueue[this.currentStep];
      if (step && typeof step === 'function') {
        step();
      }
      if (this.onStepChange) {
        this.onStepChange(this.currentStep, this.totalSteps);
      }
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }
}

// Code Preview Data
const CODE_TEMPLATES = {
  tree: {
    insert: `// BST Insert - O(log n) average
function insert(root, value) {
  if (!root) return new Node(value);
  
  if (value < root.value) {
    root.left = insert(root.left, value);
  } else {
    root.right = insert(root.right, value);
  }
  return root;
}`,
    search: `// BST Search - O(log n) average
function search(root, value) {
  if (!root) return false;
  
  if (value === root.value) return true;
  
  return value < root.value 
    ? search(root.left, value)
    : search(root.right, value);
}`,
    inorder: `// Inorder Traversal - O(n)
function inorder(root) {
  if (!root) return;
  
  inorder(root.left);   // Visit left
  console.log(root.value); // Process node
  inorder(root.right);  // Visit right
}`
  },
  list: {
    append: `// List Append - O(n)
function append(head, value) {
  const newNode = new Node(value);
  
  if (!head) return newNode;
  
  let current = head;
  while (current.next) {
    current = current.next;
  }
  current.next = newNode;
  return head;
}`,
    search: `// List Search - O(n)
function search(head, value) {
  let current = head;
  let index = 0;
  
  while (current) {
    if (current.value === value) {
      return { found: true, index };
    }
    current = current.next;
    index++;
  }
  return { found: false, index: -1 };
}`,
    sort: `// Bubble Sort - O(n²)
function bubbleSort(head) {
  let swapped;
  do {
    swapped = false;
    let current = head;
    
    while (current.next) {
      if (current.value > current.next.value) {
        swap(current, current.next);
        swapped = true;
      }
      current = current.next;
    }
  } while (swapped);
}`
  },
  graph: {
    dfs: `// Depth First Search - O(V + E)
function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  console.log(start);
  
  for (let neighbor of graph[start]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
}`,
    bfs: `// Breadth First Search - O(V + E)
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  
  while (queue.length > 0) {
    const node = queue.shift();
    if (!visited.has(node)) {
      visited.add(node);
      console.log(node);
      queue.push(...graph[node]);
    }
  }
}`
  },
  stack: {
    push: `// Stack Push - O(1)
function push(stack, value) {
  stack.items.push(value);
  stack.size++;
}`,
    pop: `// Stack Pop - O(1)
function pop(stack) {
  if (stack.isEmpty()) {
    throw new Error("Stack underflow");
  }
  stack.size--;
  return stack.items.pop();
}`
  },
  queue: {
    enqueue: `// Queue Enqueue - O(1)
function enqueue(queue, value) {
  queue.items.push(value);
  queue.size++;
}`,
    dequeue: `// Queue Dequeue - O(1)
function dequeue(queue) {
  if (queue.isEmpty()) {
    throw new Error("Queue underflow");
  }
  queue.size--;
  return queue.items.shift();
}`
  }
};

// Practice Problems
const PRACTICE_PROBLEMS = {
  tree: [
    {
      title: "Build BST",
      description: "Insert nodes [50, 30, 70, 20, 40, 60, 80] in order",
      solution: [50, 30, 70, 20, 40, 60, 80],
      hint: "Start with 50 as root, then follow BST property"
    },
    {
      title: "Find Path",
      description: "What's the search path for value 40?",
      solution: [50, 30, 40],
      hint: "Follow the path from root to target"
    }
  ],
  list: [
    {
      title: "Reverse List",
      description: "Reverse the linked list [1, 2, 3, 4, 5]",
      solution: [5, 4, 3, 2, 1],
      hint: "Use three pointers: prev, current, next"
    }
  ],
  graph: [
    {
      title: "DFS Order",
      description: "What's the DFS traversal order starting from node 1?",
      solution: "Depends on adjacency order",
      hint: "Visit as deep as possible before backtracking"
    }
  ]
};

const DataStructuresVisualizer = () => {
  // State Management
  const [activeStructure, setActiveStructure] = useState('tree');
  const [theme, setTheme] = useState('dark');
  const [inputValue, setInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showMetrics, setShowMetrics] = useState(true);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [currentOperation, setCurrentOperation] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(800);
  const [customNodeColor, setCustomNodeColor] = useState('#A371F7');
  
  // Animation State
  const [animationController] = useState(new AnimationController());
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  
  // Data Structures
  const [bst] = useState(new BST());
  const [linkedList] = useState(new LinkedList());
  const [graph] = useState(new Graph());
  const [stack] = useState(new Stack());
  const [queue] = useState(new Queue());

  // Stats
  const [treeStats, setTreeStats] = useState({ height: 0, nodeCount: 0, isBalanced: true });
  const [operationStats, setOperationStats] = useState({ steps: 0, complexity: '', operation: '' });

  // Refs
  const [, forceUpdate] = useState(0);
  const triggerUpdate = () => forceUpdate(prev => prev + 1);

  // Animation Controller Setup
  useEffect(() => {
    animationController.onStepChange = (step, total) => {
      setCurrentStep(step);
      setTotalSteps(total);
      triggerUpdate();
    };
    animationController.setSpeed(animationSpeed);
  }, [animationSpeed]);

  // Message System
  const showMessage = useCallback((text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    
    // Confetti for success
    if (type === 'success' && text.includes('found')) {
      createConfetti();
    }
  }, []);

  // Confetti Effect
  const createConfetti = () => {
    const colors = ['#A371F7', '#58A6FF', '#56D364', '#F85149', '#34D399'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  };

  // Enhanced Tree Visualization
  const TreeVisualization = () => {
    const svgRef = useRef(null);

    const updateTreeVisualization = useCallback(() => {
      triggerUpdate();
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
          const levelFactor = 1.2;

          // Draw edges with animation
          if (node.left) {
            const childX = x - (baseSeparation / Math.pow(level, levelFactor));
            const childY = y + 80;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', y);
            line.setAttribute('x2', childX);
            line.setAttribute('y2', childY);
            line.classList.add('tree-edge');
            if (node.isActive) line.classList.add('active-edge');
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
            if (node.isActive) line.classList.add('active-edge');
            treeGroup.appendChild(line);
            drawNodeAndEdges(node.right, childX, childY, level + 1);
          }
          
          // Draw node with enhanced animations
          const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          nodeGroup.classList.add('tree-node');
          
          let stateClasses = [];
          if (node.isVisited) stateClasses.push('visited');
          if (node.isNew) stateClasses.push('new');
          if (node.isHighlighted) stateClasses.push('highlighted');
          if (node.isActive) stateClasses.push('active');
          stateClasses.forEach(cls => nodeGroup.classList.add(cls));

          // Enhanced circle with glow effects
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', '28');
          circle.classList.add('node-circle');
          circle.style.fill = customNodeColor;
          nodeGroup.appendChild(circle);

          // Add glow effect for active nodes
          if (node.isActive || node.isHighlighted) {
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            glow.setAttribute('cx', x);
            glow.setAttribute('cy', y);
            glow.setAttribute('r', '35');
            glow.classList.add('glow-effect');
            treeGroup.insertBefore(glow, nodeGroup);
          }

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', x);
          text.setAttribute('y', y);
          text.textContent = hideValues ? '?' : node.value;
          text.classList.add('node-text');
          nodeGroup.appendChild(text);

          treeGroup.appendChild(nodeGroup);
        };

        if (bst.root) {
          drawNodeAndEdges(bst.root, svg.clientWidth / 2, 60);
        }

        setTreeStats({
          height: bst.root ? bst.root.height : 0,
          nodeCount: bst.nodeCount,
          isBalanced: Math.abs(bst.root?.balanceFactor || 0) <= 1
        });
      };

      draw();
      window.addEventListener('resize', draw);
      return () => window.removeEventListener('resize', draw);
    }, [bst.root, customNodeColor, hideValues]);

    return (
      <div className={`visualization-area theme-tree ${theme}`}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
        {!bst.root && (
          <div className="placeholder">
            <GitBranch className="placeholder-icon" />
            <p>No tree data</p>
            <span>Insert nodes to begin visualization</span>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Linked List Visualization
  const LinkedListVisualization = () => {
    const nodes = linkedList.toArray();
    
    return (
      <div className={`visualization-area theme-list ${theme}`}>
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
                  <div className={`list-node ${node.isVisited ? 'visited' : ''} ${node.isNew ? 'new' : ''} ${node.isHighlighted ? 'highlighted' : ''} ${node.isActive ? 'active' : ''}`}>
                    {hideValues ? '?' : node.value}
                    {index === 0 && <div className="head-label">HEAD</div>}
                  </div>
                  {index < nodes.length - 1 && (
                    <ArrowRight className={`list-arrow ${node.isActive ? 'active-arrow' : ''}`} />
                  )}
                </React.Fragment>
              ))}
              <ArrowRight className="list-arrow" />
              <div className="list-null">NULL</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Graph Visualization
  const GraphVisualization = () => {
    const svgRef = useRef(null);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
      const svg = svgRef.current;
      if (!svg) return;

      const graphGroup = svg.querySelector('#graphGroup') || document.createElementNS('http://www.w3.org/2000/svg', 'g');
      graphGroup.id = 'graphGroup';
      graphGroup.innerHTML = '';
      if (!svg.querySelector('#graphGroup')) svg.appendChild(graphGroup);

      // Draw edges with enhanced animations
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
        if (edge.isNew) line.classList.add('new-edge');
        if (edge.isActive) line.classList.add('active-edge');
        graphGroup.appendChild(line);
      });

      // Draw nodes with enhanced effects
      graph.getNodesArray().forEach(node => {
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeGroup.classList.add('graph-node');
        
        let stateClasses = [];
        if (node.isVisited) stateClasses.push('visited');
        if (node.isHighlighted) stateClasses.push('highlighted');
        if (node.isActive) stateClasses.push('active');
        stateClasses.forEach(cls => nodeGroup.classList.add(cls));

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', '28');
        circle.classList.add('node-circle');
        circle.style.fill = customNodeColor;
        nodeGroup.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y);
        text.textContent = hideValues ? '?' : node.value;
        text.classList.add('node-text');
        nodeGroup.appendChild(text);

        nodeGroup.addEventListener('mousedown', (e) => {
          setDraggedNode(node);
          const rect = svg.getBoundingClientRect();
          setDragOffset({ 
            x: e.clientX - rect.left - node.x, 
            y: e.clientY - rect.top - node.y 
          });
        });
        
        graphGroup.appendChild(nodeGroup);
      });
    }, [graph.nodes.size, graph.edges.length, customNodeColor, hideValues]);

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!draggedNode) return;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        draggedNode.x = Math.max(28, Math.min(rect.width - 28, e.clientX - rect.left - dragOffset.x));
        draggedNode.y = Math.max(28, Math.min(rect.height - 28, e.clientY - rect.top - dragOffset.y));
        triggerUpdate();
      };
      
      const handleMouseUp = () => setDraggedNode(null);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [draggedNode, dragOffset]);

    return (
      <div className={`visualization-area theme-graph ${theme}`}>
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

  // Stack Visualization
  const StackVisualization = () => {
    const items = stack.items;
    
    return (
      <div className={`visualization-area theme-stack ${theme}`}>
        <div className="stack-container">
          {items.length === 0 ? (
            <div className="placeholder">
              <Layers className="placeholder-icon" />
              <p>Empty Stack</p>
              <span>Push elements to see LIFO structure</span>
            </div>
          ) : (
            <div className="stack-items">
              {items.slice().reverse().map((item, index) => (
                <div 
                  key={item.id} 
                  className={`stack-item ${item.isNew ? 'new' : ''} ${item.isActive ? 'active' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {hideValues ? '?' : item.value}
                  {index === 0 && <div className="top-label">TOP</div>}
                </div>
              ))}
              <div className="stack-base">STACK</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Queue Visualization
  const QueueVisualization = () => {
    const items = queue.items;
    
    return (
      <div className={`visualization-area theme-queue ${theme}`}>
        <div className="queue-container">
          {items.length === 0 ? (
            <div className="placeholder">
              <CircleDot className="placeholder-icon" />
              <p>Empty Queue</p>
              <span>Enqueue elements to see FIFO structure</span>
            </div>
          ) : (
            <div className="queue-items">
              <div className="queue-label front-label">FRONT</div>
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <div 
                    className={`queue-item ${item.isNew ? 'new' : ''} ${item.isActive ? 'active' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {hideValues ? '?' : item.value}
                  </div>
                  {index < items.length - 1 && <ArrowRight className="queue-arrow" />}
                </React.Fragment>
              ))}
              <div className="queue-label rear-label">REAR</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Animation Functions
  const createAnimationQueue = async (nodes, operation) => {
    const queue = [];
    nodes.forEach((node, index) => {
      queue.push(() => {
        node.isActive = true;
        if (index > 0) nodes[index - 1].isActive = false;
        triggerUpdate();
      });
    });
    
    // Final step to clear active states and highlight result
    queue.push(() => {
      nodes.forEach(node => node.isActive = false);
      if (nodes.length > 0) {
        nodes[nodes.length - 1].isHighlighted = true;
      }
      triggerUpdate();
    });
    
    return queue;
  };

  // Enhanced Operation Handlers
  const handleTreeInsert = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { 
      showMessage('Please enter a valid number', 'error'); 
      return; 
    }
    if (bst.search(value, false).found) { 
      showMessage('Value already exists', 'error'); 
      return; 
    }

    setCurrentOperation('insert');
    bst.clearNodeStates();
    bst.insert(value);
    
    setOperationStats({
      steps: bst.operationSteps,
      complexity: 'O(log n) avg, O(n) worst',
      operation: 'Tree Insert'
    });

    setInputValue('');
    showMessage('Node inserted successfully', 'success');
    triggerUpdate();
  };

  const handleTreeSearch = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { 
      showMessage('Please enter a valid number', 'error'); 
      return; 
    }
    
    setIsAnimating(true);
    setCurrentOperation('search');
    bst.clearNodeStates();
    const { found, path, steps } = bst.search(value);
    
    setOperationStats({
      steps,
      complexity: 'O(log n) avg, O(n) worst',
      operation: 'Tree Search'
    });

    const animationQueue = await createAnimationQueue(path, 'search');
    animationController.setAnimationQueue(animationQueue);
    
    if (animationController.isPlaying) {
      animationController.stop();
    }
    animationController.play();

    setTimeout(() => {
      if (found) {
        showMessage(`Value ${value} found!`, 'success');
      } else {
        showMessage(`Value ${value} not found`, 'error');
      }
      
      setTimeout(() => {
        bst.clearNodeStates();
        triggerUpdate();
        setIsAnimating(false);
      }, 2000);
    }, animationQueue.length * animationSpeed);
  };

  const handleListSearch = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { 
      showMessage('Please enter a valid number', 'error'); 
      return; 
    }
    
    setIsAnimating(true);
    setCurrentOperation('search');
    linkedList.clearNodeStates();
    const { found, index, path, steps } = linkedList.search(value);
    
    setOperationStats({
      steps,
      complexity: 'O(n)',
      operation: 'List Search'
    });

    const animationQueue = await createAnimationQueue(path, 'search');
    animationController.setAnimationQueue(animationQueue);
    animationController.play();

    setTimeout(() => {
      if (found) {
        showMessage(`Value found at index ${index}`, 'success');
      } else {
        showMessage('Value not found in list', 'error');
      }
      
      setTimeout(() => {
        linkedList.clearNodeStates();
        triggerUpdate();
        setIsAnimating(false);
      }, 2000);
    }, animationQueue.length * animationSpeed);
  };

  const handleListSort = async () => {
    if (linkedList.size === 0) {
      showMessage('List is empty', 'error');
      return;
    }

    setIsAnimating(true);
    setCurrentOperation('sort');
    linkedList.clearNodeStates();
    
    // Visual bubble sort with animation
    const nodes = linkedList.toArray();
    const animationQueue = [];
    
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = 0; j < nodes.length - i - 1; j++) {
        animationQueue.push(() => {
          nodes.forEach(node => node.isActive = false);
          nodes[j].isActive = true;
          nodes[j + 1].isActive = true;
          triggerUpdate();
        });
        
        if (nodes[j].value > nodes[j + 1].value) {
          animationQueue.push(() => {
            // Swap values
            const temp = nodes[j].value;
            nodes[j].value = nodes[j + 1].value;
            nodes[j + 1].value = temp;
            
            nodes[j].isHighlighted = true;
            nodes[j + 1].isHighlighted = true;
            triggerUpdate();
          });
        }
      }
    }
    
    animationQueue.push(() => {
      nodes.forEach(node => {
        node.isActive = false;
        node.isHighlighted = false;
      });
      triggerUpdate();
      setIsAnimating(false);
      showMessage('List sorted successfully', 'success');
    });

    animationController.setAnimationQueue(animationQueue);
    animationController.play();
  };

  const handleGraphTraversal = async (traversalType) => {
    const startValue = parseInt(inputValue);
    if (isNaN(startValue) || !graph.nodes.has(startValue)) {
      showMessage('Please enter a valid starting node', 'error');
      return;
    }
    
    setIsAnimating(true);
    setCurrentOperation(traversalType);
    graph.clearNodeStates();
    
    const result = traversalType === 'dfs' ? graph.dfs(startValue) : graph.bfs(startValue);
    const { path, steps } = result;
    
    setOperationStats({
      steps,
      complexity: 'O(V + E)',
      operation: `Graph ${traversalType.toUpperCase()}`
    });

    const animationQueue = await createAnimationQueue(path, traversalType);
    animationController.setAnimationQueue(animationQueue);
    animationController.play();

    setTimeout(() => {
      showMessage(`${traversalType.toUpperCase()} completed: visited ${path.length} nodes`, 'success');
      setTimeout(() => {
        graph.clearNodeStates();
        triggerUpdate();
        setIsAnimating(false);
      }, 2000);
    }, animationQueue.length * animationSpeed);
  };

  // Stack Operations
  const handleStackPush = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { 
      showMessage('Please enter a valid number', 'error'); 
      return; 
    }
    
    stack.clearNodeStates();
    stack.push(value);
    setOperationStats({
      steps: stack.operationSteps,
      complexity: 'O(1)',
      operation: 'Stack Push'
    });
    
    setInputValue('');
    showMessage('Element pushed to stack', 'success');
    triggerUpdate();
  };

  const handleStackPop = () => {
    if (stack.isEmpty()) {
      showMessage('Stack is empty', 'error');
      return;
    }
    
    const popped = stack.pop();
    setOperationStats({
      steps: stack.operationSteps,
      complexity: 'O(1)',
      operation: 'Stack Pop'
    });
    
    showMessage(`Popped ${popped.value} from stack`, 'success');
    triggerUpdate();
  };

  // Queue Operations
  const handleQueueEnqueue = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) { 
      showMessage('Please enter a valid number', 'error'); 
      return; 
    }
    
    queue.clearNodeStates();
    queue.enqueue(value);
    setOperationStats({
      steps: queue.operationSteps,
      complexity: 'O(1)',
      operation: 'Queue Enqueue'
    });
    
    setInputValue('');
    showMessage('Element enqueued', 'success');
    triggerUpdate();
  };

  const handleQueueDequeue = () => {
    if (queue.isEmpty()) {
      showMessage('Queue is empty', 'error');
      return;
    }
    
    const dequeued = queue.dequeue();
    setOperationStats({
      steps: queue.operationSteps,
      complexity: 'O(1)',
      operation: 'Queue Dequeue'
    });
    
    showMessage(`Dequeued ${dequeued.value} from queue`, 'success');
    triggerUpdate();
  };

  // Utility Functions
  const resetCurrentStructure = () => {
    const structures = {
      tree: () => { bst.reset(); showMessage('Tree reset', 'success'); },
      list: () => { linkedList.reset(); showMessage('List reset', 'success'); },
      graph: () => { graph.reset(); showMessage('Graph reset', 'success'); },
      stack: () => { stack.reset(); showMessage('Stack reset', 'success'); },
      queue: () => { queue.reset(); showMessage('Queue reset', 'success'); }
    };
    
    structures[activeStructure]?.();
    setOperationStats({ steps: 0, complexity: '', operation: '' });
    triggerUpdate();
  };

  const generateRandomData = () => {
    const count = 5 + Math.floor(Math.random() * 8);
    const values = Array.from(new Set(Array.from({ length: count }, () => Math.floor(Math.random() * 100) + 1)));

    const generators = {
      tree: () => {
        bst.reset();
        values.forEach(value => bst.insert(value));
        showMessage('Random tree generated', 'success');
      },
      list: () => {
        linkedList.reset();
        values.forEach(value => linkedList.append(value));
        showMessage('Random list generated', 'success');
      },
      graph: () => {
        graph.reset();
        values.forEach(value => graph.addNode(value));
        for (let i = 0; i < values.length - 1; i++) {
          if (Math.random() > 0.4) {
            const from = values[i];
            const to = values[Math.floor(Math.random() * values.length)];
            if (from !== to) graph.addEdge(from, to);
          }
        }
        showMessage('Random graph generated', 'success');
      },
      stack: () => {
        stack.reset();
        values.forEach(value => stack.push(value));
        showMessage('Random stack generated', 'success');
      },
      queue: () => {
        queue.reset();
        values.forEach(value => queue.enqueue(value));
        showMessage('Random queue generated', 'success');
      }
    };

    generators[activeStructure]?.();
    triggerUpdate();
  };

  const saveStructure = () => {
    const data = {
      structure: activeStructure,
      data: getCurrentStructureData(),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeStructure}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Structure saved', 'success');
  };

  const getCurrentStructureData = () => {
    switch (activeStructure) {
      case 'tree': return serializeTree(bst.root);
      case 'list': return linkedList.toArray().map(node => node.value);
      case 'graph': return {
        nodes: Array.from(graph.nodes.keys()),
        edges: graph.edges
      };
      case 'stack': return stack.items.map(item => item.value);
      case 'queue': return queue.items.map(item => item.value);
      default: return null;
    }
  };

  const serializeTree = (node) => {
    if (!node) return null;
    return {
      value: node.value,
      left: serializeTree(node.left),
      right: serializeTree(node.right)
    };
  };

  // Animation Controls
  const handlePlayPause = () => {
    if (animationController.isPlaying) {
      animationController.pause();
    } else {
      animationController.play();
    }
  };

  const handleStop = () => {
    animationController.stop();
    setIsAnimating(false);
    getCurrentStructure().clearNodeStates();
    triggerUpdate();
  };

  const getCurrentStructure = () => {
    const structures = { tree: bst, list: linkedList, graph, stack, queue };
    return structures[activeStructure];
  };

  // Render Methods
  const renderVisualization = () => {
    const visualizations = {
      tree: <TreeVisualization />,
      list: <LinkedListVisualization />,
      graph: <GraphVisualization />,
      stack: <StackVisualization />,
      queue: <QueueVisualization />
    };
    return visualizations[activeStructure];
  };

  const renderControls = () => {
    const controlSets = {
      tree: (
        <>
          <button onClick={handleTreeInsert} disabled={isAnimating} className="action-button button-insert">
            <Plus />Insert
          </button>
          <button onClick={() => bst.delete(parseInt(inputValue)) && triggerUpdate()} disabled={isAnimating} className="action-button button-delete">
            <Trash2 />Delete
          </button>
          <button onClick={handleTreeSearch} disabled={isAnimating} className="action-button button-search">
            <Search />Search
          </button>
        </>
      ),
      list: (
        <>
          <button onClick={() => { linkedList.append(parseInt(inputValue)); setInputValue(''); triggerUpdate(); }} disabled={isAnimating} className="action-button button-append">
            <ArrowRight />Append
          </button>
          <button onClick={() => { linkedList.prepend(parseInt(inputValue)); setInputValue(''); triggerUpdate(); }} disabled={isAnimating} className="action-button button-prepend">
            <ArrowLeft />Prepend
          </button>
          <button onClick={handleListSort} disabled={isAnimating} className="action-button button-sort">
            <BarChart3 />Sort
          </button>
          <button onClick={handleListSearch} disabled={isAnimating} className="action-button button-search">
            <Search />Search
          </button>
        </>
      ),
      graph: (
        <>
          <button onClick={() => { graph.addNode(parseInt(inputValue)); setInputValue(''); triggerUpdate(); }} disabled={isAnimating} className="action-button button-add-node">
            <Plus />Add Node
          </button>
          <button onClick={() => { graph.addEdge(parseInt(inputValue), parseInt(secondInputValue)); setInputValue(''); setSecondInputValue(''); triggerUpdate(); }} disabled={isAnimating} className="action-button button-add-edge">
            <Share2 />Add Edge
          </button>
          <button onClick={() => handleGraphTraversal('dfs')} disabled={isAnimating} className="action-button button-dfs">
            <Activity />DFS
          </button>
          <button onClick={() => handleGraphTraversal('bfs')} disabled={isAnimating} className="action-button button-bfs">
            <Zap />BFS
          </button>
        </>
      ),
      stack: (
        <>
          <button onClick={handleStackPush} disabled={isAnimating} className="action-button button-push">
            <ArrowUp />Push
          </button>
          <button onClick={handleStackPop} disabled={isAnimating} className="action-button button-pop">
            <ArrowDown />Pop
          </button>
          <button onClick={() => { if (!stack.isEmpty()) showMessage(`Top: ${stack.peek().value}`, 'info'); }} className="action-button button-peek">
            <Eye />Peek
          </button>
        </>
      ),
      queue: (
        <>
          <button onClick={handleQueueEnqueue} disabled={isAnimating} className="action-button button-enqueue">
            <Plus />Enqueue
          </button>
          <button onClick={handleQueueDequeue} disabled={isAnimating} className="action-button button-dequeue">
            <Trash2 />Dequeue
          </button>
          <button onClick={() => { if (!queue.isEmpty()) showMessage(`Front: ${queue.front().value}`, 'info'); }} className="action-button button-front">
            <Eye />Front
          </button>
        </>
      )
    };
    return controlSets[activeStructure];
  };

  const renderTraversalControls = () => {
    if (activeStructure !== 'tree') return null;
    
    const performTreeTraversal = async (type) => {
      if (!bst.root) { 
        showMessage('Tree is empty', 'error'); 
        return; 
      }
      
      setIsAnimating(true);
      setCurrentOperation(type);
      bst.clearNodeStates();
      
      const traversalFns = {
        inorder: () => bst.inorderTraversal(),
        preorder: () => bst.preorderTraversal(),
        postorder: () => bst.postorderTraversal()
      };
      
      const nodes = traversalFns[type]();
      setOperationStats({
        steps: bst.operationSteps,
        complexity: 'O(n)',
        operation: `${type.charAt(0).toUpperCase() + type.slice(1)} Traversal`
      });
      
      const animationQueue = await createAnimationQueue(nodes, type);
      animationController.setAnimationQueue(animationQueue);
      animationController.play();

      setTimeout(() => {
        const traversalText = nodes.map(node => node.value).join(' → ');
        showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${traversalText}`, 'success');
        
        setTimeout(() => {
          bst.clearNodeStates();
          triggerUpdate();
          setIsAnimating(false);
        }, 3000);
      }, animationQueue.length * animationSpeed);
    };

    return (
      <div className="traversal-controls">
        <span>Traversals:</span>
        {['inorder', 'preorder', 'postorder'].map(type => (
          <button
            key={type}
            onClick={() => performTreeTraversal(type)}
            disabled={isAnimating || !bst.root}
            className="traversal-button"
          >
            {type}
          </button>
        ))}
      </div>
    );
  };

  const renderAnimationControls = () => (
    <div className="animation-controls">
      <button
        onClick={handlePlayPause}
        disabled={!isAnimating && animationController.totalSteps === 0}
        className="control-button"
      >
        {animationController.isPlaying && !animationController.isPaused ? <Pause /> : <Play />}
      </button>
      <button onClick={handleStop} disabled={!isAnimating} className="control-button">
        <RotateCcw />
      </button>
      <button onClick={() => animationController.prevStep()} disabled={currentStep === 0} className="control-button">
        <StepBack />
      </button>
      <button onClick={() => animationController.nextStep()} disabled={currentStep >= totalSteps - 1} className="control-button">
        <StepForward />
      </button>
      <div className="animation-progress">
        <span>{currentStep + 1} / {totalSteps}</span>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => {
            const step = parseInt(e.target.value);
            animationController.currentStep = step;
            animationController.executeCurrentStep();
          }}
          className="progress-slider"
        />
      </div>
    </div>
  );

  const renderStats = () => {
    const getStats = () => {
      switch (activeStructure) {
        case 'tree':
          return [
            { label: 'Nodes', value: treeStats.nodeCount, color: 'purple' },
            { label: 'Height', value: treeStats.height, color: 'blue' },
            { label: 'Balanced', value: treeStats.isBalanced ? 'Yes' : 'No', color: treeStats.isBalanced ? 'green' : 'red' },
            { label: 'Type', value: 'BST', color: 'purple' }
          ];
        case 'list':
          return [
            { label: 'Size', value: linkedList.size, color: 'emerald' },
            { label: 'Head', value: linkedList.head?.value ?? 'null', color: 'teal' },
            { label: 'Type', value: 'Singly Linked', color: 'cyan' }
          ];
        case 'graph':
          return [
            { label: 'Nodes', value: graph.nodes.size, color: 'orange' },
            { label: 'Edges', value: graph.edges.length, color: 'yellow' },
            { label: 'Density', value: graph.nodes.size > 1 ? `${(graph.edges.length / (graph.nodes.size * (graph.nodes.size - 1) / 2) * 100).toFixed(1)}%` : '0%', color: 'red' }
          ];
        case 'stack':
          return [
            { label: 'Size', value: stack.size(), color: 'purple' },
            { label: 'Top', value: stack.isEmpty() ? 'null' : stack.peek()?.value, color: 'blue' },
            { label: 'Type', value: 'LIFO', color: 'green' }
          ];
        case 'queue':
          return [
            { label: 'Size', value: queue.size(), color: 'cyan' },
            { label: 'Front', value: queue.isEmpty() ? 'null' : queue.front()?.value, color: 'teal' },
            { label: 'Type', value: 'FIFO', color: 'emerald' }
          ];
        default:
          return [];
      }
    };

    const stats = getStats();
    return (
      <div className="stats-grid">
        {stats.map(stat => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
        ))}
        {operationStats.operation && (
          <>
            <StatCard label="Steps" value={operationStats.steps} color="yellow" />
            <StatCard label="Complexity" value={operationStats.complexity} color="red" />
          </>
        )}
        <StatCard label="Status" value={isAnimating ? 'Running' : 'Ready'} color={isAnimating ? 'yellow' : 'green'} />
      </div>
    );
  };

  const renderCodePreview = () => {
    if (!showCodePreview || !currentOperation) return null;

    const code = CODE_TEMPLATES[activeStructure]?.[currentOperation];
    if (!code) return null;

    return (
      <div className="code-preview-panel">
        <div className="panel-header">
          <h3>Code Implementation</h3>
          <button onClick={() => setShowCodePreview(false)} className="close-button">×</button>
        </div>
        <pre className="code-block">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  const renderPracticePanel = () => {
    if (!showPractice) return null;

    const problems = PRACTICE_PROBLEMS[activeStructure] || [];

    return (
      <div className="practice-panel">
        <div className="panel-header">
          <h3>Practice Problems</h3>
          <button onClick={() => setShowPractice(false)} className="close-button">×</button>
        </div>
        <div className="practice-content">
          {problems.map((problem, index) => (
            <div key={index} className="practice-problem">
              <h4>{problem.title}</h4>
              <p>{problem.description}</p>
              <div className="practice-hint">💡 {problem.hint}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsPanel = () => (
    <div className="settings-panel">
      <div className="setting-group">
        <label>Animation Speed</label>
        <input
          type="range"
          min="100"
          max="2000"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
          className="setting-slider"
        />
        <span>{animationSpeed}ms</span>
      </div>
      
      <div className="setting-group">
        <label>Node Color</label>
        <input
          type="color"
          value={customNodeColor}
          onChange={(e) => setCustomNodeColor(e.target.value)}
          className="color-picker"
        />
      </div>
      
      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={hideValues}
            onChange={(e) => setHideValues(e.target.checked)}
          />
          Hide Values (Practice Mode)
        </label>
      </div>
      
      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={(e) => setPracticeMode(e.target.checked)}
          />
          Practice Mode
        </label>
      </div>
    </div>
  );

  return (
    <div className={`app ${theme}`}>
      <div className="app-container">
        <header className="app-header">
          <h1>DATA STRUCTURES LAB</h1>
          <p>Interactive Visualization & Learning Platform</p>
          <div className="header-controls">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="fullscreen-toggle"
              aria-label="Toggle fullscreen"
            >
              <Maximize />
            </button>
          </div>
        </header>

        <div className="structure-selector">
          {[
            { id: 'tree', label: 'Binary Trees', icon: GitBranch },
            { id: 'list', label: 'Linked Lists', icon: Share2 },
            { id: 'graph', label: 'Graphs', icon: Grid3X3 },
            { id: 'stack', label: 'Stacks', icon: Layers },
            { id: 'queue', label: 'Queues', icon: CircleDot }
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

        <div className={`main-content ${isFullscreen ? 'fullscreen' : ''}`}>
          <div className="controls-section">
            <div className="panel controls-panel">
              <div className="input-group">
                <div className="input-field-container">
                  <label>
                    {activeStructure === 'graph' ? 'Node Value / From' : 'Value'}
                  </label>
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
                  <button onClick={() => setShowCodePreview(!showCodePreview)} className="utility-button" title="Show Code">
                    <Code />
                  </button>
                  <button onClick={() => setShowPractice(!showPractice)} className="utility-button" title="Practice Problems">
                    <Target />
                  </button>
                  <button onClick={generateRandomData} disabled={isAnimating} className="utility-button" title="Generate Random Data">
                    <Shuffle />
                  </button>
                  <button onClick={saveStructure} className="utility-button" title="Save Structure">
                    <Download />
                  </button>
                  <button onClick={resetCurrentStructure} disabled={isAnimating} className="utility-button" title="Reset">
                    <RotateCcw />
                  </button>
                </div>
              </div>

              {renderTraversalControls()}
              
              {isAnimating && renderAnimationControls()}
            </div>

            <div className="settings-toggle">
              <button onClick={() => setShowMetrics(!showMetrics)} className="toggle-button">
                <Settings /> Settings
              </button>
              {showMetrics && renderSettingsPanel()}
            </div>
          </div>

          <div className="visualization-section">
            <div className="visualization-container">
              {renderVisualization()}
            </div>
            
            {renderCodePreview()}
            {renderPracticePanel()}
          </div>
        </div>

        {!isFullscreen && (
          <>
            <div className="panel analytics-panel">
              <div className="panel-header">
                <h3>Analytics & Metrics</h3>
                <button onClick={() => setShowMetrics(!showMetrics)} className="toggle-button">
                  <ChevronDown className={`transform transition-transform ${showMetrics ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showMetrics && renderStats()}
            </div>

            <div className="panel learning-panel">
              <div className="panel-header">
                <h3>Quick Reference</h3>
              </div>
              <div className="reference-grid">
                {renderQuickReference()}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="confetti-container"></div>
    </div>
  );

  function renderQuickReference() {
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
      },
      stack: {
        color: 'purple',
        ops: ["• Push: O(1)", "• Pop: O(1)", "• Peek: O(1)", "• isEmpty: O(1)"],
        props: ["• LIFO principle", "• Top access only", "• Dynamic size", "• Memory efficient"],
        cases: ["• Function calls", "• Undo operations", "• Expression evaluation", "• Browser history"]
      },
      queue: {
        color: 'cyan',
        ops: ["• Enqueue: O(1)", "• Dequeue: O(1)", "• Front: O(1)", "• isEmpty: O(1)"],
        props: ["• FIFO principle", "• Front/rear access", "• Dynamic size", "• Fair processing"],
        cases: ["• Task scheduling", "• Print queues", "• BFS algorithm", "• Buffer for data streams"]
      }
    };

    const data = content[activeStructure];
    if (!data) return null;

    return (
      <>
        <ReferenceCard title="Operations" items={data.ops} color={data.color} />
        <ReferenceCard title="Properties" items={data.props} color={data.color} />
        <ReferenceCard title="Use Cases" items={data.cases} color={data.color} />
      </>
    );
  }
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
