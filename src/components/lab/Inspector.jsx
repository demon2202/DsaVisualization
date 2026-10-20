import { useLab } from '../../state/lab'
import { HUE } from '../../lib/palette'
import CodePanel from './CodePanel'

const LABELS = {
  nodes: 'nodes', height: 'height', idealHeight: 'ideal height', balanced: 'balanced', min: 'min', max: 'max',
  comparisons: 'comparisons', swaps: 'swaps', writes: 'writes', sorted: 'sorted', total: 'array size',
  length: 'length', head: 'head', tail: 'tail', size: 'size', top: 'top', front: 'front', back: 'back',
  entries: 'entries', capacity: 'capacity', loadFactor: 'load factor', bucketsUsed: 'buckets used',
  longestChain: 'longest chain', probes: 'probes', root: 'root', levels: 'levels', edges: 'edges',
  density: 'density', mstCost: 'mst cost', visited: 'expanded', frontier: 'frontier',
  pathLength: 'path length', pathCost: 'path cost', walls: 'walls', cells: 'cells', balanceFactor: 'balance factor',
}

const fmt = (v) => {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(2)
  return String(v)
}

function useActiveOp(entry) {
  const opId = useLab((s) => s.runMeta?.op)
  if (!opId) return null
  const op = entry.ops.find((o) => o.id === opId)
  return op ? { id: opId, label: op.label, why: op.why || null } : null
}

const TABS = [
  { id: 'now', label: 'Now' },
  { id: 'code', label: 'Code' },
  { id: 'learn', label: 'Learn' },
]

const MARKS = [
  [HUE.probe, 'current'],
  [HUE.flow, 'visited'],
  [HUE.success, 'settled'],
  [HUE.special, 'moving'],
  [HUE.bad, 'removed'],
]

const idleNote = (entry) =>
  ({
    stack: 'Push, pop, peek, or run fact(n).',
    queue: 'Enqueue, dequeue, or reverse.',
    deque: 'Push and pop at either end.',
  })[entry.id] ||
  ({
    tree: 'Insert, search, or run a traversal.',
    list: 'Append, prepend, insert, or reverse.',
    linear: 'Push, pop, or run the recursion trace.',
    hash: 'Insert a key to see its bucket.',
    heap: 'Push, extract, or heapify an array.',
    graph: 'Choose a start node and an algorithm.',
    array: 'Choose one of the seven sorts.',
    grid: 'Run a search, or paint terrain first.',
  })[entry.scene] ||
  'Choose an operation to begin.'

function RunState() {
  const snapshot = useLab((s) => s.snapshot)
  const entry = useLab((s) => s.entry)
  const index = useLab((s) => s.index)
  const steps = useLab((s) => s.steps)
  const runMeta = useLab((s) => s.runMeta)
  const has = steps.length > 0
  const pct = has ? ((index + 1) / steps.length) * 100 : 0

  return (
    <div className="border-b border-[var(--line)] px-5 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="eyebrow text-bone-dim">{has ? runMeta?.label || 'Run' : 'Ready'}</h3>
        {has && (
          <span className="mono-num text-[11px] text-faint">
            frame <span className="text-bone-dim">{index + 1}</span> / {steps.length}
          </span>
        )}
      </div>

      {snapshot?.banner && (
        <span className="mono-num mt-3 inline-block border border-signal/45 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-signal">
          {snapshot.banner}
        </span>
      )}

      <p className="mt-3 text-[13.5px] leading-[1.7] text-muted">{has ? snapshot?.note || idleNote(entry) : idleNote(entry)}</p>

      {has && (
        <div className="mt-4 h-px bg-[var(--line)]">
          <div
            className="h-px bg-signal"
            style={{ width: `${pct}%`, transition: 'width 120ms linear' }}
          />
        </div>
      )}
    </div>
  )
}

function AuxReadout() {
  const aux = useLab((s) => s.snapshot?.aux)
  if (!aux || aux.kind !== 'math' || !aux.items?.length) return null
  return (
    <div className="border-b border-[var(--line)] px-5 py-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="eyebrow">{aux.title}</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {aux.items.map((item, i) => (
          <span key={i} className="code-face border border-[var(--line-2)] bg-[#0b0b0b] px-2 py-1 text-[11.5px] text-bone-dim">
            {item.value}
          </span>
        ))}
      </div>
    </div>
  )
}

