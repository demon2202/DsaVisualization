/**
 * liveDemos.js — real runs for the editorial sections.
 *
 * The landing does not play a canned animation: every scroll-driven scene is
 * the output of the same engine the lab uses, built from a fresh machine so
 * the reader's own lab session is never touched. The story tree is seven
 * nodes, small enough to read at a glance and solve in a handful of moves.
 */
import { createTree } from '../../lib/structures/tree'

export const STORY_SEED = [50, 30, 70, 20, 40, 60, 80]

function makeTree() {
  const machine = createTree({ avl: false })
  STORY_SEED.forEach((v) => machine.silentInsert(v))
  return machine
}

/** a miss that throws away branches in four decisions */
export function bstSearchRun(value = 65) {
  const machine = makeTree()
  return { run: machine.search(value), value, seed: STORY_SEED, block: 'bstSearch' }
}

/** a leaf attached at the end of a seven-decision path */
export function bstInsertRun(value = 45) {
  const machine = makeTree()
  return { run: machine.insert(value), value, seed: STORY_SEED, block: 'bstInsert' }
}

/** only the visit + completion frames, so the reader sees the ascending order */
export function inorderRun() {
  const machine = makeTree()
  const raw = machine.traverse('in')
  const steps = (raw.steps || []).filter((s) => s.banner === 'IN-ORDER' || s.banner === 'DONE')
  return { run: { ...raw, steps }, seed: STORY_SEED, block: 'traverseIn' }
}

/** the hero keeps a single search looping on the same seven-node tree */
export function heroRun() {
  return bstSearchRun(65)
}
