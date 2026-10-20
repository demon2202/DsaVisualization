/**
 * pathfinding.js — weighted grid with BFS, DFS, Dijkstra, A* and Greedy.
 * Terrain costs make Dijkstra/A* genuinely different from BFS instead of
 * producing identical pictures.
 */

export const TERRAIN = {
  open: { cost: 1, label: 'open' },
  mud: { cost: 4, label: 'mud' },
  water: { cost: 8, label: 'water' },
  wall: { cost: Infinity, label: 'wall' },
}

const CELL = 0.82

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createGrid(cols = 21, rows = 15, seed = 3) {
  const rng = mulberry32(seed)
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let terrain = 'open'
      const x = rng()
      if (x > 0.9) terrain = 'water'
      else if (x > 0.76) terrain = 'mud'
      cells.push({ id: `${r}_${c}`, r, c, terrain })
    }
  }
  // a couple of wall blocks so routes have to bend
  const wallBlocks = [
    { r0: 2, c0: 5, r1: 8, c1: 5 },
    { r0: 6, c0: 10, r1: 13, c1: 10 },
    { r0: 3, c0: 15, r1: 9, c1: 15 },
  ]
  for (const b of wallBlocks) {
    for (let r = b.r0; r <= Math.min(b.r1, rows - 1); r++) {
      for (let c = b.c0; c <= Math.min(b.c1, cols - 1); c++) {
        const cell = cells[r * cols + c]
        if (cell) cell.terrain = 'wall'
      }
    }
  }
  /*
   * Bounds-checked lookup. Without the check, c = -1 indexes the previous
   * row's last column (and c = cols the next row's first), so a "4-neighbour"
   * search could step across the map edge — a real correctness bug that made
   * paths teleport between opposite sides of the grid.
   */
  const at = (r, c) => (r >= 0 && r < rows && c >= 0 && c < cols ? cells[r * cols + c] : null)
  let start = at(Math.floor(rows / 2), 1)
  let end = at(Math.floor(rows / 2), cols - 2)
  start.terrain = 'open'
  end.terrain = 'open'

  /* the grid lies flat on the stage floor: columns on x, rows on z */
  const posOf = (cell) => [(cell.c - (cols - 1) / 2) * CELL, 0, (-cell.r + (rows - 1) / 2) * CELL]

  const neighbours = (cell) => {
    const out = []
    const dirs = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]
    for (const [dr, dc] of dirs) {
      const n = at(cell.r + dr, cell.c + dc)
      if (n && n.terrain !== 'wall') out.push(n)
    }
    return out
  }

  const costOf = (cell) => TERRAIN[cell.terrain].cost

  function snap(o = {}) {
    const { states = {}, marks = {} } = o
    return {
      nodes: cells.map((cell) => {
        let state = states[cell.id]
        if (!state) {
          if (cell.id === start.id) state = 'start'
          else if (cell.id === end.id) state = 'goal'
          else if (cell.terrain === 'wall') state = 'wall'
          else if (cell.terrain === 'mud') state = 'mud'
          else if (cell.terrain === 'water') state = 'water'
          else state = 'open'
        }
        const isEnd = state === 'start' || state === 'goal'
        const h =
          cell.terrain === 'wall' && state === 'wall'
            ? 0.74
            : state === 'path'
              ? 0.3
              : state === 'visited'
                ? 0.2
                : state === 'frontier'
                  ? 0.24
                  : isEnd
                    ? 0.26
                    : 0.06
        const [x, , z] = posOf(cell)
        return {
          id: cell.id,
          value: null,
          pos: [x, h / 2, z],
          state,
          /* the endpoints keep their letters even once the path paints them */
          glyph: cell.id === start.id ? 'S' : cell.id === end.id ? 'G' : null,
          tile: { w: CELL * 0.88, h, d: CELL * 0.88 },
        }
      }),
      links: [],
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: o.aux || null,
      stats: {
        cells: cols * rows,
        walls: cells.filter((c) => c.terrain === 'wall').length,
        visited: marks.visited || 0,
        frontier: marks.frontier || 0,
        pathLength: marks.pathLength ?? null,
        pathCost: marks.pathCost ?? null,
      },
    }
  }

  function runPath(algo) {
    const steps = []
    const gScore = new Map([[start.id, 0]])
    const came = new Map()
    const closed = new Set()
    const states = {}
    let visitedCount = 0

    const h = (cell) => Math.abs(cell.r - end.r) + Math.abs(cell.c - end.c)

    const pq = [] // simple array-based priority queue, fine at this scale
    const push = (cell, f) => pq.push({ cell, f })
    const popBest = () => {
      let bi = 0
      for (let i = 1; i < pq.length; i++) if (pq[i].f < pq[bi].f) bi = i
      return pq.splice(bi, 1)[0]
    }

    push(start, algo === 'astar' ? h(start) : algo === 'greedy' ? h(start) : 0)
    states[start.id] = 'start'
    steps.push(
      snap({
        states,
        note:
          algo === 'astar'
            ? `A* scores candidates with f = g + h, where g is cost so far and h is the Manhattan estimate. The estimate focuses the search.`
            : algo === 'greedy'
              ? `Greedy best-first uses only h. It heads for the goal quickly, without an optimality guarantee.`
              : algo === 'dijkstra'
                ? `Dijkstra expands by cost g, ignoring direction. Slower than A*, but optimal with weighted terrain.`
                : algo === 'dfs'
                  ? `DFS follows one direction until it hits a wall, then backtracks. It finds a path, not the shortest one.`
                  : `BFS expands in rings. The first time it reaches the goal is the fewest-steps path, but it ignores terrain cost.`,
        code: ['pf.init'],
        banner: algo.toUpperCase(),
      }),
    )

    let found = false
    let guard = 0
    while (pq.length && guard++ < 8000) {
      const { cell } = popBest()
      if (closed.has(cell.id)) continue
      closed.add(cell.id)
      visitedCount++
      if (cell.id !== start.id && cell.id !== end.id) states[cell.id] = 'visited'
      else if (cell.id === end.id) states[cell.id] = 'goal'

      if (cell.id === end.id) {
        found = true
        steps.push(snap({ states, note: `Goal ${algo === 'dfs' ? 'reached' : 'settled'} after ${visitedCount} expansions.`, code: ['pf.goal'], banner: 'GOAL', marks: { visited: visitedCount } }))
        break
      }

      for (const n of neighbours(cell)) {
        if (closed.has(n.id)) continue
        const tentative = gScore.get(cell.id) + costOf(n)
        if (tentative < (gScore.get(n.id) ?? Infinity)) {
          gScore.set(n.id, tentative)
          came.set(n.id, cell)
          const f = algo === 'astar' ? tentative + h(n) : algo === 'greedy' ? h(n) : algo === 'dijkstra' ? tentative : tentative
          push(n, f)
          if (n.id !== end.id) states[n.id] = 'frontier'
        }
      }
      if (visitedCount % (algo === 'dfs' ? 1 : 2) === 0 || visitedCount < 12) {
        steps.push(
          snap({
            states: { ...states },
            note: `Expand ${cell.terrain === 'open' ? 'open' : cell.terrain} cell at (${cell.c},${cell.r}). Cost so far ${gScore.get(cell.id)}. ${algo === 'astar' ? `Priority f = ${gScore.get(cell.id)} + ${h(cell)} = ${gScore.get(cell.id) + h(cell)}.` : algo === 'greedy' ? `Estimate h = ${h(cell)}.` : algo === 'dijkstra' ? 'Priority is accumulated cost.' : ''}`,
            code: algo === 'astar' ? ['pf.expand', 'pf.score'] : ['pf.expand'],
            marks: { visited: visitedCount, frontier: pq.length },
            aux: { kind: 'priority', title: algo === 'dfs' ? 'stack' : 'priority queue', items: pq.slice(0, 8).map((p) => ({ value: `${p.cell.c},${p.cell.r}`, state: 'frontier', sub: String(p.f) })) },
            focus: posOf(cell),
          }),
        )
      }
    }

    if (!found) {
      steps.push(snap({ states, note: `No path. The goal is walled off; ${visitedCount} cells were explored.`, code: ['pf.nopath'], banner: 'NO PATH', marks: { visited: visitedCount } }))
      return { ok: false, steps, summary: 'No path exists' }
    }

    /*
     * Reconstruct by ids. `came` stores the predecessor *cell*, so the walk
     * has to take its id; storing the object into the id list used to enter
     * the list and map lookup as different key types, which silently broke
     * the traced path and dropped the goal's own state.
     */
    const path = []
    let c = end.id
    while (c) {
      path.unshift(c)
      c = came.get(c)?.id
    }
    const startOfPath = path[0]
    if (startOfPath !== start.id) {
      return { ok: false, steps, summary: 'Path reconstruction failed' }
    }
    let cost = 0
    path.forEach((id, i) => {
      if (i > 0) {
        const cell = cells.find((x) => x.id === id)
        cost += costOf(cell)
      }
      if (id !== start.id && id !== end.id) states[id] = 'path'
      if (i % 2 === 0 || path.length < 40) {
        steps.push(
          snap({
            states: { ...states },
            note: i === path.length - 1 ? `Path traced from the goal to the start: ${path.length} cells, terrain cost ${cost}.` : `Follow the predecessor chain: ${path.length - i} cells left.`,
            code: ['pf.trace'],
            banner: i === path.length - 1 ? `${algo.toUpperCase()} PATH` : 'TRACE',
            marks: { visited: visitedCount, pathLength: path.length, pathCost: cost },
          }),
        )
      }
    })
    steps.push(
      snap({
        states,
        note: `Done. ${algo.toUpperCase()} expanded ${visitedCount} cells and produced a path of ${path.length} cells costing ${cost}. Fewer expansions means a more informed search.`,
        code: ['pf.done'],
        banner: `${visitedCount} EXPANDED`,
        marks: { visited: visitedCount, pathLength: path.length, pathCost: cost },
      }),
    )
    return { ok: true, steps, summary: `${algo.toUpperCase()}: ${path.length} cells, cost ${cost}, ${visitedCount} expanded`, path, cost, visitedCount }
  }

  const api = {
    kind: 'grid',
    get cols() {
      return cols
    },
    get rows() {
      return rows
    },
    loadRows(input) {
      const nextRows = Array.isArray(input) ? input : []
      const nextCols = nextRows[0]?.length || 0
      if (
        nextRows.length < 3 ||
        nextRows.length > 21 ||
        nextCols < 3 ||
        nextCols > 31 ||
        nextRows.some((row) => row.length !== nextCols || /[^.#mwSG]/.test(row))
      ) return false

      const starts = []
      const goals = []
      nextRows.forEach((row, r) => {
        for (let c = 0; c < nextCols; c++) {
          if (row[c] === 'S') starts.push([r, c])
          if (row[c] === 'G') goals.push([r, c])
        }
      })
      if (starts.length !== 1 || goals.length !== 1) return false

      cols = nextCols
      rows = nextRows.length
      cells.length = 0
      nextRows.forEach((row, r) => {
        for (let c = 0; c < cols; c++) {
          const token = row[c]
          const terrain = token === '#' ? 'wall' : token === 'm' ? 'mud' : token === 'w' ? 'water' : 'open'
          cells.push({ id: `${r}_${c}`, r, c, terrain })
        }
      })
      start = at(starts[0][0], starts[0][1])
      end = at(goals[0][0], goals[0][1])
      return true
    },
    get cells() {
      return cells
    },
    start: () => start.id,
    end: () => end.id,
    snapshot: () => snap({ note: 'Run a search.' }),
    bfs: () => runPath('bfs'),
    dfs: () => runPath('dfs'),
    dijkstra: () => runPath('dijkstra'),
    astar: () => runPath('astar'),
    greedy: () => runPath('greedy'),
    toggleWall(r, c) {
      const cell = at(r, c)
      if (!cell || cell.id === start.id || cell.id === end.id) return false
      cell.terrain = cell.terrain === 'wall' ? 'open' : 'wall'
      return true
    },
    paint(r, c, terrain) {
      const cell = at(r, c)
      if (!cell || cell.id === start.id || cell.id === end.id) return false
      cell.terrain = terrain
      return true
    },
    serialize() {
      const CH = { open: '.', mud: 'm', water: 'w', wall: '#' }
      return cells.map((c) => CH[c.terrain] || '.').join('') + '|' + start.id + '|' + end.id
    },
    load(str) {
      const [body, st, en] = String(str).split('|')
      const TERR = { '.': 'open', m: 'mud', w: 'water', '#': 'wall' }
      if (!body || body.length !== cells.length) return false
      for (let i = 0; i < cells.length; i++) cells[i].terrain = TERR[body[i]] || 'open'
      const sc = cells.find((c) => c.id === st)
      const ec = cells.find((c) => c.id === en)
      if (sc && ec && sc.id !== ec.id) {
        start.terrain = 'open'
        end.terrain = 'open'
        start = sc
        end = ec
        start.terrain = 'open'
        end.terrain = 'open'
      }
      return true
    },
    setStart(r, c) {
      const cell = at(r, c)
      if (!cell || cell.id === end.id) return false
      start.terrain = 'open'
      start = cell
      cell.terrain = 'open'
      return true
    },
    setGoal(r, c) {
      const cell = at(r, c)
      if (!cell || cell.id === start.id) return false
      end.terrain = 'open'
      end = cell
      cell.terrain = 'open'
      return true
    },
    clearWalls() {
      for (const cell of cells) {
        if (cell.id !== start.id && cell.id !== end.id) cell.terrain = 'open'
      }
    },
    reset(seed = Date.now() % 10000) {
      const g = createGrid(cols, rows, seed)
      cells.length = 0
      cells.push(...g.cells)
      start.terrain = 'open'
      end.terrain = 'open'
      return api
    },
  }
  return api
}
