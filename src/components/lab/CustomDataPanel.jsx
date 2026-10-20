import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLab } from '../../state/lab'
import { applyCustomData, dataKind, initialCustomData } from '../../lib/customData'

const inputClass =
  'scroll w-full resize-y border border-[var(--line-2)] bg-ink-950 px-3 py-2.5 font-mono text-[12px] leading-[1.7] text-bone outline-none transition-colors placeholder:text-faint focus:border-signal'

export default function CustomDataPanel({ machine }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => initialCustomData(machine))
  const [error, setError] = useState('')
  const reduceMotion = useReducedMotion()
  const kind = dataKind(machine)

  const apply = () => {
    try {
      applyCustomData(machine, draft)
      const state = useLab.getState()
      state.syncMachine()
      state.frame()
      state.toastIt('ok', 'Starting data updated')
      setError('')
      setOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load this data.')
    }
  }

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const isGrid = kind === 'grid'
  const isGraph = kind === 'graph'
  const isText = kind === 'text-linear'
  const stringKind = isGrid ? 'map' : isGraph ? 'edges' : isText ? 'items' : kind === 'hash' ? 'keys' : 'numbers'
  const heading = isGrid ? 'Map' : isGraph ? 'Node labels' : 'Values'
  const hint = isGrid
    ? 'One row per line: . open, # wall, m mud, w water, S start, G goal.'
    : isGraph
      ? 'Comma-separated labels (2–26). Use short letters, numbers or underscores.'
      : isText
        ? 'Comma-separated items; each becomes one queue/deque value.'
        : kind === 'hash'
          ? `Comma-separated whole numbers; up to ${machine.capacity} unique keys.`
          : 'Comma-separated numbers. They replace the current starting structure.'

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 border border-[var(--line)] px-3 py-2.5 text-left transition-colors hover:border-[var(--line-2)] hover:bg-white/[0.025]"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex-1 text-[12.5px] text-bone-dim">Edit {stringKind}…</span>
        <span className={`text-[14px] text-faint transition-transform ${open ? 'rotate-45' : ''}`} aria-hidden="true">
          +
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-px border border-[var(--line-2)] bg-[#0b0b0b] p-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-muted">{heading}</span>
                <textarea
                  className={`${inputClass} ${isGrid ? 'min-h-32 whitespace-pre' : 'min-h-[64px]'}`}
                  spellCheck={false}
                  aria-label={heading}
                  value={draft.values || ''}
                  onChange={(event) => update('values', event.target.value)}
                />
              </label>
              <p className="mt-2 text-[11.5px] leading-[1.6] text-faint">{hint}</p>

              {isGraph && (
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[12px] text-muted">Weighted edges</span>
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    spellCheck={false}
                    aria-label="Weighted edges"
                    placeholder={'A-B:4\nA-C:2\nB-C:3'}
                    value={draft.edges || ''}
                    onChange={(event) => update('edges', event.target.value)}
                  />
                  <span className="mt-1.5 block text-[11.5px] text-faint">One edge per line: A-B or A-B:weight.</span>
                </label>
              )}

              {error && (
                <p role="alert" className="mt-2.5 border border-bad/40 bg-bad/10 px-3 py-2 text-[11.5px] leading-[1.6] text-bad">
                  {error}
                </p>
              )}
              <button type="button" onClick={apply} className="btn mt-3 h-9 w-full text-[12px]">
                Load data
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
