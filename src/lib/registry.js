/**
 * registry.js — the catalogue the whole app is driven by.
 *
 * Every lab entry declares its machine, its operations, the pseudocode each
 * operation maps to, and the editorial content (blurb / complexity / where it
 * is actually used). UI is generated from this file, so adding a structure
 * means adding one object here.
 */
import { createTree } from './structures/tree'
import { createList } from './structures/list'
import { createLinear } from './structures/linear'
import { createHash } from './structures/hash'
import { createHeap } from './structures/heap'
import { createGraph, generateGraph } from './structures/graph'
import { createGrid } from './structures/pathfinding'
import { createSorter, randomArray, almostSortedArray, reversedArray } from './structures/sorting'
import { mulberry } from './rng'

export const FAMILIES = [
  { id: 'trees', name: 'Trees', note: 'hierarchical order' },
  { id: 'linear', name: 'Linear', note: 'ends and order' },
  { id: 'hashing', name: 'Hashing', note: 'keyed access' },
  { id: 'heaps', name: 'Heaps', note: 'priority' },
  { id: 'graphs', name: 'Graphs', note: 'relationships' },
  { id: 'arrays', name: 'Arrays', note: 'sorting' },
  { id: 'grids', name: 'Grids', note: 'search space' },
]

const num = (key, label, placeholder, def) => ({ key, label, type: 'number', placeholder, default: def })

/* ══════════════════════════════════════════════════════════════════════
   TREES
   ══════════════════════════════════════════════════════════════════════ */
