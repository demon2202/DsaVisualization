import { useEffect } from 'react'
import { useCompare, SORT_ALGS } from '../state/compare'
import { useLab } from '../state/lab'
import BarViz from '../components/diagram/BarViz'
import Glyph from '../components/lab/Glyph'

/**
 * Compare — two sorting algorithms, one shared input, real runs on both sides.
 * Lockstep playback: one frame per tick per side; a finished side holds its
 * final frame. Metrics are the engines' own counters for THIS input.
 */
export default function Compare() {
  const c = useCompare()
  const setRoute = useLab((s) => s.setRoute)

  useEffect(() => {
    if (!useCompare.getState().stepsA.length) useCompare.getState().run()
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      const state = useCompare.getState()
      if (e.key === ' ') {
        e.preventDefault()
        state.togglePlay()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        state.step()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        state.stop()
        state.seekA(state.iA - 1)
        state.seekB(state.iB - 1)
      }
      if (e.key === 'r') state.restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sA = c.stepsA[c.iA]
  const sB = c.stepsB[c.iB]
  const totA = c.stepsA[c.stepsA.length - 1]?.stats
  const totB = c.stepsB[c.stepsB.length - 1]?.stats
  const doneA = c.stepsA.length > 0 && c.iA >= c.stepsA.length - 1
  const doneB = c.stepsB.length > 0 && c.iB >= c.stepsB.length - 1

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-bone">
      <header className="border-b border-[var(--line)] px-4 py-3 md:px-7">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            onClick={() => setRoute('landing')}
            className="flex h-9 shrink-0 items-center gap-2 text-bone transition-opacity hover:opacity-75"
            aria-label="Structure — back to the overview"
          >
            <span className="wordmark text-[20px]">structure</span>
            <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
          </button>
          <span className="hidden h-5 w-px bg-[var(--line-2)] sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="eyebrow">Comparison desk</p>
            <h1 className="mt-1 text-[13.5px] text-bone-dim">Two sorts, one input.</h1>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-faint">
              input
              <select
                value={c.shape}
                onChange={(e) => c.setShape(e.target.value)}
                aria-label="Input shape"
                className="field h-8 w-auto pr-7 text-[12px]"
              >
                <option value="random">random</option>
                <option value="almost">almost sorted</option>
                <option value="reversed">reversed</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-faint">
              n
              <select
                value={c.size}
                onChange={(e) => c.setSize(Number(e.target.value))}
                aria-label="Array size"
                className="field h-8 w-auto pr-7 text-[12px]"
              >
                {[8, 12, 16, 24, 32].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={c.newArray} className="btn h-8 px-3 text-[12px]">
              New array
            </button>
            <button onClick={() => setRoute('lab')} className="btn btn-primary h-8 px-3 text-[12px]" aria-label="Enter the lab to run a single algorithm">
              Open the lab
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
        <ComparePanel
          side="A"
          alg={c.algA}
          setAlg={(id) => c.setAlg('A', id)}
          snap={sA}
          i={c.iA}
          n={c.stepsA.length}
          seek={c.seekA}
          done={doneA}
        />
        <ComparePanel
          side="B"
          alg={c.algB}
          setAlg={(id) => c.setAlg('B', id)}
          snap={sB}
          i={c.iB}
          n={c.stepsB.length}
          seek={c.seekB}
          done={doneB}
        />
      </div>

      <footer className="border-t border-[var(--line)] bg-[#080808] px-4 py-4 md:px-7 md:py-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-1">
            <button
              onClick={c.togglePlay}
              aria-label={c.playing ? 'Pause (space)' : 'Play (space)'}
              className="grid h-9 w-9 place-items-center bg-signal text-[#080706] transition-colors hover:bg-bone"
            >
              <Glyph name={c.playing ? 'pause' : 'play'} size={14} />
            </button>
            <button onClick={c.step} aria-label="Step both (right arrow)" className="icon-btn h-9 w-9">
              <Glyph name="stepFwd" size={14} />
            </button>
            <button onClick={c.restart} aria-label="Restart both (r)" className="icon-btn h-9 w-9">
              <Glyph name="restart" size={14} />
            </button>
          </div>

          <p className="max-w-[72ch] text-[12px] leading-[1.6] text-faint">
            One recorded frame per tick; a finished side holds its final frame. Counts are totals for this input, not
            timings.
          </p>
        </div>

        <div className="mono-num mt-4 grid grid-cols-[minmax(90px,1.1fr)_repeat(2,minmax(64px,1fr))] gap-x-4 gap-y-2 border-t border-[var(--line)] pt-3 text-[13px] sm:grid-cols-[150px_120px_120px_1fr] md:gap-x-6">
          <span className="eyebrow">metric · this input</span>
          <span className="truncate text-[11px] uppercase tracking-[0.1em] text-bone-dim">{labelOf(c.algA)}</span>
          <span className="truncate text-[11px] uppercase tracking-[0.1em] text-bone-dim">{labelOf(c.algB)}</span>
          <span className="hidden sm:block" />
          {[
            ['comparisons', totA?.comparisons, totB?.comparisons],
            ['swaps', totA?.swaps, totB?.swaps],
            ['frames recorded', c.stepsA.length, c.stepsB.length],
          ].map(([name, a, b]) => (
            <Row key={name} name={name} a={a} b={b} />
          ))}
        </div>
      </footer>
    </div>
  )
}

function Row({ name, a, b }) {
  const win = a != null && b != null && a !== b
  return (
    <>
      <span className="font-sans text-[12px] text-muted">{name}</span>
      <span className={win && a < b ? 'text-signal' : 'text-bone-dim'}>{a ?? '—'}</span>
      <span className={win && b < a ? 'text-signal' : 'text-bone-dim'}>{b ?? '—'}</span>
      <span className="hidden sm:block" />
    </>
  )
}

function ComparePanel({ side, alg, setAlg, snap, i, n, seek, done }) {
  const pct = n > 1 ? (i / (n - 1)) * 100 : 0
  return (
    <section
      className="relative flex min-h-[42dvh] min-w-0 flex-col border-b border-[var(--line)] bg-ink-950 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
      aria-label={`Panel ${side}`}
    >
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-2.5 md:px-6">
        <span className="mono-num grid h-6 w-6 place-items-center border border-[var(--line-2)] text-[10.5px] text-signal">
          {side}
        </span>
        <select
          value={alg}
          onChange={(e) => setAlg(e.target.value)}
          aria-label={`Algorithm for panel ${side}`}
          className="field h-8 w-auto pr-7 text-[12px] text-bone"
        >
          {SORT_ALGS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <span className="mono-num ml-auto text-[12px] text-bone-dim">
          {n ? `${i + 1} / ${n}` : '—'} {done && <span className="text-mint">· done</span>}
        </span>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#080808]">
        {snap ? (
          <BarViz snapshot={snap} compact minBar={18} className="px-2 pb-1 pt-2 md:px-4" />
        ) : (
          <div className="grid h-full place-items-center">
            <p className="text-[12px] text-faint">waiting for a run</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-2 md:px-6">
        <input
          type="range"
          min={0}
          max={Math.max(0, n - 1)}
          value={i}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label={`Scrub ${side}`}
          className="scrub"
          style={{ '--track': `linear-gradient(to right, var(--color-signal) ${pct}%, var(--color-ink-700) ${pct}%)` }}
        />
      </div>
    </section>
  )
}

function labelOf(id) {
  return SORT_ALGS.find((a) => a.id === id)?.label || id
}
