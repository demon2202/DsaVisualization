/**
 * lab.js — the single store for the Lab.
 *
 * Machines (the mutable algorithm objects) live outside React so they never
 * trigger renders by identity; only their snapshots do. Playback is index
 * based over an array of absolute snapshots, which is what makes scrubbing
 * backwards behave exactly like scrubbing forwards.
 */
import { create } from 'zustand'
import { entryById } from '../lib/registry'
import { code } from '../lib/pseudocode'
import { makeQuestion, nextDecisionFrame } from '../lib/practice'

const machines = new Map()

export function machineFor(entry) {
  if (!machines.has(entry.id)) {
    const m = entry.create()
    entry.seed?.(m)
    machines.set(entry.id, m)
  }
  return machines.get(entry.id)
}

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2.5, 4]
const BASE_DWELL = 720 // ms per step at 1x

let rafId = null
let lastTick = 0
let acc = 0

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  acc = 0
}

function startLoop(get, set) {
  stopLoop()
  lastTick = performance.now()
  const tick = (now) => {
    const s = get()
    if (!s.playing) {
      rafId = null
      return
    }
    const dt = Math.min(120, now - lastTick)
    lastTick = now
    acc += dt * s.speed
    const dwell = Math.max(40, BASE_DWELL * (s.entry.scene === 'grid' ? 0.55 : 1))
    while (acc >= dwell) {
      acc -= dwell
      const cur = get()
      if (cur.index >= cur.steps.length - 1) {
        set({ playing: false, atEnd: true })
        stopLoop()
        return
      }
      applyIndex(get, set, cur.index + 1)
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function applyIndex(get, set, index) {
  const s = get()
  const i = Math.max(0, Math.min(s.steps.length - 1, index))
  const step = s.steps[i]
  if (!step) return set({ index: i })
  set({
    index: i,
    snapshot: step,
    atEnd: i >= s.steps.length - 1,
  })
}

export const useLab = create((set, get) => {
  const initialEntry = entryById('bst')
  const initialMachine = machineFor(initialEntry)

  return {
    /* ── routing ── */
    route: 'landing',
    setRoute: (route) => set({ route }),

    /* ── current entry ── */
    entry: initialEntry,
    machine: initialMachine,
    snapshot: initialMachine.snapshot(),
    steps: [],
    index: 0,
    playing: false,
    atEnd: false,
    speed: readPrefs().speed ?? 1,
    runMeta: null,
    toast: null,
    selected: null,
    brush: 'wall',
    quality: readPrefs().quality ?? 'high',
    showCode: true,
    showInfo: false,
    showInspectorPanel: true,
    panelTab: 'now',
    setPanelTab: (panelTab) => set({ panelTab, showInspectorPanel: true }),
    /* orbit is opt-in: idle camera drift is noise unless the reader asks */
    autoRotate: readPrefs().autoRotate ?? false,
    paintMode: false,
    editMode: false,
    selectedLink: null,
    editFocus: null,
    setEditMode: (editMode) => set({ editMode, selectedLink: null, editFocus: null }),
    setSelectedLink: (selectedLink) => set({ selectedLink }),
    setEditFocus: (editFocus) => set({ editFocus }),
    syncMachine: () => {
      const s = get()
      stopLoop()
      set({ steps: [], index: 0, playing: false, atEnd: false, runMeta: null, snapshot: s.machine.snapshot() })
    },
    mobilePanel: null,
    practice: {
      on: false, q: null, picked: null, checked: false, wrongPicks: [],
      first: 0, eventual: 0, wrong: 0, asked: 0, streak: 0,
      mistakes: [], review: false,
    },
    frameToken: 1,
    lastRun: null,

    setPaintMode: (paintMode) => set({ paintMode }),
    setMobilePanel: (mobilePanel) => set({ mobilePanel }),

    /* ── practice: predict at decision points, check, retry, review ─────── */
    togglePractice: () => {
      const s = get()
      if (s.practice.on) {
        set({ practice: { ...s.practice, on: false, q: null, review: false } })
        return
      }
      if (!s.steps.length) {
        get().toastIt('info', 'Run an operation first.')
        return
      }
      set({
        playing: false,
        practice: { on: true, q: null, picked: null, checked: false, wrongPicks: [], first: 0, eventual: 0, wrong: 0, asked: 0, streak: 0, mistakes: [], review: false },
      })
      get().askPractice()
    },
    askPractice: (atIndex) => {
      const s = get()
      const idx = atIndex ?? s.index
      const q = makeQuestion(s.steps, idx, { scene: s.entry.scene, lines: s.practiceLines() }, idx + 3)
      set({ practice: { ...s.practice, q, picked: null, checked: false, wrongPicks: [] } })
    },
    practiceLines: () => {
      const s = get()
      const op = s.entry.ops.find((o) => o.id === s.runMeta?.op)
      return op?.code ? code(op.code) : []
    },
    pickPractice: (i) => {
      const s = get()
      if (!s.practice.q || s.practice.checked || s.practice.wrongPicks.includes(i)) return
      set({ practice: { ...s.practice, picked: i } })
    },
    checkPractice: () => {
      const s = get()
      const pr = s.practice
      if (!pr.q || pr.checked || pr.picked == null) return
      const right = pr.picked === pr.q.answer
      if (right) {
        const firstTry = pr.wrongPicks.length === 0
        const mistakes = firstTry
          ? pr.mistakes
          : [...pr.mistakes, { frame: pr.q.frame, prompt: pr.q.prompt, options: pr.q.options, answer: pr.q.answer, picked: pr.wrongPicks[0], explain: pr.q.explain }]
        set({
          practice: {
            ...pr, checked: true,
            first: pr.first + (firstTry ? 1 : 0),
            eventual: pr.eventual + 1,
            streak: pr.streak + 1,
            asked: pr.asked + 1,
            mistakes,
          },
        })
      } else {
        const wrongPicks = [...pr.wrongPicks, pr.picked]
        const exhausted = wrongPicks.length >= pr.q.options.length - 1
        const mistakes = exhausted
          ? [...pr.mistakes, { frame: pr.q.frame, prompt: pr.q.prompt, options: pr.q.options, answer: pr.q.answer, picked: pr.wrongPicks[0] ?? pr.picked, explain: pr.q.explain }]
          : pr.mistakes
        set({
          practice: {
            ...pr,
            picked: null,
            wrongPicks,
            streak: 0,
            checked: exhausted,
            wrong: pr.wrong + (exhausted ? 1 : 0),
            asked: pr.asked + (exhausted ? 1 : 0),
            mistakes,
          },
        })
      }
    },
    continuePractice: () => {
      const s = get()
      if (!s.practice.on) return
      const j = nextDecisionFrame(s.steps, s.index + 1, { scene: s.entry.scene, lines: s.practiceLines() }, s.index + 4)
      if (j === -1) {
        get().toastIt('ok', `Practice complete: ${s.practice.first} first try, ${s.practice.eventual} eventual, ${s.practice.wrong} missed`)
        set({ practice: { ...s.practice, on: false, q: null } })
        return
      }
      get().seek(j)
      set({ playing: false })
      get().askPractice(j)
    },
    retryMistake: (m) => {
      if (!m) return
      set((s) => ({ practice: { ...s.practice, review: false, on: true } }))
      get().seek(m.frame - 1)
      get().askPractice(m.frame - 1)
    },
    toggleReview: () => set((s) => ({ practice: { ...s.practice, review: !s.practice.review } })),
frame: () => set((s) => ({ frameToken: s.frameToken + 1 })),

    setQuality: (quality) => set({ quality }),
    railPinned: readPrefs().railPinned ?? false,
    setRailPinned: (railPinned) => set({ railPinned }),
    setAutoRotate: (v) => set({ autoRotate: v }),
    toggleCode: () => set((s) => ({ showCode: !s.showCode, panelTab: 'code', showInspectorPanel: true })),
    toggleInfo: () => set((s) => ({ showInfo: !s.showInfo, panelTab: 'learn', showInspectorPanel: true })),
    toggleInspectorPanel: () => set((s) => ({ showInspectorPanel: !s.showInspectorPanel })),
    setBrush: (brush) => set({ brush }),
    setSelected: (selected) => set({ selected }),
    setSpeed: (speed) => set({ speed }),

    toastIt: (kind, text) => {
      set({ toast: { kind, text, at: Date.now() } })
      setTimeout(() => {
        const t = get().toast
        if (t && Date.now() - t.at >= 2600) set({ toast: null })
      }, 2800)
    },

    /* ── switching structure ── */
    setEntry: (id) => {
      const entry = entryById(id)
      const machine = machineFor(entry)
      stopLoop()
      set({
        entry,
        machine,
        steps: [],
        index: 0,
        playing: false,
        atEnd: false,
        runMeta: null,
        selected: null,
        paintMode: false,
        editMode: false,
        selectedLink: null,
        editFocus: null,
        lastRun: null,
        frameToken: get().frameToken + 1,
        snapshot: machine.snapshot(),
      })
    },

    refresh: () => {
      const s = get()
      if (!s.steps.length) set({ snapshot: s.machine.snapshot() })
    },

    /* ── run an operation ── */
    runOp: (op, args, { autoplay = true } = {}) => {
      const s = get()
      stopLoop()

      if (op.action) {
        const out = op.action(s.machine, args)
        if (out && out.steps) return get().runOp({ ...op, action: undefined, run: () => out }, args, { autoplay })
        set({ steps: [], index: 0, playing: false, atEnd: false, runMeta: null, lastRun: { op, args }, snapshot: s.machine.snapshot() })
        return
      }

      /* pre-run state needed for link fidelity (sorting array) */
      const pre = s.entry.id === 'sorting' && s.machine?.array ? [...s.machine.array] : null

      let run
      try {
        run = op.run(s.machine, args)
      } catch (err) {
        console.error(err)
        get().toastIt('error', 'Operation failed. See the console.')
        set({ playing: false })
        return
      }

      if (!run) {
        set({ snapshot: s.machine.snapshot() })
        return
      }
      if (run.error) {
        get().toastIt('error', run.error)
        if (!run.steps?.length) {
          set({ playing: false })
          return
        }
      }
      if (!run.steps?.length) {
        set({ playing: false, snapshot: s.machine.snapshot() })
        return
      }

      set({
        steps: run.steps,
        index: 0,
        snapshot: run.steps[0],
        playing: false,
        atEnd: run.steps.length <= 1,
        runMeta: { op: op.id, label: op.label, summary: run.summary || null, error: run.error || null, count: run.steps.length },
        lastRun: { op, args, pre },
      })
      if (run.error) get().toastIt('error', run.error)
      else if (run.summary) get().toastIt('ok', run.summary)

      /* an open practice session follows the new run, never a stale question */
      if (get().practice.on) get().askPractice()

      if (autoplay && run.steps.length > 1) {
        set({ playing: true })
        startLoop(get, set)
      }
    },

    /* ── transport ── */
    play: () => {
      const s = get()
      if (s.steps.length < 2) return
      if (s.atEnd || s.index >= s.steps.length - 1) {
        applyIndex(get, set, 0)
      }
      set({ playing: true, atEnd: false })
      startLoop(get, set)
    },
    pause: () => {
      stopLoop()
      set({ playing: false })
    },
    togglePlay: () => (get().playing ? get().pause() : get().play()),
    seek: (i) => {
      stopLoop()
      set({ playing: false })
      applyIndex(get, set, i)
    },
    stepBy: (d) => {
      const s = get()
      if (!s.steps.length) return
      stopLoop()
      set({ playing: false })
      applyIndex(get, set, s.index + d)
    },
    restart: () => {
      const s = get()
      if (!s.steps.length) return
      stopLoop()
      applyIndex(get, set, 0)
      set({ playing: true, atEnd: false })
      startLoop(get, set)
    },
    jumpEnd: () => {
      const s = get()
      if (!s.steps.length) return
      stopLoop()
      set({ playing: false })
      applyIndex(get, set, s.steps.length - 1)
    },
    paintCellRefresh: () => {
      stopLoop()
      const s = get()
      set({ steps: [], index: 0, playing: false, atEnd: false, runMeta: null, snapshot: s.machine.snapshot() })
    },

    reRun: () => {
      const s = get()
      if (s.lastRun) s.runOp(s.lastRun.op, s.lastRun.args)
    },

    stopAll: () => {
      stopLoop()
      const s = get()
      set({ playing: false, steps: [], index: 0, atEnd: false, runMeta: null, snapshot: s.machine.snapshot() })
    },
  }
})



/* ── prefs: survive a reload, deep-link the entry ─────────────────────── */
function readPrefs() {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('structure-prefs') || '{}')
  } catch {
    return {}
  }
}
const PREF_KEYS = ['speed', 'quality', 'autoRotate', 'showCode', 'showInfo', 'panelTab', 'railPinned']
if (typeof window !== 'undefined') {
  let queued = false
  useLab.subscribe((state) => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const prefs = {}
      for (const k of PREF_KEYS) prefs[k] = state[k]
      try {
        localStorage.setItem('structure-prefs', JSON.stringify(prefs))
      } catch {
        /* private mode */
      }
    })
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && useLab.getState().playing) useLab.getState().pause()
  })
}
