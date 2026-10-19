import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLab } from '../../state/lab'
import { TONE } from '../../lib/registry'
import Glyph from './Glyph'
import CustomDataPanel from './CustomDataPanel'

function Field({ field, value, onChange, machine }) {
  const base =
    'w-full rounded-[4px] border border-[var(--line)] bg-ink-800/80 px-2.5 py-1.5 text-[12px] text-bone outline-none transition-colors placeholder:text-faint focus:border-acid/60 focus:bg-ink-750'
  if (field.type === 'select') {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === 'node') {
    const labels = machine?.labels?.() || []
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        {labels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      className={base}
      type={field.type === 'number' ? 'text' : 'text'}
      inputMode={field.type === 'number' ? 'numeric' : undefined}
      placeholder={field.placeholder}
      aria-label={field.label || field.placeholder || field.key}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.closest('[data-composer]')?.querySelector('[data-run]')?.click()
        e.stopPropagation()
      }}
    />
  )
}

export default function OpsPanel() {
  const entry = useLab((s) => s.entry)
  const machine = useLab((s) => s.machine)
  const runOp = useLab((s) => s.runOp)
  const selected = useLab((s) => s.selected)
  const paintMode = useLab((s) => s.paintMode)
  const setPaintMode = useLab((s) => s.setPaintMode)
  const brush = useLab((s) => s.brush)
  const setBrush = useLab((s) => s.setBrush)
  const steps = useLab((s) => s.steps)

  const [openOp, setOpenOp] = useState(entry.ops.find((o) => o.fields?.length)?.id || null)
  const [argsByOp, setArgsByOp] = useState({})
  const [filter, setFilter] = useState('')
  const filterRef = useRef(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setOpenOp(entry.ops.find((o) => o.fields?.length)?.id || null)
    setArgsByOp({})
    setFilter('')
  }, [entry])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      filterRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const visibleOps = entry.ops.filter((op) =>
    `${op.label} ${op.group || ''} ${op.note || ''}`.toLowerCase().includes(filter.trim().toLowerCase()),
  )

  const argsFor = (op) => {
    const stored = argsByOp[op.id]
    const out = {}
    for (const f of op.fields || []) {
      let v = stored?.[f.key]
      if (v === undefined || v === null || v === '') {
        if (f.type === 'node') v = selected && (machine.labels?.() || []).some((l) => l.id === selected) ? selected : machine.labels?.()[0]?.id
        else v = f.default
      }
      out[f.key] = v
    }
    return out
  }

  const launch = (op) => {
    if (!op.fields?.length) {
      runOp(op, {})
      return
    }
    runOp(op, argsFor(op))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--line)] px-4 pb-5 pt-5">
        <div className="label-xs mb-2 font-semibold uppercase tracking-[0.11em] text-acid">{entry.family}</div>
        <h2 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.025em] text-bone">{entry.name}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{entry.tagline}</p>
      </div>

      <div className="scroll flex-1 overflow-y-auto px-3.5 py-4">
        <CustomDataPanel key={entry.id} machine={machine} />
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="label-xs font-semibold uppercase tracking-[0.12em]">operations</div>
          <span className="text-[10px] text-faint">/ to find</span>
        </div>
        <label className="mb-2.5 flex items-center gap-2 rounded-[4px] border border-[var(--line)] bg-ink-850/70 px-2.5 focus-within:border-acid/50">
          <Glyph name="search" size={14} stroke={1.5} />
          <input
            ref={filterRef}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setFilter('')
                event.currentTarget.blur()
              }
            }}
            className="min-w-0 flex-1 bg-transparent py-2 text-[12px] text-bone outline-none placeholder:text-faint"
            placeholder="Find an operation"
            aria-label="Find an operation"
          />
          {filter && (
            <button
              type="button"
              onClick={() => {
                setFilter('')
                filterRef.current?.focus()
              }}
              aria-label="Clear operation search"
              className="text-[13px] text-faint hover:text-bone"
            >
              ×
            </button>
          )}
        </label>
        <div className="flex flex-col gap-1.5">
          {visibleOps.map((op) => {
            const tone = TONE[op.tone] || TONE.ghost
            const open = openOp === op.id && op.fields?.length > 0
            return (
              <div key={op.id}>
                <button
                  onClick={() => (op.fields?.length ? setOpenOp(open ? null : op.id) : launch(op))}
                  className={`group flex w-full items-center gap-2.5 rounded-[3px] border px-3 py-2.5 text-left transition-[background-color,border-color] duration-200 ${
                    open ? 'border-acid/35 border-l-2 bg-ink-750' : 'border-transparent hover:border-[var(--line)] hover:bg-ink-800'
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tone.fg, boxShadow: `0 0 8px ${tone.fg}55` }} />
                  <span className="flex-1 text-[14px] font-medium text-bone-dim transition-colors group-hover:text-bone">{op.label}</span>
                  {op.fields?.length > 0 ? (
                    <span className="text-[12px] text-faint">{open ? '−' : '+'}</span>
                  ) : (
                    <span className="text-[12px] text-faint opacity-0 transition-opacity group-hover:opacity-100">run</span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="composer"
                      data-composer
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mb-1 ml-1 mt-1 flex flex-col gap-2.5 rounded-[3px] border border-[var(--line)] bg-ink-850 p-3">
                        {op.fields.map((f) => (
                          <label key={f.key} className="block">
                            <span className="label-xs mb-1 block">{f.label}</span>
                            <Field
                              field={f}
                              machine={machine}
                              value={argsFor(op)[f.key]}
                              onChange={(v) => setArgsByOp((s) => ({ ...s, [op.id]: { ...s[op.id], [f.key]: v } }))}
                            />
                          </label>
                        ))}
                        {op.note && <p className="text-[13px] leading-snug text-faint">{op.note}</p>}
                        <button
                          data-run
                          onClick={() => launch(op)}
                          className={`mt-0.5 flex items-center justify-center gap-2 rounded-[4px] px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                            op.tone === 'ghost'
                              ? 'border border-[var(--line-2)] bg-transparent text-bone-dim hover:text-bone'
                              : 'bg-bone text-ink-950 hover:bg-gold'
                          }`}
                        >
                          run
                          <span className="opacity-60">↵</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {visibleOps.length === 0 && (
            <p className="rounded-[4px] border border-dashed border-[var(--line)] px-3 py-4 text-center text-[12px] leading-relaxed text-faint">
              No operation matches “{filter}”.
            </p>
          )}
        </div>

        {entry.paintable && (
          <>
            <div className="label-xs mb-2 mt-5 px-1">map editing</div>
            <div className="rounded-[6px] border border-[var(--line)] bg-ink-850/60 p-2.5">
              <button
                onClick={() => setPaintMode(!paintMode)}
                className={`flex w-full items-center justify-between rounded-[4px] px-2.5 py-2 text-[13px] transition-colors ${
                  paintMode ? 'bg-acid text-ink-950' : 'bg-ink-750 text-bone-dim hover:text-bone'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Glyph name="brush" size={13} /> paint terrain
                </span>
                <span>{paintMode ? 'ON' : 'OFF'}</span>
              </button>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {['wall', 'mud', 'water', 'open', 'start', 'goal'].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setBrush(b)
                      setPaintMode(true)
                    }}
                    className={`rounded px-1 py-1.5 text-[12px] capitalize transition-colors ${
                      brush === b && paintMode ? 'bg-ink-600 text-bone' : 'text-muted hover:bg-ink-750 hover:text-bone-dim'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-faint">With painting on, drag across the grid to sculpt terrain, or drop the start and goal cells, then re-run a search.</p>
            </div>
          </>
        )}

        {steps.length > 0 && (
          <div className="mt-5 rounded-[6px] border border-[var(--line)] bg-ink-850/60 p-2.5">
            <div className="label-xs mb-1.5">timeline</div>
            <p className="text-[13px] leading-relaxed text-bone-dim">
              {steps.length} recorded frames · scrub any of them in the transport bar. Every frame is a full snapshot, so going backwards is exact.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
