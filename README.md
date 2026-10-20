# STRUCTURE.

An interactive laboratory for data structures & algorithms — a complete redesign of
[demon2202/DsaVisualization](https://github.com/demon2202/DsaVisualization).

Not a demo reel. Every operation records a **timeline of complete snapshots** that you can play,
pause, scrub and step through, while the pseudocode highlights the exact lines being executed and
live metrics (comparisons, swaps, expansions, load factor, balance factor…) update per frame.

**Landing** → an editorial argument before it is a product page. The hero is a real binary search
tree running `search(65)`, drawn from the same snapshots the lab consumes and on screen at first
paint. A short factual “How it works” section and a typographic index follow, with one pinned,
scroll-scrubbed story in the middle — search, insert and an in-order walk over **one seven-node
tree**. The picture, the pseudocode, the counters and the caption all read the same recorded frame.

**Lab** → a single-viewport instrument. The stage owns the whole width; the lab controls and
notes live behind 44 px hover rails (`LAB`, `NOTES`) instead of permanently taking space.
Spatial models are drawn as a **2.5D SVG/DOM stage** — isometric slabs for lists, stacks, queues,
buckets and heap cells, circular nodes for trees, graphs and hash entries — with values printed at
a size that stays readable as the structure grows. Sorting gets a flat bar desk. One transport
scrubs exact frames; Now / Code / Learn explains them.

The lab panel opens on the current structure and its operations. **Change** swaps that same panel to
the full structure index; picking a structure returns to its operations, so the twelve-entry list
never sits above the composer. On phones the panel is a full-width drawer that closes on choice.

**Compare** → two sorts on one input, both drawn as the same flat bars, advanced in lockstep with
the engines' own counters side by side.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

Deployable as-is on Vercel/Netlify (Vite project, no env vars, no backend).

## Stack

| Layer     | Choice |
|-----------|--------|
| UI        | React 19 + Vite 8, Tailwind 4, `motion` for layout and panel choreography |
| Stage     | SVG + DOM — a single 2.5D renderer for every spatial structure; no WebGL, no model download |
| Motion    | Lenis for the landing document only; Motion `useScroll` drives the pinned story; all reduced-motion paths stay usable |
| State     | zustand store + a RAF timeline player; algorithm engines are plain JS modules |
| Type      | Schibsted Grotesk for interface and display, Fragment Mono for data and code — self-hosted |
| Art direction | true-black surfaces, warm bone ink, one signal orange; grotesk scale, hairline rules, rectangular controls, no glow/gradient/pill decoration |

## What's inside the lab

| Family   | Entries |
|----------|---------|
| Trees    | Binary Search Tree, AVL (rotations) |
| Linear   | Linked List, Stack, Queue, Deque |
| Hashing  | Chained hash set, Open addressing (linear probe) |
| Heaps    | Binary heap (insert / extract / heapify + array view) |
| Graphs   | Weighted graph — BFS, DFS, Dijkstra, Prim MST, editable nodes and weights |
| Arrays   | Sorting — bubble, selection, insertion, shell, merge, quick, heap |
| Grids    | Pathfinding — BFS, DFS, Dijkstra, Greedy, A* on paintable terrain (wall / mud / water) |

Every entry: seeded demo state, parameterised operations, per-frame narration, complexity table,
"Details" notes and real-world uses.

## Architecture

```
src/
  lib/structures/   algorithm engines (pure JS). Each mutation returns
                    { ok, steps, summary } where steps = absolute snapshots:
                    { nodes, links, aux, note, code[], banner, focus, stats }
  lib/registry.js   the 12 entries: ops, fields, complexity, facts, metrics
  lib/pseudocode.js symbolic pseudocode blocks (id | indent | text)
  lib/palette.js    one semantic colour language: orange = cursor,
                    lavender = restructure, steel = traversal, sage = settled, clay = removed
  state/lab.js      zustand store + RAF player (dwell per step, speed ramps)
  state/compare.js  two independent sorting runs over one shared input
  components/diagram/
                    SnapshotDiagram (2.5D SVG stage), BarViz (flat sorting bars)
  components/lab/   Topbar, hover-rail Sidebar, Inspector, OpsPanel, Transport,
                    StageChrome, ArrayStage, PracticePanel, GraphEdit
  components/landing/
                    Story (pinned three-chapter story), liveDemos (real runs), visuals
  pages/            Landing.jsx, Lab.jsx, Compare.jsx
  hooks/useLenis.js Lenis ↔ native scroll bridge, landing only
```

Because frames are absolute snapshots, **scrubbing backwards is exact** — no delta replay.

## Study features beyond the visuals

- **Deep links** — `#/lab/<entry>?op=…&a=…&f=…` replays a run and lands on the exact frame;
  sorting links also carry the input array, pathfinding links carry the painted grid.
  `#/compare` opens the comparison desk directly.
- **Build your own problem** — set custom starting data across the structures; graph: add nodes /
  edges and edit weights; grid: paint terrain and move start/goal; sorting: presets or your own
  comma-separated array.
- **Practice** — decision points in a real run: predict the next branch, get scored, review misses.
- **Compare desk** — two sorts on one input, lockstep playback, engine counters side by side;
  reachable from the sorting desk ("Compare two sorts").
- **Prefs persist** — playback speed and panel choices survive a reload (localStorage).

## Verification

```bash
npm run lint                 # eslint 9 flat config, 0 errors
npm test                     # 32 engine / custom-data / practice / compare tests
node tools/verify.mjs        # 49 real-browser checks
node tools/interact.mjs      # 15 checks: practice, paint, graph editing, lab panel flow, reduced motion
node tools/perf.mjs          # frame-rate sample on the heaviest screens
node tools/shots.mjs         # design-review captures in .review/ (dev tool, not shipped)
```

`verify.mjs` covers boot, insert timeline, autoplay, pause/resume, exact step forward/back,
narration match, seek, 40 rapid seeks, restart, speed, all 12 structures, seven family runs,
deep-link replay, graph drag/weight/delete, practice keyboard flow, compare lockstep, mobile
drawers, toast clearance, overflow at 1440/768/390, and console errors.

`interact.mjs` covers practice scoring, terrain painting, graph editing, the **Change → pick →
operations** panel flow, mobile drawers, and reduced motion.

## Controls

`space` play/pause · `←` `→` step · `r` restart · `e` jump to end · `f` reframe ·
`c` code · `i` notes · `p` practice · `1`–`4` answer · `Delete` remove a selected graph edge ·
`Esc` close/cancel. In graph edit mode, drag a node to move it and click an edge to edit its
weight; the arrow keys nudge a focused node. On the grid, switch on *paint terrain* and drag to
paint walls, mud or water, then re-run. The sorting desk is flat by design; the same transport
plays, steps and scrubs it.

## License

MIT — original project by demon2202; redesign keeps the same licence.
