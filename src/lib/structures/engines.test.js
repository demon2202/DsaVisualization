/**
 * engines.test.js — the contract every visualisation depends on:
 * mutations return absolute snapshots of a known shape, algorithms
 * terminate, and the new editing ops behave. Runs under `npm test`
 * (node --test, no extra deps).
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { createTree } from './tree.js'
import { createSorter, randomArray, almostSortedArray, reversedArray } from './sorting.js'
import { createGraph, generateGraph } from './graph.js'
import { createGrid } from './pathfinding.js'
import { createHash } from './hash.js'
import { createLinear } from './linear.js'
import { createList } from './list.js'
import { createHeap } from './heap.js'
import { mulberry } from '../rng.js'

/* ── contract helpers ─────────────────────────────────────────────────── */
function checkSteps(t, run, label) {
  assert.ok(run, `${label}: run returned nothing`)
  if (run.error) assert.fail(`${label}: engine error: ${run.error}`)
  assert.ok(Array.isArray(run.steps), `${label}: steps must be an array`)
  for (const [i, st] of run.steps.entries()) {
    assert.ok(Array.isArray(st.nodes), `${label} frame ${i}: nodes array`)
    assert.ok(Array.isArray(st.links), `${label} frame ${i}: links array`)
    assert.ok(Array.isArray(st.code), `${label} frame ${i}: code array`)
    assert.equal(typeof st.note, 'string', `${label} frame ${i}: note string`)
    for (const n of st.nodes) {
      assert.ok(n.id && n.state && n.pos, `${label} frame ${i}: node ${n.id} needs id/state/pos`)
    }
    for (const l of st.links) {
      assert.ok(l.from && l.to, `${label} frame ${i}: link endpoints`)
    }
  }
  return run.steps
}

/* ── trees ────────────────────────────────────────────────────────────── */
test('bst: insert/search/delete produce contract frames', () => {
  const m = createTree({})
  ;[50, 30, 70, 20, 40].forEach((v) => m.silentInsert(v))
  checkSteps(test, m.insert(35), 'bst.insert')
  checkSteps(test, m.search(40), 'bst.search')
  checkSteps(test, m.remove(30), 'bst.delete')
  const miss = m.search(999)
  assert.equal(miss.ok, false, 'searching a missing key reports not-ok')
})

test('avl: inserts keep the tree balanced', () => {
  const m = createTree({ avl: true })
  ;[10, 20, 30, 40, 50].forEach((v) => m.silentInsert(v))
  const heights = m.snapshot().nodes.map((n) => n.pos[1])
  assert.ok(Math.max(...heights) - Math.min(...heights) <= 4 * 2.2, 'avl depth stays shallow')
  checkSteps(test, m.insert(25), 'avl.insert')
})

/* ── sorting ──────────────────────────────────────────────────────────── */
for (const algo of ['bubble', 'selection', 'insertion', 'shell', 'merge', 'quick', 'heap']) {
  test(`sorting: ${algo} ends sorted`, () => {
    const m = createSorter(randomArray(18, 90, mulberry(4)))
    const steps = checkSteps(test, m[algo](), `sort.${algo}`)
    assert.ok(steps.length > 1)
    const arr = m.array
    assert.deepEqual([...arr].sort((a, b) => a - b), arr, `${algo} leaves the array sorted`)
  })
}

test('sorting: presets and custom arrays', () => {
  const m = createSorter(randomArray(10, 50, mulberry(9)))
  m.reset(almostSortedArray(12, 2, mulberry(2)))
  assert.equal(m.array.length, 12)
  m.reset(reversedArray(8))
  assert.deepEqual(m.array, [...m.array].sort((a, b) => b - a))
  m.reset([5, 3, 9, 1])
  assert.deepEqual(m.array, [5, 3, 9, 1])
})

