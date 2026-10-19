import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLab } from '../../state/lab'
import { code } from '../../lib/pseudocode'
import { ENTRIES } from '../../lib/registry'
import Glyph from './Glyph'
import '../../styles/lab-code.css'

export default function CodePanel() {
  const showCode = useLab((s) => s.showCode)
  const toggleCode = useLab((s) => s.toggleCode)
  const runMeta = useLab((s) => s.runMeta)
  const entry = useLab((s) => s.entry)
  const snapshot = useLab((s) => s.snapshot)

  const op = useMemo(() => {
    const e = ENTRIES.find((x) => x.id === entry.id)
    return e?.ops.find((o) => o.id === runMeta?.op) || null
  }, [entry, runMeta])

  const lines = useMemo(() => (op?.code ? code(op.code) : []), [op])
  const active = new Set(snapshot?.code || [])

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-20 w-[min(360px,calc(100%-2rem))]">
      <AnimatePresence>
        {showCode && lines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="panel overflow-hidden shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-acid">
                  <Glyph name="code" size={13} />
                </span>
                <span className="text-[14px] font-semibold text-bone">{op.label}</span>
                <span className="label-xs">pseudocode</span>
              </div>
              <button onClick={toggleCode} className="code-face text-[12px] text-faint transition-colors hover:text-bone">
                hide
              </button>
            </div>
            <div className="max-h-[42vh] overflow-y-auto py-2 text-[14px] leading-[1.7]">
              {lines.map((l, i) => {
                const hot = active.has(l.id)
                return (
                  <div
                    key={i}
                    className={`relative flex gap-3 px-3 transition-colors duration-200 ${hot ? 'bg-acid/10 text-bone' : 'text-muted'}`}
                  >
                    {hot && <span className="absolute inset-y-0 left-0 w-[2px] bg-acid" />}
                    <span className={`mono-num w-6 shrink-0 text-right text-[14px] ${hot ? 'text-acid' : 'text-faint'}`}>{i + 1}</span>
                    <code style={{ paddingLeft: l.indent * 12 }} className={`code-face ${hot ? 'font-semibold' : ''}`}>
                      {l.text}
                    </code>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!showCode && (
        <button
          onClick={toggleCode}
          className="panel flex items-center gap-2 px-3 py-2 text-[14px] text-muted transition-colors hover:text-bone"
        >
          <Glyph name="code" size={13} /> pseudocode
        </button>
      )}
    </div>
  )
}
