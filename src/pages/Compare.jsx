import { useEffect } from 'react'
import { useCompare, SORT_ALGS, finalOrder } from '../state/compare'
import { useLab } from '../state/lab'
import Stage from '../three/Stage'
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
      if (e.key === ' ') {
        e.preventDefault()
        useCompare.getState().togglePlay()
      }
      if (e.key === 'ArrowRight') useCompare.getState().step()
      if (e.key === 'r') useCompare.getState().restart()
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
  const orderA = finalOrder(c.stepsA)
  const orderB = finalOrder(c.stepsB)
  const agree = orderA.length > 0 && orderA.join(',') === orderB.join(',')

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-bone">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[var(--line)] bg-ink-900/75 px-4 py-4 backdrop-blur-xl md:px-7">
        <button onClick={() => setRoute('landing')} className="flex shrink-0 items-center gap-2.5 text-bone transition-opacity hover:opacity-80" aria-label="Back to overview">
          <span className="grid h-8 w-8 place-items-center bg-gold text-ink-950">
            <Glyph name="trees" size={16} />
          </span>
          <span className="font-display text-[17px] font-semibold tracking-[-0.02em]">structure<span className="text-gold">.</span></span>
        </button>
        <div className="hidden h-8 w-px bg-[var(--line-2)] sm:block" />
        <div className="min-w-0">
          <h1 className="display text-[24px] tracking-[-0.02em] md:text-[28px]">compare algorithms</h1>
          <p className="mt-0.5 hidden text-[13px] text-muted sm:block">One input. Two real runs. Every operation counted.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="label-xs flex items-center gap-2">
            input
            <select value={c.shape} onChange={(e) => c.setShape(e.target.value)} aria-label="Input shape" className="rounded-[4px] border border-[var(--line)] bg-ink-800 px-2.5 py-2 text-[13px] text-bone-dim">
              <option value="random">random</option>
              <option value="almost">almost sorted</option>
              <option value="reversed">reversed</option>
            </select>
          </label>
          <label className="label-xs flex items-center gap-2">
            n
            <select value={c.size} onChange={(e) => c.setSize(Number(e.target.value))} aria-label="Array size" className="rounded-[4px] border border-[var(--line)] bg-ink-800 px-2.5 py-2 text-[13px] text-bone-dim">
              {[8, 12, 16, 24, 32].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button onClick={c.newArray} className="rounded-[4px] border border-[var(--line-2)] bg-ink-800 px-3.5 py-2 text-[13px] font-semibold text-bone-dim transition-colors hover:bg-ink-700 hover:text-bone">
            new array
          </button>
          <button onClick={() => setRoute('lab')} className="basis-full rounded-[4px] px-2 py-2 text-right text-[13px] font-semibold text-muted transition-colors hover:text-bone sm:ml-1 sm:basis-auto" aria-label="Return to the lab">
            lab
          </button>
        </div>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
        <Panel side="A" alg={c.algA} setAlg={(id) => c.setAlg('A', id)} snap={sA} i={c.iA} n={c.stepsA.length} seek={c.seekA} done={doneA} />
        <Panel side="B" alg={c.algB} setAlg={(id) => c.setAlg('B', id)} snap={sB} i={c.iB} n={c.stepsB.length} seek={c.seekB} done={doneB} />
      </div>

      <footer className="border-t border-[var(--line)] bg-ink-900/70 px-4 py-5 md:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={c.togglePlay}
            aria-label={c.playing ? 'Pause (space)' : 'Play (space)'}
            className="grid h-10 w-10 place-items-center rounded-[6px] bg-acid text-ink-950 transition-colors hover:bg-bone"
          >
            <Glyph name={c.playing ? 'pause' : 'play'} size={16} />
          </button>
          <button onClick={c.step} aria-label="Step both (right arrow)" className="grid h-9 w-9 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone">
            <Glyph name="stepFwd" size={15} />
          </button>
          <button onClick={c.restart} aria-label="Restart both (r)" className="grid h-9 w-9 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-700 hover:text-bone">
            <Glyph name="restart" size={15} />
          </button>
          <p className="label-xs max-w-[60ch] leading-relaxed">
            lockstep: both advance one recorded frame per tick. A finished side holds its final frame — step counts
            differ because the algorithms differ.
          </p>
        </div>

        <div className="mono-num mt-5 grid grid-cols-[minmax(100px,1.2fr)_repeat(2,minmax(72px,1fr))] gap-x-4 gap-y-2 text-[14px] sm:grid-cols-[160px_repeat(2,minmax(90px,1fr))_1fr] md:gap-x-6">
          <span className="label-xs">metric (this input)</span>
          <span className="label-xs">{labelOf(c.algA)}</span>
          <span className="label-xs">{labelOf(c.algB)}</span>
          <span className="hidden sm:block" />
          {[
            ['comparisons', totA?.comparisons, totB?.comparisons],
            ['swaps', totA?.swaps, totB?.swaps],
            ['writes', totA?.writes, totB?.writes],
            ['recorded frames', c.stepsA.length, c.stepsB.length],
          ].map(([name, a, b]) => (
            <Row key={name} name={name} a={a} b={b} />
          ))}
        </div>

        <p className="mt-5 max-w-[88ch] text-[14px] leading-relaxed text-muted">
          {agree && c.stepsA.length && c.stepsB.length ? (
            <>Both runs end in the same order, so the engines agree. </>
          ) : null}
          These counts describe <em className="not-italic text-bone-dim">this input</em>: comparisons are pairs examined,
          swaps are element exchanges, writes are array stores. They are not wall-clock time — constants, memory
          movement and cache behaviour differ per machine, so fewer operations never guarantees a faster run.
          {totA && totB && (totA.comparisons !== totB.comparisons || totA.swaps !== totB.swaps) ? (
            <>
              {' '}
              On this array {labelOf(totA.comparisons <= totB.comparisons ? c.algA : c.algB)} examined fewer pairs, while{' '}
              {labelOf(totA.swaps <= totB.swaps ? c.algA : c.algB)} exchanged fewer elements — different algorithms win
              on different measures.
              {totA.writes || totB.writes ? (
                <> Writes: {labelOf(totA.writes <= totB.writes ? c.algA : c.algB)} stored to memory fewer times.</>
              ) : null}
            </>
          ) : null}
        </p>
      </footer>
    </div>
  )
}

