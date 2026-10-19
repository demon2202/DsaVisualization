import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCustomData, initialCustomData } from '../customData'
import { ENTRIES } from '../registry'
import { createTree } from './tree'
import { createList } from './list'
import { createLinear } from './linear'
import { createHash } from './hash'
import { createHeap } from './heap'
import { createGraph } from './graph'
import { createGrid } from './pathfinding'
import { createSorter } from './sorting'

test('custom values load into trees, lists, linear structures and arrays', () => {
  const tree = createTree()
  applyCustomData(tree, { values: '8, 3, 10, 1' })
  assert.deepEqual(tree.values(), [1, 3, 8, 10])
  assert.throws(() => applyCustomData(tree, { values: '1, 1, 2' }), /unique/)

  const shapedTree = createTree()
  ;[48, 27, 68, 15, 35, 55, 79, 22, 31, 62, 9, 44].forEach((value) => shapedTree.silentInsert(value))
  const originalShape = shapedTree.snapshot().nodes.map(({ value, pos }) => [value, pos])
  const draft = initialCustomData(shapedTree)
  applyCustomData(shapedTree, draft)
  assert.deepEqual(shapedTree.snapshot().nodes.map(({ value, pos }) => [value, pos]), originalShape)

  const list = createList()
  applyCustomData(list, { values: '7, 2, 9' })
  assert.deepEqual(list.values, [7, 2, 9])

  const queue = createLinear('queue')
  applyCustomData(queue, { values: 'red, green, blue' })
  assert.deepEqual(queue.values, ['red', 'green', 'blue'])

  const sorter = createSorter([4, 2, 1])
  applyCustomData(sorter, { values: '8, 1, 5' })
  assert.deepEqual(sorter.array, [8, 1, 5])
})

test('custom hash keys are validated before the existing table is cleared', () => {
  const hash = createHash({ capacity: 5, mode: 'probing' })
  hash.silentInsert(4)
  assert.throws(() => applyCustomData(hash, { values: '1, 1' }), /unique/)
  assert.deepEqual(hash.keys(), [4])

  applyCustomData(hash, { values: '2, 7, 12' })
  assert.deepEqual(hash.keys(), [2, 7, 12])
})

test('custom heap data is heapified and graph data preserves weighted links', () => {
  const heap = createHeap({ max: false })
  applyCustomData(heap, { values: '9, 3, 7, 1' })
  assert.equal(heap.values[0], 1)
  assert.equal(heap.values.length, 4)

  const graph = createGraph({ nodes: [], edges: [] })
  applyCustomData(graph, { values: 'A, B, C', edges: 'A-B:4\nB-C:2' })
  assert.deepEqual(graph.nodes.map((node) => node.value), ['A', 'B', 'C'])
  assert.deepEqual(graph.edges.map((edge) => edge.weight), [4, 2])
  assert.equal(graph.snapshot().stats.edges, 2)
})

test('custom grid data validates dimensions and sets start, goal and terrain', () => {
  const grid = createGrid(5, 3)
  applyCustomData(grid, { values: 'S..#.\n.mw..\n...G.' })
  assert.equal(grid.cells.length, 15)
  assert.equal(grid.start(), '0_0')
  assert.equal(grid.end(), '2_3')
  assert.equal(grid.cells.find((cell) => cell.id === '1_1').terrain, 'mud')
  assert.equal(grid.cells.find((cell) => cell.id === '1_2').terrain, 'water')

  assert.throws(() => applyCustomData(grid, { values: 'S..\n...\n...' }), /exactly one/)
  assert.equal(grid.cells.length, 15)
  assert.equal(grid.start(), '0_0')
})

test('every registered structure accepts its current data as a custom starting set', () => {
  for (const entry of ENTRIES) {
    const machine = entry.create()
    entry.seed?.(machine)
    const draft = initialCustomData(machine)
    assert.doesNotThrow(() => applyCustomData(machine, draft), entry.name)
    assert.ok(machine.snapshot())
  }
})
