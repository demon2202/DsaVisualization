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
  tagline: 'Every node splits the remaining search space in half.',
  blurb:
    'A binary search tree keeps the invariant left < node < right at every single node. That one rule is what turns a lookup into a series of halving decisions instead of a scan — the same intuition behind binary search, but the data can grow and shrink without being re-sorted.',
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
    'The worst case is a linked list in disguise: insert 1,2,3,4,5 in order and the tree degenerates to depth n.',
    'In-order traversal of a BST always prints values in ascending order — interviewers love that one.',
    'Deleting a node with two children swaps in the in-order successor, never a random value.',
  ],
  where: ['Database indexes', 'Autocomplete tries (variant)', 'Filesystem directories', 'std::map / TreeMap'],
  metrics: ['nodes', 'height', 'idealHeight', 'balanced', 'min', 'max'],
}

const avlEntry = {
  ...bstEntry,
  id: 'avl',
  name: 'AVL Tree',
  abbr: 'AVL',
  tagline: 'A BST that refuses to degenerate — it rotates to stay balanced.',
  blurb:
    'An AVL tree is a BST with one extra rule: at every node, the heights of the left and right subtrees may differ by at most 1. When an insert or delete breaks that rule, the tree repairs itself with one or two rotations on the way back up. That guarantee is what keeps every operation at O(log n) worst case, not just average.',
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
    'Watch the LL, RR, LR and RL cases — the double rotations are the part people forget.',
    'Balance factor = height(left) − height(right). Anything outside [−1, 1] triggers a rotation.',
    'AVL is stricter than a red-black tree, so it searches faster but rebalances more often.',
  ],
  where: ['In-memory indexes', 'Database lookup tables', 'Anywhere read-heavy and worst case matters'],
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
  tagline: 'Nodes scattered in memory, stitched together by pointers.',
  blurb:
    'A linked list stores each value in a node that also holds the address of the next one. Nothing has to be contiguous, so inserting at the front is a couple of pointer writes — the thing an array genuinely cannot do cheaply. The price is that there is no random access: to reach index k you must walk k links.',
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
    { op: 'append*', avg: 'O(1)', worst: 'O(n)' },
    { op: 'delete@head', avg: 'O(1)', worst: 'O(1)' },
  ],
  facts: [
    '*Appending is O(1) only if you keep a tail pointer. Without one you walk the whole list first.',
    'Reverse uses three pointers — prev, cur, next — and no extra memory. It is the most-asked list question.',
    'A linked list node costs an extra pointer per element; for small values that overhead beats the data.',
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
  tagline: 'Last in, first out — the shape of every function call.',
  blurb:
    'A stack only lets you touch one end. Push adds to the top, pop removes from the top, and that restriction is exactly what makes it O(1) everywhere. It is the runtime model behind recursion, the mechanism behind your editor\'s undo, and the tool for anything that needs to "remember where I was".',
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
    'Run fact(5) to watch call frames stack up and unwind — that is literally what recursion costs you in memory.',
    'Stack overflow is not the stack "running out of memory", it is running out of frames: depth without a base case.',
    'Balanced parentheses, expression evaluation and browser history are all the same problem in disguise.',
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
  tagline: 'First in, first out — fairness as a data structure.',
  blurb:
    'A queue adds at the back and removes from the front, so elements are served in the exact order they arrived. Implemented as a circular buffer it is O(1) at both ends with no shifting. It is the engine of BFS, of every job scheduler, and of anything described as "fair".',
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
    'BFS is just "queue + visited set". Level-order tree traversal is the same code with tree children.',
    'A naive array queue is O(n) to dequeue because everything shifts; a circular buffer fixes that with two moving indices.',
    'A priority queue is not this — it serves by importance, not arrival order. That is a heap.',
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
  tagline: 'Both ends open — a stack and a queue at once.',
  blurb:
    'A double-ended queue supports O(1) push and pop at either end. Use it from one end and it is a stack; from both and it becomes the natural structure for sliding windows, work-stealing schedulers and monotonic-queue tricks.',
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
    'Sliding-window maximum is the classic deque problem: keep the window monotonically decreasing and the answer is always at the front.',
    'Work-stealing schedulers (Go, Java ForkJoin) use a deque per worker — own end for the owner, other end for thieves.',
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
  tagline: 'A hash turns any key into an index; collisions become short lists.',
  blurb:
    'Hashing trades order for speed: a hash function maps a key straight to a bucket, so a lookup costs one computation instead of a search. Collisions are unavoidable — with chaining, each bucket just holds a small linked list, and the table stays correct no matter how full it gets.',
  create: () => createHash({ capacity: 11, mode: 'chaining' }),
  seed: (m) => [12, 23, 34, 5, 16, 27].forEach((k) => m.silentInsert(k)),
  ops: hashOps(true),
  complexity: [
    { op: 'insert', avg: 'O(1)', worst: 'O(n)' },
    { op: 'lookup', avg: 'O(1)', worst: 'O(n)' },
    { op: 'delete', avg: 'O(1)', worst: 'O(n)' },
  ],
  facts: [
    'Load factor = entries / buckets. Most implementations resize at 0.75 — watch it climb in the HUD.',
    'Worst case O(n) happens when every key collides, which is why hash functions must be hard to game.',
    '12, 23 and 34 all hash to bucket 1 with capacity 11 — a real collision you can see chained together.',
  ],
  where: ['Object / dict / Map', 'Database sharding', 'Deduplication', 'Caches keyed by URL'],
  metrics: ['entries', 'capacity', 'loadFactor', 'bucketsUsed', 'longestChain'],
}

