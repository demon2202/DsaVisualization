/**
 * practice.js — retrieval practice derived from the timeline itself.
 *
 * A question is generated from two consecutive snapshots (current frame and
 * the one about to play), so it can never disagree with the engine: the
 * answer IS the next frame, and the explanation IS its narration. No
 * algorithm logic is duplicated here — only read from recorded states.
 *
 * Kinds, in preference order:
 *   swap    — sorting: which two values trade places next
 *   decide  — sorting compare frame: will this comparison swap? (yes / no)
 *   dir     — tree descent: go left, go right, or attach here?
 *   probe   — which value is examined / visited next
 *   expand  — grid/graph: which cell or node is expanded next
 *   code    — universal fallback: which pseudocode line runs next
 *
 * Decision kinds (swap / decide / dir / probe / expand) are the frames where
 * practice pauses: `code` frames are narration fillers, not decisions.
 */
import { mulberry } from './rng'

const HOT = ['probe', 'visit', 'swap', 'remove', 'insert', 'found', 'active', 'target', 'frontier']

function pick(rng, pool, n) {
  const copy = [...pool]
  const out = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0])
  return out
}

function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * @param {Array} steps recorded frames
 * @param {number} i current frame index (question asks about i+1)
 * @param {object} ctx { scene, lines } — scene for phrasing, lines = the op's
 *   pseudocode lines for the universal code-line question
 * @param {number} seed deterministic per frame so retries are stable
 */
export function makeQuestion(steps, i, ctx = {}, seed = 1) {
  if (!steps || i < 0 || i + 1 >= steps.length) return null
  const cur = steps[i]
  const next = steps[i + 1]
  const rng = mulberry(seed * 7919 + i * 104729)

  const curById = new Map(cur.nodes.map((n) => [n.id, n]))
  const became = next.nodes.filter((n) => {
    const c = curById.get(n.id)
    return c && HOT.includes(n.state) && !HOT.includes(c.state)
  })

  const options = []
  let answer = -1
  let prompt = ''
  let kind = ''

  // 1 — swaps (two nodes enter swap state together)
  const swaps = became.filter((n) => n.state === 'swap')
  if (swaps.length >= 2) {
    kind = 'swap'
    const pair = swaps.slice(0, 2).map((n) => n.value)
    prompt = 'Which two values trade places next?'
    const others = pick(
      rng,
      cur.nodes.filter((n) => !pair.includes(n.value)).map((n) => n.value),
      3,
    )
    const wrongs = others.map((v) => [pair[0], v])
    options.push({ label: `${pair[0]} ↔ ${pair[1]}` }, ...wrongs.map((w) => ({ label: `${w[0]} ↔ ${w[1]}` })))
    answer = 0
  }

  // 1b — compare decision: two probes now, swap or not in the next frame
  const probes = cur.nodes.filter((n) => n.state === 'probe')
  if (answer === -1 && ctx.scene === 'array' && probes.length === 2 && !swaps.length) {
    const [pa, pb] = probes
    const willSwap = next.nodes.some((n) => (n.id === pa.id || n.id === pb.id) && n.state === 'swap')
    kind = 'decide'
    prompt = `Compare ${pa.value} with ${pb.value} — will they swap?`
    options.push({ label: 'yes — out of order' }, { label: 'no — leave them' })
    answer = willSwap ? 0 : 1
  }

  // 1c — tree descent decision: left, right, or attach (BST order + real links)
  if (answer === -1 && ctx.scene === 'tree' && probes.length === 1) {
    const P = probes[0]
    const childLinks = (cur.links || []).filter((l) => l.from === P.id)
    const nextProbe = next.nodes.find((n) => n.state === 'probe' && n.id !== P.id)
    const attached = next.nodes.find(
      (n) => n.state === 'insert' && !curById.has(n.id) && (next.links || []).some((l) => l.from === P.id && l.to === n.id),
    )
    let correct = null
    if (attached) correct = 'attach here'
    else if (nextProbe && childLinks.some((l) => l.to === nextProbe.id)) {
      correct = Number(nextProbe.value) < Number(P.value) ? 'go left' : 'go right'
    }
    if (correct) {
      kind = 'dir'
      prompt = `At ${P.value}: where does the search go next?`
      const all = ['go left', 'go right', 'attach here']
      all.forEach((lab) => options.push({ label: lab }))
      answer = all.indexOf(correct)
    }
  }

  // 2 — probe / visit: single hottest new node
  if (answer === -1 && became.length >= 1) {
    const target = became[0]
    kind = ctx.scene === 'grid' || ctx.scene === 'graph' ? 'expand' : 'probe'
    prompt =
      kind === 'expand'
        ? 'Which cell or node is expanded next?'
        : 'Which value does the algorithm examine next?'
    const label = (n) => String(n.value)
    const dummies = pick(
      rng,
      cur.nodes.filter((n) => n.id !== target.id && label(n) !== label(target)).map(label),
      3,
    )
    options.push({ label: label(target) }, ...dummies.map((d) => ({ label: d })))
    answer = 0
  }

  // 3 — universal fallback: the next pseudocode line
  if (answer === -1) {
    if (!next.code?.length) return null
    kind = 'code'
    prompt = 'Which line executes next?'
    const lines = ctx.lines || []
    const right = next.code[0]
    const pool = lines.filter((l) => l.id !== right && l.text).slice(0, 12)
    const dummies = pick(rng, pool, 3)
    const textOf = (id) => lines.find((l) => l.id === id)?.text || id
    options.push({ label: textOf(right) }, ...dummies.map((d) => ({ label: d.text })))
    answer = 0
  }

  if (options.length < 2) return null
  const mixed = shuffle(rng, options.map((o, idx) => ({ ...o, right: idx === answer })))
  return {
    kind,
    prompt,
    options: mixed.map((o) => o.label),
    answer: mixed.findIndex((o) => o.right),
    explain: next.note || 'The next frame explains itself in the inspector.',
    frame: i + 1,
  }
}

/** decision kinds — the moments practice should pause and ask */
export const DECISION_KINDS = ['swap', 'decide', 'dir', 'probe', 'expand']
export const isDecision = (q) => !!q && DECISION_KINDS.includes(q.kind)

/**
 * The next frame index at or after `from` whose question is a real decision
 * (not a pseudocode filler). Returns -1 when the run has no more decisions.
 */
export function nextDecisionFrame(steps, from, ctx = {}, seed = 1) {
  if (!steps) return -1
  for (let j = Math.max(0, from); j < steps.length - 1; j++) {
    const q = makeQuestion(steps, j, ctx, seed)
    if (isDecision(q)) return j
  }
  return -1
}
