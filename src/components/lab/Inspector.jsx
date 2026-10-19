import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLab } from '../../state/lab'

/* the op the user just ran, so complexity context lands at the moment of need */
function useActiveOp(entry) {
  const opId = useLab((s) => s.runMeta?.op)
  if (!opId) return null
  const op = entry.ops.find((o) => o.id === opId)
  return op ? { id: opId, label: op.label, why: op.why || null } : null
}

const LABELS = {
  nodes: 'nodes',
  height: 'height',
  idealHeight: 'ideal h',
  balanced: 'balanced',
  min: 'min',
  max: 'max',
  comparisons: 'compares',
  swaps: 'swaps',
  writes: 'writes',
  sorted: 'sorted',
  total: 'of',
  length: 'length',
  head: 'head',
  tail: 'tail',
  size: 'size',
  top: 'top',
  front: 'front',
  back: 'back',
  entries: 'entries',
  capacity: 'slots',
  loadFactor: 'load',
  bucketsUsed: 'used',
  longestChain: 'max chain',
  probes: 'probes',
  root: 'root',
  levels: 'levels',
  edges: 'edges',
  density: 'density',
  mstCost: 'mst cost',
  visited: 'expanded',
  frontier: 'frontier',
  pathLength: 'path len',
  pathCost: 'path cost',
  walls: 'walls',
  cells: 'cells',
  balanceFactor: 'balance',
}

const fmt = (v) => {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(2)
  return String(v)
}

export default function Inspector() {
  const snapshot = useLab((s) => s.snapshot)
  const entry = useLab((s) => s.entry)
  const index = useLab((s) => s.index)
  const steps = useLab((s) => s.steps)
  const showInfo = useLab((s) => s.showInfo)
  const seek = useLab((s) => s.seek)
  const toggleInfo = useLab((s) => s.toggleInfo)
  const reduceMotion = useReducedMotion()

  const active = useActiveOp(entry)
  const activeOp = active?.id || null
  const activeWhy = active?.why ? active : null
  const hasBest = entry.complexity.some((c) => c.best)

  const stats = snapshot?.stats || {}
  const keys = Object.keys(stats).filter((k) => k in LABELS || entry.metrics?.includes(k))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* live narration */}
      <div className="relative min-h-[188px] shrink-0 border-b border-[var(--line)] px-5 py-5">
        <AnimatePresence initial={false}>
          <motion.div
            key={snapshot?.note || 'idle'}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {snapshot?.banner && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-[4px] border border-acid/30 bg-acid/10 px-2.5 py-1 text-[12px] font-semibold text-acid">
                {snapshot.banner}
              </div>
            )}
            <p className="max-w-[42ch] text-[14px] leading-[1.8] text-bone-dim">{snapshot?.note || 'Pick an operation on the left. The viewport narrates every frame.'}</p>
          </motion.div>
        </AnimatePresence>
        {steps.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-faint">
            <span className="text-bone-dim">
              {index + 1}
              <span className="text-faint"> / {steps.length}</span>
            </span>
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span>frame</span>
          </div>
        )}
      </div>

      <div className="scroll flex-1 overflow-y-auto">
        {/* frame transcript — the teaching content, reviewable */}
        {steps.length > 1 && (
          <details className="border-b border-[var(--line)] px-4 py-3">
            <summary className="label-xs cursor-pointer select-none py-1 hover:text-bone">frame transcript · click to jump</summary>
            <div className="max-h-[26vh] overflow-y-auto pr-1">
              {steps.slice(0, 400).map((st, i) => (
                <button
                  key={i}
                  onClick={() => seek(i)}
                  className={`flex w-full gap-2 rounded-[3px] px-1.5 py-1 text-left text-[13px] leading-snug transition-colors ${
                    i === index ? 'bg-ink-700 text-bone' : 'text-muted hover:bg-ink-800 hover:text-bone-dim'
                  }`}
                >
                  <span className="mono-num shrink-0 text-faint">{i + 1}</span>
                  <span className="line-clamp-2">{st.note || '(no narration)'}</span>
                </button>
              ))}
            </div>
          </details>
        )}

        {/* live metrics */}
        <div className="border-b border-[var(--line)] px-4 py-3.5">
          <div className="label-xs mb-2.5">live state</div>
          {keys.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {keys.map((k) => (
                <div key={k}>
                  <div className="label-xs mb-0.5">{LABELS[k] || k}</div>
                  <div className="mono-num truncate text-[15px] font-semibold text-bone">{fmt(stats[k])}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px] text-faint">metrics appear once a structure is loaded.</p>
          )}
        </div>

        <div className="border-b border-[var(--line)] px-4 py-3">
          <button
            type="button"
            onClick={toggleInfo}
            aria-expanded={showInfo}
            className="flex w-full items-center justify-between text-left"
          >
            <span>
              <span className="label-xs block">Learning notes</span>
              <span className="mt-1 block text-[12px] text-faint">Complexity, useful facts and real-world context</span>
            </span>
            <span className="text-[14px] text-acid" aria-hidden="true">{showInfo ? '−' : '+'}</span>
          </button>
        </div>

        {showInfo && (
          <>
            {/* complexity */}
            <div className="border-b border-[var(--line)] px-4 py-3.5">
              <div className="label-xs mb-2.5">complexity</div>
              {activeWhy && (
                <p className="mb-3 rounded-[4px] border border-[var(--line)] bg-ink-800/50 px-3 py-2 text-[12px] leading-relaxed text-bone-dim">
                  <span className="text-acid">{activeWhy.label} · </span>
                  {activeWhy.why}
                </p>
              )}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="label-xs">
                    <th className="pb-1.5 text-left font-medium">op</th>
                    {hasBest && <th className="pb-1.5 text-right font-medium">best</th>}
                    <th className="pb-1.5 text-right font-medium">avg</th>
                    <th className="pb-1.5 text-right font-medium">worst</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.complexity.map((c) => {
                    const active = activeOp && c.op.toLowerCase().includes(activeOp)
                    return (
                      <tr key={c.op} className={`border-t border-[var(--line)] ${active ? 'bg-ink-800/60' : ''}`}>
                        <td className={`py-1.5 pr-2 text-[13px] ${active ? 'text-bone' : 'text-bone-dim'}`}>
                          {active && <span aria-hidden="true" className="mr-1.5 inline-block h-1 w-1 rounded-full bg-acid align-middle" />}
                          {c.op}
                        </td>
                        {hasBest && <td className="py-1.5 text-right text-[13px] text-muted">{c.best || '—'}</td>}
                        <td className="py-1.5 text-right text-[13px] text-acid/90">{c.avg}</td>
                        <td className="py-1.5 text-right text-[13px] text-muted">{c.worst}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-faint">
                These bounds count operations as input grows — not stopwatch seconds. Constants, cache behaviour and memory
                layout decide real speed, so compare algorithms by counts on the same input, never by claimed runtime.
              </p>
            </div>

            {/* facts */}
            <div className="border-b border-[var(--line)] px-4 py-3.5">
              <div className="label-xs mb-2.5">worth knowing</div>
              <ul className="flex flex-col gap-2.5">
                {entry.facts.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-muted">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-acid/70" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* real world */}
            <div className="px-4 py-3.5">
              <div className="label-xs mb-2.5">used for</div>
              <div className="flex flex-wrap gap-1.5">
                {entry.where.map((w) => (
                  <span key={w} className="rounded-[4px] border border-[var(--line)] bg-ink-800/60 px-2.5 py-1 text-[12px] text-bone-dim">
                    {w}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-faint">{entry.blurb}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
