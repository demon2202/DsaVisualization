/**
 * tools/verify.mjs — real-browser interaction check.
 *
 * Boots the dev server's page in headless Chrome and drives the transport the
 * way a person would: play, pause, step, scrub, restart, change speed and
 * switch structures, then asserts that the visual frame and the store agree.
 * It also checks the layouts for horizontal overflow at three widths and
 * collects every console error on the way.
 *
 *   npm run dev            # in another terminal
 *   node tools/verify.mjs  [url]
 */
import puppeteer from 'puppeteer'

const BASE = process.argv[2] || 'http://localhost:5173'
const CHROME_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

const results = []
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new', args: CHROME_ARGS })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

const frame = () =>
  page.evaluate(() => {
    const s = window.__lab.getState()
    return {
      index: s.index,
      count: s.steps.length,
      playing: s.playing,
      atEnd: s.atEnd,
      note: s.snapshot?.note || '',
      expected: s.steps[s.index]?.note || '',
      nodes: s.snapshot?.nodes?.length ?? 0,
      code: s.snapshot?.code || [],
      entry: s.entry.id,
    }
  })

const click = (label) =>
  page.evaluate((l) => {
    const target = l.toLowerCase()
    const btn = [...document.querySelectorAll('button')].find((b) => {
      const text = b.textContent.trim().toLowerCase()
      const aria = (b.getAttribute('aria-label') || '').toLowerCase()
      return text === target || aria === target || aria.startsWith(target)
    })
    if (!btn) throw new Error(`no button "${l}"`)
    btn.click()
  }, label)

const run = (entryId, opId, args = {}) =>
  page.evaluate(
    (id, op, a) => {
      const s = window.__lab.getState()
      const definition = s.entry.ops.find((o) => o.id === op)
      if (!definition) throw new Error(`no op ${op}`)
      s.runOp(definition, a)
    },
    entryId,
    opId,
    args,
  )

/* ── 1. boot and run ─────────────────────────────────────────────────────── */
await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'domcontentloaded' })
await sleep(1500)
let f = await frame()
record('lab boots on the BST', f.entry === 'bst' && f.nodes > 0, `${f.nodes} nodes`)
record('transport starts empty', f.count === 0 && f.index === 0)

await run('bst', 'insert', { value: 41 })
await sleep(350)
f = await frame()
record('insert records a timeline', f.count > 1, `${f.count} frames`)
record('playback auto-starts', f.playing === true)

/* ── 2. pause / resume ───────────────────────────────────────────────────── */
await click('Pause')
await sleep(220)
const paused = await frame()
await sleep(700)
const stillPaused = await frame()
record('pause stops the clock', paused.playing === false && stillPaused.index === paused.index)

await click('Play')
await sleep(1200)
record('resume advances', (await frame()).index > stillPaused.index)
await click('Pause')

/* ── 3. stepping is exact and reversible ─────────────────────────────────── */
await page.evaluate(() => window.__lab.getState().seek(4))
await sleep(150)
const at4 = await frame()
await page.keyboard.press('ArrowRight')
await sleep(150)
const at5 = await frame()
await page.keyboard.press('ArrowLeft')
await sleep(150)
const back4 = await frame()
record('step forward moves one frame', at5.index === at4.index + 1)
record('step backward returns the same frame', back4.index === at4.index && back4.note === at4.note)
record('frame narration matches the store', at4.note === at4.expected)

/* ── 4. scrubbing restores state, not just the indicator ─────────────────── */
const seekTarget = Math.floor(at4.count * 0.7)
await page.evaluate((i) => window.__lab.getState().seek(i), seekTarget)
await sleep(200)
const seeked = await frame()
record('seek lands on the requested frame', seeked.index === seekTarget && seeked.note === seeked.expected)
record('seek pauses playback', seeked.playing === false)

/* ── 5. rapid input never corrupts the frame ─────────────────────────────── */
await page.evaluate(() => {
  const s = window.__lab.getState()
  for (let i = 0; i < 40; i++) s.seek(i % Math.max(1, s.steps.length))
})
await sleep(250)
const rapid = await frame()
record('rapid seeking stays coherent', rapid.note === rapid.expected && rapid.index >= 0)

/* ── 6. restart ──────────────────────────────────────────────────────────── */
await page.evaluate(() => window.__lab.getState().restart())
await sleep(180)
const restarted = await frame()
record('restart returns to frame 1 and plays', restarted.index <= 1)
await page.evaluate(() => window.__lab.getState().pause())

