/**
 * BarViz — the flat sorting stage.
 *
 * Bars keep their node identity across frames, so a swap reads as the same
 * value moving, not as two colours changing places. Values sit above their
 * bar and indices below the baseline. When the row is wider than the screen
 * it scrolls horizontally at a fixed minimum bar width instead of shrinking
 * the numerals into dust.
 */
import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { stateOf } from '../../lib/palette'

const HOT = new Set(['probe', 'active', 'swap', 'insert', 'found', 'target', 'pivot', 'remove', 'recurse', 'set', 'visit', 'path'])

const num = (v) => (v === null || v === undefined ? '' : String(v))

export default function BarViz({
  snapshot,
  className = '',
  compact = false,
  showIndex = true,
  showValues = true,
  minBar = null,
}) {
  const reduced = useReducedMotion()
  const bars = useMemo(
    () =>
      (snapshot?.nodes || [])
        .filter((n) => n.bar)
        .slice()
        .sort((a, b) => (a.bar.index ?? 0) - (b.bar.index ?? 0)),
    [snapshot],
  )
  const max = useMemo(() => Math.max(1, ...bars.map((b) => Number(b.value) || 0)), [bars])
  const layout = reduced ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 30, mass: 0.75 }
  const count = bars.length
  const barMin = minBar ?? (compact ? 20 : 24)
  const labelEvery = count > 32 ? 2 : 1
  const font = compact ? (count > 24 ? 9 : 10.5) : count > 32 ? 9.5 : count > 24 ? 10.5 : 11.5
  const idxFont = compact ? 9 : 10

  return (
    <div
      className={`relative flex h-full w-full min-w-0 flex-col ${className}`}
      data-arrayviz=""
      data-count={count}
    >
      {count > 0 ? (
        <div className="scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full flex-col" style={{ minWidth: `max(100%, ${count * barMin}px)` }}>
            <div className="flex min-h-0 flex-1 items-end gap-[0.7%] px-[0.5%] pb-2 pt-7">
              {bars.map((b) => {
                const st = stateOf(b.state)
                const value = Number(b.value)
                const pct = Math.max(2.5, (Math.abs(value) / max) * 88)
                const lit = HOT.has(b.state)
                return (
                  <motion.div
                    key={b.id}
                    layout
                    transition={layout}
                    className="relative h-full min-w-0 flex-1"
                    style={{ minWidth: `${barMin}px` }}
                  >
                    <div
                      className="absolute bottom-0 w-full transition-[height,background-color,border-color] duration-300 ease-out"
                      style={{
                        height: `${pct}%`,
                        background: st.fill,
                        borderTop: lit ? `2px solid ${st.stroke}` : `1px solid ${st.stroke}`,
                        borderLeft: lit ? `1px solid ${st.stroke}` : '1px solid transparent',
                        borderRight: lit ? `1px solid ${st.stroke}` : '1px solid transparent',
                      }}
                    />
                    {showValues && (
                      <span
                        className="absolute w-full text-center leading-none text-bone-dim"
                        style={{
                          bottom: `calc(${pct}% + 7px)`,
                          fontSize: `${font}px`,
                          fontFamily: "'Fragment Mono', monospace",
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {num(b.value)}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>
            {showIndex && (
              <div className="flex w-full gap-[0.7%] border-t border-[var(--line)] px-[0.5%] pt-1.5">
                {bars.map((b, i) => (
                  <span
                    key={b.id}
                    className="min-w-0 flex-1 text-center leading-none text-faint"
                    style={{ minWidth: `${barMin}px`, fontSize: `${idxFont}px`, fontFamily: "'Fragment Mono', monospace" }}
                    aria-hidden="true"
                  >
                    {i % labelEvery === 0 ? b.bar.index ?? i : '\u00a0'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center">
          <div className="text-center">
            <p className="meta">No array</p>
            <p className="mt-2 text-[13px] text-faint">Choose a sort.</p>
          </div>
        </div>
      )}
    </div>
  )
}
