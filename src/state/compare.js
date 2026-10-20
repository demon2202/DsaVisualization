/**
 * compare.js — side-by-side sorting comparison on one shared input.
 *
 * Both algorithms run as independent engine instances over the SAME values,
 * so every metric comes from real recorded runs (stats comparisons / swaps /
 * writes) and both timelines are real snapshot arrays. Lockstep playback
 * advances each side one frame per tick; a finished side holds its final
 * frame while the other completes — different step counts are the point.
 *
 * No wall-clock timing is measured or implied anywhere: operation counts
 * describe the run, not the machine.
 */
import { create } from 'zustand'
import { createSorter, randomArray, almostSortedArray, reversedArray } from '../lib/structures/sorting'
import { mulberry } from '../lib/rng'

const DWELL = 720
let timer = null

export const SORT_ALGS = [
  { id: 'bubble', label: 'Bubble' },
  { id: 'selection', label: 'Selection' },
  { id: 'insertion', label: 'Insertion' },
  { id: 'shell', label: 'Shell' },
  { id: 'merge', label: 'Merge' },
  { id: 'quick', label: 'Quick' },
  { id: 'heap', label: 'Heap' },
]

export const useCompare = create((set, get) => ({
  algA: 'bubble',
  algB: 'quick',
  size: 16,
  shape: 'random',
  values: [],
  stepsA: [],
  stepsB: [],
  iA: 0,
  iB: 0,
  playing: false,
  speed: 1,

  setAlg: (side, id) => {
    set(side === 'A' ? { algA: id } : { algB: id })
    get().run()
  },
  setShape: (shape) => {
    set({ shape })
    get().makeArray(false)
    get().run()
  },
  setSize: (size) => {
    set({ size })
    get().makeArray(false)
    get().run()
  },
  newArray: () => {
    get().makeArray(true)
    get().run()
  },
  setSpeed: (speed) => {
    set({ speed })
    if (get().playing) {
      get().stop()
      get().start()
    }
  },

  makeArray: (fresh) => {
    const { size, shape, values } = get()
    if (!fresh && values.length === size && shape === 'custom') return
    const rng = mulberry(fresh ? (Date.now() % 100000) + 7 : 2026)
    const vals =
      shape === 'reversed'
        ? reversedArray(size)
        : shape === 'almost'
          ? almostSortedArray(size, 3, rng)
          : randomArray(size, 100, rng)
    set({ values: vals })
  },

  run: () => {
    get().stop()
    let { values, algA, algB } = get()
    if (!values.length) {
      get().makeArray(false)
      values = get().values
    }
    const mA = createSorter([...values])
    const mB = createSorter([...values])
    const rA = mA[algA]?.() || { steps: [] }
    const rB = mB[algB]?.() || { steps: [] }
    set({ stepsA: rA.steps || [], stepsB: rB.steps || [], iA: 0, iB: 0, playing: false })
  },

  start: () => {
    const s = get()
    if (!s.stepsA.length || !s.stepsB.length) return
    if (s.iA >= s.stepsA.length - 1 && s.iB >= s.stepsB.length - 1) set({ iA: 0, iB: 0 })
    set({ playing: true })
    timer = setInterval(() => get().tick(), DWELL / s.speed)
  },
  stop: () => {
    if (timer) clearInterval(timer)
    timer = null
    set({ playing: false })
  },
  togglePlay: () => (get().playing ? get().stop() : get().start()),
  tick: () => {
    const s = get()
    const iA = Math.min(s.iA + 1, s.stepsA.length - 1)
    const iB = Math.min(s.iB + 1, s.stepsB.length - 1)
    set({ iA, iB })
    if (iA >= s.stepsA.length - 1 && iB >= s.stepsB.length - 1) get().stop()
  },
  step: () => {
    get().stop()
    const s = get()
    set({ iA: Math.min(s.iA + 1, s.stepsA.length - 1), iB: Math.min(s.iB + 1, s.stepsB.length - 1) })
  },
  restart: () => {
    get().stop()
    set({ iA: 0, iB: 0 })
  },
  seekA: (i) => set((s) => ({ iA: Math.max(0, Math.min(i, s.stepsA.length - 1)) })),
  seekB: (i) => set((s) => ({ iB: Math.max(0, Math.min(i, s.stepsB.length - 1)) })),
}))