const hashProbeEntry = {
  ...hashMapEntry,
  id: 'hashprobe',
  name: 'Hash Table · Open Addressing',
  abbr: 'Probe',
  tagline: 'No chains — on collision, walk forward to the next free slot.',
  blurb:
    'Open addressing keeps every entry directly in the array. On a collision it probes forward (linear probing here) until it finds an empty slot. That is extremely cache-friendly because the data is contiguous, but it clusters: a full neighbourhood makes every nearby lookup slower.',
  create: () => createHash({ capacity: 11, mode: 'probing' }),
  seed: (m) => [12, 23, 5, 16, 30].forEach((k) => m.silentInsert(k)),
  ops: hashOps(false),
  facts: [
    'Linear probing steps by 1; quadratic probing steps by 1, 4, 9… to break up clusters.',
    'Deleting needs a tombstone, not an empty slot — a real gap would end a probe chain too early.',
    'Load factor must stay well below 1; at 0.9 probes explode.',
  ],
  where: ['Python dict (variant)', 'Rust HashMap alt', 'GPU memory pools', 'Anything cache-sensitive'],
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
  tagline: 'A complete tree stored in a flat array — the root is always the answer.',
  blurb:
    'A binary heap is a complete binary tree where every parent beats its children (max-heap) or loses to them (min-heap). Because it is complete, it needs no pointers: children of index i live at 2i+1 and 2i+2, so the whole structure is just an array. That is why a priority queue is cheap.',
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
    'Floyd build-heap is O(n), not O(n log n) — most nodes are leaves and barely sift at all.',
    'Heaps are not sorted, only partially ordered. Walking the array does not print ascending values.',
    'A* and Dijkstra are only fast because a priority queue hands them the minimum in O(log n).',
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
  tagline: 'Nodes and edges — the shape of every network you will ever model.',
  blurb:
    'A graph is just relationships: nodes for things, weighted edges for the cost of moving between them. Four algorithms cover most of what you need — BFS and DFS for reachability and ordering, Dijkstra for shortest paths with weights, and Prim for the cheapest way to connect everything.',
  create: () => createGraph(generateGraph(14, 7)),
  seed: () => {},
  ops: [
    { id: 'bfs', label: 'BFS', tone: 'flow', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'bfs', run: (m, a) => m.bfs(a.start), why: 'Expands in rings, so on unweighted graphs the first time it touches a node is via a shortest path — the right tool for hop counts and reachability.' },
    { id: 'dfs', label: 'DFS', tone: 'flow', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'dfs', run: (m, a) => m.dfs(a.start), why: 'Dives deep and backtracks: no shortest-path guarantee, but it is the backbone of cycle detection, topological order and connectivity components.' },
    { id: 'dijkstra', label: 'Dijkstra', tone: 'acid', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'dijkstra', run: (m, a) => m.dijkstra(a.start), why: 'BFS ordered by accumulated weight: exact shortest paths with non-negative edges, expanding uniformly in cost rings around the source.' },
    { id: 'prim', label: "Prim's MST", tone: 'special', fields: [{ key: 'start', label: 'from', type: 'node' }], code: 'prim', run: (m, a) => m.prim(a.start), why: 'Grows one connected tree by always taking the cheapest outgoing edge — minimum total cost to span every node, not paths from a source.' },
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
    'This implementation uses a naive O(V²) Dijkstra for clarity; a binary heap drops it to O(E log V).',
    'BFS gives shortest paths only when edges are unweighted. Add weights and you need Dijkstra.',
    'An MST connects every node at minimum total cost with exactly V−1 edges and no cycles.',
    'Dijkstra is wrong with negative edges — that is Bellman-Ford\'s job.',
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
  tagline: 'Seven ways to order the same array — and the cost of each.',
  blurb:
    'Sorting looks like one problem and is actually a family of trade-offs: how many comparisons, how many moves, does it need extra memory, does it keep equal items in order, and does it get faster when the input is already nearly sorted. Run the same array through all of them and the differences stop being abstract.',
  create: () => createSorter(randomArray(22, 100, mulberry(2026))),
  seed: () => {},
  ops: [
    { id: 'bubble', label: 'Bubble', tone: 'bad', fields: [], code: 'bubble', run: (m) => m.bubble(), group: 'sort', why: 'Teaching tool, not a production sort: O(n²) even on average, but its early-exit pass makes it the clearest way to see what a comparison and a swap cost.' },
    { id: 'selection', label: 'Selection', tone: 'bad', fields: [], code: 'selection', run: (m) => m.selection(), group: 'sort', why: 'Always O(n²) compares but only O(n) swaps — the right pick when writing memory is far more expensive than reading it.' },
    { id: 'insertion', label: 'Insertion', tone: 'probe', fields: [], code: 'insertionSort', run: (m) => m.insertion(), group: 'sort', why: 'O(n) on nearly-sorted input and stable, which is why real libraries finish with it for small or almost-ordered runs.' },
    { id: 'shell', label: 'Shell', tone: 'probe', fields: [], code: 'shell', run: (m) => m.shell(), group: 'sort', why: 'Insertion sort plus far-apart gap passes: breaks up early inversions cheaply, in place, with a gap-sequence-dependent bound.' },
    { id: 'merge', label: 'Merge', tone: 'flow', fields: [], code: 'merge', run: (m) => m.merge(), group: 'sort', why: 'Guaranteed O(n log n) and stable, and it merges sequential runs — the reason it wins on disk and linked lists despite the extra O(n) memory.' },
    { id: 'quick', label: 'Quick', tone: 'acid', fields: [], code: 'quick', run: (m) => m.quick(), group: 'sort', why: 'In place with tiny constants and cache-friendly scans: usually the fastest in practice, but a bad pivot makes it O(n²), so pivot choice is everything.' },
    { id: 'heap', label: 'Heap', tone: 'special', fields: [], code: 'heapSort', run: (m) => m.heap(), group: 'sort', why: 'Worst-case O(n log n) in place with no extra memory — the safe guarantee when quicksort\'s tail risk is unacceptable, at the cost of cache-hostile jumps.' },
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
        if (nums.length < 2) return { ok: false, error: 'Give me at least two numbers', steps: [] }
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
    'Run "nearly sorted" through insertion sort and bubble sort — both collapse to almost O(n).',
    'Reversed input is quicksort\'s worst case with a last-element pivot. Production sorts randomise or median-of-three.',
    'Merge sort is the only one here that is both stable and guaranteed O(n log n) — it pays with O(n) memory, visible as the row behind the array.',
    'Heapsort needs no extra memory but walks the array in a jumping pattern, so it is cache-hostile.',
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
  tagline: 'Same four searches, now with a heuristic — watch the search area shrink.',
  blurb:
    'A grid is a graph where every cell has four neighbours. Run BFS, Dijkstra, Greedy and A* on the identical map and the difference is visible: uninformed searches flood everything, a heuristic pulls the flood toward the goal. Terrain costs (mud, water) are what separate Dijkstra from plain BFS.',
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
    'A* = Dijkstra + heuristic. If h never overestimates (admissible), A* is guaranteed optimal.',
    'Greedy best-first is fast and frequently wrong: it can be dragged into a dead end by the estimate alone.',
    'DFS on a grid produces a winding, usually terrible path — a good reminder that "a path" ≠ "the best path".',
    'Count the expanded cells in the HUD: that number is the real cost difference between these algorithms.',
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
  acid: { fg: '#c9a45a', bg: 'rgba(201,164,90,0.10)', bd: 'rgba(201,164,90,0.32)' },
  probe: { fg: '#e3a83e', bg: 'rgba(227,168,62,0.10)', bd: 'rgba(227,168,62,0.30)' },
  flow: { fg: '#7fb6d9', bg: 'rgba(127,182,217,0.10)', bd: 'rgba(127,182,217,0.30)' },
  bad: { fg: '#e06a5e', bg: 'rgba(224,106,94,0.10)', bd: 'rgba(224,106,94,0.30)' },
  special: { fg: '#a98bd9', bg: 'rgba(169,139,217,0.10)', bd: 'rgba(169,139,217,0.30)' },
  ghost: { fg: '#b9b9b1', bg: 'rgba(255,255,255,0.03)', bd: 'rgba(255,255,255,0.12)' },
}
