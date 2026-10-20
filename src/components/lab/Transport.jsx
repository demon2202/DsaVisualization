import { motion } from 'motion/react'
import { useLab, SPEEDS } from '../../state/lab'
import Glyph from './Glyph'

/**
 * Transport — one row, one job: move through time.
 * A rectangular instrument, not a toolbar: play is the only filled control,
 * every other action stays quiet until hovered.
 */
export default function Transport() {
  const playing = useLab((s) => s.playing)
  const steps = useLab((s) => s.steps)
  const index = useLab((s) => s.index)
  const speed = useLab((s) => s.speed)
  const togglePlay = useLab((s) => s.togglePlay)
  const stepBy = useLab((s) => s.stepBy)
  const restart = useLab((s) => s.restart)
  const seek = useLab((s) => s.seek)
  const jumpEnd = useLab((s) => s.jumpEnd)
  const setSpeed = useLab((s) => s.setSpeed)

  const has = steps.length > 0
  const atStart = index === 0
  const atEnd = index >= steps.length - 1
  const pct = has ? (steps.length <= 1 ? 100 : (index / (steps.length - 1)) * 100) : 0

  const cycleSpeed = () => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[min(780px,calc(100%-1rem))] -translate-x-1/2 md:bottom-5"
      role="group"
      aria-label="Playback"
    >
      <div className="flex items-center gap-1 border border-[var(--line-2)] bg-[#0a0a0a]/95 px-1.5 py-1.5 backdrop-blur-md">
        <button
          onClick={restart}
          disabled={!has || atStart}
          className="icon-btn hidden h-8 w-8 sm:grid"
          aria-label="Restart run (r)"
          title="Restart (r)"
        >
          <Glyph name="restart" size={14} />
        </button>
        <button
          onClick={() => stepBy(-1)}
          disabled={!has || atStart}
          className="icon-btn h-8 w-8"
          aria-label="Previous frame (left arrow)"
          title="Previous frame (←)"
        >
          <Glyph name="stepBack" size={15} />
        </button>

        <button
          onClick={togglePlay}
          disabled={!has || steps.length < 2}
          className="grid h-9 w-9 shrink-0 place-items-center bg-signal text-[#080706] transition-colors hover:bg-bone disabled:opacity-25"
          aria-label={playing ? 'Pause' : 'Play'}
          title="Play / pause (space)"
        >
          <Glyph name={playing ? 'pause' : 'play'} size={15} />
        </button>

        <button
          onClick={() => stepBy(1)}
          disabled={!has || atEnd}
          className="icon-btn h-8 w-8"
          aria-label="Next frame (right arrow)"
          title="Next frame (→)"
        >
          <Glyph name="stepFwd" size={15} />
        </button>
        <button
          onClick={jumpEnd}
          disabled={!has || atEnd}
          className="icon-btn hidden h-8 w-8 sm:grid"
          aria-label="Jump to the last frame (e)"
          title="Jump to end (e)"
        >
          <Glyph name="end" size={14} />
        </button>

        <div className="relative min-w-0 flex-1 px-2">
          <div className="pointer-events-none absolute inset-x-2 inset-y-0 flex items-center justify-between" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="h-[4px] w-px bg-[var(--line-2)]" />
            ))}
          </div>
          <input
            type="range"
            className="scrub relative z-10"
            min={0}
            max={Math.max(0, steps.length - 1)}
            value={index}
            disabled={!has || steps.length < 2}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Timeline frame"
            aria-valuetext={has ? `Frame ${index + 1} of ${steps.length}` : 'No run recorded'}
            style={{ '--track': `linear-gradient(to right, var(--color-signal) ${pct}%, var(--color-ink-700) ${pct}%)` }}
          />
        </div>

        <span className="mono-num hidden w-[58px] shrink-0 text-right text-[11px] text-faint md:block">
          {has ? (
            <>
              <span className="text-bone-dim">{index + 1}</span>/{steps.length}
            </>
          ) : (
            '—/—'
          )}
        </span>

        <button
          onClick={cycleSpeed}
          className="mono-num shrink-0 border border-[var(--line)] px-2 py-1.5 text-[10.5px] text-bone-dim transition-colors hover:border-[var(--line-3)] hover:text-bone"
          title="Cycle playback speed"
          aria-label={`Playback speed ${speed}× — click to change`}
        >
          {speed}×
        </button>
      </div>
    </motion.div>
  )
}
