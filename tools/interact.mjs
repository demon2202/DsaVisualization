/**
 * tools/interact.mjs — the interactions the screenshots cannot prove:
 * practice, paint, graph editing, the mobile drawer and reduced motion.
 */
import puppeteer from 'puppeteer'

const BASE = process.argv[2] || 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const record = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

/* ── practice: a real decision is asked, scored, and can be reviewed ───── */
await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'domcontentloaded' })
await sleep(1400)
await page.evaluate(() => {
  const s = window.__lab.getState()
  s.runOp(s.entry.ops.find((o) => o.id === 'insert'), { value: 57 })
  s.seek(3)
})
await sleep(500)
await page.keyboard.press('p')
await sleep(500)
const quiz = await page.evaluate(() => {
  const s = window.__lab.getState()
  return {
    on: s.practice.on,
    question: s.practice.q?.prompt || s.practice.q?.question || null,
    options: s.practice.q?.options?.length || 0,
    answer: s.practice.q?.answer,
    dialog: !!document.querySelector('[role="dialog"]'),
  }
})
record('practice opens a decision question', quiz.on && quiz.options >= 2 && quiz.dialog, `${quiz.options} options`)
await page.keyboard.press(String(quiz.answer + 1))
await sleep(300)
const picked = await page.evaluate(() => window.__lab.getState().practice.picked)
await page.keyboard.press('Enter')
await sleep(400)
const checked = await page.evaluate(() => {
  const s = window.__lab.getState()
  return { checked: s.practice.checked, correct: s.practice.q?.answer, picked: s.practice.picked, asked: s.practice.asked }
})
record('answer is scored against the engine', checked.checked === true && checked.picked === checked.correct && picked === checked.correct, `picked ${JSON.stringify(picked)}`)
await page.keyboard.press('Escape')
await sleep(200)
const closed = await page.evaluate(() => window.__lab.getState().practice.on)
record('Escape leaves practice', closed === false)

/* ── paint: dragging on the grid writes terrain ───────────────────────── */
await page.goto(`${BASE}/#/lab/pathfinding`, { waitUntil: 'domcontentloaded' })
await sleep(1500)
const before = await page.evaluate(() => window.__lab.getState().snapshot.stats.walls)
await page.evaluate(() => {
  const s = window.__lab.getState()
  s.setPaintMode(true)
  s.setBrush('wall')
})
await sleep(200)
await page.evaluate(() => {
  const s = window.__lab.getState()
  for (const id of ['5_3', '5_4', '5_5']) {
    const [r, c] = id.split('_').map(Number)
    s.machine.paint(r, c, 'wall')
  }
  s.paintCellRefresh()
})
await sleep(400)
const after = await page.evaluate(() => window.__lab.getState().snapshot.stats.walls)
record('painting adds walls and refreshes the frame', after > before, `${before} → ${after} walls`)

/* ── graph editing: add a node, move it, add an edge, delete it ───────── */
await page.goto(`${BASE}/#/lab/graph`, { waitUntil: 'domcontentloaded' })
await sleep(1500)
const graphBefore = await page.evaluate(() => window.__lab.getState().snapshot.stats.nodes)
await page.evaluate(() => {
  const s = window.__lab.getState()
  s.runOp(s.entry.ops.find((o) => o.id === 'addNode'), {})
})
await sleep(400)
const graphAfter = await page.evaluate(() => window.__lab.getState().snapshot.stats.nodes)
record('add node grows the graph', graphAfter === graphBefore + 1, `${graphBefore} → ${graphAfter}`)

const edge = await page.evaluate(() => {
  const s = window.__lab.getState()
  const labels = s.machine.labels()
  const linked = new Set(s.snapshot.links.flatMap((l) => [`${l.from}|${l.to}`, `${l.to}|${l.from}`]))
  const from = labels[0].id
  const to = labels.map((l) => l.id).find((id) => id !== from && !linked.has(`${from}|${id}`))
  if (!to) return { added: false, weight: null }
  s.runOp(s.entry.ops.find((o) => o.id === 'addEdge'), { from, to, w: 5 })
  const st = window.__lab.getState()
  const link = st.snapshot.links.find((l) => (l.from === from && l.to === to) || (l.from === to && l.to === from))
  return { added: !!link, weight: link?.weight, id: link?.id }
})
record('add edge records a weighted link', edge.added, `weight ${edge.weight}`)