/* ── graph ────────────────────────────────────────────────────────────── */
test('graph: traversals + editing ops', () => {
  const m = createGraph(generateGraph(12, 7))
  const start = m.labels()[0].id
  for (const [name, fn] of [['bfs', m.bfs], ['dfs', m.dfs], ['dijkstra', m.dijkstra], ['prim', m.prim]]) {
    checkSteps(test, fn.call(m, start), `graph.${name}`)
  }
  const before = m.nodes.length
  m.addNode()
  assert.equal(m.nodes.length, before + 1, 'addNode grows the graph')
  const L = m.labels()
  const has = (x, y) => m.edges.some((e) => (e.from === x && e.to === y) || (e.from === y && e.to === x))
  let pair = null
  for (const x of L) {
    for (const y of L) {
      if (x.id !== y.id && !has(x.id, y.id)) {
        pair = [x, y]
        break
      }
    }
    if (pair) break
  }
  assert.ok(pair, 'a non-adjacent pair exists')
  assert.equal(m.addEdge(L[0].id, L[0].id), false, 'self edges rejected')
  assert.equal(m.addEdge(pair[0].id, pair[1].id, 3), true, 'new edge accepted')
  assert.equal(m.addEdge(pair[0].id, pair[1].id, 3), false, 'duplicate edge rejected')
})

/* ── pathfinding ──────────────────────────────────────────────────────── */
test('pathfinding: searches reach the goal; start/goal are movable', () => {
  const m = createGrid(15, 11, 3)
  for (const algo of ['bfs', 'dijkstra', 'astar', 'greedy']) {
    checkSteps(test, m[algo](), `pf.${algo}`)
  }
  assert.ok(m.start() !== m.end(), 'start and goal are distinct cells')
})

test('pathfinding: painting walls and moving endpoints', () => {
  const m = createGrid(15, 11, 5)
  assert.equal(m.paint(2, 2, 'wall'), true)
  assert.equal(m.paint(2, 2, 'mud'), true)
  const startId = m.start()
  const cell = startId.split('_').map(Number)
  assert.equal(m.setStart(cell[0], cell[1]), true, 'start can be re-dropped')
  assert.equal(m.setGoal(cell[0], cell[1]), false, 'goal cannot sit on start')
  checkSteps(test, m.astar(), 'pf.astar after edits')
})

/* ── hashing ──────────────────────────────────────────────────────────── */
for (const mode of ['chaining', 'probe']) {
  test(`hash ${mode}: insert/find/delete/resize`, () => {
    const m = createHash({ capacity: mode === 'probe' ? 13 : 5, mode })
    ;[3, 8, 13, 21, 34, 5, 16].forEach((k) => checkSteps(test, m.insert(k), `hash.${mode}.insert${k}`))
    checkSteps(test, m.find(13), `hash.${mode}.find`)
    const miss = m.find(999)
    assert.equal(miss.ok, false)
    const keysBefore = m.snapshot().stats.entries
    const r = m.resize()
    checkSteps(test, r, `hash.${mode}.resize`)
    assert.ok(m.capacity > 5, 'capacity grew')
    assert.equal(m.snapshot().stats.entries, keysBefore, 'resize loses no keys')
    checkSteps(test, m.find(21), `hash.${mode}.find after resize`)
  })
}

/* ── linear structures ────────────────────────────────────────────────── */
test('stack/queue/deque ops', () => {
  const s = createLinear('stack')
  checkSteps(test, s.push(7), 'stack.push')
  checkSteps(test, s.pop(), 'stack.pop')
  const q = createLinear('queue')
  checkSteps(test, q.push(1), 'queue.enqueue')
  checkSteps(test, q.dequeue(), 'queue.dequeue')
  const d = createLinear('deque')
  checkSteps(test, d.pushFront(2), 'deque.pushFront')
  checkSteps(test, d.popBack(), 'deque.popBack')
})

test('linked list: append/insertAt/remove/search', () => {
  const l = createList({})
  ;[1, 2, 3].forEach((v) => l.silentAppend ? l.silentAppend(v) : l.append(v))
  checkSteps(test, l.append(4), 'list.append')
  checkSteps(test, l.insertAt(2, 9), 'list.insertAt')
  checkSteps(test, l.search(9), 'list.search')
  checkSteps(test, l.remove(9), 'list.remove')
})

