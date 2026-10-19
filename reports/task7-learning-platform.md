# STRUCTURE → interactive learning platform · task 7 report

Commit `b657e70` on top of `25c7a5a`. Everything below is labelled **implemented / tested / suggested**.
Test evidence: `npm test` (node:test harness), `vite build`, and puppeteer runs against the real
rendered app (dev 5173 for DEV-only hooks, preview 4173 for production bundles). Screenshots in /tmp
were viewed, not just captured.

---

## 1. Audit findings (phase 1–2)

Foundation re-verified before touching anything (**tested**): HEAD clean at 25c7a5a, 23/23 tests,
build green, deep link `#/lab/bst?op=search&f=2` → frame 1/4, back-scrub to 0 exact, practice on +
question live, eco quality, zero console/page errors.

Learning gaps found, ranked by user value:

1. **Practice asked about states, not decisions.** Old questions ("what colour is node X") tested
   recall of the frame you were already looking at. The educational moment is *predicting the next
   operation* — will this pair swap, which way does the search descend, which frontier node locks next.
2. **No way to experiment on graphs.** The graph was read-only; Dijkstra/A* understanding needs
   "what if this edge were cheaper / this node moved".
3. **No side-by-side algorithm comparison.** "Why is quicksort faster than bubble?" was answered only
   by prose, never by two honest runs on one input.
4. **Complexity table had no context.** avg/worst columns with no best case, no note on the running
   op, and nothing warning that O-notation ≠ seconds.
5. Minor: practice feedback had no retry loop (wrong = dead end), and the compare URL got clobbered by
   the lab hash-writer.

Real defects found and fixed during the work (**implemented + tested**):

- `graph.js` edit methods wrote `pos` as `{x,y,z}` while the whole engine uses `[x,y,z]` arrays →
  after any move, incident edge weights went **NaN** and the node rendered at undefined coordinates.
  Canonicalised to arrays; regression test added.
- Drag handler used a nonexistent `e.ray.ray` clause → would throw on first drag.
- A stray patch had inserted the edit actions *inside* `setEntry`'s `set()` call (functions written
  into state on every entry switch). Removed.
- Hash-writer reset to `#/` while on compare, destroying `#/compare` share links.
- Registry patch initially left `,,` holes in the ops arrays (`.find` skipped them silently, store
  showed nulls). Fixed and re-verified.

## 2. Highest-value improvements implemented

### Practice v2 — predict, check, retry, review (**implemented + tested**)
- New question kinds derived from the *next real frame*, never hardcoded:
  `decide` (sorting: "Compare 3 with 7 — will they swap?", yes/no read off whether the next frame
  actually swaps the probed pair) and `dir` (trees: "At 50: where does the search go next?",
  go-left/go-right/attach derived from real links + BST order + the next inserted node).
- Flow: pick → check → wrong options get struck out and you retry → reveal explains via the real
  frame note → "play to the next decision" seeks with `nextDecisionFrame()` (first non-code frame ≥
  current), not `i+1`.
- Honest stats: first-try vs eventual counters, streak resets on retry, mistake list with frame +
  prompt + correct answer behind a review toggle. No invented scores.
- Keyboard: 1–4 pick, Enter check/continue; radiogroup semantics + aria-live feedback line + focus
  moves to first option per question.

### Compare mode (**implemented + tested**)
- `#/compare`: two `<Stage quality="eco">` panels run any two of the 7 sorting algorithms on **one
  shared array** (same mulberry seed), lockstep one frame per tick; the finished side holds its final
  frame so different completion speeds read clearly.
- Per-panel independent scrubbing; shared transport (space / → / r).
- Metrics grid: comparisons, swaps, writes, recorded frames, with the better count marked; agreement
  sentence computed by reading both runs' final bar order (multiset-equal + sorted, asserted in
  tests). Copy explicitly says op counts are not wall-clock runtime; the writes clause only renders
  when a writes count is non-zero (bubble/quick record 0/0 — an earlier sentence there was
  misleading and was replaced).

### Graph experimentation (**implemented + tested**)
- Edit toolbar: toggle (aria-pressed), add node, edge editor (weight stepper 1–99, cut edge).
- Node dragging on a camera-facing plane with pointer capture; edge picking by clicking the tube.
- Keyboard alternative: arrows nudge the focused node (shift = fine step), Delete cuts the selected
  edge, Escape deselects/exits. Focus = last dragged or added node.
- Every mutation goes through the real machine + `syncMachine()` (stop loop, clear steps, fresh
  snapshot), so a subsequent Dijkstra run uses the edited graph — verified: 36 steps on an edited
  graph, weights re-derived from distance after drags.

### Explanation context (**implemented + tested**)
- Inspector complexity table: best-case column, running-op row highlighted with a gold dot, per-op
  suitability note (`why` authored for the 7 sorts + 4 graph ops), and a caption stating these bounds
  count operations, not seconds — constants/cache/layout decide real speed.

