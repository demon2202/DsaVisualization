import { useEffect, useRef, useState } from 'react'
import { useLab } from '../../state/lab'
import { ENTRIES, FAMILIES, entriesByFamily } from '../../lib/registry'
import Glyph from './Glyph'
import OpsPanel from './OpsPanel'

/**
 * Sidebar — the lab controls.
 *
 * Two jobs, never on screen at the same time: run the current model, or
 * change which model you are running. It opens on the operations; the full
 * structure list is one explicit "Change" away. That keeps the composer from
 * disappearing under a scroll of entries.
 */
export default function Sidebar({ mobile = false, onNavigate, onClose }) {
  const entry = useLab((state) => state.entry)
  const setEntry = useLab((state) => state.setEntry)
  const [choosing, setChoosing] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [choosing])

  const family = FAMILIES.find((item) => item.id === entry.family)

  const choose = (item) => {
    if (item.id !== entry.id) setEntry(item.id)
    setChoosing(false)
    if (mobile) onNavigate?.()
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#080808]">
      <div className={`flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 ${mobile ? 'h-14' : 'h-16'}`}>
        <div className="flex items-baseline gap-3">
          <span className="eyebrow text-bone-dim">Lab</span>
          <span className="mono-num text-[10px] text-faint">{ENTRIES.length} structures</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="icon-btn h-8 w-8" aria-label="Close the lab panel">
            <Glyph name="close" size={13} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="scroll min-h-0 flex-1 overflow-y-auto">
        {choosing ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <span className="eyebrow text-bone-dim">Choose a structure</span>
              <button
                onClick={() => setChoosing(false)}
                className="text-[11.5px] text-muted transition-colors hover:text-bone"
              >
                Back
              </button>
            </div>

            <nav aria-label="All structures">
              {FAMILIES.map((group) => {
                const items = entriesByFamily(group.id)
                if (!items.length) return null
                return (
                  <section key={group.id} className="border-b border-[var(--line)] px-4 pb-3 pt-4 last:border-b-0">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <h2 className="eyebrow text-bone-dim">{group.name}</h2>
                      <span className="mono-num text-[9.5px] text-faint">{group.note}</span>
                    </div>
                    <div>
                      {items.map((item) => {
                        const active = item.id === entry.id
                        const number = ENTRIES.findIndex((candidate) => candidate.id === item.id) + 1
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => choose(item)}
                            aria-current={active ? 'page' : undefined}
                            className={`group flex w-full items-baseline gap-3 border-b border-[var(--line)] py-2.5 text-left transition-colors last:border-b-0 ${
                              active ? 'text-bone' : 'text-muted hover:text-bone-dim'
                            }`}
                          >
                            <span className={`mono-num w-5 shrink-0 text-[10px] ${active ? 'text-signal' : 'text-faint'}`}>
                              {String(number).padStart(2, '0')}
                            </span>
                            <span className={`min-w-0 flex-1 text-[15px] tracking-[-0.01em] ${active ? 'font-medium' : ''}`}>
                              {item.name}
                            </span>
                            <span className={`mono-num shrink-0 text-[9px] uppercase ${active ? 'text-signal' : 'text-faint'}`}>
                              {active ? 'current' : item.abbr}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </nav>
          </>
        ) : (
          <>
            <div className="border-b border-[var(--line)] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">Structure</p>
                  <h2 className="mt-1.5 text-[17px] font-medium leading-[1.25] tracking-[-0.02em] text-bone">{entry.name}</h2>
                  <p className="mono-num mt-1 text-[9.5px] uppercase tracking-[0.12em] text-faint">
                    {family?.name} / {entry.abbr}
                  </p>
                </div>
                <button
                  onClick={() => setChoosing(true)}
                  aria-label="Change structure"
                  className="btn h-8 shrink-0 px-2.5 text-[11.5px]"
                >
                  Change
                </button>
              </div>
            </div>
            <OpsPanel key={entry.id} onNavigate={onNavigate} />
          </>
        )}
      </div>
    </div>
  )
}