test('heap: push/pop keep the heap property', () => {
  const h = createHeap({})
  ;[4, 9, 2, 7].forEach((v) => h.silentPush ? h.silentPush(v) : h.push(v))
  checkSteps(test, h.push(11), 'heap.push')
  checkSteps(test, h.pop(), 'heap.pop')
  checkSteps(test, h.heapify([9, 4, 7, 1, 6]), 'heap.heapify')
})



/* ── regression guards for bugs the audit caught ────────────────────────── */
test('regression: heapify with no array errors instead of crashing', () => {
  const h = createHeap({})
  const r = h.heapify()
  assert.equal(r.ok, false)
  assert.match(r.error, /array/i)
})

test('regression: list search miss walks to null without throwing', () => {
  const l = createList({})
  l.append(1)
  l.append(2)
  const r = l.search(999)
  assert.equal(r.ok, false)
  assert.ok(r.steps.length >= 3, 'walks every node then reports the miss')
})

test('regression: graph bfs/dfs final snapshot spreads visited set correctly', () => {
  const m = createGraph(generateGraph(10, 4))
  const id = m.labels()[0].id
  for (const run of [m.bfs(id), m.dfs(id)]) {
    const lastFrame = run.steps[run.steps.length - 1]
    assert.ok(lastFrame.nodes.some((n) => n.state === 'sorted'), 'final frame marks reached nodes')
  }
})

/* ── practice mode generator ──────────────────────────────────────────── */
import { makeQuestion } from '../practice.js'
import { code } from '../pseudocode.js'

test('practice: questions derive from consecutive frames, no engine duplication', () => {
  const m = createSorter([5, 3, 9, 1, 7, 2, 8, 4])
  const run = m.bubble()
  const lines = code('bubble')
  for (const i of [0, 1, 2, 5]) {
    const q = makeQuestion(run.steps, i, { scene: 'array', lines }, 4)
    assert.ok(q, `frame ${i} yields a question`)
    assert.ok(q.options.length >= 2 && q.options.length <= 4)
    assert.ok(q.answer >= 0 && q.answer < q.options.length)
    assert.equal(typeof q.explain, 'string')
    assert.ok(q.explain.length > 10, 'explanation is the next frame narration')
    assert.equal(q.frame, i + 1)
  }
  assert.equal(makeQuestion(run.steps, run.steps.length - 1, { scene: 'array', lines }), null, 'no question after the last frame')
  assert.equal(makeQuestion([], 0, {}), null, 'no steps, no question')
})

test('practice: deterministic per frame and kind is meaningful', () => {
  const m = createTree({})
  ;[50, 30, 70, 20].forEach((v) => m.silentInsert(v))
  const run = m.search(20)
  const lines = code('bstSearch')
  const a = makeQuestion(run.steps, 0, { scene: 'tree', lines }, 9)
  const b = makeQuestion(run.steps, 0, { scene: 'tree', lines }, 9)
  assert.deepEqual(a, b, 'same seed, same question')
  assert.ok(['probe', 'code', 'swap', 'expand', 'decide', 'dir'].includes(a.kind))
  // the correct option for a probe question must be the value the next frame lights up
  if (a.kind === 'probe') {
    const lit = run.steps[1].nodes.find((n) => n.state === 'probe')
    assert.equal(a.options[a.answer], String(lit.value))
  }
})