### A11y + URL (**implemented + tested**)
- Every interactive control now has an accessible name (ops field inputs, compare shape/size
  selects; probe: 0 unnamed of 429 lab controls). Focus ring: instant 2px solid outline.
- `#/compare` survives store writes; deep links back into the lab still restore frame index.

## 3. Decisions

- **No second practice system**: v2 extends the existing panel/store slice; questions are generated
  from recorded engine frames (`makeQuestion(steps, i, ctx, seed)`), so they can never drift from the
  animation.
- **Lockstep playback for compare** (not free-running): makes "same tick, different progress"
  visible; per-panel scrub keeps independence available.
- **Lockstep dwell 720 ms/speed** chosen for readability at eco quality on SwiftShader-class CPUs.
- **Stepper buttons instead of a number input** for edge weight: controlled number inputs in a
  floating toolbar proved flaky under synthetic events, and steppers give bigger touch targets +
  trivial keyboard support.
- **Graphs excluded from compare** (sorting only): graph "comparison" would need aligned problem
  definitions per algorithm pair; not cheap without faking equivalence. Documented as a limitation.
- **Pos canonicalised to arrays** rather than converting the engine to objects: one writer fixed vs
  a dozen readers.

## 4. Files changed

New: `src/state/compare.js`, `src/pages/Compare.jsx`, `src/components/lab/GraphEdit.jsx`.
Modified: `src/lib/practice.js`, `src/state/lab.js`, `src/components/lab/PracticePanel.jsx`,
`src/lib/structures/graph.js`, `src/lib/structures/engines.test.js`, `src/lib/registry.js`,
`src/components/lab/Inspector.jsx`, `src/components/lab/OpsPanel.jsx`, `src/pages/Lab.jsx`,
`src/three/Elements.jsx`, `src/three/Links.jsx`, `src/three/Stage.jsx`, `src/App.jsx`,
`src/main.jsx`, `src/components/lab/Topbar.jsx`.
Untouched (task-6 engine): `motion.js`, `materials.js`, `palette.js`, algorithm logic.

## 5. Tests and actual results

- **Unit**: 26/26 pass (was 23). New: graph edit methods (move reweights by rounded 3D distance,
  weights clamp 1–99, cut reflected in snapshot), practice kinds match engine next-frame state
  (`decide` yes/no equals actual swap; `dir` answer "go left" for 20 under 50; `nextDecisionFrame`
  -1 at tail), compare: 5 algorithms on one array all end sorted and multiset-identical with
  differing step counts.
- **Build**: `vite build` green after every patch (final 1.5 s).
- **Browser, production bundle (4173)**: foundation sweep — deep link i=1/n=4, back-scrub 0,
  practice on+q, eco, 0 errors. Compare — metrics 114/71 comparisons, 71/27 swaps, 199/90 frames,
  lockstep counters 5/199 & 5/90, both "done" markers, agreement sentence, 0 errors. Practice —
  wrong pick strikes out (mistake recorded, panel says so), retry-correct keeps honest streak 0,
  continue jumped 0→1 to the next decision frame, keyboard pick+check, review lists the mistake,
  0 errors. Inspector — why-note, best column, active row, caption all rendered; hash stays
  `#/compare`; deep link back lands frame 5 → index 4. A11y — 0 unnamed controls on lab and compare.
- **Browser, dev (5173, DEV camera hook)**: real mouse drag on projected node pixels moved it 4.64
  world units and re-weighted incident edges to [7,5,7]; stepper 7→8; add node 14→15; dijkstra on
  the edited graph 36 steps; keyboard nudge 2×right+down = +1.5x/+0.75z exact. 0 errors.
- Screenshots viewed: graph edit + dijkstra, practice review panel, inspector context, compare
  mid-run.

## 6. Limitations

- Rendering is CPU/SwiftShader in this sandbox (~18 FPS); lockstep dwell was tuned for readability,
  not benchmarked on real GPUs. No wall-clock claims anywhere by design.
- Compare is sorting-only (see decision). Pathfinding/grid editing already existed (brushes) and
  was left as-is; graph edit covers nodes/edges/weights but not edge *creation* by dragging between
  two nodes (only via the existing "Add edge" op).
- Pixel-identity staticness remains unprovable under SwiftShader; convergence is proven by
  `__stagePool` transform sampling (DEV), unchanged from task 6.
- Touch was exercised via pointer events (R3F unifies mouse/touch); no physical touch device here —
  keyboard alternatives were added and tested instead as the non-pointer path.

## 7. Next three improvements (suggested, not started)

1. **Edge creation by drag** between two nodes in edit mode (pointer-down on node A, drop on node B,
   weight from distance) — completes the graph editor's vocabulary.
2. **Practice for graphs/pathfinding**: "which node locks next / which edge relaxes" decisions using
   the same `decide` machinery on frontier state, plus a prediction marker drawn in 3D before reveal.
3. **Compare presets**: one-click "bubble vs quick on reversed input" style teaching scenarios that
   set shape+size+algorithms and pre-roll to the first divergence frame, where the two runs visibly
   part ways.
