import { useEffect, useMemo, useRef } from 'react'
import { useLab } from '../../state/lab'
import { code } from '../../lib/pseudocode'
import { ENTRIES } from '../../lib/registry'
import Glyph from './Glyph'

/**
 * Pseudocode body for the explanation panel.
 * The active line is the current frame's own `code` array — the same data the
 * engine emitted — so the highlight can never disagree with the model.
 */
export default function CodePanel() {
  const runMeta = useLab((s) => s.runMeta)
  const entry = useLab((s) => s.entry)
  const snapshot = useLab((s) => s.snapshot)
  const activeRef = useRef(null)

  const op = useMemo(() => {
    const e = ENTRIES.find((x) => x.id === entry.id)
    return e?.ops.find((o) => o.id === runMeta?.op) || null
  }, [entry, runMeta])

  const lines = useMemo(() => (op?.code ? code(op.code) : []), [op])
  const active = new Set(snapshot?.code || [])

  /* keep the executing line in view without animating the whole panel */
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [snapshot?.code])

  if (!op || !lines.length) {
    return (
      <div className="px-5 py-6">
        <p className="text-[13.5px] leading-[1.7] text-muted">
          {op
            ? 'This operation changes the starting data; it does not run pseudocode.'
            : 'Run an operation to see its pseudocode.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
        <span className="text-signal">
          <Glyph name="code" size={13} />
        </span>
        <span className="truncate text-[13px] font-medium text-bone">{op.label}</span>
        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.12em] text-faint">pseudocode</span>
      </div>

      <div className="scroll min-h-0 flex-1 overflow-y-auto py-2">
        {lines.map((l, i) => {
          const hot = active.has(l.id)
          return (
            <div
              key={i}
              ref={hot ? activeRef : null}
              className={`relative flex gap-3 px-5 py-[3px] transition-colors duration-150 ${hot ? 'bg-signal/[0.07]' : ''}`}
            >
              {hot && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" aria-hidden="true" />}
              <span className={`mono-num w-5 shrink-0 select-none text-right text-[10.5px] leading-[1.95] ${hot ? 'text-signal' : 'text-faint/70'}`}>
                {i + 1}
              </span>
              <code
                style={{ paddingLeft: l.indent * 11 }}
                className={`code-face whitespace-pre-wrap text-[12px] leading-[1.95] ${hot ? 'text-bone' : 'text-muted'}`}
              >
                {l.text}
              </code>
            </div>
          )
        })}
      </div>

      {runMeta?.error && (
        <p className="mx-4 mb-3 border border-bad/40 bg-bad/10 px-3 py-2 text-[12px] text-bad">{runMeta.error}</p>
      )}
    </div>
  )
}
