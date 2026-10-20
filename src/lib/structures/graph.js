/**
 * graph.js — weighted undirected graph with BFS, DFS, Dijkstra and Prim's MST.
 * Node positions are computed once with a deterministic force pass so the
 * layout is stable while algorithms run (only colours/states change).
 */

let seq = 0
const uid = () => `g${(++seq).toString(36)}`

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateGraph(nodeCount = 14, seed = 7) {
  const rng = mulberry32(seed)
  const count = Math.max(3, Math.min(26, nodeCount))
  const nodes = []
  const R = 9.5

  /* a golden-angle spiral is an even, deterministic starting arrangement */
  const pts = []
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963229728653
    const r = Math.sqrt((i + 0.6) / count) * R
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r })
  }

  const seen = new Set()
  const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
  const links = []

  /* connect each point to its nearest neighbour, then add secondary edges */
  for (let i = 0; i < count; i++) {
    const near = pts
      .map((p, j) => ({ j, d: dist2(pts[i], p) }))
      .filter((c) => c.j !== i)
      .sort((a, b) => a.d - b.d)
    for (const c of near.slice(0, 2)) {
      const k = pairKey(i, c.j)
      if (seen.has(k)) continue
      seen.add(k)
      links.push({ i, j: c.j })
    }
  }
  const extra = Math.floor(count * 0.45)
  for (let e = 0; e < extra; e++) {
    const i = Math.floor(rng() * count)
    const j = Math.floor(rng() * count)
    if (i === j) continue
    const k = pairKey(i, j)
    if (seen.has(k)) continue
    seen.add(k)
    links.push({ i, j })
  }

  /* Fruchterman–Reingold in the x/z plane, then a collision pass. The graph
     is read as a plan, so it stays flat; a shallow y jitter only catches the
     light. Deterministic for a given seed. */
  const area = (R * 2.05) ** 2
  const k = Math.sqrt(area / count)
  let temp = R * 0.9
  const disp = pts.map(() => ({ x: 0, z: 0 }))
  for (let iter = 0; iter < 420; iter++) {
    for (const d of disp) {
      d.x = 0
      d.z = 0
    }
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        let dx = pts[i].x - pts[j].x
        let dz = pts[i].z - pts[j].z
        let d = Math.hypot(dx, dz) || 0.01
        if (d < 0.2) {
          dx += (rng() - 0.5) * 0.4
          dz += (rng() - 0.5) * 0.4
          d = Math.hypot(dx, dz) || 0.2
        }
        const f = (k * k) / d
        disp[i].x += (dx / d) * f
        disp[i].z += (dz / d) * f
        disp[j].x -= (dx / d) * f
        disp[j].z -= (dz / d) * f
      }
    }
    for (const l of links) {
      let dx = pts[l.i].x - pts[l.j].x
      let dz = pts[l.i].z - pts[l.j].z
      const d = Math.hypot(dx, dz) || 0.01
      const f = (d * d) / k
      disp[l.i].x -= (dx / d) * f
      disp[l.i].z -= (dz / d) * f
      disp[l.j].x += (dx / d) * f
      disp[l.j].z += (dz / d) * f
    }
    for (let i = 0; i < count; i++) {
      const d = Math.hypot(disp[i].x, disp[i].z) || 1
      pts[i].x += (disp[i].x / d) * Math.min(d, temp)
      pts[i].z += (disp[i].z / d) * Math.min(d, temp)
    }
    temp = Math.max(0.12, temp * 0.985)
  }

  /* enforce a readable minimum gap between node bodies */
  const MIN = 3.1
  for (let pass = 0; pass < 90; pass++) {
    let moved = false
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pts[i].x - pts[j].x
        const dz = pts[i].z - pts[j].z
        const d = Math.hypot(dx, dz) || 0.001
        if (d >= MIN) continue
        moved = true
        const push = (MIN - d) * 0.52
        pts[i].x += (dx / d) * push
        pts[i].z += (dz / d) * push
        pts[j].x -= (dx / d) * push
        pts[j].z -= (dz / d) * push
      }
    }
    if (!moved) break
  }

  /* normalise into a comfortable disc and add the shallow depth */
  const cx = pts.reduce((a, p) => a + p.x, 0) / count
  const cz = pts.reduce((a, p) => a + p.z, 0) / count
  const maxR = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.z - cz)), 1)
  for (let i = 0; i < count; i++) {
    const scale = Math.min(1, R / maxR)
    nodes.push({
      id: uid(),
      value: String.fromCharCode(65 + (i % 26)),
      pos: [(pts[i].x - cx) * scale * 1.02, 0, (pts[i].z - cz) * scale * 1.02],
    })
  }

  const edges = links.map((l) => {
    const a = nodes[l.i]
    const b = nodes[l.j]
    const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2])
    return { id: pairKey(a.id, b.id), from: a.id, to: b.id, weight: Math.max(1, Math.round(d * 0.72)) }
  })

  return { nodes, edges }
}

