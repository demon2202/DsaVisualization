/**
 * visuals.jsx — editorial furniture shared by the landing.
 * The structures themselves are drawn by SnapshotDiagram / BarViz now.
 */
import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { code } from '../../lib/pseudocode'

/** Scroll reveal: one curve, one distance, never repeats. */
export function Reveal({ children, delay = 0, y = 26, className = '' }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Pseudocode rail — the active lines are the frame's own code ids. */
export function CodeRail({ block, active = [], limit = null, className = '' }) {
  const lines = useMemo(() => code(block), [block])
  if (!lines.length) return null
  const shown = limit ? lines.slice(0, limit) : lines
  const set = new Set(active)
  return (
    <ol className={`code-face text-[11.5px] leading-[1.85] ${className}`}>
      {shown.map((line, i) => {
        const lit = set.has(line.id)
        return (
          <li key={line.id + i} className={`flex gap-2.5 transition-colors duration-200 ${lit ? 'text-acid' : 'text-muted/70'}`}>
            <span className={`mono-num w-4 shrink-0 select-none text-right ${lit ? 'text-acid/70' : 'text-faint/60'}`}>{i + 1}</span>
            <span style={{ paddingLeft: Math.max(0, line.indent - 1) * 12 }} className={`min-w-0 whitespace-pre-wrap ${lit ? 'text-bone-dim' : ''}`}>
              {line.text.replace(/\s+$/, '')}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** The small word-level label used across the stage overlays. */
export function Chip({ children, tone = 'bone', className = '' }) {
  const tones = {
    bone: 'text-bone-dim',
    acid: 'text-acid',
    faint: 'text-faint',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}