function Row({ name, a, b }) {
  const win = a != null && b != null && a !== b
  return (
    <>
      <span className="text-muted">{name}</span>
      <span className={win && a < b ? 'text-gold' : 'text-bone-dim'}>{a ?? '—'}</span>
      <span className={win && b < a ? 'text-gold' : 'text-bone-dim'}>{b ?? '—'}</span>
      <span className="hidden sm:block" />
    </>
  )
}

function Panel({ side, alg, setAlg, snap, i, n, seek, done }) {
  return (
    <section className="relative flex min-h-[46dvh] min-w-0 flex-col border-b border-[var(--line)] bg-ink-900/35 lg:border-b-0 lg:border-r" aria-label={`Panel ${side}`}>
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-ink-900/70 px-4 py-3 md:px-6">
        <span className="grid h-7 w-7 place-items-center rounded-[4px] border border-[var(--line-2)] text-[12px] font-semibold text-gold">{side}</span>
        <select value={alg} onChange={(e) => setAlg(e.target.value)} aria-label={`Algorithm for panel ${side}`} className="rounded-[4px] border border-[var(--line)] bg-ink-800 px-2.5 py-2 text-[14px] font-semibold text-bone">
          {SORT_ALGS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <span className="mono-num ml-auto text-[13px] text-bone-dim">
          {n ? `${i + 1} / ${n}` : '—'} {done && <span className="text-gold">· done</span>}
        </span>
      </div>
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {snap && <Stage snapshot={snap} scene="array" quality="eco" frameIndex={i} autoRotate={false} />}
      </div>
      <div className="px-4 py-2">
        <input
          type="range"
          min={0}
          max={Math.max(0, n - 1)}
          value={i}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label={`Scrub ${side}`}
          className="h-6 w-full cursor-ew-resize accent-[#c9a45a]"
        />
      </div>
    </section>
  )
}

function labelOf(id) {
  return SORT_ALGS.find((a) => a.id === id)?.label || id
}