export function createGraph(g = generateGraph()) {
  let { nodes, edges } = g
  const adj = () => {
    const m = new Map(nodes.map((n) => [n.id, []]))
    for (const e of edges) {
      m.get(e.from)?.push({ to: e.to, w: e.weight, id: e.id })
      m.get(e.to)?.push({ to: e.from, w: e.weight, id: e.id })
    }
    for (const [, list] of m) list.sort((a, b) => a.w - b.w)
    return m
  }
  const labelOf = (id) => nodes.find((n) => n.id === id)?.value || '?'

  function snap(o = {}) {
    const { states = {}, linkStates = {}, marks = {} } = o
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        value: n.value,
        pos: n.pos,
        state: states[n.id] || (marks.current === n.id ? 'probe' : 'base'),
        badge: marks.dist?.[n.id] !== undefined ? String(marks.dist[n.id]) : null,
      })),
      links: edges.map((e) => ({ id: e.id, from: e.from, to: e.to, state: linkStates[e.id] || 'idle', weight: e.weight })),
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: o.aux || null,
      stats: {
        nodes: nodes.length,
        edges: edges.length,
        density: +((2 * edges.length) / (nodes.length * (nodes.length - 1))).toFixed(2),
        ...(o.statExtra || {}),
      },
    }
  }

  const focusOf = (id) => nodes.find((n) => n.id === id)?.pos || null

  /* ── BFS ─────────────────────────────────────────────────────────────── */
  function bfs(startId) {
    const steps = []
    const A = adj()
    const order = [startId]
    const visited = new Set([startId])
    const queue = [startId]
    const parent = new Map()
    const linkStates = {}
    steps.push(snap({ states: { [startId]: 'found' }, note: `Start at ${labelOf(startId)}. BFS expands the oldest unvisited node; on unweighted graphs, first visit is shortest.`, code: ['bfs.init'], banner: 'SOURCE' }))

    while (queue.length) {
      const cur = queue.shift()
      steps.push(
        snap({
          states: Object.fromEntries([...visited].map((id) => [id, 'visited'])),
          marks: { current: cur },
          linkStates,
          note: `Dequeue ${labelOf(cur)} (depth ${order.indexOf(cur)}). Its unvisited neighbours go to the back of the queue.`,
          code: ['bfs.dequeue'],
          aux: { kind: 'queue', title: 'frontier', items: queue.map((id) => ({ value: labelOf(id), state: 'frontier' })) },
          focus: focusOf(cur),
        }),
      )
      const states = Object.fromEntries([...visited].map((id) => [id, 'visited']))
      states[cur] = 'visit'
      for (const { to, id } of A.get(cur) || []) {
        if (visited.has(to)) continue
        visited.add(to)
        queue.push(to)
        order.push(to)
        parent.set(to, cur)
        linkStates[id] = 'flow'
        steps.push(
          snap({
            states: { ...states, [to]: 'frontier' },
            linkStates,
            note: `${labelOf(to)} is unvisited → mark it, enqueue it, and light the edge ${labelOf(cur)}–${labelOf(to)}.`,
            code: ['bfs.enqueue'],
            aux: { kind: 'queue', title: 'frontier', items: queue.map((q) => ({ value: labelOf(q), state: q === to ? 'active' : 'frontier' })) },
            focus: focusOf(to),
          }),
        )
      }
    }
    const finalStates = Object.fromEntries([...visited].map((id) => [id, 'sorted']))
    steps.push(snap({ states: finalStates, linkStates, note: `BFS complete. Visit order: ${order.map(labelOf).join(' → ')}. The search expands in rings, so each first visit is a shortest path.`, code: ['bfs.done'], banner: `${visited.size}/${nodes.length} REACHED`, aux: { kind: 'sequence', title: 'visit order', items: order.map((id, i) => ({ value: labelOf(id), state: 'sorted', index: i })) } }))
    return { ok: true, steps, summary: `BFS from ${labelOf(startId)} · ${visited.size} nodes`, output: order.map(labelOf) }
  }

  /* ── DFS ─────────────────────────────────────────────────────────────── */
  function dfs(startId) {
    const steps = []
    const A = adj()
    const visited = new Set()
    const order = []
    const stack = [startId]
    const linkStates = {}
    steps.push(snap({ states: { [startId]: 'found' }, note: `Start at ${labelOf(startId)}. DFS goes deep before backtracking, using an explicit stack.`, code: ['dfs.init'], banner: 'SOURCE' }))

    while (stack.length) {
      const cur = stack.pop()
      if (visited.has(cur)) {
        steps.push(snap({ states: Object.fromEntries([...visited].map((id) => [id, 'visited'])), linkStates, note: `${labelOf(cur)} was already visited. Skip it.`, code: ['dfs.skip'], aux: { kind: 'stack', title: 'stack', items: stack.map((id) => ({ value: labelOf(id), state: 'frontier' })) } }))
        continue
      }
      visited.add(cur)
      order.push(cur)
      const states = Object.fromEntries([...visited].map((id) => [id, 'visited']))
      states[cur] = 'visit'
      steps.push(
        snap({
          states,
          linkStates,
          note: `Pop ${labelOf(cur)} and mark it visited: node ${order.length} in DFS order.`,
          code: ['dfs.visit'],
          aux: { kind: 'stack', title: 'stack', items: stack.map((id) => ({ value: labelOf(id), state: 'frontier' })) },
          focus: focusOf(cur),
        }),
      )
      const nbrs = (A.get(cur) || []).slice().reverse()
      for (const { to, id } of nbrs) {
        if (visited.has(to)) continue
        stack.push(to)
        linkStates[id] = 'probe'
        steps.push(
          snap({
            states: { ...states, [to]: 'frontier' },
            linkStates,
            note: `Push ${labelOf(to)} on the stack via edge ${labelOf(cur)}–${labelOf(to)}. It will be explored before anything shallower.`,
            code: ['dfs.push'],
            aux: { kind: 'stack', title: 'stack', items: stack.map((s) => ({ value: labelOf(s), state: s === to ? 'active' : 'frontier' })) },
            focus: focusOf(to),
          }),
        )
      }
    }
    steps.push(snap({ states: Object.fromEntries([...visited].map((id) => [id, 'sorted'])), linkStates, note: `DFS complete: ${order.map(labelOf).join(' → ')}. DFS goes deep; BFS goes wide.`, code: ['dfs.done'], banner: `${visited.size}/${nodes.length} REACHED`, aux: { kind: 'sequence', title: 'visit order', items: order.map((id) => ({ value: labelOf(id), state: 'sorted' })) } }))
    return { ok: true, steps, summary: `DFS from ${labelOf(startId)} · ${visited.size} nodes`, output: order.map(labelOf) }
  }

  /* ── DIJKSTRA ────────────────────────────────────────────────────────── */
  function dijkstra(startId) {
    const steps = []
    const A = adj()
    const dist = new Map(nodes.map((n) => [n.id, Infinity]))
    const prev = new Map()
    const done = new Set()
    dist.set(startId, 0)
    const linkStates = {}
    steps.push(snap({ states: { [startId]: 'found' }, marks: { dist: { [startId]: 0 } }, note: `Initialise: distance to ${labelOf(startId)} = 0, every other node = ∞. Dijkstra repeatedly locks in the closest unsettled node.`, code: ['dij.init'], banner: 'INIT' }))

    while (done.size < nodes.length) {
      let cur = null
      let best = Infinity
      for (const n of nodes) {
        if (!done.has(n.id) && dist.get(n.id) < best) {
          best = dist.get(n.id)
          cur = n.id
        }
      }
      if (cur === null) break
      done.add(cur)
      const states = Object.fromEntries([...done].map((id) => [id, 'sorted']))
      states[cur] = 'visit'
      steps.push(
        snap({
          states,
          linkStates,
          marks: { dist: Object.fromEntries(nodes.map((n) => [n.id, dist.get(n.id) === Infinity ? null : dist.get(n.id)])) },
          note: `Smallest unsettled distance: ${labelOf(cur)} at ${best}. With non-negative weights, this distance is final.`,
          code: ['dij.pick', 'dij.lock'],
          banner: `LOCK ${labelOf(cur)} = ${best}`,
          focus: focusOf(cur),
          aux: { kind: 'table', title: 'distances', columns: ['node', 'dist'], rows: nodes.map((n) => [n.value, dist.get(n.id) === Infinity ? '∞' : String(dist.get(n.id))]).filter((r) => r[1] !== '∞' || done.has(nodes.find((x) => x.value === r[0])?.id)) },
        }),
      )
      for (const { to, w, id } of A.get(cur) || []) {
        if (done.has(to)) continue
        const alt = dist.get(cur) + w
        const better = alt < dist.get(to)
        steps.push(
          snap({
            states,
            linkStates: { ...linkStates, [id]: better ? 'path' : 'probe' },
            marks: { dist: Object.fromEntries(nodes.map((n) => [n.id, dist.get(n.id) === Infinity ? null : dist.get(n.id)])) },
            note: `Relax edge ${labelOf(cur)}–${labelOf(to)} (weight ${w}): ${dist.get(cur)} + ${w} = ${alt} ${better ? `< ${dist.get(to) === Infinity ? '∞' : dist.get(to)} → improve and remember ${labelOf(cur)} as the predecessor.` : `≥ ${dist.get(to) === Infinity ? '∞' : dist.get(to)} → no improvement.`}`,
            code: better ? ['dij.relax', 'dij.improve'] : ['dij.relax'],
            aux: { kind: 'table', title: 'distances', columns: ['node', 'dist'], rows: nodes.map((n) => [n.value, dist.get(n.id) === Infinity ? '∞' : String(dist.get(n.id))]) },
          }),
        )
        if (better) {
          dist.set(to, alt)
          prev.set(to, cur)
          linkStates[id] = 'tree'
        }
      }
    }
    const target = nodes.find((n) => n.id !== startId && dist.get(n.id) < Infinity && dist.get(n.id) === Math.max(...nodes.map((n) => dist.get(n.id)).filter((d) => d < Infinity)))
    const pathLinks = {}
    const pathNodes = []
    if (target) {
      let c = target.id
      while (c) {
        pathNodes.unshift(c)
        const p = prev.get(c)
        if (p) pathLinks[`${p}|${c}`] = 'path'
        if (p) pathLinks[`${c}|${p}`] = 'path'
        c = p
      }
    }
    steps.push(
      snap({
        states: Object.fromEntries(pathNodes.map((id, i) => [id, i === pathNodes.length - 1 ? 'found' : 'sorted'])),
        linkStates: { ...linkStates, ...pathLinks },
        marks: { dist: Object.fromEntries(nodes.map((n) => [n.id, dist.get(n.id) === Infinity ? null : dist.get(n.id)])) },
        note: target ? `Shortest path ${labelOf(startId)} → ${labelOf(target.id)} costs ${dist.get(target.id)} and runs ${pathNodes.map(labelOf).join(' → ')}.` : `All reachable nodes settled.`,
        code: ['dij.done'],
        banner: 'SHORTEST PATHS',
        aux: { kind: 'table', title: 'final distances', columns: ['node', 'dist', 'via'], rows: nodes.map((n) => [n.value, dist.get(n.id) === Infinity ? '∞' : String(dist.get(n.id)), prev.get(n.id) ? labelOf(prev.get(n.id)) : '—']) },
      }),
    )
    return { ok: true, steps, summary: `Dijkstra from ${labelOf(startId)} · max dist ${Math.max(...[...dist.values()].filter((d) => d < Infinity))}`, output: pathNodes.map(labelOf) }
  }

  /* ── PRIM MST ────────────────────────────────────────────────────────── */
  function prim(startId) {
    const steps = []
    const A = adj()
    const inTree = new Set([startId])
    const linkStates = {}
    let total = 0
    steps.push(snap({ states: { [startId]: 'found' }, note: `Prim starts from ${labelOf(startId)} with an empty tree and grows it one cheapest edge at a time.`, code: ['prim.init'], banner: 'SEED' }))

    while (inTree.size < nodes.length) {
      let bestEdge = null
      for (const id of inTree) {
        for (const e of A.get(id) || []) {
          if (inTree.has(e.to)) continue
          if (!bestEdge || e.w < bestEdge.w) bestEdge = { ...e, from: id }
        }
      }
      if (!bestEdge) break
      steps.push(
        snap({
          states: Object.fromEntries([...inTree].map((id) => [id, 'sorted'])),
          linkStates: { ...linkStates, [bestEdge.id]: 'probe' },
          note: `Cheapest edge crossing the cut: ${labelOf(bestEdge.from)}–${labelOf(bestEdge.to)} with weight ${bestEdge.w}. Every other candidate is heavier.`,
          code: ['prim.cut', 'prim.min'],
          focus: focusOf(bestEdge.to),
        }),
      )
      inTree.add(bestEdge.to)
      linkStates[bestEdge.id] = 'path'
      total += bestEdge.w
      steps.push(
        snap({
          states: Object.fromEntries([...inTree].map((id) => [id, 'sorted'])),
          linkStates,
          note: `Add ${labelOf(bestEdge.to)} and the edge to the MST. Running cost: ${total}.`,
          code: ['prim.add'],
          banner: `COST ${total}`,
          statExtra: { mstCost: total, mstEdges: inTree.size - 1 },
        }),
      )
    }
    steps.push(snap({ states: Object.fromEntries([...inTree].map((id) => [id, 'found'])), linkStates, note: `Minimum spanning tree complete: ${inTree.size - 1} edges, total weight ${total}. It connects every node with the least possible cost and no cycles.`, code: ['prim.done'], banner: `MST = ${total}`, statExtra: { mstCost: total, mstEdges: inTree.size - 1 } }))
    return { ok: true, steps, summary: `MST cost ${total} over ${inTree.size - 1} edges`, output: total }
  }

  const api = {
    kind: 'graph',
    get nodes() {
      return nodes
    },
    get edges() {
      return edges
    },
    snapshot: () => snap({ note: 'Choose a start node and an algorithm.' }),
    bfs,
    dfs,
    dijkstra,
    prim,
    regenerate(count = 14, seed = Date.now() % 100000) {
      const g = generateGraph(count, seed)
      nodes = g.nodes
      edges = g.edges
      return api
    },
    loadData(labels, connections) {
      const radius = Math.max(4, labels.length * 0.48)
      const byLabel = new Map()
      nodes = labels.map((value, i) => {
        const id = uid()
        byLabel.set(value, id)
        const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2
        return { id, value, pos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] }
      })
      edges = connections.map(({ from, to, weight }) => {
        const a = byLabel.get(from)
        const b = byLabel.get(to)
        return { id: `${a}|${b}`, from: a, to: b, weight }
      })
      return api
    },
    labels: () => nodes.map((n) => ({ id: n.id, label: n.value })),
    addNode() {
      const a = Math.random() * Math.PI * 2
      const r = 4.5 + Math.random() * 5
      return api.addNodeAt(Math.cos(a) * r, (Math.random() - 0.5) * 2.6, Math.sin(a) * r)
    },
    addNodeAt(x, y, z) {
      const used = new Set(nodes.map((n) => n.value))
      let value = '?'
      for (let i = 0; i < 26; i++) {
        const c = String.fromCharCode(65 + i)
        if (!used.has(c)) { value = c; break }
      }
      nodes.push({ id: 'n' + Math.random().toString(36).slice(2, 8), value, pos: [x, y, z] })
      return api
    },
    moveNode(id, x, y, z) {
      const n = nodes.find((n) => n.id === id)
      if (!n) return false
      n.pos = [x, y, z]
      /* edges that were auto-weighted by distance keep meaning after a move */
      for (const e of edges) {
        if (e.from === id || e.to === id) {
          const a = nodes.find((n) => n.id === e.from)
          const b = nodes.find((n) => n.id === e.to)
          e.weight = Math.max(1, Math.round(Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2])))
        }
      }
      return true
    },
    removeEdge(id) {
      const i = edges.findIndex((e) => e.id === id)
      if (i < 0) return false
      edges.splice(i, 1)
      return true
    },
    setWeight(id, w) {
      const e = edges.find((e) => e.id === id)
      if (!e) return false
      e.weight = Math.max(1, Math.min(99, Math.round(Number(w) || 1)))
      return true
    },
    addEdge(from, to, w = 1 + Math.floor(Math.random() * 9)) {
      if (!from || !to || from === to) return false
      const dupe = edges.some((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))
      if (dupe || !nodes.some((n) => n.id === from) || !nodes.some((n) => n.id === to)) return false
      edges.push({ id: 'e' + Math.random().toString(36).slice(2, 8), from, to, weight: w })
      return true
    },
  }
  return api
}
