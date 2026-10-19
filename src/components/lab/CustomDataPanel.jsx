import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLab } from '../../state/lab'
import { applyCustomData, dataKind, initialCustomData } from '../../lib/customData'

const inputClass =
  'w-full resize-y rounded-[4px] border border-[var(--line)] bg-ink-800/80 px-3 py-2 font-mono text-[12px] leading-relaxed text-bone outline-none transition-colors placeholder:text-faint focus:border-acid/60'

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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load this data.')
    }
  }

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const isGrid = kind === 'grid'
  const isGraph = kind === 'graph'
  const isText = kind === 'text-linear'
  const heading = isGrid ? 'Map' : isGraph ? 'Node labels' : 'Values'
  const hint = isGrid
    ? 'One row per line: . open, # wall, m mud, w water, S start, G goal.'
    : isGraph
      ? 'Comma-separated labels (2–26). Use short letters, numbers or underscores.'
      : isText
        ? 'Comma-separated items; each item becomes one queue/deque value.'
        : kind === 'hash'
          ? `Comma-separated whole numbers; up to ${machine.capacity} unique keys.`
          : 'Comma-separated numbers. Values replace the current starting structure.'

  return (
    <section className="mb-4 overflow-hidden rounded-[5px] border border-[var(--line)] bg-ink-850/60">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-ink-800"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-bone">Your starting data</span>
          <span className="mt-0.5 block text-[11px] text-faint">Build the structure from your own input</span>
        </span>
        <span className="text-[12px] text-muted">{open ? '−' : '+'}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--line)] px-3 pb-3 pt-3">
              <label className="block">
                <span className="label-xs mb-1.5 block">{heading}</span>
                <textarea
                  className={`${inputClass} ${isGrid ? 'min-h-32 whitespace-pre' : 'min-h-[58px]'}`}
                  spellCheck={false}
                  aria-label={heading}
                  value={draft.values || ''}
                  onChange={(event) => update('values', event.target.value)}
                />
              </label>
              <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{hint}</p>

              {isGraph && (
                <label className="mt-3 block">
                  <span className="label-xs mb-1.5 block">Weighted edges</span>
                  <textarea
                    className={`${inputClass} min-h-[82px]`}
                    spellCheck={false}
                    aria-label="Weighted edges"
                    placeholder={'A-B:4\nA-C:2\nB-C:3'}
                    value={draft.edges || ''}
                    onChange={(event) => update('edges', event.target.value)}
                  />
                  <span className="mt-1.5 block text-[11px] leading-relaxed text-faint">One edge per line in A-B:weight format. Weight is optional.</span>
                </label>
              )}

              {error && <p role="alert" className="mt-2 rounded-sm border border-bad/30 bg-bad/10 px-2.5 py-2 text-[12px] leading-relaxed text-bad">{error}</p>}
              <button
                type="button"
                onClick={apply}
                className="mt-3 w-full rounded-[4px] bg-bone px-3 py-2 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                Load starting data
              </button>
              <p className="mt-2 text-[10.5px] text-faint">This clears the current run and keeps the new structure as your starting point.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