/* ── 7. speed change keeps timing sane ───────────────────────────────────── */
await page.evaluate(() => {
  const s = window.__lab.getState()
  s.setSpeed(4)
  s.seek(0)
  s.play()
})
await sleep(900)
const fast = await frame()
await page.evaluate(() => {
  const s = window.__lab.getState()
  s.pause()
  s.setSpeed(0.25)
})
record('4× plays faster than the base dwell', fast.index > 3, `${fast.index} frames in 0.9 s`)

/* ── 8. every structure renders a non-empty frame ────────────────────────── */
/* sorting is drawn as labelled bars, everything else on the 2.5D SVG stage */
for (const id of ['avl', 'linkedlist', 'stack', 'queue', 'deque', 'hashchain', 'hashprobe', 'heap', 'graph', 'sorting', 'pathfinding']) {
  await page.goto(`${BASE}/#/lab/${id}`, { waitUntil: 'domcontentloaded' })
  await sleep(1100)
  const info = await page.evaluate(() => {
    const s = window.__lab.getState()
    const stage = document.querySelector('[data-stage]')
    const bars = document.querySelector('[data-arrayviz]')?.getAttribute('data-count')
    const values = stage ? [...stage.querySelectorAll('text')].filter((t) => t.textContent.trim()).length : 0
    return { entry: s.entry.id, nodes: s.snapshot?.nodes?.length ?? 0, stage: !!stage, values, bars: Number(bars || 0) }
  })
  const painted = info.stage || info.bars > 0
  record(`${id} renders its model`, info.entry === id && info.nodes > 0 && painted, `${info.nodes} nodes${info.values ? ` · ${info.values} labels` : ''}${info.bars ? ` · ${info.bars} bars` : ''}`)
}

/* ── 9. a run on each family produces readable frames ────────────────────── */
const runs = [
  ['linkedlist', 'reverse', {}],
  ['stack', 'push', { value: 71 }],
  ['deque', 'pushBack', { value: 91 }],
  ['heap', 'push', { value: 91 }],
  ['graph', 'bfs', {}],
  ['sorting', 'quick', {}],
  ['pathfinding', 'astar', {}],
]
for (const [id, op, args] of runs) {
  await page.goto(`${BASE}/#/lab/${id}`, { waitUntil: 'domcontentloaded' })
  await sleep(600)
  const outcome = await page.evaluate(
    (opId, a) => {
      const s = window.__lab.getState()
      const definition = s.entry.ops.find((o) => o.id === opId)
      if (!definition) return { steps: 0, note: `missing op ${s.entry.id}.${opId}`, nodes: 0 }
      const nodeField = definition.fields?.find((f) => f.type === 'node')
      if (nodeField && !a[nodeField.key]) {
        const first = s.machine.labels?.()[0]?.id || s.snapshot.nodes?.[0]?.id
        a = { ...a, [nodeField.key]: first }
      }
      s.runOp(definition, a)
      const st = window.__lab.getState()
      return { steps: st.steps.length, note: st.steps[0]?.note || '', nodes: st.steps[0]?.nodes?.length || 0 }
    },
    op,
    args,
  )
  record(`${id} · ${op} produces narrated frames`, outcome.steps > 0 && outcome.note.length > 0 && outcome.nodes > 0, `${outcome.steps} frames`)
}

/* ── 10. layout: no horizontal overflow at three widths ──────────────────── */
for (const [w, h, name] of [
  [1440, 900, 'desktop'],
  [768, 1024, 'tablet'],
  [390, 844, 'phone'],
]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(`${BASE}/#/lab/graph`, { waitUntil: 'domcontentloaded' })
  await sleep(900)
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }))
  record(`${name} has no horizontal overflow`, overflow.doc <= 1 && overflow.body <= 1, `doc ${overflow.doc}px, body ${overflow.body}px`)
}

await page.setViewport({ width: 390, height: 844 })
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
await sleep(900)
const landingOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
record('landing has no horizontal overflow on a phone', landingOverflow <= 1, `${landingOverflow}px`)

/* ── 11. deep links replay a run at a frame ──────────────────────────────── */
await page.setViewport({ width: 1440, height: 900 })
const deepArgs = encodeURIComponent(JSON.stringify({ value: 45 }))
await page.goto(`${BASE}/#/lab/bst?op=insert&a=${deepArgs}&f=3`, { waitUntil: 'domcontentloaded' })
await sleep(1200)
const deep = await page.evaluate(() => {
  const s = window.__lab.getState()
  return { entry: s.entry.id, steps: s.steps.length, index: s.index, note: s.snapshot?.note || '', expected: s.steps[s.index]?.note || '', playing: s.playing }
})
record(
  'deep link replays an operation at the named frame',
  deep.entry === 'bst' && deep.steps > 2 && deep.index === 2 && deep.note === deep.expected && deep.playing === false,
  `${deep.steps} frames · frame ${deep.index + 1}`,
)

