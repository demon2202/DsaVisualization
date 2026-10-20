/**
 * list.js — singly and doubly linked list with visible pointers.
 * Positions come from the snapshot, so a reverse() makes every node glide
 * to its new slot instead of jumping.
 */

const STEP_MIN = 1.6
const STEP_MAX = 2.7

let seq = 0
const uid = () => `l${(++seq).toString(36)}`

export function createList({ doubly = false } = {}) {
  let nodes = [] // { id, value }

  /* the row only re-centres every third node, so appending does not slide the
     whole chain sideways on every single insertion */
  const capacity = (n) => Math.max(4, Math.ceil(n / 3) * 3)
  const stepFor = (n) => Math.max(STEP_MIN, Math.min(STEP_MAX, 17 / Math.max(4, n)))
  const posOf = (i, total = nodes.length) => [(i - (capacity(total) - 1) / 2) * stepFor(total), 0, 0]

  function snap(o = {}) {
    const { states = {}, linkStates = {}, pointers = {} } = o
    const out = []
    const links = []
    const step = stepFor(nodes.length)
    nodes.forEach((n, i) => {
      out.push({
        id: n.id,
        value: n.value,
        pos: posOf(i),
        state: states[n.id] || 'base',
        index: i,
        sub: String(i),
        inset: true,
        plate: { w: step * 0.64, h: 1.12, d: 1.12 },
        pointer: Object.entries(pointers).find(([, id]) => id === n.id)?.[0] || null,
      })
      if (i < nodes.length - 1) {
        const nxt = nodes[i + 1]
        links.push({ id: `${n.id}->${nxt.id}`, from: n.id, to: nxt.id, state: linkStates[`${n.id}->${nxt.id}`] || 'tree', arrow: true, z: doubly ? -0.35 : 0 })
        if (doubly) links.push({ id: `${nxt.id}<-${n.id}`, from: nxt.id, to: n.id, state: linkStates[`${nxt.id}<-${n.id}`] || 'idle', arrow: true, z: 0.35, dashed: true })
      }
    })
    if (nodes.length) {
      const lastX = posOf(nodes.length - 1)[0]
      out.push({ id: 'null_tail', value: 'null', pos: [lastX + step * 0.95, 0, 0], state: 'dim', ghost: true, small: true, inset: true, plate: { w: step * 0.6, h: 0.92, d: 0.92 } })
      links.push({ id: `tail->null`, from: nodes[nodes.length - 1].id, to: 'null_tail', state: 'idle', arrow: true, dashed: true })
      links.push({ id: 'head_pin->first', from: 'head_pin', to: nodes[0].id, state: 'pointer', arrow: true })
      links.push({ id: 'tail_pin->last', from: 'tail_pin', to: nodes[nodes.length - 1].id, state: 'pointer', arrow: true })
      out.push({ id: 'head_pin', value: 'head', pos: [posOf(0)[0], 1.95, 0], state: 'pointer', ghost: true, small: true, pin: true, inset: true, plate: { w: 1.16, h: 0.44, d: 0.44 } })
      out.push({ id: 'tail_pin', value: 'tail', pos: [lastX, 1.95, 0], state: 'pointer', ghost: true, small: true, pin: true, inset: true, plate: { w: 1.16, h: 0.44, d: 0.44 } })
    }
    return {
      nodes: out,
      links,
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: o.aux || null,
      stats: { length: nodes.length, head: nodes[0]?.value ?? null, tail: nodes[nodes.length - 1]?.value ?? null, ...(o.statExtra || {}) },
    }
  }

  const findIdx = (v) => nodes.findIndex((n) => n.value === Number(v))

  function append(value) {
    const steps = []
    const v = Number(value)
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    const nn = { id: uid(), value: v }
    if (!nodes.length) {
      nodes.push(nn)
      steps.push(snap({ states: { [nn.id]: 'insert' }, note: `List empty. ${v} becomes both head and tail; next is null.`, code: ['ll.first'], banner: 'HEAD', pointers: { cur: nn.id } }))
      return { ok: true, steps, summary: `append(${v})` }
    }
    steps.push(snap({ note: `Walk from head to the last node. Appending without a tail pointer is O(n).`, code: ['ll.walk'] }))
    nodes.forEach((n, i) => {
      if (i < nodes.length) steps.push(snap({ states: Object.fromEntries(nodes.slice(0, i + 1).map((x) => [x.id, 'visited'])), pointers: { cur: n.id }, note: `cur = ${n.value}. ${n === nodes[nodes.length - 1] ? 'next is null, so this is the tail.' : 'next is not null; keep walking.'}`, code: ['ll.step'], focus: posOf(i) }))
    })
    nodes.push(nn)
    steps.push(snap({ states: { [nn.id]: 'insert', [nodes[nodes.length - 2].id]: 'swap' }, linkStates: { [`${nodes[nodes.length - 2].id}->${nn.id}`]: 'active' }, pointers: { cur: nn.id }, note: `tail.next = newNode(${v}). One pointer write; no existing nodes move.`, code: ['ll.link'], banner: 'LINK', focus: posOf(nodes.length - 1) }))
    return { ok: true, steps, summary: `append(${v}) · length ${nodes.length}` }
  }

  function prepend(value) {
    const steps = []
    const v = Number(value)
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    const nn = { id: uid(), value: v }
    const oldHead = nodes[0]
    nodes.unshift(nn)
    steps.push(
      snap({
        states: { [nn.id]: 'insert', ...(oldHead ? { [oldHead.id]: 'swap' } : {}) },
        linkStates: oldHead ? { [`${nn.id}->${oldHead.id}`]: 'active' } : {},
        pointers: { cur: nn.id },
        note: oldHead ? `newNode.next = head (${oldHead.value}), then head = newNode. Two assignments; prepend is O(1).` : `List empty. ${v} becomes the head.`,
        code: ['ll.prep'],
        banner: 'O(1) PREPEND',
      }),
    )
    return { ok: true, steps, summary: `prepend(${v})` }
  }

  function insertAt(index, value) {
    const steps = []
    const v = Number(value)
    const i = Math.max(0, Math.min(nodes.length, Number(index) || 0))
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    const nn = { id: uid(), value: v }
    if (i === 0) return prepend(v)
    steps.push(snap({ note: `Insert at index ${i}: first walk to index ${i - 1}. A linked list has no random access.`, code: ['ll.atWalk'] }))
    for (let k = 0; k < i; k++) {
      steps.push(snap({ states: Object.fromEntries(nodes.slice(0, k + 1).map((x) => [x.id, 'visited'])), pointers: { cur: nodes[k].id }, note: `cur = index ${k} (${nodes[k].value})${k === i - 1 ? '; splice after this node.' : ''}`, code: ['ll.atStep'], focus: posOf(k) }))
    }
    const prev = nodes[i - 1]
    const next = nodes[i]
    nodes.splice(i, 0, nn)
    steps.push(
      snap({
        states: { [nn.id]: 'insert' },
        linkStates: { [`${prev.id}->${nn.id}`]: 'active', [`${nn.id}->${next.id}`]: 'active' },
        pointers: { prev: prev.id, cur: nn.id, next: next.id },
        note: `Splice: newNode.next = ${next.value}, then prev.next = newNode. Assign newNode.next first; otherwise the rest of the list is lost.`,
        code: ['ll.splice'],
        banner: 'SPLICE',
      }),
    )
    return { ok: true, steps, summary: `insert(${v}) at ${i}` }
  }

  function remove(value) {
    const steps = []
    const v = Number(value)
    const i = findIdx(v)
    if (i === -1) return { ok: false, error: `${v} is not in the list`, steps }
    if (i === 0) {
      const gone = nodes[0]
      steps.push(snap({ states: { [gone.id]: 'remove' }, pointers: { cur: gone.id }, note: `Delete the head: move head to head.next.`, code: ['ll.delHead'], banner: 'DELETE HEAD' }))
      nodes.shift()
      steps.push(snap({ note: `head now points at ${nodes[0]?.value ?? 'null'}. Length ${nodes.length}.`, code: ['ll.delHeadDone'] }))
      return { ok: true, steps, summary: `removed ${v}` }
    }
    for (let k = 0; k < i; k++) {
      steps.push(snap({ states: Object.fromEntries(nodes.slice(0, k + 1).map((x) => [x.id, 'visited'])), pointers: { prev: nodes[k - 1]?.id, cur: nodes[k].id }, note: k === i - 1 ? `prev = ${nodes[k].value}, the node before the target. Deletion needs the previous pointer.` : `Walk to index ${k}.`, code: ['ll.delWalk'], focus: posOf(k) }))
    }
    const target = nodes[i]
    const prev = nodes[i - 1]
    const next = nodes[i + 1]
    steps.push(snap({ states: { [target.id]: 'remove' }, pointers: { prev: prev.id, cur: target.id, next: next?.id }, note: `Set prev.next = target.next (${next ? next.value : 'null'}). The target is bypassed.`, code: ['ll.delBypass'], banner: 'BYPASS' }))
    nodes.splice(i, 1)
    steps.push(snap({ linkStates: { [`${prev.id}->${next?.id ?? 'null_tail'}`]: 'active' }, note: `Done. ${v} is removed; the chain is continuous. Length ${nodes.length}.`, code: ['ll.delDone'] }))
    return { ok: true, steps, summary: `removed ${v}` }
  }

  function search(value) {
    const steps = []
    const v = Number(value)
    steps.push(snap({ note: `Search starts at the head and walks. There is no indexing or binary search.`, code: ['ll.search'], pointers: { cur: nodes[0]?.id } }))
    for (let k = 0; k < nodes.length; k++) {
      const hit = nodes[k].value === v
      steps.push(
        snap({
          states: Object.fromEntries([...nodes.slice(0, k).map((x) => [x.id, 'visited']), ...Object.entries(hit ? { [nodes[k].id]: 'found' } : { [nodes[k].id]: 'probe' })]),
          pointers: { cur: nodes[k].id },
          note: hit ? `Index ${k}: ${nodes[k].value} === ${v}. Found after ${k + 1} hop${k === 0 ? '' : 's'}.` : `Index ${k}: ${nodes[k].value} ≠ ${v}; cur = cur.next.`,
          code: hit ? ['ll.hit'] : ['ll.searchStep'],
          banner: hit ? 'FOUND' : null,
          focus: posOf(k),
        }),
      )
      if (hit) return { ok: true, steps, summary: `found ${v} at index ${k}` }
    }
    steps.push(snap({ states: Object.fromEntries(nodes.map((x) => [x.id, 'visited'])), note: `Reached null after ${nodes.length} hops — ${v} is not in the list.`, code: ['ll.miss'], banner: 'NOT FOUND' }))
    return { ok: false, steps, summary: `${v} not found` }
  }

  function reverse() {
    const steps = []
    if (nodes.length < 2) return { ok: false, error: 'Need at least 2 nodes', steps }
    steps.push(snap({ note: `Three pointers: prev, cur, next. Walk once and reverse every link.`, code: ['ll.revInit'], pointers: { prev: null, cur: nodes[0].id } }))
    const reversed = []
    for (let k = 0; k < nodes.length; k++) {
      const cur = nodes[k]
      const next = nodes[k + 1]
      steps.push(snap({ states: { [cur.id]: 'probe', ...(next ? { [next.id]: 'aux' } : {}) }, pointers: { prev: reversed[reversed.length - 1]?.id, cur: cur.id, next: next?.id }, note: `Save next = ${next ? next.value : 'null'} before breaking the link; otherwise the rest of the list is unreachable.`, code: ['ll.revSave'], focus: posOf(k) }))
      reversed.unshift(cur)
      nodes = reversed.concat(nodes.slice(k + 1))
      steps.push(
        snap({
          states: Object.fromEntries(reversed.map((x) => [x.id, 'visited'])).valueOf(),
          linkStates: Object.fromEntries(reversed.slice(1).map((x, i) => [`${reversed[i].id}->${x.id}`, 'active'])),
          pointers: { cur: cur.id },
          note: `cur.next = prev. ${cur.value} now points backwards. Advance prev and cur one step.`,
          code: ['ll.revFlip'],
          banner: 'FLIP',
        }),
      )
    }
    steps.push(snap({ states: Object.fromEntries(nodes.map((x) => [x.id, 'sorted'])), note: `Reversed in one pass with three pointers and no extra memory. head is now ${nodes[0].value}.`, code: ['ll.revDone'], banner: 'REVERSED' }))
    return { ok: true, steps, summary: 'list reversed' }
  }

  const api = {
    kind: 'list',
    get values() {
      return nodes.map((n) => n.value)
    },
    snapshot: () => snap({ note: 'Choose an operation.' }),
    append,
    prepend,
    insertAt,
    remove,
    search,
    reverse,
    seed(values) {
      nodes = values.map((v) => ({ id: uid(), value: Number(v) }))
    },
    clear() {
      nodes = []
    },
  }
  return api
}