const treeOps = (avl) => [
  {
    id: 'insert',
    label: 'Insert',
    tone: 'acid',
    fields: [num('value', 'value', '42', 42)],
    code: avl ? 'avlInsert' : 'bstInsert',
    run: (m, a) => m.insert(a.value),
  },
  {
    id: 'search',
    label: 'Search',
    tone: 'probe',
    fields: [num('value', 'find', '35', 35)],
    code: 'bstSearch',
    run: (m, a) => m.search(a.value),
  },
  {
    id: 'delete',
    label: 'Delete',
    tone: 'bad',
    fields: [num('value', 'remove', '27', 27)],
    code: avl ? 'avlDelete' : 'bstDelete',
    run: (m, a) => m.remove(a.value),
  },
  { id: 'in', label: 'In-order', tone: 'flow', fields: [], code: 'traverseIn', run: (m) => m.traverse('in'), group: 'traverse' },
  { id: 'pre', label: 'Pre-order', tone: 'flow', fields: [], code: 'traversePre', run: (m) => m.traverse('pre'), group: 'traverse' },
  { id: 'post', label: 'Post-order', tone: 'flow', fields: [], code: 'traversePost', run: (m) => m.traverse('post'), group: 'traverse' },
  { id: 'level', label: 'Level-order', tone: 'flow', fields: [], code: 'traverseLevel', run: (m) => m.traverse('level'), group: 'traverse' },
  {
    id: 'random',
    label: 'Random tree',
    tone: 'ghost',
    fields: [num('count', 'nodes', '12', 12)],
    code: null,
    action: (m, a) => {
      m.clear()
      const n = Math.max(3, Math.min(40, Number(a.count) || 12))
      const used = new Set()
      let guard = 0
      while (used.size < n && guard++ < 400) used.add(Math.floor(Math.random() * 99) + 1)
      ;[...used].forEach((v) => m.silentInsert(v))
      return null
    },
  },
  { id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
]

const bstEntry = {
  id: 'bst',
  family: 'trees',
  name: 'Binary Search Tree',
  abbr: 'BST',
  scene: 'tree',
  tagline: 'Left is smaller, right is larger.',
  blurb:
    'A binary search tree keeps smaller values on the left and larger values on the right. A lookup follows one branch at each node instead of scanning the whole set.',
  create: () => createTree({ avl: false }),
  seed: (m) => [48, 27, 68, 15, 35, 55, 79, 22, 31, 62, 9, 44].forEach((v) => m.silentInsert(v)),
  ops: treeOps(false),
  complexity: [
    { op: 'search', avg: 'O(log n)', worst: 'O(n)' },
    { op: 'insert', avg: 'O(log n)', worst: 'O(n)' },
    { op: 'delete', avg: 'O(log n)', worst: 'O(n)' },
    { op: 'traversal', avg: 'O(n)', worst: 'O(n)' },
    { op: 'space', avg: 'O(n)', worst: 'O(n)' },
  ],
  facts: [
    'Inserting sorted values makes the tree a linked list; its height becomes n.',
    'In-order traversal returns the values in ascending order.',
    'Deleting a node with two children replaces it with its in-order successor.',
  ],
  where: ['Database indexes', 'Autocomplete tries (variant)', 'Filesystem directories', 'std::map / TreeMap'],
  metrics: ['nodes', 'height', 'idealHeight', 'balanced', 'min', 'max'],
}

const avlEntry = {
  ...bstEntry,
  id: 'avl',
  name: 'AVL Tree',
  abbr: 'AVL',
  tagline: 'A self-balancing binary search tree.',
  blurb:
    'An AVL tree is a BST with a height constraint: the left and right subtrees at every node may differ by at most one. Rotations restore that balance after an insert or delete, keeping operations O(log n) in the worst case.',
  create: () => createTree({ avl: true }),
  seed: (m) => [10, 20, 30, 40, 50, 25, 15, 5, 35, 45].forEach((v) => m.silentInsert(v)),
  ops: treeOps(true),
  complexity: [
    { op: 'search', avg: 'O(log n)', worst: 'O(log n)' },
    { op: 'insert', avg: 'O(log n)', worst: 'O(log n)' },
    { op: 'delete', avg: 'O(log n)', worst: 'O(log n)' },
    { op: 'rotation', avg: 'O(1)', worst: 'O(log n)' },
  ],
  facts: [
    'LL, RR, LR, and RL are the four rotation cases.',
    'Balance factor = height(left) − height(right). It must stay in [−1, 1].',
    'AVL trees are stricter than red-black trees: faster lookups, more rotations.',
  ],
  where: ['In-memory indexes', 'Database lookup tables', 'Read-heavy workloads'],
}

/* ══════════════════════════════════════════════════════════════════════
   LINEAR
   ══════════════════════════════════════════════════════════════════════ */
const listEntry = {
  id: 'linkedlist',
  family: 'linear',
  name: 'Singly Linked List',
  abbr: 'List',
  scene: 'list',
  tagline: 'Values linked by pointers.',
  blurb:
    'A linked list stores each value in a node with a pointer to the next. Inserting at the front takes constant time; reaching index k requires walking k links.',
  create: () => createList({ doubly: false }),
  seed: (m) => m.seed([12, 45, 7, 33, 58, 21]),
  ops: [
    { id: 'append', label: 'Append', tone: 'acid', fields: [num('value', 'value', '99', 99)], code: 'llAppend', run: (m, a) => m.append(a.value) },
    { id: 'prepend', label: 'Prepend', tone: 'acid', fields: [num('value', 'value', '4', 4)], code: 'llPrepend', run: (m, a) => m.prepend(a.value) },
    {
      id: 'insertAt',
      label: 'Insert at',
      tone: 'probe',
      fields: [num('index', 'index', '2', 2), num('value', 'value', '77', 77)],
      code: 'llInsertAt',
      run: (m, a) => m.insertAt(a.index, a.value),
    },
    { id: 'remove', label: 'Delete', tone: 'bad', fields: [num('value', 'value', '33', 33)], code: 'llRemove', run: (m, a) => m.remove(a.value) },
    { id: 'search', label: 'Search', tone: 'flow', fields: [num('value', 'find', '58', 58)], code: 'llSearch', run: (m, a) => m.search(a.value) },
    { id: 'reverse', label: 'Reverse', tone: 'special', fields: [], code: 'llReverse', run: (m) => m.reverse() },
    { id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
  ],
  complexity: [
    { op: 'access(k)', avg: 'O(n)', worst: 'O(n)' },
    { op: 'search', avg: 'O(n)', worst: 'O(n)' },
    { op: 'prepend', avg: 'O(1)', worst: 'O(1)' },
    { op: 'append', avg: 'O(1)', worst: 'O(n)' },
    { op: 'delete@head', avg: 'O(1)', worst: 'O(1)' },
  ],
  facts: [
    'Appending is O(1) only with a tail pointer. Without one, it is O(n).',
    'Reversing a list uses three pointers: prev, current, next.',
    'Each node pays for an extra pointer; for small values, that overhead can exceed the data.',
  ],
  where: ['LRU caches', 'Kernel free-lists', 'Undo history', 'Chained hash buckets'],
  metrics: ['length', 'head', 'tail'],
}

const stackEntry = {
  id: 'stack',
  family: 'linear',
  name: 'Stack',
  abbr: 'Stack',
  scene: 'linear',
  tagline: 'Last in, first out.',
  blurb:
    'A stack adds and removes at one end. Push and pop are O(1); recursion, undo, and expression parsing all use this order.',
  create: () => createLinear('stack'),
  seed: (m) => [24, 51, 17].forEach((v) => m.push(v)),
  ops: [
    { id: 'push', label: 'Push', tone: 'acid', fields: [num('value', 'value', '88', 88)], code: 'stack', run: (m, a) => m.push(a.value) },
    { id: 'pop', label: 'Pop', tone: 'bad', fields: [], code: 'stack', run: (m) => m.pop() },
    { id: 'peek', label: 'Peek', tone: 'probe', fields: [], code: 'stack', run: (m) => m.peek() },
    { id: 'recursion', label: 'Run fact(n)', tone: 'special', fields: [num('n', 'n', '5', 5)], code: 'recursion', run: (m, a) => m.runRecursion(a.n) },
    { id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
  ],
  complexity: [
    { op: 'push', avg: 'O(1)', worst: 'O(1)' },
    { op: 'pop', avg: 'O(1)', worst: 'O(1)' },
    { op: 'peek', avg: 'O(1)', worst: 'O(1)' },
    { op: 'search', avg: 'O(n)', worst: 'O(n)' },
  ],
  facts: [
    'fact(5) shows call frames stacking and unwinding.',
    'Stack overflow means too many frames, usually from a missing base case.',
    'Balanced parentheses, expression evaluation, and undo are stack problems.',
  ],
  where: ['Call stack / recursion', 'Undo & redo', 'Expression parsing', 'DFS and backtracking'],
  metrics: ['size', 'top'],
}

const queueEntry = {
  id: 'queue',
  family: 'linear',
  name: 'Queue',
  abbr: 'Queue',
  scene: 'linear',
  tagline: 'First in, first out.',
  blurb:
    'A queue adds at the back and removes from the front. A circular buffer makes both ends O(1); BFS and job schedulers are built on this order.',
  create: () => createLinear('queue'),
  seed: (m) => ['job-1', 'job-2', 'job-3'].forEach((v) => m.enqueue(v)),
  ops: [
    { id: 'enqueue', label: 'Enqueue', tone: 'acid', fields: [{ key: 'value', label: 'value', type: 'text', placeholder: 'job-4', default: 'job-4' }], code: 'queue', run: (m, a) => m.enqueue(a.value) },
    { id: 'dequeue', label: 'Dequeue', tone: 'bad', fields: [], code: 'queue', run: (m) => m.dequeue() },
    { id: 'front', label: 'Front', tone: 'probe', fields: [], code: 'queue', run: (m) => m.peekFront() },
    { id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
  ],
  complexity: [
    { op: 'enqueue', avg: 'O(1)', worst: 'O(1)' },
    { op: 'dequeue', avg: 'O(1)', worst: 'O(1)' },
    { op: 'front', avg: 'O(1)', worst: 'O(1)' },
  ],
  facts: [
    'BFS is a queue plus a visited set.',
    'A naive array queue is O(n) to dequeue because every element shifts; a circular buffer fixes that.',
    'A priority queue is a heap, not a queue: it serves by priority, not arrival.',
  ],
  where: ['BFS', 'Task schedulers', 'Print spoolers', 'Message brokers'],
  metrics: ['size', 'front', 'back'],
}

const dequeEntry = {
  id: 'deque',
  family: 'linear',
  name: 'Deque',
  abbr: 'Deque',
  scene: 'linear',
  tagline: 'Push and pop at both ends.',
  blurb:
    'A deque supports push and pop at either end in O(1). Use one end and it behaves like a stack; use both and it handles queues and sliding windows.',
  create: () => createLinear('deque'),
  seed: (m) => {
    m.pushBack(18)
    m.pushBack(42)
    m.pushFront(7)
  },
  ops: [
    { id: 'pushFront', label: 'Push front', tone: 'acid', fields: [num('value', 'value', '5', 5)], code: 'deque', run: (m, a) => m.pushFront(a.value) },
    { id: 'pushBack', label: 'Push back', tone: 'acid', fields: [num('value', 'value', '91', 91)], code: 'deque', run: (m, a) => m.pushBack(a.value) },
    { id: 'popFront', label: 'Pop front', tone: 'bad', fields: [], code: 'deque', run: (m) => m.popFront() },
    { id: 'popBack', label: 'Pop back', tone: 'bad', fields: [], code: 'deque', run: (m) => m.popBack() },
    { id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
  ],
  complexity: [
    { op: 'push/pop front', avg: 'O(1)', worst: 'O(1)' },
    { op: 'push/pop back', avg: 'O(1)', worst: 'O(1)' },
    { op: 'access(k)', avg: 'O(n)', worst: 'O(n)' },
  ],
  facts: [
    'A sliding-window maximum keeps a monotonic deque; the maximum stays at the front.',
    'Work-stealing schedulers give each worker a deque.',
  ],
  where: ['Sliding window problems', 'Work-stealing schedulers', 'Browser history both ways', 'Undo/redo with redo'],
  metrics: ['size', 'front', 'back'],
}

/* ══════════════════════════════════════════════════════════════════════
   HASHING
   ══════════════════════════════════════════════════════════════════════ */
const hashOps = (chaining) => [
  { id: 'insert', label: 'Insert', tone: 'acid', fields: [num('key', 'key', chaining ? '45' : '19', chaining ? 45 : 19)], code: chaining ? 'hashInsertChain' : 'hashInsertProbe', run: (m, a) => m.insert(a.key) },
  { id: 'find', label: 'Lookup', tone: 'probe', fields: [num('key', 'key', chaining ? '23' : '16', chaining ? 23 : 16)], code: chaining ? 'hashFindChain' : 'hashFindProbe', run: (m, a) => m.find(a.key) },
  { id: 'remove', label: 'Delete', tone: 'bad', fields: [num('key', 'key', '34', 34)], code: 'hashDelete', run: (m, a) => m.remove(a.key) },
  { id: 'resize', label: 'Resize ×2', tone: 'special', fields: [], code: 'hashResize', run: (m) => m.resize() },
  { id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
]

const hashMapEntry = {
  id: 'hashchain',
  family: 'hashing',
  name: 'Hash Table · Chaining',
  abbr: 'Chain',
  scene: 'hash',
  tagline: 'Collisions are stored in per-bucket lists.',
  blurb:
    'A hash function maps a key to a bucket, so lookups avoid scanning the table. Chaining stores colliding keys in a small list per bucket.',
  create: () => createHash({ capacity: 11, mode: 'chaining' }),
  seed: (m) => [12, 23, 34, 5, 16, 27].forEach((k) => m.silentInsert(k)),
  ops: hashOps(true),
  complexity: [
    { op: 'insert', avg: 'O(1)', worst: 'O(n)' },
    { op: 'lookup', avg: 'O(1)', worst: 'O(n)' },
    { op: 'delete', avg: 'O(1)', worst: 'O(n)' },
  ],
  facts: [
    'Load factor = entries / buckets. Many implementations resize around 0.75.',
    'Worst-case O(n) happens when every key collides.',
    '12, 23, and 34 all map to bucket 1 at capacity 11.',
  ],
  where: ['Object / dict / Map', 'Database sharding', 'Deduplication', 'Caches keyed by URL'],
  metrics: ['entries', 'capacity', 'loadFactor', 'bucketsUsed', 'longestChain'],
}

const hashProbeEntry = {
  ...hashMapEntry,
  id: 'hashprobe',
  name: 'Hash Table · Open Addressing',
  abbr: 'Probe',
  tagline: 'Collisions probe forward to the next free slot.',
  blurb:
    'Open addressing stores collisions in the same array. A full slot triggers a probe forward; contiguous storage is cache-friendly, but clusters slow lookups.',
  create: () => createHash({ capacity: 11, mode: 'probing' }),
  seed: (m) => [12, 23, 5, 16, 30].forEach((k) => m.silentInsert(k)),
  ops: hashOps(false),
  facts: [
    'Linear probing steps by 1; quadratic probing breaks up clusters.',
    'Deletes need tombstones; an empty slot would end a probe chain early.',
    'Probe length grows sharply as the load factor approaches 1.',
  ],
  where: ['Python dict (variant)', 'Rust hash maps', 'GPU memory pools', 'Cache-sensitive lookups'],
}

/* ══════════════════════════════════════════════════════════════════════
   HEAPS
   ══════════════════════════════════════════════════════════════════════ */
const heapEntry = {
  id: 'heap',
  family: 'heaps',
  name: 'Binary Heap',
  abbr: 'Heap',
  scene: 'heap',
  tagline: 'The largest value stays at the root.',
  blurb:
    'A binary heap is a complete tree stored in an array: children of index i live at 2i+1 and 2i+2. Every parent beats its children, so the root is always the maximum.',
  create: () => createHeap({ max: true }),
  seed: (m) => m.heapify([42, 17, 63, 8, 51, 29, 74, 33]),
  ops: [
    { id: 'push', label: 'Push', tone: 'acid', fields: [num('value', 'value', '80', 80)], code: 'heapPush', run: (m, a) => m.push(a.value) },
    { id: 'pop', label: 'Extract max', tone: 'bad', fields: [], code: 'heapPop', run: (m) => m.pop() },
    { id: 'peek', label: 'Peek root', tone: 'probe', fields: [], code: 'heapPeek', run: (m) => m.peek() },
    {
      id: 'heapify',
      label: 'Heapify array',
      tone: 'special',
      fields: [{ key: 'values', label: 'csv', type: 'text', placeholder: '9,42,17,63,8', default: '9,42,17,63,8,51,29' }],
      code: 'heapify',
      run: (m, a) =>
        m.heapify(
          String(a.values)
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n)),
        ),
    },
{ id: 'clear', label: 'Clear', tone: 'ghost', fields: [], code: null, action: (m) => (m.clear(), null) },
  ],
  complexity: [
    { op: 'push', avg: 'O(log n)', worst: 'O(log n)' },
    { op: 'extract', avg: 'O(log n)', worst: 'O(log n)' },
    { op: 'peek', avg: 'O(1)', worst: 'O(1)' },
    { op: 'heapify', avg: 'O(n)', worst: 'O(n)' },
  ],
  facts: [
    'Build-heap is O(n), not O(n log n).',
    'A heap is partially ordered, not sorted.',
    'Dijkstra and A* use a priority queue to get the minimum in O(log n).',
  ],
  where: ['Priority queues', 'Dijkstra & A*', 'Heap sort', 'Median maintenance (two heaps)'],
  metrics: ['size', 'root', 'levels'],
}

/* ══════════════════════════════════════════════════════════════════════
   GRAPHS
   ══════════════════════════════════════════════════════════════════════ */
const graphEntry = {
  id: 'graph',
  family: 'graphs',
  name: 'Weighted Graph',
  abbr: 'Graph',
  scene: 'graph',
  tagline: 'Weighted nodes and edges, four algorithms.',
  blurb:
    'A graph is a set of nodes joined by weighted edges. BFS and DFS traverse, Dijkstra finds shortest paths, and Prim builds a minimum spanning tree.',
  create: () => createGraph(generateGraph(14, 7)),
  seed: () => {},
  ops: [
    { id: 'bfs', label: 'BFS', tone: 'flow', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'bfs', run: (m, a) => m.bfs(a.start), why: 'Expands in rings. On unweighted graphs, the first visit is a shortest path.' },
    { id: 'dfs', label: 'DFS', tone: 'flow', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'dfs', run: (m, a) => m.dfs(a.start), why: 'Explores deep before backtracking. It does not guarantee a shortest path.' },
    { id: 'dijkstra', label: 'Dijkstra', tone: 'acid', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'dijkstra', run: (m, a) => m.dijkstra(a.start), why: 'BFS ordered by accumulated weight. Exact shortest paths for non-negative edges.' },
    { id: 'prim', label: "Prim's MST", tone: 'special', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'prim', run: (m, a) => m.prim(a.start), why: 'Grows one tree by taking the cheapest edge leaving it.' },
    {
      id: 'addNode',
      label: 'Add node',
      tone: 'special',
      fields: [],
      code: null,
      action: (m) => (m.addNode(), null),
    },
    {
      id: 'addEdge',
      label: 'Add edge',
      tone: 'special',
      fields: [
        { key: 'from', label: 'from', type: 'node' },
        { key: 'to', label: 'to', type: 'node' },
        { key: 'w', label: 'weight', type: 'number', placeholder: '1-9', default: 4 },
      ],
      code: null,
      action: (m, a) => (m.addEdge(a.from, a.to, a.w), null),
    },
    {
      id: 'regen',
      label: 'New graph',
      tone: 'ghost',
      fields: [num('count', 'nodes', '14', 14)],
      code: null,
      action: (m, a) => {
        m.regenerate(Math.max(4, Math.min(26, Number(a.count) || 14)), Math.floor(Math.random() * 1e5))
        return null
      },
    },
  ],
  complexity: [
    { op: 'BFS / DFS', avg: 'O(V+E)', worst: 'O(V+E)' },
    { op: 'Dijkstra', avg: 'O(E log V)', worst: 'O(V²) naive' },
    { op: "Prim (binary heap)", avg: 'O(E log V)', worst: 'O(V²)' },
    { op: 'space', avg: 'O(V+E)', worst: 'O(V+E)' },
  ],
  facts: [
    'This visualizer uses the O(V²) Dijkstra; a binary heap gives O(E log V).',
    'BFS gives shortest paths only when edges are unweighted.',
    'A minimum spanning tree has V−1 edges and no cycles.',
    'Dijkstra requires non-negative edge weights.',
  ],
  where: ['Maps & routing', 'Social networks', 'Package dependency resolution', 'Network routing (OSPF)'],
  metrics: ['nodes', 'edges', 'density', 'mstCost'],
  nodeField: true,
}

/* ══════════════════════════════════════════════════════════════════════
   ARRAYS / SORTING
   ══════════════════════════════════════════════════════════════════════ */
const sortEntry = {
  id: 'sorting',
  family: 'arrays',
  name: 'Sorting Algorithms',
  abbr: 'Sort',
  scene: 'array',
  tagline: 'Seven sorts on one array.',
  blurb:
    'Sorting algorithms trade comparisons, moves, memory, stability, and behavior on nearly sorted input. Running the same array through each makes those differences visible.',
  create: () => createSorter(randomArray(22, 100, mulberry(2026))),
  seed: () => {},
  ops: [
    { id: 'bubble', label: 'Bubble', tone: 'bad', fields: [], code: 'bubble', run: (m) => m.bubble(), group: 'sort', why: 'O(n²) on average. The early-exit pass makes it O(n) on already sorted input.' },
    { id: 'selection', label: 'Selection', tone: 'bad', fields: [], code: 'selection', run: (m) => m.selection(), group: 'sort', why: 'Always O(n²) comparisons, but at most O(n) swaps.' },
    { id: 'insertion', label: 'Insertion', tone: 'probe', fields: [], code: 'insertionSort', run: (m) => m.insertion(), group: 'sort', why: 'O(n) on nearly sorted input; stable and fast for small arrays.' },
    { id: 'shell', label: 'Shell', tone: 'probe', fields: [], code: 'shell', run: (m) => m.shell(), group: 'sort', why: 'Insertion sort with gap passes; breaks up inversions early.' },
    { id: 'merge', label: 'Merge', tone: 'flow', fields: [], code: 'merge', run: (m) => m.merge(), group: 'sort', why: 'Guaranteed O(n log n) and stable, with O(n) extra memory.' },
    { id: 'quick', label: 'Quick', tone: 'acid', fields: [], code: 'quick', run: (m) => m.quick(), group: 'sort', why: 'Usually fastest in practice; a bad pivot gives O(n²).' },
    { id: 'heap', label: 'Heap', tone: 'special', fields: [], code: 'heapSort', run: (m) => m.heap(), group: 'sort', why: 'O(n log n) worst case, in place, with poor cache locality.' },
    {
      id: 'shuffle',
      label: 'New array',
      tone: 'ghost',
      fields: [
        num('size', 'size', '22', 22),
        { key: 'shape', label: 'shape', type: 'select', options: ['random', 'nearly sorted', 'reversed'], default: 'random' },
      ],
      code: null,
      action: (m, a) => {
        const n = Math.max(4, Math.min(48, Number(a.size) || 22))
        const src = a.shape === 'reversed' ? reversedArray(n) : a.shape === 'nearly sorted' ? almostSortedArray(n, Math.max(2, Math.round(n * 0.12))) : randomArray(n)
        m.reset(src)
        return null
      },
    },
    {
      id: 'custom',
      label: 'Your array',
      tone: 'ghost',
      fields: [{ key: 'values', label: 'values, separated by commas', type: 'text', placeholder: '5, 3, 9, 1, 7', default: '' }],
      code: null,
      run: (m, a) => {
        const nums = String(a.values || '')
          .split(/[^0-9+-]+/)
          .filter((t) => t.trim() !== '')
          .map(Number)
          .filter(Number.isFinite)
          .slice(0, 48)
        if (nums.length < 2) return { ok: false, error: 'Enter at least two numbers.', steps: [] }
        m.reset(nums)
        return { ok: true, steps: [], summary: `Array set to ${nums.join(', ')}` }
      },
    },
  ],
  complexity: [
    { op: 'bubble', avg: 'O(n²)', worst: 'O(n²)', best: 'O(n)' },
    { op: 'selection', avg: 'O(n²)', worst: 'O(n²)', best: 'O(n²)' },
    { op: 'insertion', avg: 'O(n²)', worst: 'O(n²)', best: 'O(n)' },
    { op: 'shell', avg: 'O(n log² n)', worst: 'O(n²)', best: 'O(n log n)' },
    { op: 'merge', avg: 'O(n log n)', worst: 'O(n log n)', best: 'O(n log n)' },
    { op: 'quick', avg: 'O(n log n)', worst: 'O(n²)', best: 'O(n log n)' },
    { op: 'heap', avg: 'O(n log n)', worst: 'O(n log n)', best: 'O(n log n)' },
  ],
  facts: [
    'Insertion and bubble sort approach O(n) on nearly sorted input.',
    'With a last-element pivot, reversed input is quicksort\'s worst case.',
    'Merge sort is stable and O(n log n), but needs O(n) extra memory.',
    'Heapsort is in place and O(n log n), but jumps through memory.',
  ],
  where: ['Database ORDER BY', 'std::sort (introsort)', 'External merge sort on disk', 'Dedup via sort + scan'],
  metrics: ['comparisons', 'swaps', 'writes', 'sorted', 'total'],
}

/* ══════════════════════════════════════════════════════════════════════
   GRIDS / PATHFINDING
   ══════════════════════════════════════════════════════════════════════ */
const pathEntry = {
  id: 'pathfinding',
  family: 'grids',
  name: 'Grid Pathfinding',
  abbr: 'Path',
  scene: 'grid',
  tagline: 'Five searches on a grid you can edit.',
  blurb:
    'A grid is a graph with four neighbours per cell. BFS and Dijkstra flood the map; Greedy and A* use a heuristic to focus the search; DFS finds a path without promising the shortest one.',
  create: () => createGrid(21, 15, 3),
  seed: () => {},
  ops: [
    { id: 'bfs', label: 'BFS', tone: 'flow', fields: [], code: 'path', run: (m) => m.bfs(), group: 'search' },
    { id: 'dfs', label: 'DFS', tone: 'bad', fields: [], code: 'path', run: (m) => m.dfs(), group: 'search' },
    { id: 'dijkstra', label: 'Dijkstra', tone: 'probe', fields: [], code: 'path', run: (m) => m.dijkstra(), group: 'search' },
    { id: 'greedy', label: 'Greedy', tone: 'special', fields: [], code: 'path', run: (m) => m.greedy(), group: 'search' },
    { id: 'astar', label: 'A*', tone: 'acid', fields: [], code: 'path', run: (m) => m.astar(), group: 'search' },
    {
      id: 'wall',
      label: 'Draw walls',
      tone: 'ghost',
      fields: [{ key: 'mode', label: 'brush', type: 'select', options: ['wall', 'mud', 'water', 'open'], default: 'wall' }],
      code: null,
      note: 'Then drag across the grid in the viewport.',
      action: () => null,
      paint: true,
    },
    { id: 'clear', label: 'Clear map', tone: 'ghost', fields: [], code: null, action: (m) => (m.clearWalls(), null) },
    { id: 'reset', label: 'New map', tone: 'ghost', fields: [], code: null, action: (m) => (m.reset(Math.floor(Math.random() * 1e4)), null) },
  ],
  complexity: [
    { op: 'BFS', avg: 'O(V+E)', worst: 'O(V+E)' },
    { op: 'Dijkstra', avg: 'O(E log V)', worst: 'O(E log V)' },
    { op: 'A*', avg: 'O(E)', worst: 'O(E log V)' },
    { op: 'Greedy', avg: 'O(E log V)', worst: 'O(E log V)' },
  ],
  facts: [
    'A* is Dijkstra plus an admissible heuristic.',
    'Greedy best-first can be fast and suboptimal.',
    'DFS on a grid finds a path, not the shortest one.',
    'Expanded cells are the search cost.',
  ],
  where: ['Game navigation', 'Robot motion planning', 'Routing & logistics', 'Maze solvers'],
  metrics: ['visited', 'frontier', 'pathLength', 'pathCost', 'walls'],
  paintable: true,
}

/* ══════════════════════════════════════════════════════════════════════ */
export const ENTRIES = [bstEntry, avlEntry, listEntry, stackEntry, queueEntry, dequeEntry, hashMapEntry, hashProbeEntry, heapEntry, graphEntry, sortEntry, pathEntry]

export const entryById = (id) => ENTRIES.find((e) => e.id === id) || ENTRIES[0]

export const entriesByFamily = (family) => ENTRIES.filter((e) => e.family === family)

export const TONE = {
  acid: { fg: '#ff5a36', bg: 'rgba(255,90,54,0.10)', bd: 'rgba(255,90,54,0.30)' },
  probe: { fg: '#ff5a36', bg: 'rgba(255,90,54,0.10)', bd: 'rgba(255,90,54,0.30)' },
  flow: { fg: '#8fa6b2', bg: 'rgba(143,166,178,0.10)', bd: 'rgba(143,166,178,0.30)' },
  bad: { fg: '#d97a67', bg: 'rgba(217,122,103,0.10)', bd: 'rgba(217,122,103,0.30)' },
  special: { fg: '#b3a1c9', bg: 'rgba(179,161,201,0.10)', bd: 'rgba(179,161,201,0.30)' },
  ghost: { fg: '#8f8a80', bg: 'rgba(242,239,233,0.04)', bd: 'rgba(242,239,233,0.12)' },
}
