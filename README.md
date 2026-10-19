# STRUCTURE.

An interactive 3D laboratory for data structures & algorithms — a complete redesign of
[demon2202/DsaVisualization](https://github.com/demon2202/DsaVisualization).

Not a demo reel: every operation records a **timeline of complete 3D snapshots** that you can
play, pause, scrub and step through, while the pseudocode highlights the exact lines being
executed and live metrics (compares, swaps, expansions, load factor, balance factor…) update
per frame.

**Landing** → the product performs: a two-tone first screen whose right half *is* the live
lab (type a value, it inserts into the real tree), a drag row of true-size interface panels,
proof modules, the syllabus as family tabs, and a gold closing field whose dialog carries
your run into the lab. Lenis + GSAP underneath.
**Lab** → full-viewport instrument: 12 structures, 40+ operations, orbitable WebGL stage,
inspector, transport bar, pseudocode panel.

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
| UI        | React 19 + Vite 8, Tailwind 4, `motion` (Framer) for panel choreography |
| 3D        | three.js + @react-three/fiber + drei, one custom ShaderMaterial (instanced icosahedra + boxes), postprocessing (bloom / chromatic aberration / vignette) |
| Motion    | GSAP + ScrollTrigger (landing), Lenis (inertia scrolling), spring/damp interpolation inside the render loop |
| State     | zustand store + a RAF timeline player; algorithm engines are plain JS modules |
| Type      | League Spartan (display), Figtree (text), JetBrains Mono (literal code only) — self-hosted |
| Art direction | dealt with `Leonxlnx/taste-skill` ("the product performs", warm black + gold); lint + real-browser inspector gate at 0 FAIL |

## What's inside the lab

| Family   | Entries |
|----------|---------|
| Trees    | Binary Search Tree, AVL (rotations) |
| Linear   | Linked List, Stack, Queue, Deque |
| Hashing  | Chained hash set, Open addressing (linear probe) |
| Heaps    | Binary heap (insert / extract / heapify + array view) |
| Graphs   | Weighted graph — BFS, DFS, Dijkstra, Prim MST |
| Arrays   | Sorting — bubble, selection, insertion, shell, merge, quick, heap |
| Grids    | Pathfinding — BFS, DFS, Dijkstra, Greedy, A* on paintable terrain (wall / mud / water) |

Every entry: seeded demo state, parameterised operations, per-frame narration, complexity
table, "worth knowing" notes and real-world uses.

## Architecture

```
src/
  lib/structures/   algorithm engines (pure JS). Each mutation returns
                    { ok, steps, summary } where steps = absolute snapshots:
                    { nodes, links, aux, note, code[], banner, focus, stats }
  lib/registry.js   the 12 entries: ops, fields, complexity, facts, metrics
  lib/pseudocode.js symbolic pseudocode blocks (id | indent | text)
  lib/palette.js    one semantic colour language: amber = compare,
                    violet = restructure, sky = traverse, acid = success, rose = remove
  state/lab.js      zustand store + RAF player (dwell per step, speed ramps)
  three/            Elements (2 InstancedMeshes + shader), Links (tubes/arrows/pulses),
                    Stage (camera rig, ground, environment, post FX)
  components/lab/   NavigationDock, OpsPanel, Inspector, Transport, CodePanel, Topbar
  pages/            Landing.jsx (scroll story), Lab.jsx (the instrument), Compare.jsx
  hooks/useLenis.js Lenis ↔ GSAP ticker bridge
```

Because frames are absolute snapshots, **scrubbing backwards is exact** — no delta replay.

## Study features beyond the visuals

- **Frame transcript** — every frame's narration listed in the inspector; click to jump.
- **Deep links** — `#/lab/<entry>` opens straight into any instrument; the URL follows you.
- **Prefs persist** — speed, quality, panel toggles survive a reload (localStorage).
- **PNG export** — camera button in the stage saves the current frame.
- **Build your own problem** — set custom starting data across the structures; graph: add
  nodes / edges; grid: paint terrain *and* move start/goal; sorting: presets or your own
  comma-separated array.
- **Tests** — `npm test` runs the engine, custom-data and motion tests.

## Controls

`space` play/pause · `←` `→` step · `r` restart · `e` end · `f` frame selection ·
`c` code panel · `i` inspector · drag = orbit · wheel = zoom · click node = target it ·
in Path: enable *paint terrain* and drag on the grid to sculpt walls/mud/water, then re-run.

## License

MIT — original project by demon2202; redesign keeps the same licence.