function Metrics() {
  const snapshot = useLab((s) => s.snapshot)
  const entry = useLab((s) => s.entry)
  const stats = snapshot?.stats || {}
  const preferred = (entry.metrics || []).filter((k) => k in stats)
  const rest = Object.keys(stats).filter((k) => !preferred.includes(k))
  const keys = [...preferred, ...rest].slice(0, 8)
  if (!keys.length) return null

  return (
    <div className="border-b border-[var(--line)] px-5 py-5">
      <h3 className="eyebrow mb-2">Metrics</h3>
      <dl className="grid grid-cols-2 gap-x-6">
        {keys.map((k) => (
          <div key={k} className="flex items-baseline justify-between gap-2 border-b border-[var(--line)] py-2.5 last:border-b-0">
            <dt className="truncate text-[12.5px] text-muted">{LABELS[k] || k}</dt>
            <dd className="mono-num shrink-0 text-[13.5px] text-bone">{fmt(stats[k])}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Learn() {
  const entry = useLab((s) => s.entry)
  const active = useActiveOp(entry)
  const hasBest = entry.complexity.some((c) => c.best)

  return (
    <div className="scroll h-full overflow-y-auto">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <h3 className="eyebrow mb-2.5">Overview</h3>
        <p className="text-[13.5px] leading-[1.75] text-bone-dim">{entry.blurb}</p>
      </div>

      {active?.why && (
        <div className="border-b border-[var(--line)] px-5 py-5">
          <h3 className="eyebrow mb-2.5">When to use it</h3>
          <p className="text-[13px] leading-[1.75] text-muted">{active.why}</p>
        </div>
      )}

      <div className="border-b border-[var(--line)] px-5 py-5">
        <h3 className="eyebrow mb-3">Complexity</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10.5px] text-faint">
              <th className="pb-2 text-left font-normal">operation</th>
              {hasBest && <th className="pb-2 text-right font-normal">best</th>}
              <th className="pb-2 text-right font-normal">average</th>
              <th className="pb-2 text-right font-normal">worst</th>
            </tr>
          </thead>
          <tbody>
            {entry.complexity.map((c) => {
              const hot = active && c.op.toLowerCase().includes(active.id)
              return (
                <tr key={c.op} className="border-t border-[var(--line)]">
                  <td className={`py-2.5 pr-2 text-[12.5px] ${hot ? 'text-bone' : 'text-bone-dim'}`}>
                    {hot && <span className="mr-1.5 inline-block h-[3px] w-[3px] bg-signal align-middle" aria-hidden="true" />}
                    {c.op}
                  </td>
                  {hasBest && <td className="py-2.5 text-right text-[12.5px] text-muted">{c.best || '—'}</td>}
                  <td className={`py-2.5 text-right text-[12.5px] ${hot ? 'text-signal' : 'text-bone-dim'}`}>{c.avg}</td>
                  <td className="py-2.5 text-right text-[12.5px] text-muted">{c.worst}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-b border-[var(--line)] px-5 py-5">
        <h3 className="eyebrow mb-3">Details</h3>
        <ul className="flex flex-col gap-3">
          {entry.facts.map((f, i) => (
            <li key={i} className="flex gap-3 text-[12.5px] leading-[1.72] text-muted">
              <span className="mt-[8px] h-[3px] w-[3px] shrink-0 bg-signal/80" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-5">
        <h3 className="eyebrow mb-3">Applications</h3>
        <div className="flex flex-wrap gap-1.5">
          {entry.where.map((w) => (
            <span key={w} className="border border-[var(--line-2)] px-2.5 py-1.5 text-[11.5px] text-bone-dim">
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Inspector({ onClose }) {
  const tab = useLab((s) => s.panelTab)
  const setTab = useLab((s) => s.setPanelTab)

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#080808]">
      <div className="flex h-16 shrink-0 items-center border-b border-[var(--line)] px-5">
        <div role="tablist" aria-label="Explanation" className="flex flex-1 items-center">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className="tab"
            >
              {t.label}
            </button>
          ))}
        </div>
        {onClose && (
          <button onClick={onClose} className="icon-btn -mr-2 h-8 w-8" aria-label="Close panel" title="Close panel (i)">
            <span aria-hidden="true" className="text-[18px] leading-none">×</span>
          </button>
        )}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="min-h-0 flex-1 overflow-hidden">
        {tab === 'now' && (
          <div className="scroll h-full overflow-y-auto">
            <RunState />
            <AuxReadout />
            <Metrics />
            <div className="px-5 py-5">
              <h3 className="eyebrow mb-3">Marks</h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-2.5">
                {MARKS.map(([color, label]) => (
                  <li key={label} className="flex items-center gap-2 text-[11.5px] text-muted">
                    <span className="h-2 w-2 shrink-0" style={{ background: color }} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {tab === 'code' && <CodePanel />}
        {tab === 'learn' && <Learn />}
      </div>
    </div>
  )
}
