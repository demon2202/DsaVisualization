/**
 * hash.js — hash table with separate chaining and linear probing.
 * The interesting part is made visible: the hash computation, the bucket it
 * lands in, and every collision that follows.
 */

const BUCKET_X = 2.15
const CHAIN_Y = -1.5

let seq = 0
const uid = () => `h${(++seq).toString(36)}`

export function createHash({ capacity = 11, mode = 'chaining' } = {}) {
  let buckets = Array.from({ length: capacity }, () => [])
  let entries = [] // { id, key, bucket, slot }
  let probes = 0

  const hash = (key) => ((key % capacity) + capacity) % capacity

  const bucketX = (i) => (i - (capacity - 1) / 2) * BUCKET_X

  function snap(o = {}) {
    const { states = {}, linkStates = {}, marks = {} } = o
    const nodes = []
    const links = []

    for (let i = 0; i < capacity; i++) {
      const bucketId = `bucket_${i}`
      nodes.push({
        id: bucketId,
        value: i,
        pos: [bucketX(i), 2.6, 0],
        state: states[bucketId] || 'base',
        plate: { w: BUCKET_X * 0.82, h: 0.42, d: 0.9 },
        sub: mode === 'chaining' ? `bucket ${i}` : `slot ${i}`,
      })
      if (mode === 'chaining') {
        buckets[i].forEach((en, k) => {
          nodes.push({
            id: en.id,
            value: en.key,
            pos: [bucketX(i), 2.6 + (k + 1) * CHAIN_Y, 0.15 * k],
            state: states[en.id] || 'visited',
            slot: k,
          })
          links.push({
            id: `${k === 0 ? bucketId : buckets[i][k - 1].id}->${en.id}`,
            from: k === 0 ? bucketId : buckets[i][k - 1].id,
            to: en.id,
            state: linkStates[en.id] || 'tree',
          })
        })
      } else {
        const en = buckets[i][0]
        if (en) {
          nodes.push({ id: en.id, value: en.key, pos: [bucketX(i), 2.6, 0], state: states[en.id] || 'visited', overlay: true })
        }
      }
    }

    return {
      nodes,
      links,
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: o.aux || null,
      stats: {
        entries: entries.length,
        capacity,
        loadFactor: +(entries.length / capacity).toFixed(2),
        bucketsUsed: buckets.filter((b) => b.length > 0).length,
        longestChain: Math.max(0, ...buckets.map((b) => b.length)),
        probes,
      },
    }
  }

  const hashNote = (key) => `${key} mod ${capacity} = ${hash(key)}`

  function insert(key) {
    const steps = []
    const k = Number(key)
    if (!Number.isFinite(k)) return { ok: false, error: 'Enter a number', steps }
    if (entries.some((e) => e.key === k)) return { ok: false, error: `${k} is already stored`, steps }
    const b = hash(k)
    probes = 0

    steps.push(
      snap({
        states: { [`bucket_${b}`]: 'probe' },
        note: `hash(${k}) = ${hashNote(k)} → bucket ${b}. The hash function turns an arbitrary key into an index in O(1).`,
        code: ['h.hash'],
        banner: `h(${k}) = ${b}`,
        aux: { kind: 'math', title: 'hash', items: [{ value: `${k} % ${capacity}`, state: 'probe' }, { value: '=', state: 'idle' }, { value: String(b), state: 'found' }] },
        focus: [bucketX(b), 2.6, 0],
      }),
    )

    if (mode === 'chaining') {
      if (buckets[b].length) {
        steps.push(
          snap({
            states: { [`bucket_${b}`]: 'probe', ...Object.fromEntries(buckets[b].map((e) => [e.id, 'reject'])) },
            note: `Bucket ${b} already holds ${buckets[b].map((e) => e.key).join(', ')} — a collision. Chaining does not move anything: it just appends to this bucket's list.`,
            code: ['h.collision', 'h.chain'],
            banner: 'COLLISION',
            aux: { kind: 'math', title: 'chain length', items: buckets[b].map((e) => ({ value: String(e.key), state: 'reject' })).concat([{ value: `+${k}`, state: 'insert' }]) },
          }),
        )
      } else {
        steps.push(snap({ states: { [`bucket_${b}`]: 'probe' }, note: `Bucket ${b} is empty — no collision, straight in.`, code: ['h.empty'] }))
      }
      const en = { id: uid(), key: k }
      buckets[b].push(en)
      entries.push({ ...en, bucket: b })
      steps.push(
        snap({
          states: { [en.id]: 'insert', [`bucket_${b}`]: 'found' },
          note: `Stored ${k} at bucket ${b}, chain position ${buckets[b].length - 1}. Load factor is now ${(entries.length / capacity).toFixed(2)}.`,
          code: ['h.store'],
          banner: 'STORED',
          focus: [bucketX(b), 2.6 + (buckets[b].length - 1) * CHAIN_Y, 0],
        }),
      )
    } else {
      let i = b
      let guard = 0
      while (buckets[i][0] && guard++ < capacity) {
        probes++
        steps.push(
          snap({
            states: { [`bucket_${i}`]: 'reject' },
            note: `Slot ${i} holds ${buckets[i][0].key} — collision. Linear probing steps to ${(i + 1) % capacity} and tries again. Clustering is why this gets slow at high load factors.`,
            code: ['h.probeHit', 'h.probeStep'],
            banner: `PROBE ${probes}`,
            focus: [bucketX(i), 2.6, 0],
          }),
        )
        i = (i + 1) % capacity
      }
      if (guard >= capacity) return { ok: false, error: 'Table is full', steps }
      const en = { id: uid(), key: k }
      buckets[i] = [en]
      entries.push({ ...en, bucket: i })
      steps.push(
        snap({
          states: { [en.id]: 'insert', [`bucket_${i}`]: 'found' },
          note: `Slot ${i} was free — ${k} is stored there after ${probes} probe${probes === 1 ? '' : 's'}. Notice it is no longer at its hash index, which is why lookups must re-walk the probe sequence.`,
          code: ['h.storeProbe'],
          banner: 'STORED',
          focus: [bucketX(i), 2.6, 0],
        }),
      )
    }
    return { ok: true, steps, summary: `Inserted ${k} → bucket ${b}` }
  }

  function find(key) {
    const steps = []
    const k = Number(key)
    if (!Number.isFinite(k)) return { ok: false, error: 'Enter a number', steps }
    const b = hash(k)
    probes = 0
    steps.push(snap({ states: { [`bucket_${b}`]: 'probe' }, note: `Look up ${k}: hash(${k}) = ${b}. Jump straight to that bucket — no scanning of the table.`, code: ['h.lookup'], banner: `h(${k}) = ${b}`, focus: [bucketX(b), 2.6, 0] }))

    if (mode === 'chaining') {
      const chain = buckets[b]
      for (let i = 0; i < chain.length; i++) {
        probes++
        const hit = chain[i].key === k
        steps.push(
          snap({
            states: { [chain[i].id]: hit ? 'found' : 'probe', [`bucket_${b}`]: 'probe' },
            note: hit ? `Chain position ${i} holds ${k} — found after ${probes} comparison${probes === 1 ? '' : 's'}.` : `Chain position ${i} holds ${chain[i].key}, not ${k} → keep walking the chain.`,
            code: hit ? ['h.chainHit'] : ['h.chainStep'],
            banner: hit ? 'HIT' : `COMPARE ${probes}`,
            focus: [bucketX(b), 2.6 + i * CHAIN_Y, 0],
          }),
        )
        if (hit) return { ok: true, steps, summary: `Found ${k} in ${probes} comparisons` }
      }
    } else {
      let i = b
      let guard = 0
      while (guard++ < capacity) {
        probes++
        const en = buckets[i][0]
        if (!en) {
          steps.push(snap({ states: { [`bucket_${i}`]: 'reject' }, note: `Slot ${i} is empty — since probing never leaves gaps inside a cluster, ${k} cannot be in the table.`, code: ['h.emptyMiss'], banner: 'MISS' }))
          return { ok: false, steps, summary: `${k} not found` }
        }
        const hit = en.key === k
        steps.push(snap({ states: { [en.id]: hit ? 'found' : 'probe', [`bucket_${i}`]: hit ? 'found' : 'probe' }, note: hit ? `Slot ${i} holds ${k} — found after ${probes} probe${probes === 1 ? '' : 's'}.` : `Slot ${i} holds ${en.key} → step to ${(i + 1) % capacity}.`, code: hit ? ['h.probeFound'] : ['h.probeStep2'], banner: hit ? 'HIT' : `PROBE ${probes}`, focus: [bucketX(i), 2.6, 0] }))
        if (hit) return { ok: true, steps, summary: `Found ${k} in ${probes} probes` }
        i = (i + 1) % capacity
      }
    }
    steps.push(snap({ note: `${k} is not in the table. Cost was still O(1) amortised — proportional to the chain length, not the table size.`, code: ['h.miss'], banner: 'MISS' }))
    return { ok: false, steps, summary: `${k} not found` }
  }

  function remove(key) {
    const steps = []
    const k = Number(key)
    if (!Number.isFinite(k)) return { ok: false, error: 'Enter a number', steps }
    const b = hash(k)
    const idx = buckets[b].findIndex((e) => e.key === k)
    if (idx === -1) return { ok: false, error: `${k} is not stored`, steps }
    const en = buckets[b][idx]
    steps.push(snap({ states: { [en.id]: 'remove', [`bucket_${b}`]: 'probe' }, note: `Found ${k} in bucket ${b}. Removing it ${mode === 'chaining' ? 'unlinks one node from the chain' : 'leaves a tombstone — probing relies on contiguous clusters, so a real gap would break future lookups'}.`, code: ['h.del'], banner: 'DELETE' }))
    buckets[b].splice(idx, 1)
    entries = entries.filter((e) => e.id !== en.id)
    steps.push(snap({ states: { [`bucket_${b}`]: 'found' }, note: `${k} gone. Load factor drops to ${(entries.length / capacity).toFixed(2)}.`, code: ['h.delDone'], banner: 'REMOVED' }))
    return { ok: true, steps, summary: `Deleted ${k}` }
  }

  const api = {
    kind: 'hash',
    get mode() {
      return mode
    },
    resize() {
      const steps = []
      const oldCap = capacity
      const keys = entries.map((e) => e.key)
      const before = (keys.length / capacity).toFixed(2)
      steps.push(
        snap({
          note: `Load factor ${before}. Past ~0.75 chains get long, so allocate ${oldCap * 2 + 1} buckets and rehash every key — indices depend on capacity, so nothing can be moved lazily.`,
          code: ['h.resize'],
          banner: 'REHASH',
        }),
      )
      capacity = oldCap * 2 + 1
      buckets = Array.from({ length: capacity }, () => [])
      entries = []
      steps.push(snap({ note: `Fresh table: ${capacity} empty buckets. Every stored key must find its new home.`, code: ['h.resize'] }))
      for (const k of keys) {
        const b = hash(k)
        let slot = b
        if (mode !== 'chaining') {
          while (buckets[slot][0]) slot = (slot + 1) % capacity
        }
        const en = { id: uid(), key: k }
        if (mode === 'chaining') buckets[b].push(en)
        else buckets[slot][0] = en
        entries.push({ ...en, bucket: slot })
        steps.push(
          snap({
            states: { [`bucket_${b}`]: 'probe', [en.id]: 'insert' },
            note: `${k} mod ${capacity} = ${b}${slot !== b ? ` (probe to ${slot})` : ''} — same key, new home.`,
            code: ['h.resize'],
            focus: [bucketX(b), 2.6, 0],
          }),
        )
      }
      steps.push(
        snap({
          note: `Rehash complete: ${keys.length} keys in ${capacity} buckets. Load factor ${before} → ${(keys.length / capacity).toFixed(2)}, and with it the expected chain length.`,
          code: ['h.resize'],
          banner: 'REHASHED',
        }),
      )
      return { ok: true, steps, summary: `Resized ${oldCap} → ${capacity}` }
    },
    get capacity() {
      return capacity
    },
    snapshot: () => snap({ note: 'Idle — insert keys and watch the hash function route them.' }),
    insert,
    find,
    remove,
    clear() {
      buckets = Array.from({ length: capacity }, () => [])
      entries = []
    },
    keys: () => entries.map((e) => e.key),
    silentInsert(k) {
      const key = Number(k)
      if (entries.some((e) => e.key === key)) return false
      const b = hash(key)
      const en = { id: uid(), key }
      if (mode === 'chaining') buckets[b].push(en)
      else {
        let i = b
        while (buckets[i][0]) i = (i + 1) % capacity
        buckets[i] = [en]
      }
      entries.push({ ...en, bucket: b })
      return true
    },
  }
  return api
}
