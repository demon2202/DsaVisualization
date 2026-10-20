import { useLab } from '../../state/lab'
import BarViz from '../diagram/BarViz'
import { stateOf } from '../../lib/palette'

/**
 * ArrayStage — sorting, drawn flat.
 *
 * The 3D bars were the hardest scene to read: depth hid swaps, labels fell
 * away and a comparison was a colour change you had to catch. This is the
 * same engine snapshot rendered as a row of labelled bars, one bar per node
 * id, so a swap moves the bar you were watching and the value stays legible
 * the whole way through.
 */

const KEY = [
  [stateOf('probe').fill, 'examined'],
  [stateOf('swap').fill, 'moving'],
  [stateOf('sorted').fill, 'settled'],
]

export default function ArrayStage() {
  const snapshot = useLab((s) => s.snapshot)
  const runMeta = useLab((s) => s.runMeta)
  const stats = snapshot?.stats || {}

  return (
    <div className="absolute inset-0 flex flex-col bg-ink-950">
      <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-[146px] pt-7 md:px-8 md:pb-[154px] md:pt-9">
        <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <p className="eyebrow text-bone-dim">Sorting desk</p>
              <p className="mt-1.5 text-[19px] font-medium tracking-[-0.025em] text-bone">
                {runMeta?.label || 'Choose a sort'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
              <dl className="flex items-center gap-6">
                {[
                  ['comparisons', stats.comparisons],
                  ['swaps', stats.swaps],
                  ['settled', `${stats.sorted ?? 0}/${stats.total ?? 0}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-[9.5px] uppercase tracking-[0.13em] text-faint">{label}</dt>
                    <dd className="mono-num text-[15px] leading-none text-bone">{value ?? 0}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => useLab.getState().setRoute('compare')}
                className="btn h-9 px-3.5 text-[12px]"
              >
                Compare two sorts
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden border border-[var(--line-2)] bg-[#080808]">
            <BarViz snapshot={snapshot} minBar={26} className="px-3 py-2 md:px-5 md:py-3" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="text-[11.5px] leading-[1.5] text-faint md:hidden">Swipe to see the full row ↔</p>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 md:ml-auto">
              {KEY.map(([color, label]) => (
                <li key={label} className="flex items-center gap-1.5 text-[10.5px] text-faint">
                  <span className="h-2 w-2" style={{ background: color }} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
