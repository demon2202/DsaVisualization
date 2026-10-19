import { motion } from 'motion/react'
import { useLab, SPEEDS } from '../../state/lab'
import Glyph from './Glyph'

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
  const reRun = useLab((s) => s.reRun)
  const frame = useLab((s) => s.frame)
  const practiceOn = useLab((s) => s.practice.on)
  const togglePractice = useLab((s) => s.togglePractice)

  const has = steps.length > 0
  const pct = has ? (index / Math.max(1, steps.length - 1)) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[min(680px,calc(100%-2rem))] -translate-x-1/2"
    >
      <div className="panel flex items-center gap-2 border-acid/25 bg-ink-900/95 px-3 py-2.5 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.7)]">
        <button
          aria-label="Restart (r)" onClick={restart}
          disabled={!has || index === 0}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone disabled:opacity-30"
          title="Restart (r)"
        >
          <Glyph name="restart" size={15} />
        </button>
        <button
          aria-label="Step back (left arrow)"
          onClick={stepBy.bind(null, -1)}
          disabled={!has || index === 0}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone disabled:opacity-30"
          title="Step back (←)"
        >
          <Glyph name="stepBack" size={15} />
        </button>
        <button
          aria-label={playing ? 'Pause (space)' : 'Play (space)'} onClick={togglePlay}
          disabled={!has}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-[6px] transition-colors duration-200 disabled:opacity-30 ${
            playing ? 'bg-bone text-ink-950' : 'bg-acid text-ink-950'
          }`}
          title="Play / pause (space)"
        >
          <Glyph name={playing ? 'pause' : 'play'} size={16} />
        </button>
        <button
          aria-label="Step forward (right arrow)"
          onClick={stepBy.bind(null, 1)}
          disabled={!has || index >= steps.length - 1}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone disabled:opacity-30"
          title="Step forward (→)"
        >
          <Glyph name="stepFwd" size={15} />
        </button>
        <button
          aria-label="Jump to end (e)" onClick={jumpEnd}
          disabled={!has || index >= steps.length - 1}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone disabled:opacity-30"
          title="Skip to end (e)"
        >
          <Glyph name="end" size={15} />
        </button>

        <div className="relative mx-2 h-6 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-ink-600">
            <div className="h-full rounded-full bg-acid/80 transition-[width] duration-100" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, steps.length - 1)}
            value={index}
            disabled={!has}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            aria-label="Timeline scrub"
          />
          {has && (
            <div
              className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-950 bg-gold text-ink-950"
              style={{ left: `${pct}%` }}
            />
          )}
        </div>

        <div className="mono-num w-[74px] shrink-0 text-right text-[13px] text-bone-dim">
          {has ? `${index + 1} / ${steps.length}` : '— / —'}
        </div>

        <div className="mx-1 h-5 w-px shrink-0 bg-[var(--line)]" />

        <div className="flex shrink-0 items-center gap-0.5 rounded-[5px] bg-ink-800 p-0.5" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`mono-num rounded-[3px] px-1.5 py-1 text-[12px] font-semibold transition-colors ${
                speed === s ? 'bg-ink-600 text-acid' : 'text-faint hover:text-bone-dim'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="mx-1 h-5 w-px shrink-0 bg-[var(--line)]" />
        <button aria-label="Re-run last operation" onClick={reRun} disabled={!has} className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone disabled:opacity-30" title="Re-run last operation">
          <Glyph name="spark" size={14} />
        </button>
        <button
          aria-label="Practice mode — predict the next frame"
          onClick={togglePractice}
          title="Practice mode (p)"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-[4px] transition-colors ${
            practiceOn ? 'bg-gold text-ink-950' : 'text-muted hover:bg-ink-700 hover:text-bone'
          }`}
        >
          <Glyph name="quiz" size={15} />
        </button>
        <button aria-label="Re-frame camera (f)" onClick={frame} className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone" title="Re-frame camera (f)">
          <Glyph name="camera" size={15} />
        </button>
      </div>
    </motion.div>
  )
}