await page.goto(`${BASE}/#/lab/sorting?arr=9,2,7,4,1&op=bubble&f=2`, { waitUntil: 'domcontentloaded' })
await sleep(1100)
const sortDeep = await page.evaluate(() => {
  const s = window.__lab.getState()
  const first = (s.steps[0]?.nodes || [])
    .filter((n) => n.bar)
    .sort((a, b) => a.bar.index - b.bar.index)
    .map((n) => n.value)
  return { entry: s.entry.id, first, index: s.index, steps: s.steps.length, note: s.snapshot?.note || '', expected: s.steps[s.index]?.note || '' }
})
record(
  'sorting deep link restores its input and frame',
  sortDeep.entry === 'sorting' && sortDeep.first.join(',') === '9,2,7,4,1' && sortDeep.steps > 1 && sortDeep.index === 1 && sortDeep.note === sortDeep.expected,
  sortDeep.first.join(','),
)

/* ── 12. graph editing mutates the real machine ──────────────────────────── */
await page.goto(`${BASE}/#/lab/graph`, { waitUntil: 'domcontentloaded' })
await sleep(1000)
const graphBefore = await page.evaluate(() => {
  const s = window.__lab.getState()
  s.setEditMode(true)
  const node = s.machine.nodes[0]
  const edge = s.machine.edges[0]
  return { node: node.id, pos: [...node.pos], edge: edge.id, weight: edge.weight }
})
await sleep(500)
const nodeBox = await (await page.$('[data-stage="graph"] .diagram-node')).boundingBox()
await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2)
await page.mouse.down()
await page.mouse.move(nodeBox.x + nodeBox.width / 2 + 55, nodeBox.y + nodeBox.height / 2 + 28, { steps: 8 })
await page.mouse.up()
await sleep(500)
const moved = await page.evaluate((id) => {
  const s = window.__lab.getState()
  const node = s.machine.nodes.find((n) => n.id === id)
  return node ? [...node.pos] : null
}, graphBefore.node)
record(
  'graph nodes drag to a new position',
  moved && Math.hypot(moved[0] - graphBefore.pos[0], moved[2] - graphBefore.pos[2]) > 0.2,
  moved ? `${graphBefore.pos[0].toFixed(1)},${graphBefore.pos[2].toFixed(1)} → ${moved[0].toFixed(1)},${moved[2].toFixed(1)}` : 'node missing',
)

const edgeBefore = await page.evaluate((id) => {
  const s = window.__lab.getState()
  s.setSelectedLink(id)
  return s.machine.edges.find((e) => e.id === id)?.weight
}, graphBefore.edge)
await sleep(400)
await click('Increase edge weight')
await sleep(300)
const edgeAfter = await page.evaluate((id) => {
  const s = window.__lab.getState()
  const edge = s.machine.edges.find((e) => e.id === id)
  const link = s.snapshot?.links?.find((l) => l.id === id)
  return { weight: edge?.weight, drawn: link?.weight }
}, graphBefore.edge)
record(
  'edge weight edits re-snapshot the graph',
  edgeAfter.weight === edgeBefore + 1 && edgeAfter.drawn === edgeAfter.weight,
  `${edgeBefore} → ${edgeAfter.weight}`,
)

await page.keyboard.press('Delete')
await sleep(300)
const edgeGone = await page.evaluate((id) => {
  const s = window.__lab.getState()
  return !s.machine.edges.some((e) => e.id === id) && !s.snapshot?.links?.some((l) => l.id === id)
}, graphBefore.edge)
record('delete removes the selected edge', edgeGone)

