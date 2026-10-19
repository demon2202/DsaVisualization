import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { useLab } from './state/lab'
import { entryById } from './lib/registry'

// exposed for the QA harness and for power users poking in the console
if (typeof window !== 'undefined') window.__lab = useLab

/* ── deep links ───────────────────────────────────────────────────────────
   #/lab/<entry>?op=<opId>&a=<json args>&f=<frame>
   Boot (and in-document hash navigation) replays the exact run and seeks
   the exact frame, so a link can carry a moment to another person.       */
let writtenHash = ''

function parseHash() {
  const m = window.location.hash.match(/^#\/lab\/([a-z]+)(?:\?(.*))?$/)
  if (!m || !entryById(m[1])) return null
  return { entry: m[1], params: new URLSearchParams(m[2] || '') }
}

function bootFromHash() {
  if (typeof window === 'undefined') return
  if (window.location.hash.startsWith('#/compare')) {
    useLab.getState().setRoute('compare')
    return
  }
  const parsed = parseHash()
  if (!parsed) return
  const s = useLab.getState()
  s.setEntry(parsed.entry)
  s.setRoute('lab')
  const g = parsed.params.get('g')
  if (g && useLab.getState().machine?.load) useLab.getState().machine.load(g)
  const arr = parsed.params.get('arr')
  if (arr && useLab.getState().machine?.reset) {
    const nums = arr.split(',').map(Number).filter(Number.isFinite).slice(0, 48)
    if (nums.length > 1) useLab.getState().machine.reset(nums)
  }
  const opId = parsed.params.get('op')
  const frame = Number(parsed.params.get('f'))
  if (!opId) return
  // replay once the lab has mounted its machine (setEntry above is sync)
  queueMicrotask(() => {
    const st = useLab.getState()
    const op = st.entry.ops.find((o) => o.id === opId)
    if (!op) return
    let args = {}
    try {
      args = JSON.parse(parsed.params.get('a') || '{}')
    } catch {
      args = {}
    }
    st.runOp(op, args, { autoplay: false })
    const steps = useLab.getState().steps
    if (Number.isFinite(frame) && frame > 0 && steps.length) {
      useLab.getState().seek(Math.min(steps.length, frame) - 1)
    }
  })
}

bootFromHash()

/* address-bar edits / hash navigation replay too (our own replaceState writes
   never fire hashchange, and writtenHash guards programmatic echoes) */
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === writtenHash) return
    bootFromHash()
  })

  /* the URL follows the work: entry, last run and current frame */
  let last = ''
  let queued = false
  useLab.subscribe(() => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const s = useLab.getState()
      let next = '#/'
      if (s.route === 'compare') next = '#/compare'
      if (s.route === 'lab') {
        const q = new URLSearchParams()
        if (s.entry.id === 'sorting') {
          const arr = s.lastRun?.pre || s.machine?.array
          if (arr) q.set('arr', arr.join(','))
        }
        if (s.entry.id === 'pathfinding' && s.machine?.serialize) q.set('g', s.machine.serialize())
        if (s.lastRun?.op?.id) {
          q.set('op', s.lastRun.op.id)
          if (s.lastRun.args && Object.keys(s.lastRun.args).length) q.set('a', JSON.stringify(s.lastRun.args))
          if (s.steps.length > 1) q.set('f', String(s.index + 1))
        }
        next = `#/lab/${s.entry.id}${q.toString() ? `?${q}` : ''}`
      }
      if (next === last) return
      last = next
      writtenHash = next
      window.history.replaceState(null, '', next)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
