/**
 * tools/shots.mjs — art-direction review aid (dev tool, not shipped).
 * Captures the surfaces the design review must judge, at three widths.
 *   npm run dev   # first
 *   node tools/shots.mjs [base]
 * Writes PNGs to .review/ (git-ignored).
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '.review')
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function shoot(name, route, { width, height, delay = 1400 } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
  await sleep(delay)
  await page.screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log('shot', name)
  await page.close()
}

/* ── landing, desktop ── */
await shoot('landing-desk-hero', '/', { width: 1440, height: 900 })

{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
  await sleep(1600)

  const at = (sel, frac) =>
    page.evaluate(
      ([sel, frac]) => {
        const el = document.querySelector(sel)
        if (!el) return 0
        const y = el.getBoundingClientRect().top + window.scrollY
        const span = el.getBoundingClientRect().height
        window.scrollTo(0, y + span * frac)
      },
      [sel, frac],
    )

  await at('#how', 0.45)
  await sleep(1400)
  await page.screenshot({ path: path.join(OUT, 'landing-desk-how.png') })
  console.log('shot landing-desk-how')

  for (const [index, frac] of [0.125, 0.38, 0.63].entries()) {
    await at('#story', frac)
    await sleep(1600)
    await page.screenshot({ path: path.join(OUT, `landing-desk-story-${index + 1}.png`) })
    console.log(`shot landing-desk-story-${index + 1}`)
  }

  await at('#collection', 0.25)
  await sleep(1400)
  await page.screenshot({ path: path.join(OUT, 'landing-desk-collection.png') })
  console.log('shot landing-desk-collection')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await sleep(1400)
  await page.screenshot({ path: path.join(OUT, 'landing-desk-close.png') })
  console.log('shot landing-desk-close')
  await page.close()
}

/* ── every structure, desktop ── */
for (const id of ['bst', 'avl', 'linkedlist', 'stack', 'queue', 'deque', 'hashchain', 'hashprobe', 'heap', 'graph', 'sorting', 'pathfinding']) {
  await shoot(`lab-desk-${id}`, `/#/lab/${id}`, { width: 1440, height: 900, delay: 900 })
}

/* ── hover-reveal panels ── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'networkidle2' })
  await sleep(1000)
  await page.mouse.move(22, 480)
  await sleep(700)
  await page.screenshot({ path: path.join(OUT, 'lab-desk-lab-open.png') })
  console.log('shot lab-desk-lab-open')

  await page.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="Lab controls"]')
    const button = [...(aside?.querySelectorAll('button') || [])].find((item) => item.textContent.trim() === 'Change')
    button?.click()
  })
  await sleep(400)
  await page.screenshot({ path: path.join(OUT, 'lab-desk-lab-change.png') })
  console.log('shot lab-desk-lab-change')

  await page.mouse.move(1440 - 22, 480)
  await sleep(1000)
  await page.screenshot({ path: path.join(OUT, 'lab-desk-notes-open.png') })
  console.log('shot lab-desk-notes-open')

  await page.goto(`${BASE}/#/lab/graph`, { waitUntil: 'networkidle2' })
  await sleep(900)
  await page.evaluate(() => {
    const s = window.__lab.getState()
    s.setEditMode(true)
  })
  await sleep(500)
  await page.screenshot({ path: path.join(OUT, 'lab-desk-graph-edit.png') })
  console.log('shot lab-desk-graph-edit')
  await page.close()
}

/* ── operations composer, opened from the current model ── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'networkidle2' })
  await sleep(900)
  await page.mouse.move(22, 480)
  await sleep(600)
  await page.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="Lab controls"]')
    const button = [...(aside?.querySelectorAll('button') || [])].find((item) => item.textContent.includes('Insert'))
    button?.click()
  })
  await sleep(500)
  await page.screenshot({ path: path.join(OUT, 'lab-desk-composer-open.png') })
  console.log('shot lab-desk-composer-open')
  await page.close()
}

/* ── a sorting run, paused mid-swap ── */
async function sortingRun(width, height, name) {
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.goto(`${BASE}/#/lab/sorting`, { waitUntil: 'networkidle2' })
  await sleep(900)
  await page.evaluate(() => {
    const s = window.__lab.getState()
    const op = s.entry.ops.find((o) => o.id === 'bubble')
    s.runOp(op, {}, { autoplay: false })
    window.__lab.getState().seek(14)
  })
  await sleep(700)
  await page.screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log(`shot ${name}`)
  await page.close()
}
await sortingRun(1440, 900, 'lab-desk-sorting-run')
await sortingRun(390, 844, 'lab-phone-sorting-run')

/* ── practice on phone ── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'networkidle2' })
  await sleep(900)
  await page.evaluate(() => {
    const s = window.__lab.getState()
    const op = s.entry.ops.find((o) => o.id === 'insert')
    s.runOp(op, { value: '45' })
    window.__lab.getState().seek(3)
    window.__lab.getState().togglePractice()
  })
  await sleep(900)
  await page.screenshot({ path: path.join(OUT, 'lab-phone-practice.png') })
  console.log('shot lab-phone-practice')
  await page.close()
}

/* ── compare, desktop + phone ── */
await shoot('compare-desk', '/#/compare', { width: 1440, height: 900, delay: 1400 })
await shoot('compare-phone', '/#/compare', { width: 390, height: 844, delay: 1400 })

/* ── tablet ── */
await shoot('lab-tablet-bst', '/#/lab/bst', { width: 768, height: 1024, delay: 900 })

/* ── phone ── */
await shoot('landing-phone-hero', '/', { width: 390, height: 844, delay: 1400 })
await shoot('lab-phone-bst', '/#/lab/bst', { width: 390, height: 844, delay: 900 })

{
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${BASE}/#/lab/bst`, { waitUntil: 'networkidle2' })
  await sleep(900)
  await page.evaluate(() => window.__lab.getState().setMobilePanel('ops'))
  await sleep(700)
  await page.screenshot({ path: path.join(OUT, 'lab-phone-lab-open.png') })
  console.log('shot lab-phone-lab-open')
  await page.evaluate(() => {
    const aside = document.querySelector('[role="dialog"]')
    const button = [...(aside?.querySelectorAll('button') || [])].find((item) => item.textContent.trim() === 'Change')
    button?.click()
  })
  await sleep(400)
  await page.screenshot({ path: path.join(OUT, 'lab-phone-lab-change.png') })
  console.log('shot lab-phone-lab-change')
  await page.evaluate(() => {
    const aside = document.querySelector('[role="dialog"]')
    const button = [...(aside?.querySelectorAll('button') || [])].find((item) => item.textContent.includes('Deque'))
    button?.click()
  })
  await sleep(700)
  await page.screenshot({ path: path.join(OUT, 'lab-phone-lab-after.png') })
  console.log('shot lab-phone-lab-after')
  await page.evaluate(() => window.__lab.getState().setMobilePanel('info'))
  await sleep(700)
  await page.screenshot({ path: path.join(OUT, 'lab-phone-notes-open.png') })
  console.log('shot lab-phone-notes-open')
  await page.close()
}

await browser.close()
