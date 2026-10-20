import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLab } from '../../state/lab'
import { TONE } from '../../lib/registry'
import CustomDataPanel from './CustomDataPanel'

const GROUP_LABEL = { sort: 'Algorithms', traverse: 'Traversals', search: 'Search algorithms' }

function Field({ field, value, onChange, machine }) {
  if (field.type === 'select') {
    return (
      <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
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
      <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
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
      className="field"
      type="text"
      inputMode={field.type === 'number' ? 'numeric' : undefined}
      placeholder={field.placeholder}
      aria-label={field.label || field.placeholder || field.key}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.closest('[data-composer]')?.querySelector('[data-run]')?.click()
        }
        e.stopPropagation()
      }}
    />
  )
}

function Composer({ op, machine, values, onChange, onRun }) {
  const runLabel = op.paint
    ? 'Start painting'
    : /^run\b/i.test(op.label)
      ? op.label
      : `${op.tone === 'ghost' ? 'Apply' : 'Run'} ${op.label.toLowerCase()}`
  return (
    <motion.div
      data-composer
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="mb-2 mt-1 border border-[var(--line-2)] bg-[#0b0b0b] p-3.5">
        <div className="flex flex-col gap-3">
          {(op.fields || []).map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1.5 block text-[12px] text-muted">{f.label}</span>
              <Field field={f} machine={machine} value={values?.[f.key]} onChange={(v) => onChange(f.key, v)} />
            </label>
          ))}
        </div>
        {op.note && <p className="mt-2.5 text-[11.5px] leading-[1.65] text-faint">{op.note}</p>}
        <button data-run onClick={onRun} className="btn btn-primary mt-3 w-full text-[12.5px]">
          {runLabel}
          <span className="opacity-60">↵</span>
        </button>
      </div>
    </motion.div>
  )
}

export default function OpsPanel({ onNavigate }) {
  const entry = useLab((s) => s.entry)
  const machine = useLab((s) => s.machine)
  const runOp = useLab((s) => s.runOp)
  const selected = useLab((s) => s.selected)
  const paintMode = useLab((s) => s.paintMode)
  const setPaintMode = useLab((s) => s.setPaintMode)
  const brush = useLab((s) => s.brush)
  const setBrush = useLab((s) => s.setBrush)

  const [openOp, setOpenOp] = useState(null)
  const [argsByOp, setArgsByOp] = useState({})

  const argsFor = (op) => {
    const stored = argsByOp[op.id]
    const out = {}
    for (const f of op.fields || []) {
      let v = stored?.[f.key]
      if (v === undefined || v === null || v === '') {
        if (f.type === 'node') {
          const labels = machine.labels?.() || []
          v = labels.some((l) => l.id === selected) ? selected : labels[0]?.id
        } else v = f.default
      }
      out[f.key] = v
    }
    return out
  }

  const launch = (op) => {
    if (op.paint) {
      setBrush(argsFor(op).mode)
      setPaintMode(true)
      setOpenOp(null)
      onNavigate?.()
      return
    }
    runOp(op, op.fields?.length ? argsFor(op) : {})
    if (op.tone !== 'ghost') setOpenOp(null)
    if (op.tone !== 'ghost') onNavigate?.()
  }

  const primaryOps = entry.ops.filter((o) => o.tone !== 'ghost')
  const dataOps = entry.ops.filter((o) => o.tone === 'ghost')

  const renderOp = (op) => {
    const tone = TONE[op.tone] || TONE.ghost
    const needsFields = op.fields?.length > 0
    const open = openOp === op.id
    return (
      <div key={op.id} className="border-b border-[var(--line)] last:border-b-0">
        <button
          type="button"
          onClick={() => (needsFields ? setOpenOp(open ? null : op.id) : launch(op))}
          aria-expanded={needsFields ? open : undefined}
          className={`group flex w-full items-center gap-3 px-1 py-3 text-left transition-colors duration-150 ${
            open ? 'bg-white/[0.035] text-bone' : 'text-bone-dim hover:bg-white/[0.025] hover:text-bone'
          }`}
        >
          <span className="h-3.5 w-[2px] shrink-0" style={{ background: tone.fg }} aria-hidden="true" />
          <span className="flex-1 truncate text-[14px] tracking-[-0.01em]">{op.label}</span>
          {needsFields ? (
            <span className={`pr-1 text-[15px] text-faint transition-transform ${open ? 'rotate-45' : ''}`} aria-hidden="true">
              +
            </span>
          ) : (
            <span className="pr-1 text-[10px] uppercase tracking-[0.12em] text-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
              run
            </span>
          )}
        </button>
        <AnimatePresence initial={false}>
          {open && needsFields && (
            <Composer
              op={op}
              machine={machine}
              values={argsFor(op)}
              onChange={(key, v) => setArgsByOp((s) => ({ ...s, [op.id]: { ...s[op.id], [key]: v } }))}
              onRun={() => launch(op)}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8">
      <div className="flex items-baseline justify-between pb-1 pt-5">
        <h2 className="eyebrow text-bone-dim">Operations</h2>
        <span className="mono-num text-[10px] text-faint">{String(primaryOps.length).padStart(2, '0')}</span>
      </div>

      {primaryOps.map((op, i) => {
        const showGroup = op.group && (i === 0 || primaryOps[i - 1].group !== op.group)
        return (
          <div key={op.id}>
            {showGroup && (
              <div className="pb-1 pt-4 text-[11px] uppercase tracking-[0.13em] text-faint">{GROUP_LABEL[op.group] || op.group}</div>
            )}
            {renderOp(op)}
          </div>
        )
      })}

      {entry.paintable && (
        <div className="mt-5 border border-[var(--line-2)] bg-[#0b0b0b] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-bone-dim">Paint terrain</span>
            <button
              onClick={() => setPaintMode(!paintMode)}
              aria-pressed={paintMode}
              className={`mono-num h-6 border px-2 text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                paintMode ? 'border-signal bg-signal text-[#080706]' : 'border-[var(--line-2)] text-faint hover:text-bone'
              }`}
              aria-label="Toggle terrain painting"
            >
              {paintMode ? 'on' : 'off'}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-px bg-[var(--line)]">
            {['wall', 'mud', 'water', 'open', 'start', 'goal'].map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBrush(b)
                  setPaintMode(true)
                }}
                aria-pressed={brush === b && paintMode}
                className={`h-8 bg-[#0b0b0b] text-[11.5px] capitalize transition-colors ${
                  brush === b && paintMode ? 'text-signal' : 'text-muted hover:text-bone'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11.5px] leading-[1.6] text-faint">Drag on the grid to paint, then run a search.</p>
        </div>
      )}

      <div className="pb-1 pt-6">
        <h2 className="eyebrow text-bone-dim">Starting data</h2>
      </div>
      <div>
        <CustomDataPanel key={entry.id} machine={machine} />
      </div>

      <div className="mt-2 flex flex-col">
        {dataOps.filter((op) => op.id !== 'custom').map((op) => renderOp(op))}
      </div>
    </div>
  )
}