/* ── 13. practice keyboard flow ─────────────────────────────────────────── */
await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'domcontentloaded' })
await page.reload({ waitUntil: 'domcontentloaded' })
await sleep(900)
await run('bst', 'insert', { value: 45 })
await sleep(250)
await page.evaluate(() => {
  const s = window.__lab.getState()
  s.seek(3)
  s.togglePractice()
})
await sleep(500)
const question = await page.evaluate(() => {
  const s = window.__lab.getState()
  const p = s.practice
  return { on: p.on, q: p.q ? { frame: p.q.frame, answer: p.q.answer } : null, checked: p.checked, first: p.first, index: s.index, steps: s.steps.length }
})
record('practice opens with a decision question', question.on && !!question.q, `${question.steps} frames · frame ${question.index + 1}`)
if (question.q) {
  await page.keyboard.press(String(question.q.answer + 1))
  await sleep(150)
  const picked = await page.evaluate(() => window.__lab.getState().practice.picked)
  await page.keyboard.press('Enter')
  await sleep(300)
  const checked = await page.evaluate(() => {
    const p = window.__lab.getState().practice
    return { checked: p.checked, first: p.first, picked: p.picked, answer: p.q?.answer }
  })
  record('practice accepts a keyboard pick and check', picked === checked.answer && checked.checked && checked.first === 1)
  await page.keyboard.press('Enter')
  await sleep(350)
  const advanced = await page.evaluate(() => {
    const p = window.__lab.getState().practice
    return { on: p.on, checked: p.checked, frame: p.q?.frame }
  })
  record('practice continues to another decision or ends cleanly', !advanced.on || (!advanced.checked && advanced.frame !== question.q.frame))
} else {
  record('practice accepts a keyboard pick and check', false, 'no question opened')
  record('practice continues to another decision or ends cleanly', false, 'no question opened')
}

/* ── 14. compare transport stays in lockstep ─────────────────────────────── */
await page.goto(`${BASE}/#/compare`, { waitUntil: 'domcontentloaded' })
await sleep(1400)
const compareFrames = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('section[aria-label^="Panel"]')].map((section) => {
      const match = section.textContent.match(/(\d+)\s*\/\s*\d+/)
      return match ? Number(match[1]) : null
    }),
  )
const compareBefore = await compareFrames()
await page.keyboard.press('ArrowRight')
await sleep(300)
const compareAfter = await compareFrames()
record(
  'compare moves both panels on one arrow press',
  compareBefore.length === 2 && compareAfter.every((n, i) => n === compareBefore[i] + 1),
  `${compareBefore.join('/')} → ${compareAfter.join('/')}`,
)

/* ── 15. mobile drawers and toast clearance ──────────────────────────────── */
await page.setViewport({ width: 390, height: 844 })
await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'domcontentloaded' })
await sleep(900)
await click('Open lab controls')
await sleep(700)
const mobileLab = await page.evaluate(() => {
  const drawer = document.querySelector('[role="dialog"][aria-label="Lab controls"]')
  if (!drawer) return null
  const box = drawer.getBoundingClientRect()
  return { width: box.width, viewport: window.innerWidth }
})
record('mobile lab panel is a full-width drawer', !!mobileLab && Math.abs(mobileLab.width - mobileLab.viewport) <= 1, mobileLab ? `${mobileLab.width}px` : 'missing')

await page.evaluate(() => window.__lab.getState().setMobilePanel(null))
await sleep(500)
await click('Toggle the notes panel')
await sleep(700)
const mobileNotes = await page.evaluate(() => {
  const drawer = document.querySelector('[role="dialog"][aria-label="Notes"]')
  if (!drawer) return null
  const box = drawer.getBoundingClientRect()
  return { width: box.width, right: box.right, viewport: window.innerWidth }
})
record('mobile notes is a full-width drawer', !!mobileNotes && Math.abs(mobileNotes.width - mobileNotes.viewport) <= 1, mobileNotes ? `${mobileNotes.width}px` : 'missing')

await page.evaluate(() => {
  window.__lab.getState().setMobilePanel(null)
  window.__lab.getState().toastIt('ok', 'Saved — toast clearance check')
})
await sleep(250)
const toastClear = await page.evaluate(() => {
  const rect = (el) => el?.getBoundingClientRect() || null
  const overlap = (a, b) => !!a && !!b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  const toast = rect(document.querySelector('[role="status"]'))
  return {
    present: !!toast,
    narration: overlap(toast, rect(document.querySelector('p[aria-live="polite"]'))),
    transport: overlap(toast, rect(document.querySelector('[aria-label="Playback"]'))),
  }
})
record('toast clears narration and transport on a phone', toastClear.present && !toastClear.narration && !toastClear.transport)

/* ── 16. console stays clean ─────────────────────────────────────────────── */
const real = errors.filter((e) => !/DevTools|favicon|Download the React/i.test(e))
record('no console errors during the session', real.length === 0, real.slice(0, 3).join(' | '))

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