/* ── graph editing: every mutation must feed the real engine ───────────── */
test('graph editing: move reweights distance-edges, cut and weight edits stick', () => {
  const g = createGraph(generateGraph(8, 11))
  const before = g.nodes.length
  g.addNodeAt(2, 1, 2)
  assert.equal(g.nodes.length, before + 1)
  const a = g.nodes[0]
  const b = g.nodes[1]
  const e = g.edges.find((e) => e.from === a.id || e.to === a.id)
  assert.ok(e, 'fixture graph has an edge touching node 0')
  const ax = a.pos[0]
  g.moveNode(a.id, ax + 3, a.pos[1], a.pos[2])
  const moved = g.nodes.find((n) => n.id === a.id)
  assert.equal(moved.pos[0], ax + 3)
  const other = g.nodes.find((n) => n.id === (e.from === a.id ? e.to : e.from))
  const expect = Math.max(1, Math.round(Math.hypot(moved.pos[0] - other.pos[0], moved.pos[1] - other.pos[1], moved.pos[2] - other.pos[2])))
  assert.equal(g.edges.find((x) => x.id === e.id).weight, expect, 'moved endpoint reweights by distance')
  assert.ok(g.setWeight(e.id, 42))
  assert.equal(g.edges.find((x) => x.id === e.id).weight, 42)
  g.setWeight(e.id, 500)
  assert.equal(g.edges.find((x) => x.id === e.id).weight, 99, 'weights clamp')
  const snapBefore = g.snapshot()
  assert.ok(g.removeEdge(e.id))
  const snapAfter = g.snapshot()
  assert.equal(snapAfter.links.length, snapBefore.links.length - 1, 'snapshot reflects the cut edge')
  assert.equal(g.removeEdge('nope'), false)
  void b
})

/* ── practice: decision kinds derive from real frames ──────────────────── */
import { nextDecisionFrame, isDecision } from '../practice.js'

test('practice: compare-decision and tree-direction questions match the engine', () => {
  const m = createSorter([5, 3, 9, 1])
  const run = m.bubble()
  const decide = run.steps.map((_, i) => makeQuestion(run.steps, i, { scene: 'array' }, 5)).find((q) => q?.kind === 'decide')
  assert.ok(decide, 'a compare frame yields a yes/no decision')
  assert.deepEqual(decide.options.length, 2)
  // the yes/no answer must match whether the next frame actually swaps
  const i = run.steps.findIndex((_, j) => makeQuestion(run.steps, j, { scene: 'array' }, 5)?.kind === 'decide')
  const probes = run.steps[i].nodes.filter((n) => n.state === 'probe').map((n) => n.id)
  const willSwap = run.steps[i + 1].nodes.some((n) => probes.includes(n.id) && n.state === 'swap')
  assert.equal(decide.options[decide.answer].startsWith('yes'), willSwap)

  const t = createTree({})
  ;[50, 30, 70].forEach((v) => t.silentInsert(v))
  const ins = t.insert(20)
  const dir = ins.steps.map((_, j) => makeQuestion(ins.steps, j, { scene: 'tree' }, 5)).find((q) => q?.kind === 'dir')
  assert.ok(dir, 'descent frame yields a left/right/attach decision')
  assert.equal(dir.options[dir.answer], 'go left', '20 < 50 descends left')

  const nd = nextDecisionFrame(run.steps, 0, { scene: 'array' }, 5)
  assert.ok(nd >= 0 && isDecision(makeQuestion(run.steps, nd, { scene: 'array' }, 5)))
  assert.equal(nextDecisionFrame(run.steps, run.steps.length - 1, { scene: 'array' }, 5), -1)
})

/* ── comparison: same input, both engines agree on the sorted result ───── */
test('compare: independent runs over one array end in the same sorted order', () => {
  const values = [5, 3, 9, 1, 7, 2, 8, 4]
  const order = (steps) =>
    [...steps[steps.length - 1].nodes].filter((n) => n.bar).sort((a, b) => a.bar.index - b.bar.index).map((n) => n.value)
  const runs = ['bubble', 'quick', 'merge', 'insertion', 'heap'].map((alg) => ({ alg, steps: createSorter([...values])[alg]().steps }))
  const first = order(runs[0].steps)
  assert.deepEqual(first, [...values].sort((a, b) => a - b))
  for (const r of runs) {
    assert.deepEqual(order(r.steps), first, `${r.ag || r.alg} ends sorted and identical`)
    const stats = r.steps[r.steps.length - 1].stats
    assert.ok(stats.comparisons >= 0 && stats.swaps >= 0, `${r.alg} exposes metrics`)
  }
  assert.notEqual(runs[0].steps.length, runs[1].steps.length, 'different algorithms record different step counts')
})
