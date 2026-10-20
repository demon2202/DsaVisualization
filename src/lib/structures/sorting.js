/**
 * sorting.js — array sorting engines that emit scrubbable snapshots.
 *
 * Bars live on the X axis at z = 0. Merge sort gets a second row at z = AUX_Z
 * so you literally watch elements fly out of the array into scratch space and
 * back again. Recursion narrows the "live" range: everything outside it dims.
 */

const AUX_Z = -4.2
const BASE_Y = -3.4
const MAX_W = 22

let seq = 0
const uid = () => `a${(++seq).toString(36)}`

export function makeArray(values) {
  return values.map((v) => ({ id: uid(), value: Number(v) }))
}

export function randomArray(n = 24, max = 100, rng = Math.random) {
  const out = []
  for (let i = 0; i < n; i++) out.push(Math.floor(rng() * max) + 3)
  return out
}

export function almostSortedArray(n = 24, swaps = 3, rng = Math.random) {
  const a = Array.from({ length: n }, (_, i) => Math.floor((i / n) * 95) + 4)
  for (let i = 0; i < swaps; i++) {
    const x = Math.floor(rng() * n)
    const y = Math.floor(rng() * n)
    ;[a[x], a[y]] = [a[y], a[x]]
  }
  return a
}

export function reversedArray(n = 24) {
  return Array.from({ length: n }, (_, i) => Math.floor(((n - i) / n) * 95) + 4)
}

