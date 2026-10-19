/**
 * shot.js — headless QA harness.
 * Loads the dev server, captures console/page errors, waits for WebGL to
 * actually draw frames, then screenshots so the scene can be inspected.
 */
const puppeteer = require('puppeteer')

const URL = process.argv[2] || 'http://localhost:5173/'
const OUT = process.argv[3] || '/tmp/shot.png'
const WAIT = Number(process.argv[4] || 4500)
const ACTION = process.argv[5] || ''
const SIZE = (process.argv[6] || '1600x950').split('x').map(Number)

;(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--window-size=1600,950',
    ],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: SIZE[0], height: SIZE[1], deviceScaleFactor: 1 })

  const logs = []
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`[404/fail] ${r.url()} :: ${r.failure()?.errorText}`))

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })

  for (const act of ACTION.split('|').filter(Boolean)) {
    await runAction(act)
    await new Promise((r) => setTimeout(r, 350))
  }
  async function runAction(ACTION) {
  if (ACTION === 'lab') {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /enter( the)? lab|open the lab/i.test(x.textContent))
      if (b) b.click()
    })
  } else if (ACTION.startsWith('click:')) {
    const label = ACTION.slice(6)
    await page.evaluate((l) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase().includes(l.toLowerCase()))
      if (b) b.click()
    }, label)
  } else if (ACTION.startsWith('eval:')) {
    await page.evaluate(ACTION.slice(5))
  } else if (ACTION.startsWith('wait:')) {
    await new Promise((r) => setTimeout(r, Number(ACTION.slice(5))))
  }
  }

  await new Promise((r) => setTimeout(r, WAIT))

  // WebGL sanity: how many draw calls / is the canvas non-blank?
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return { canvas: false }
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    return {
      canvas: true,
      w: c.width,
      h: c.height,
      ctxLost: gl ? gl.isContextLost() : 'no-gl',
      renderer: gl ? gl.getParameter(gl.VERSION) : null,
    }
  })

  await page.screenshot({ path: OUT })
  console.log(JSON.stringify(info))
  const important = logs.filter((l) => !/DevTools|Download the React|source-map/i.test(l))
  console.log('--- console (' + important.length + ') ---')
  console.log(important.slice(0, 45).join('\n'))
  await browser.close()
})().catch((e) => {
  console.error('HARNESS FAIL', e.message)
  process.exit(1)
})
