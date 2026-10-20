import { useLab } from '../../state/lab'

/**
 * Everything drawn over the stage. Deliberately two things: one line of
 * narration tied to the current frame, and the selection chip when a node is
 * picked. The legend and the floating tool dock are gone — colour is explained
 * once in the notes panel, and the stage frames itself.
 */

function Narration() {
  const snapshot = useLab((s) => s.snapshot)
  const steps = useLab((s) => s.steps)
  const scene = useLab((s) => s.entry.scene)
  const has = steps.length > 0

  const idle =
    {
      tree: 'Choose an operation.',
      list: 'Choose an operation.',
      linear: 'Choose an operation.',
      hash: 'Insert a key or choose an operation.',
      heap: 'Choose an operation.',
      graph: 'Choose a start node and an algorithm.',
      array: 'Choose a sort.',
      grid: 'Run a search, or paint terrain first.',
    }[scene] || 'Choose an operation to begin.'

  return (
    <div className="pointer-events-none absolute bottom-[88px] left-1/2 z-10 w-[min(780px,calc(100%-2rem))] -translate-x-1/2 md:bottom-[100px]">
      <div className={`border-l pl-4 ${has ? 'border-signal' : 'border-[var(--line-2)]'}`}>
        {snapshot?.banner && has && (
          <span className="mono-num mb-1.5 block text-[9.5px] uppercase tracking-[0.16em] text-signal">{snapshot.banner}</span>
        )}
        <p
          className="line-clamp-3 max-w-[76ch] text-[13px] leading-[1.6] text-bone-dim [text-shadow:0_1px_18px_rgba(0,0,0,0.9)]"
          aria-live="polite"
        >
          {has ? snapshot?.note : idle}
        </p>
      </div>
    </div>
  )
}

function SelectionChip() {
  const selected = useLab((s) => s.selected)
  const snapshot = useLab((s) => s.snapshot)
  const setSelected = useLab((s) => s.setSelected)
  const node = snapshot?.nodes?.find((n) => n.id === selected)
  if (!node) return null
  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-10 flex items-center gap-3 border border-[var(--line-2)] bg-[#080808]/95 px-3 py-2 text-[11px] text-bone-dim md:left-5 md:top-5">
      <span className="eyebrow">selected</span>
      <span className="code-face text-[12.5px] text-bone">{String(node.value ?? '—')}</span>
      {node.depth !== undefined && <span className="mono-num text-[10.5px] text-faint">depth {node.depth}</span>}
      <button onClick={() => setSelected(null)} aria-label="Clear selection" className="pl-0.5 text-faint transition-colors hover:text-bone">
        ×
      </button>
    </div>
  )
}

export default function StageChrome() {
  return (
    <>
      <SelectionChip />
      <Narration />
    </>
  )
}
