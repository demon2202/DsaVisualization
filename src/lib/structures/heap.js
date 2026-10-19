/**
 * heap.js — binary heap rendered twice at once: as a tree (the shape that
 * matters) and as the flat array underneath (the reason it is O(1) space).
 */

const LEVEL_Y = 2.15
const TREE_W = 15

let seq = 0
const uid = () => `p${(++seq).toString(36)}`

export function createHeap({ max = true } = {}) {
  let items = [] // { id, value }
  const better = (a, b) => (max ? a > b : a < b)

  const levelOf = (i) => Math.floor(Math.log2(i + 1))
  const posOf = (i) => {
    const lvl = levelOf(i)
    const inLevel = i - (2 ** lvl - 1)
    const count = Math.min(2 ** lvl, Math.max(items.length - (2 ** lvl - 1), 1))
    const width = TREE_W / Math.max(count, 1)
    return [(inLevel + 0.5) * width - TREE_W / 2, 4.6 - lvl * LEVEL_Y, lvl * 0.55]
  }
  const arrPos = (i) => [(i - (Math.max(items.length, 10) - 1) / 2) * 0.95, -6.6, 0]

  function snap(o = {}) {
    const { states = {}, arrStates = {}, links = {} } = o
    const nodes = items.map((it, i) => ({
      id: it.id,
      value: it.value,
      pos: posOf(i),
      state: states[it.id] || (i === 0 ? 'root' : 'base'),
      index: i,
    }))
    const auxNodes = items.map((it, i) => ({
      id: `arr_${it.id}`,
      value: it.value,
      pos: arrPos(i),
      state: arrStates[it.id] || states[it.id] || 'dim',
      tile: { w: 0.82, h: 0.62, d: 0.62 },
      sub: String(i),
    }))
    const edges = []
    items.forEach((it, i) => {
      const l = 2 * i + 1
      const r = 2 * i + 2
      if (l < items.length) edges.push({ id: `${it.id}->${items[l].id}`, from: it.id, to: items[l].id, state: links[`${it.id}->${items[l].id}`] || 'tree' })
      if (r < items.length) edges.push({ id: `${it.id}->${items[r].id}`, from: it.id, to: items[r].id, state: links[`${it.id}->${items[r].id}`] || 'tree' })
    })
    return {
      nodes: [...nodes, ...auxNodes],
      links: edges,
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: { kind: 'arrayrow', y: -6.6, ...(o.aux || {}) },
      stats: { size: items.length, root: items[0]?.value ?? null, levels: items.length ? levelOf(items.length - 1) + 1 : 0, ...(o.statExtra || {}) },
    }
  }

  function siftUp(i, steps, codeBase) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (!better(items[i].value, items[p].value)) {
        steps.push(snap({ states: { [items[i].id]: 'found', [items[p].id]: 'probe' }, note: `Parent ${items[p].value} is ${max ? '≥' : '≤'} child ${items[i].value} — heap property satisfied, stop sifting up.`, code: ['hu.stop'], focus: posOf(i) }))
        return
      }
      steps.push(snap({ states: { [items[i].id]: 'swap', [items[p].id]: 'swap' }, links: { [`${items[p].id}->${items[i].id}`]: 'swap' }, note: `Child ${items[i].value} beats parent ${items[p].value} → swap them. Index ${i} ↔ index ${p}.`, code: ['hu.swap'], banner: 'SIFT UP', focus: posOf(i) }))
      ;[items[i], items[p]] = [items[p], items[i]]
      i = p
    }
    steps.push(snap({ states: { [items[0].id]: 'found' }, note: `Reached the root — ${items[0].value} is now the ${max ? 'maximum' : 'minimum'}.`, code: ['hu.root'] }))
  }

  function siftDown(i, steps, codeBase) {
    const n = items.length
    while (true) {
      const l = 2 * i + 1
      const r = 2 * i + 2
      let b = i
      if (l < n && better(items[l].value, items[b].value)) b = l
      if (r < n && better(items[r].value, items[b].value)) b = r
      if (b === i) {
        steps.push(snap({ states: { [items[i].id]: 'found' }, note: `Index ${i} (${items[i].value}) is ${max ? '≥' : '≤'} both children — heap restored.`, code: ['hd.stop'], focus: posOf(i) }))
        return
      }
      steps.push(
        snap({
          states: { [items[i].id]: 'swap', [items[b].id]: 'swap' },
          links: { [`${items[Math.min(i, b)].id}->${items[Math.max(i, b)].id}`]: 'swap' },
          note: `Best child is at index ${b} (${items[b].value}). Swap it up with ${items[i].value} and keep sifting down.`,
          code: ['hd.swap'],
          banner: 'SIFT DOWN',
          focus: posOf(b),
        }),
      )
      ;[items[i], items[b]] = [items[b], items[i]]
      i = b
    }
  }

  function push(value) {
    const steps = []
    const v = Number(value)
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    const it = { id: uid(), value: v }
    items.push(it)
    steps.push(snap({ states: { [it.id]: 'insert' }, arrStates: { [it.id]: 'insert' }, note: `Place ${v} at the end of the array (index ${items.length - 1}). A heap is a complete binary tree, so new elements always go to the last free slot — that keeps it perfectly balanced.`, code: ['hp.place'], banner: 'INSERT', focus: posOf(items.length - 1) }))
    siftUp(items.length - 1, steps, 2)
    steps.push(snap({ note: `Heap holds ${items.length} values; the ${max ? 'max' : 'min'} is ${items[0].value}.`, code: ['hp.done'], banner: `${max ? 'MAX' : 'MIN'} = ${items[0].value}` }))
    return { ok: true, steps, summary: `push(${v}) · ${max ? 'max' : 'min'} ${items[0].value}` }
  }

  function pop() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Heap is empty', steps }
    const top = items[0]
    const last = items[items.length - 1]
    steps.push(snap({ states: { [top.id]: 'remove' }, note: `extract-${max ? 'max' : 'min'}() takes the root (${top.value}). The hole it leaves must be filled without breaking the shape.`, code: ['hx.take'], banner: 'EXTRACT', focus: posOf(0) }))
    if (items.length === 1) {
      items.pop()
      steps.push(snap({ note: `That was the only element — heap is now empty.`, code: ['hx.only'] }))
      return { ok: true, steps, summary: `pop() → ${top.value}`, value: top.value }
    }
    steps.push(snap({ states: { [last.id]: 'swap', [top.id]: 'remove' }, note: `Move the last element (${last.value}) into the root slot. Shape stays complete, but the heap property is almost certainly broken now.`, code: ['hx.last'], banner: 'LAST → ROOT' }))
    items[0] = last
    items.pop()
    steps.push(snap({ states: { [items[0].id]: 'probe' }, arrStates: { [items[0].id]: 'probe' }, note: `Root now holds ${items[0].value}. Sift it down until it beats both children.`, code: ['hx.sift'], focus: posOf(0) }))
    siftDown(0, steps, 8)
    steps.push(snap({ note: `Removed ${top.value}. New ${max ? 'max' : 'min'} is ${items[0]?.value ?? '—'}; ${items.length} values left. Doing this n times is exactly how heapsort works.`, code: ['hx.done'], banner: `${max ? 'MAX' : 'MIN'} = ${items[0]?.value ?? '—'}` }))
    return { ok: true, steps, summary: `pop() → ${top.value}`, value: top.value }
  }

  function peek() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Heap is empty', steps }
    steps.push(snap({ states: { [items[0].id]: 'probe' }, note: `The root is always the ${max ? 'maximum' : 'minimum'} — reading it is O(1), which is the whole point of a heap. Priority queues are built on this.`, code: ['hk.root'], banner: `${items[0].value}`, focus: posOf(0) }))
    return { ok: true, steps, summary: `peek() → ${items[0].value}` }
  }

  function heapify(values = []) {
    const steps = []
    if (!Array.isArray(values) || values.length === 0) return { ok: false, error: 'Heapify needs an array of numbers', steps }
    items = values.map((v) => ({ id: uid(), value: Number(v) }))
    steps.push(snap({ note: `Floyd's build-heap: start from the last parent (index ${Math.floor((items.length - 1) / 2)}) and sift each one down. Sifting from the bottom up is what makes this O(n), not O(n log n).`, code: ['hb.intro'], banner: 'BUILD' }))
    for (let i = Math.floor((items.length - 1) / 2); i >= 0; i--) {
      steps.push(snap({ states: { [items[i].id]: 'probe' }, note: `Sift down index ${i} (${items[i].value}). Indices above it are already valid heaps.`, code: ['hb.step'], focus: posOf(i) }))
      siftDown(i, steps, 18)
    }
    steps.push(snap({ states: { [items[0].id]: 'found' }, note: `Heap built in linear time: every parent is ${max ? '≥' : '≤'} its children. Root = ${items[0]?.value}.`, code: ['hb.done'], banner: 'HEAPIFIED' }))
    return { ok: true, steps, summary: `heapified ${items.length} values` }
  }

  const api = {
    kind: 'heap',
    get values() {
      return items.map((i) => i.value)
    },
    snapshot: () => snap({ note: 'Idle — push values, or heapify an array in one go.' }),
    push,
    pop,
    peek,
    heapify,
    clear() {
      items = []
    },
    seed(values) {
      items = values.map((v) => ({ id: uid(), value: Number(v) }))
    },
  }
  return api
}