export function createSorter(values) {
  let arr = makeArray(values)
  const maxV = Math.max(...arr.map((a) => a.value), 1)

  const norm = (v) => v / maxV

  /**
   * Build a snapshot.
   * @param {object} o states, marks{pivot,min,sorted:Set}, range[lo,hi], aux[], note, code
   */
  function snap(o = {}) {
    const { states = {}, marks = {}, range = null, aux = null, counters = {} } = o
    const n = arr.length
    /* the row keeps one footprint as the array grows: bars narrow, never spill */
    const step = Math.max(0.6, Math.min(1.08, MAX_W / Math.max(8, n)))
    const width = step * 0.66
    const x0 = -((n - 1) * step) / 2
    const nodes = arr.flatMap((it, i) => {
      /* a lifted element leaves a true hole: its slot is skipped (not re-indexed) so
       * the row keeps its spacing and the gap reads as the open slot. One element,
       * one slot, every frame. */
      if (!it) return []
      const inRange = !range || (i >= range[0] && i <= range[1])
      let state = states[it.id] || (inRange ? 'base' : 'dim')
      if (marks.sorted?.has(it.id) && !states[it.id]) state = 'sorted'
      return [
        {
          id: it.id,
          value: it.value,
          pos: [x0 + i * step, BASE_Y + norm(it.value) * 3.4, 0],
          state,
          label: 'below',
          bar: { h: norm(it.value) * 6.8 + 0.16, index: i, w: width },
          sub: n <= 24 ? String(i) : i % 2 === 0 ? String(i) : null,
          marks: {
            pivot: marks.pivot === it.id,
            min: marks.min === it.id,
            j: marks.j === it.id,
          },
        },
      ]
    })
    const auxNodes = (aux || []).map((it, i) => ({
      id: `aux_${it.id}`,
      value: it.value,
      pos: [x0 + i * step, BASE_Y + norm(it.value) * 3.4, AUX_Z],
      state: states[it.id] === 'swap' ? 'swap' : 'aux',
      bar: { h: norm(it.value) * 6.8 + 0.16, index: i, w: width },
      ghost: true,
    }))
    return {
      nodes: [...nodes, ...auxNodes],
      links: [],
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: {
        kind: 'arrayrow',
        y: BASE_Y,
        x0,
        x1: x0 + (n - 1) * step,
        label: 'array',
        scratch: aux ? { z: AUX_Z, label: 'scratch' } : null,
      },
      stats: {
        comparisons: counters.comparisons ?? 0,
        swaps: counters.swaps ?? 0,
        writes: counters.writes ?? 0,
        sorted: marks.sorted ? marks.sorted.size : 0,
        total: arr.length,
      },
    }
  }

  /* ── BUBBLE ──────────────────────────────────────────────────────────── */
  function bubble() {
    const steps = []
    let comparisons = 0
    let swaps = 0
    const sorted = new Set()
    for (let i = 0; i < arr.length - 1; i++) {
      let swapped = false
      for (let j = 0; j < arr.length - i - 1; j++) {
        comparisons++
        steps.push(
          snap({
            marks: { sorted, j: arr[j].id },
            states: { [arr[j].id]: 'probe', [arr[j + 1].id]: 'probe' },
            note: `Pass ${i + 1}: compare ${arr[j].value} with ${arr[j + 1].value}. ${arr[j].value > arr[j + 1].value ? 'Out of order → swap.' : 'In order → leave them.'}`,
            code: arr[j].value > arr[j + 1].value ? ['bub.cmp', 'bub.swap'] : ['bub.cmp'],
            counters: { comparisons, swaps },
          }),
        )
        if (arr[j].value > arr[j + 1].value) {
          ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
          swaps++
          swapped = true
          steps.push(
            snap({
              marks: { sorted },
              states: { [arr[j].id]: 'swap', [arr[j + 1].id]: 'swap' },
              note: `Swapped. The larger value bubbles one slot closer to the end.`,
              code: ['bub.swap'],
              banner: 'SWAP',
              counters: { comparisons, swaps },
            }),
          )
        }
      }
      sorted.add(arr[arr.length - 1 - i].id)
      steps.push(
        snap({
          marks: { sorted },
          note: `End of pass ${i + 1} — position ${arr.length - 1 - i} now holds its final value (${arr[arr.length - 1 - i].value}). No need to touch it again.`,
          code: ['bub.lock'],
          counters: { comparisons, swaps },
        }),
      )
      if (!swapped) {
        for (const it of arr) sorted.add(it.id)
        steps.push(snap({ marks: { sorted }, note: `A full pass with zero swaps. The array is sorted, so the run stops early; best case O(n).`, code: ['bub.early'], banner: 'EARLY EXIT', counters: { comparisons, swaps } }))
        break
      }
    }
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted in ${comparisons} comparisons and ${swaps} swaps.`, banner: 'SORTED', code: ['bub.done'], counters: { comparisons, swaps } }))
    return finish(steps, comparisons, swaps)
  }

  /* ── SELECTION ───────────────────────────────────────────────────────── */
  function selection() {
    const steps = []
    let comparisons = 0
    let swaps = 0
    const sorted = new Set()
    for (let i = 0; i < arr.length - 1; i++) {
      let minIdx = i
      steps.push(snap({ marks: { sorted, min: arr[i].id }, states: { [arr[i].id]: 'target' }, note: `Fill slot ${i}. Assume ${arr[i].value} is the smallest for now and scan everything to the right.`, code: ['sel.init'], counters: { comparisons, swaps } }))
      for (let j = i + 1; j < arr.length; j++) {
        comparisons++
        steps.push(
          snap({
            marks: { sorted, min: arr[minIdx].id },
            states: { [arr[j].id]: 'probe' },
            note: `Is ${arr[j].value} < current min ${arr[minIdx].value}? ${arr[j].value < arr[minIdx].value ? 'Yes: new minimum.' : 'No: keep scanning.'}`,
            code: arr[j].value < arr[minIdx].value ? ['sel.cmp', 'sel.min'] : ['sel.cmp'],
            counters: { comparisons, swaps },
          }),
        )
        if (arr[j].value < arr[minIdx].value) minIdx = j
      }
      if (minIdx !== i) {
        ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
        swaps++
        steps.push(snap({ marks: { sorted }, states: { [arr[i].id]: 'swap', [arr[minIdx].id]: 'swap' }, note: `Swap ${arr[i].value} into slot ${i}. That slot is final.`, code: ['sel.swap'], banner: 'SWAP', counters: { comparisons, swaps } }))
      } else {
        steps.push(snap({ marks: { sorted }, note: `${arr[i].value} was already the smallest — no swap needed.`, code: ['sel.noswap'], counters: { comparisons, swaps } }))
      }
      sorted.add(arr[i].id)
    }
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted. Selection sort makes n²/2 comparisons regardless of input order.`, banner: 'SORTED', code: ['sel.done'], counters: { comparisons, swaps } }))
    return finish(steps, comparisons, swaps)
  }

  /* ── INSERTION ───────────────────────────────────────────────────────── */
  function insertion() {
    const steps = []
    let comparisons = 0
    let swaps = 0
    const sorted = new Set([arr[0]?.id].filter(Boolean))
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i]
      steps.push(snap({ marks: { sorted }, states: { [key.id]: 'target' }, note: `Pick up ${key.value}. The left side is sorted; find its insertion point.`, code: ['ins.pick'], counters: { comparisons, swaps } }))
      arr[i] = null
      let j = i - 1
      while (j >= 0 && arr[j].value > key.value) {
        comparisons++
        steps.push(snap({ marks: { sorted }, states: { [arr[j].id]: 'probe', [key.id]: 'target' }, note: `${arr[j].value} > ${key.value} → shift ${arr[j].value} one slot right to make room.`, code: ['ins.shift'], counters: { comparisons, swaps } }))
        arr[j + 1] = arr[j]
        arr[j] = null
        swaps++
        j--
      }
      if (j >= 0) comparisons++
      arr[j + 1] = key
      for (let k = 0; k <= i; k++) sorted.add(arr[k].id)
      steps.push(snap({ marks: { sorted }, states: { [key.id]: 'insert' }, note: `Drop ${key.value} into index ${j + 1}. The sorted prefix grew by one.`, code: ['ins.place'], banner: 'PLACE', counters: { comparisons, swaps } }))
    }
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted. Insertion sort is O(n) on nearly sorted data; only out-of-place values shift.`, banner: 'SORTED', code: ['ins.done'], counters: { comparisons, swaps } }))
    return finish(steps, comparisons, swaps)
  }

  /* ── SHELL ───────────────────────────────────────────────────────────── */
  function shell() {
    const steps = []
    let comparisons = 0
    let swaps = 0
    const sorted = new Set()
    for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      steps.push(snap({ note: `Gap ${gap}: insertion-sort elements ${gap} apart. The final pass uses gap 1.`, code: ['sh.gap'], banner: `GAP ${gap}` }))
      for (let i = gap; i < arr.length; i++) {
        const tmp = arr[i]
        let j = i
        steps.push(snap({ states: { [tmp.id]: 'target' }, note: `Take ${tmp.value} at index ${i} and compare it with index ${Math.max(0, j - gap)}.`, code: ['sh.take'], counters: { comparisons, swaps } }))
        arr[i] = null
        while (j >= gap && arr[j - gap].value > tmp.value) {
          comparisons++
          arr[j] = arr[j - gap]
          arr[j - gap] = null
          swaps++
          steps.push(snap({ states: { [arr[j].id]: 'swap' }, note: `${arr[j].value} moved ${gap} slots right; the slot it left is open for the next comparison.`, code: ['sh.shift'], counters: { comparisons, swaps } }))
          j -= gap
        }
        arr[j] = tmp
        steps.push(snap({ states: { [tmp.id]: 'insert' }, note: `Place ${tmp.value} at index ${j}.`, code: ['sh.place'], counters: { comparisons, swaps } }))
      }
    }
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted. Shell sort's cost depends on the gap sequence.`, banner: 'SORTED', code: ['sh.done'], counters: { comparisons, swaps } }))
    return finish(steps, comparisons, swaps)
  }

  /* ── MERGE ───────────────────────────────────────────────────────────── */
  function merge() {
    const steps = []
    let comparisons = 0
    let writes = 0
    const sorted = new Set()

    const mergeRange = (lo, mid, hi) => {
      const left = arr.slice(lo, mid + 1)
      const right = arr.slice(mid + 1, hi + 1)
      const outside = [...arr.slice(0, lo), ...arr.slice(hi + 1)]
      const written = []
      let i = 0
      let j = 0
      const buf = []

      /*
       * Every element is in exactly one place per frame. The visible region
       * [lo..hi] is rebuilt as: what we have written back ++ the unconsumed
       * left half ++ the unconsumed right half — the two heads slide left as
       * their half is consumed, exactly the way a real merge consumes queues.
       * (The previous model assigned `arr[k] = picked` while `picked` still sat
       * at its original slot: 38 of 97 frames carried the same element twice,
       * which is both a false state and a React duplicate-key violation.)
       */
      const rebuild = () => {
        let p = 0
        for (const el of written) arr[lo + p++] = el
        for (let q = i; q < left.length; q++) arr[lo + p++] = left[q]
        for (let q = j; q < right.length; q++) arr[lo + p++] = right[q]
      }

      steps.push(
        snap({
          range: [lo, hi],
          states: Object.fromEntries([...left.map((x) => [x.id, 'probe']), ...right.map((x) => [x.id, 'visit'])]),
          note: `Merge [${lo}..${mid}] with [${mid + 1}..${hi}]. Both halves are sorted; interleave them.`,
          code: ['mg.merge'],
          banner: 'MERGE',
          counters: { comparisons, writes },
        }),
      )
      while (i < left.length && j < right.length) {
        comparisons++
        const pickLeft = left[i].value <= right[j].value
        rebuild()
        steps.push(
          snap({
            range: [lo, hi],
            aux: buf,
            states: { [left[i].id]: 'probe', [right[j].id]: 'visit' },
            note: `Compare heads: ${left[i].value} vs ${right[j].value}. Take the ${pickLeft ? 'left' : 'right'} one — it is the smallest remaining.`,
            code: pickLeft ? ['mg.cmp', 'mg.takeL'] : ['mg.cmp', 'mg.takeR'],
            counters: { comparisons, writes },
          }),
        )
        const picked = pickLeft ? left[i++] : right[j++]
        written.push(picked)
        buf.push(picked)
        rebuild()
        writes++
        steps.push(
          snap({
            range: [lo, hi],
            aux: buf,
            states: { [picked.id]: 'insert' },
            note: `Write ${picked.value} back into index ${lo + written.length - 1}.`,
            code: ['mg.write'],
            counters: { comparisons, writes },
          }),
        )
      }
      while (i < left.length) {
        const picked = left[i++]
        written.push(picked)
        buf.push(picked)
        rebuild()
        writes++
        steps.push(snap({ range: [lo, hi], aux: buf, states: { [picked.id]: 'insert' }, note: `Right half exhausted — drain the rest of the left half (${picked.value}).`, code: ['mg.drainL'], counters: { comparisons, writes } }))
      }
      while (j < right.length) {
        const picked = right[j++]
        written.push(picked)
        buf.push(picked)
        rebuild()
        writes++
        steps.push(snap({ range: [lo, hi], aux: buf, states: { [picked.id]: 'insert' }, note: `Left half exhausted — drain the rest of the right half (${picked.value}).`, code: ['mg.drainR'], counters: { comparisons, writes } }))
      }
      rebuild()
      void outside
      for (let x = lo; x <= hi; x++) sorted.add(arr[x].id)
      steps.push(snap({ range: [lo, hi], marks: { sorted }, note: `[${lo}..${hi}] is now one sorted block of ${hi - lo + 1} values.`, code: ['mg.block'], counters: { comparisons, writes } }))
    }

    const split = (lo, hi, depth = 0) => {
      if (lo >= hi) {
        steps.push(snap({ range: [lo, hi], states: { [arr[lo]?.id]: 'target' }, note: `Single element at index ${lo}. A one-element list is sorted; recursion stops.`, code: ['mg.base'], counters: { comparisons, writes } }))
        return
      }
      const mid = (lo + hi) >> 1
      steps.push(
        snap({
          range: [lo, hi],
          note: `${'  '.repeat(depth)}Split [${lo}..${hi}] at ${mid}. Recurse into both halves.`,
          code: ['mg.split'],
          banner: depth === 0 ? 'DIVIDE' : null,
          counters: { comparisons, writes },
        }),
      )
      split(lo, mid, depth + 1)
      split(mid + 1, hi, depth + 1)
      mergeRange(lo, mid, hi)
    }

    split(0, arr.length - 1)
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted with ${comparisons} comparisons and ${writes} writes. Merge sort uses ~n log n comparisons and O(n) scratch space.`, banner: 'SORTED', code: ['mg.done'], counters: { comparisons, writes } }))
    return finish(steps, comparisons, 0, writes)
  }

  /* ── QUICK ───────────────────────────────────────────────────────────── */
  function quick() {
    const steps = []
    let comparisons = 0
    let swaps = 0
    const sorted = new Set()

    const partition = (lo, hi) => {
      const pivot = arr[hi]
      let i = lo - 1
      steps.push(snap({ range: [lo, hi], marks: { pivot: pivot.id }, states: { [pivot.id]: 'pivot' }, note: `Partition [${lo}..${hi}] around pivot ${pivot.value} (last element). Everything ≤ pivot must end up left of it.`, code: ['qk.pivot'], banner: `PIVOT ${pivot.value}`, counters: { comparisons, swaps } }))
      for (let j = lo; j < hi; j++) {
        comparisons++
        const less = arr[j].value <= pivot.value
        steps.push(snap({ range: [lo, hi], marks: { pivot: pivot.id, j: arr[j].id }, states: { [arr[j].id]: 'probe', [pivot.id]: 'pivot' }, note: `Is ${arr[j].value} ≤ ${pivot.value}? ${less ? 'Yes → it belongs in the left region.' : 'No → skip it, the boundary stays put.'}`, code: less ? ['qk.cmp', 'qk.grow'] : ['qk.cmp'], counters: { comparisons, swaps } }))
        if (less) {
          i++
          if (i !== j) {
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
            swaps++
            steps.push(snap({ range: [lo, hi], marks: { pivot: pivot.id }, states: { [arr[i].id]: 'swap', [arr[j].id]: 'swap' }, note: `Grow the "≤ pivot" region to index ${i} and swap ${arr[i].value} into it.`, code: ['qk.swap'], banner: 'SWAP', counters: { comparisons, swaps } }))
          } else {
            steps.push(snap({ range: [lo, hi], marks: { pivot: pivot.id }, note: `Boundary grows to index ${i} — element already in the right region, no swap needed.`, code: ['qk.grow'], counters: { comparisons, swaps } }))
          }
        }
      }
      ;[arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]]
      swaps++
      steps.push(snap({ range: [lo, hi], marks: { pivot: pivot.id }, states: { [arr[i + 1].id]: 'insert' }, note: `Place the pivot at index ${i + 1}. Values to its left are ≤ ${pivot.value}; values to its right are >. The pivot is now final.`, code: ['qk.place'], banner: 'PIVOT LOCKED', counters: { comparisons, swaps } }))
      sorted.add(arr[i + 1].id)
      return i + 1
    }

    const qs = (lo, hi) => {
      if (lo > hi) return
      if (lo === hi) {
        sorted.add(arr[lo].id)
        steps.push(snap({ range: [lo, hi], marks: { sorted }, note: `Index ${lo} is alone — trivially in its final position.`, code: ['qk.base'], counters: { comparisons, swaps } }))
        return
      }
      const p = partition(lo, hi)
      qs(lo, p - 1)
      qs(p + 1, hi)
    }

    qs(0, arr.length - 1)
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted in ${comparisons} comparisons and ${swaps} swaps. Quicksort is in place and usually fastest; a bad pivot gives O(n²).`, banner: 'SORTED', code: ['qk.done'], counters: { comparisons, swaps } }))
    return finish(steps, comparisons, swaps)
  }

  /* ── HEAP ────────────────────────────────────────────────────────────── */
  function heapSort() {
    const steps = []
    let comparisons = 0
    let swaps = 0
    const sorted = new Set()

    const siftDown = (start, end, label) => {
      let rootIdx = start
      while (2 * rootIdx + 1 <= end) {
        let child = 2 * rootIdx + 1
        if (child + 1 <= end) {
          comparisons++
          steps.push(snap({ range: [0, end], states: { [arr[child].id]: 'probe', [arr[child + 1].id]: 'probe', [arr[rootIdx].id]: 'target' }, note: `${label}: pick the larger child — ${arr[child].value} vs ${arr[child + 1].value}.`, code: ['hs.child'], counters: { comparisons, swaps } }))
          if (arr[child].value < arr[child + 1].value) child++
        }
        comparisons++
        if (arr[rootIdx].value >= arr[child].value) {
          steps.push(snap({ range: [0, end], states: { [arr[rootIdx].id]: 'found' }, note: `${label}: parent ${arr[rootIdx].value} ≥ child ${arr[child].value} — heap property already holds here, stop sifting.`, code: ['hs.stop'], counters: { comparisons, swaps } }))
          return
        }
        steps.push(snap({ range: [0, end], states: { [arr[rootIdx].id]: 'swap', [arr[child].id]: 'swap' }, note: `${label}: parent ${arr[rootIdx].value} < child ${arr[child].value} → swap them and keep sifting down.`, code: ['hs.sift'], banner: 'SIFT', counters: { comparisons, swaps } }))
        ;[arr[rootIdx], arr[child]] = [arr[child], arr[rootIdx]]
        swaps++
        rootIdx = child
      }
    }

    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      steps.push(snap({ range: [0, arr.length - 1], states: { [arr[i].id]: 'target' }, note: `Build phase: sift down from index ${i} — the last parent with children. Leaves are already valid heaps of one.`, code: ['hs.build'], banner: 'BUILD HEAP', counters: { comparisons, swaps } }))
      siftDown(i, arr.length - 1, 'Build')
    }
    steps.push(snap({ range: [0, arr.length - 1], states: { [arr[0].id]: 'found' }, note: `Max-heap built: index 0 holds the largest value (${arr[0].value}). Read as a tree, every parent is ≥ its children.`, code: ['hs.heap'], banner: 'MAX-HEAP', counters: { comparisons, swaps } }))

    for (let end = arr.length - 1; end > 0; end--) {
      ;[arr[0], arr[end]] = [arr[end], arr[0]]
      swaps++
      sorted.add(arr[end].id)
      steps.push(snap({ range: [0, end - 1], marks: { sorted }, states: { [arr[end].id]: 'sorted' }, note: `Move the max (${arr[end].value}) to the end — that slot is final. Heap shrinks to ${end} elements.`, code: ['hs.extract'], banner: 'EXTRACT MAX', counters: { comparisons, swaps } }))
      siftDown(0, end - 1, 'Extract')
    }
    for (const it of arr) sorted.add(it.id)
    steps.push(snap({ marks: { sorted }, note: `Sorted. Heapsort is O(n log n) worst case in place, but has poor cache locality and is not stable.`, banner: 'SORTED', code: ['hs.done'], counters: { comparisons, swaps } }))
    return finish(steps, comparisons, swaps)
  }

  function finish(steps, comparisons, swaps = 0, writes = 0) {
    return {
      ok: true,
      steps,
      summary: `${comparisons} comparisons · ${swaps || writes} moves`,
      counters: { comparisons, swaps, writes },
    }
  }

  const api = {
    kind: 'array',
    get array() {
      return arr.map((a) => a.value)
    },
    reset(values) {
      arr = makeArray(values)
      return api
    },
    snapshot: () => snap({ note: 'Choose a sort.' }),
    bubble,
    selection,
    insertion,
    shell,
    merge,
    quick,
    heap: heapSort,
  }
  return api
}
