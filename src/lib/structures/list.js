/**
 * list.js — singly and doubly linked list with visible pointers.
 * Positions come from the snapshot, so a reverse() makes every node glide
 * to its new slot instead of jumping.
 */

const STEP = 2.55

let seq = 0
const uid = () => `l${(++seq).toString(36)}`

export function createList({ doubly = false } = {}) {
  let nodes = [] // { id, value }

  const posOf = (i) => [(i - (Math.max(nodes.length, 4) - 1) / 2) * STEP, 0, 0]

  function snap(o = {}) {
    const { states = {}, linkStates = {}, pointers = {} } = o
    const out = []
    const links = []
    nodes.forEach((n, i) => {
      out.push({
        id: n.id,
        value: n.value,
        pos: posOf(i),
        state: states[n.id] || 'base',
        index: i,
        pointer: Object.entries(pointers).find(([, id]) => id === n.id)?.[0] || null,
      })
      if (i < nodes.length - 1) {
        const nxt = nodes[i + 1]
        links.push({ id: `${n.id}->${nxt.id}`, from: n.id, to: nxt.id, state: linkStates[`${n.id}->${nxt.id}`] || 'tree', arrow: true, z: doubly ? -0.35 : 0 })
        if (doubly) links.push({ id: `${nxt.id}<-${n.id}`, from: nxt.id, to: n.id, state: linkStates[`${nxt.id}<-${n.id}`] || 'idle', arrow: true, z: 0.35, dashed: true })
      }
    })
    if (nodes.length) {
      out.push({ id: 'null_tail', value: 'null', pos: [posOf(nodes.length - 1)[0] + STEP, 0, 0], state: 'dim', ghost: true, small: true })
      links.push({ id: `tail->null`, from: nodes[nodes.length - 1].id, to: 'null_tail', state: 'idle', arrow: true, dashed: true })
      out.push({ id: 'head_pin', value: 'head', pos: [posOf(0)[0], 2.1, 0], state: 'root', ghost: true, small: true, pin: true })
      links.push({ id: `head->0`, from: 'head_pin', to: nodes[0].id, state: 'idle', dashed: true, thin: true })
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
      steps.push(snap({ states: { [nn.id]: 'insert' }, note: `List empty — ${v} becomes both head and tail, and its next pointer is null.`, code: ['ll.first'], banner: 'HEAD', pointers: { cur: nn.id } }))
      return { ok: true, steps, summary: `append(${v})` }
    }
    steps.push(snap({ note: `Walk from head to the last node. This is the cost of appending to a singly linked list without keeping a tail pointer: O(n).`, code: ['ll.walk'] }))
    nodes.forEach((n, i) => {
      if (i < nodes.length) steps.push(snap({ states: Object.fromEntries(nodes.slice(0, i + 1).map((x) => [x.id, 'visited'])), pointers: { cur: n.id }, note: `cur = ${n.value}. ${n === nodes[nodes.length - 1] ? 'next is null → this is the tail, stop here.' : 'next is not null → keep walking.'}`, code: ['ll.step'], focus: posOf(i) }))
    })
    nodes.push(nn)
    steps.push(snap({ states: { [nn.id]: 'insert', [nodes[nodes.length - 2].id]: 'swap' }, linkStates: { [`${nodes[nodes.length - 2].id}->${nn.id}`]: 'active' }, pointers: { cur: nn.id }, note: `tail.next = newNode(${v}). One pointer assignment — no shifting of existing nodes, which is exactly what an array cannot do.`, code: ['ll.link'], banner: 'LINK', focus: posOf(nodes.length - 1) }))
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
        note: oldHead ? `newNode.next = head (${oldHead.value}), then head = newNode. Two assignments, no traversal — prepend is O(1).` : `List empty — ${v} becomes the head.`,
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
    steps.push(snap({ note: `To insert at index ${i} we must first walk to index ${i - 1} — a linked list has no random access.`, code: ['ll.atWalk'] }))
    for (let k = 0; k < i; k++) {
      steps.push(snap({ states: Object.fromEntries(nodes.slice(0, k + 1).map((x) => [x.id, 'visited'])), pointers: { cur: nodes[k].id }, note: `cur = index ${k} (${nodes[k].value})${k === i - 1 ? ' — this is the node we splice after.' : ''}`, code: ['ll.atStep'], focus: posOf(k) }))
    }
    const prev = nodes[i - 1]
    const next = nodes[i]
    nodes.splice(i, 0, nn)
    steps.push(
      snap({
        states: { [nn.id]: 'insert' },
        linkStates: { [`${prev.id}->${nn.id}`]: 'active', [`${nn.id}->${next.id}`]: 'active' },
        pointers: { prev: prev.id, cur: nn.id, next: next.id },
        note: `Splice: newNode.next = ${next.value}, then prev.next = newNode. Order matters — assign the new node's pointer first or you lose the rest of the list.`,
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
      steps.push(snap({ states: { [gone.id]: 'remove' }, pointers: { cur: gone.id }, note: `Deleting the head: just move head to head.next. The old node becomes garbage.`, code: ['ll.delHead'], banner: 'DELETE HEAD' }))
      nodes.shift()
      steps.push(snap({ note: `head now points at ${nodes[0]?.value ?? 'null'}. Length ${nodes.length}.`, code: ['ll.delHeadDone'] }))
      return { ok: true, steps, summary: `removed ${v}` }
    }
    for (let k = 0; k < i; k++) {
      steps.push(snap({ states: Object.fromEntries(nodes.slice(0, k + 1).map((x) => [x.id, 'visited'])), pointers: { prev: nodes[k - 1]?.id, cur: nodes[k].id }, note: k === i - 1 ? `prev = ${nodes[k].value}, the node right before the target. Deletion needs the *previous* pointer, which is why we stop one short.` : `Walk to index ${k}.`, code: ['ll.delWalk'], focus: posOf(k) }))
    }
    const target = nodes[i]
    const prev = nodes[i - 1]
    const next = nodes[i + 1]
    steps.push(snap({ states: { [target.id]: 'remove' }, pointers: { prev: prev.id, cur: target.id, next: next?.id }, note: `Target is ${target.value}. Set prev.next = target.next (${next ? next.value : 'null'}) — the target is bypassed, not moved.`, code: ['ll.delBypass'], banner: 'BYPASS' }))
    nodes.splice(i, 1)
    steps.push(snap({ linkStates: { [`${prev.id}->${next?.id ?? 'null_tail'}`]: 'active' }, note: `Done — ${v} is out and the chain is continuous again. Length ${nodes.length}.`, code: ['ll.delDone'] }))
    return { ok: true, steps, summary: `removed ${v}` }
  }

  function search(value) {
    const steps = []
    const v = Number(value)
    steps.push(snap({ note: `Search has to start at the head and walk. There is no indexing and no binary search — the nodes are not in any sorted order in memory.`, code: ['ll.search'], pointers: { cur: nodes[0]?.id } }))
    for (let k = 0; k < nodes.length; k++) {
      const hit = nodes[k].value === v
      steps.push(
        snap({
          states: Object.fromEntries([...nodes.slice(0, k).map((x) => [x.id, 'visited']), ...Object.entries(hit ? { [nodes[k].id]: 'found' } : { [nodes[k].id]: 'probe' })]),
          pointers: { cur: nodes[k].id },
          note: hit ? `index ${k}: ${nodes[k].value} === ${v} — found after ${k + 1} hop${k === 0 ? '' : 's'}.` : `index ${k}: ${nodes[k].value} ≠ ${v} → cur = cur.next.`,
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
    steps.push(snap({ note: `Three pointers: prev, cur, next. We walk the list once and flip every arrow. Watch the nodes physically trade places as the order inverts.`, code: ['ll.revInit'], pointers: { prev: null, cur: nodes[0].id } }))
    const reversed = []
    for (let k = 0; k < nodes.length; k++) {
      const cur = nodes[k]
      const next = nodes[k + 1]
      steps.push(snap({ states: { [cur.id]: 'probe', ...(next ? { [next.id]: 'aux' } : {}) }, pointers: { prev: reversed[reversed.length - 1]?.id, cur: cur.id, next: next?.id }, note: `Save next = ${next ? next.value : 'null'} before we break the link, otherwise the rest of the list is unreachable.`, code: ['ll.revSave'], focus: posOf(k) }))
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
    steps.push(snap({ states: Object.fromEntries(nodes.map((x) => [x.id, 'sorted'])), note: `Reversed in one pass with three pointers and zero extra memory. head is now ${nodes[0].value}.`, code: ['ll.revDone'], banner: 'REVERSED' }))
    return { ok: true, steps, summary: 'list reversed' }
  }

  const api = {
    kind: 'list',
    get values() {
      return nodes.map((n) => n.value)
    },
    snapshot: () => snap({ note: 'Idle — build a list, then reverse or splice it.' }),
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