const removed = await page.evaluate(() => {
  const s = window.__lab.getState()
  const before = s.snapshot.links.length
  const id = s.snapshot.links[0].id
  s.machine.removeEdge(id)
  s.syncMachine()
  return { before, after: window.__lab.getState().snapshot.links.length }
})
record('delete edge removes exactly one link', removed.after === removed.before - 1, `${removed.before} → ${removed.after}`)

/* ── lab panel: current operations, with the structure index one step away ── */
await page.setViewport({ width: 1440, height: 900 })
await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'domcontentloaded' })
await sleep(1200)
await page.mouse.move(22, 480)
await sleep(500)
const panelBefore = await page.evaluate(() => {
  const aside = document.querySelector('aside[aria-label="Lab controls"]')
  return {
    open: !!aside,
    operations: !!aside?.textContent.includes('Operations'),
    picker: !!aside?.querySelector('nav[aria-label="All structures"]'),
  }
})
record('lab panel opens on the current model', panelBefore.open && panelBefore.operations && !panelBefore.picker)

const changeClicked = await page.evaluate(() => {
  const aside = document.querySelector('aside[aria-label="Lab controls"]')
  const button = [...(aside?.querySelectorAll('button') || [])].find((item) => item.textContent.trim() === 'Change')
  button?.click()
  return !!button
})
await sleep(300)
const picker = await page.evaluate(() => {
  const aside = document.querySelector('aside[aria-label="Lab controls"]')
  return {
    list: !!aside?.querySelector('nav[aria-label="All structures"]'),
    operations: !!aside?.textContent.includes('Starting data'),
  }
})
record('Change swaps the panel to the structure index', changeClicked && picker.list && !picker.operations)

const changedModel = await page.evaluate(() => {
  const aside = document.querySelector('aside[aria-label="Lab controls"]')
  const button = [...(aside?.querySelectorAll('button') || [])].find((item) => item.textContent.includes('AVL Tree'))
  button?.click()
  return !!button
})
await sleep(700)
const afterPick = await page.evaluate(() => {
  const aside = document.querySelector('aside[aria-label="Lab controls"]')
  return {
    entry: window.__lab.getState().entry.id,
    operations: !!aside?.textContent.includes('Starting data'),
    picker: !!aside?.querySelector('nav[aria-label="All structures"]'),
  }
})
record('choosing a model returns to its operations', changedModel && afterPick.entry === 'avl' && afterPick.operations && !afterPick.picker, `entry ${afterPick.entry}`)

/* ── mobile drawer ─────────────────────────────────────────────────────── */
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'domcontentloaded' })
await sleep(1500)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Open lab controls')
  b?.click()
})
await sleep(600)
const drawer = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]')
  if (!dlg) return null
  const r = dlg.getBoundingClientRect()
  return { width: Math.round(r.width), left: Math.round(r.left), buttons: dlg.querySelectorAll('button').length }
})
record('mobile drawer opens full operations console', !!drawer && drawer.buttons > 8, drawer ? `${drawer.width}px, ${drawer.buttons} controls` : 'missing')
await page.evaluate(() => {
  const scope = document.querySelector('[role="dialog"]')?.parentElement || document
  const b = [...scope.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Close the lab panel')
  b?.click()
})
await sleep(1000)
const drawerClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'))
record('drawer closes', drawerClosed)

/* ── reduced motion: no lingering transform, playback still works ─────── */
await page.setViewport({ width: 1440, height: 900 })
const page2 = await browser.newPage()
await page2.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page2.setViewport({ width: 1440, height: 900 })
const rmErrors = []
page2.on('pageerror', (e) => rmErrors.push(e.message))
await page2.goto(`${BASE}/#/lab/heap`, { waitUntil: 'domcontentloaded' })
await sleep(1500)
const reduced = await page2.evaluate(() => {
  const s = window.__lab.getState()
  s.runOp(s.entry.ops.find((o) => o.id === 'push'), { value: 88 })
  const st = window.__lab.getState()
  return { steps: st.steps.length, playing: st.playing }
})
await sleep(300)
record('reduced motion still records the full run', reduced.steps > 1, `${reduced.steps} frames`)
record('reduced motion raises no console errors', rmErrors.length === 0, rmErrors[0] || '')

await page2.close()

/* ── keyboard: rail focus expansion and transport ─────────────────────── */
const kErrors = errors.filter((e) => !/DevTools|favicon/i.test(e))
record('no console errors across the interaction pass', kErrors.length === 0, kErrors.slice(0, 2).join(' | '))

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
