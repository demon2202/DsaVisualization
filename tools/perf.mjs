/**
 * tools/perf.mjs — measured frame rate on the heaviest screens.
 * The stage is SVG/DOM now, so these numbers say more about paint and layout
 * than about a GPU. Run against the dev server: node tools/perf.mjs [url]
 */
import puppeteer from 'puppeteer'

const BASE = process.argv[2] || 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const sample = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0
        const started = performance.now()
        const tick = () => {
          frames++
          if (performance.now() - started < 2000) requestAnimationFrame(tick)
          else resolve({ fps: +(frames / ((performance.now() - started) / 1000)).toFixed(1) })
        }
        requestAnimationFrame(tick)
      }),
  )

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
await sleep(1200)

for (const [label, hash, warm] of [
  ['BST idle', '#/lab/bst', null],
  ['pathfinding idle (315 tiles)', '#/lab/pathfinding', null],
  ['pathfinding A* at 4×', '#/lab/pathfinding', async () => {}],
  ['sorting quick at 4×', '#/lab/sorting', null],
]) {
  /* hash assignment is the reliable same-document navigation here: page.goto()
     to a URL that differs only by fragment can be swallowed while the player
     is rewriting the URL each frame */
  await page.evaluate((target) => {
    window.location.hash = target
  }, hash)
  await sleep(1600)
  if (label.includes('A*')) {
    await page.evaluate(() => {
      const s = window.__lab.getState()
      s.runOp(s.entry.ops.find((o) => o.id === 'astar'), {})
      s.setSpeed(4)
      s.play()
    })
  }
  if (label.includes('quick')) {
    await page.evaluate(() => {
      const s = window.__lab.getState()
      s.runOp(s.entry.ops.find((o) => o.id === 'quick'), {})
      s.setSpeed(4)
      s.play()
    })
  }
  const { fps } = await sample()
  console.log(`${label.padEnd(34)} ${fps} fps (headless Chromium — a floor, not a device guarantee)`)
  void warm
}

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
await sleep(1500)
console.log(`landing hero (idle tree)`.padEnd(34) + ` ${(await sample()).fps} fps`)
await browser.close()
