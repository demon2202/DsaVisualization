import { useLab } from '../../state/lab'

/**
 * Graph editing toolbar: every control mutates the REAL graph machine and
 * re-snapshots, so whatever you sculpt is exactly what the algorithms run on.
 * Keyboard paths: the toolbar buttons are focusable; Delete removes the
 * selected edge; Escape leaves edit mode.
 */
export default function GraphEdit() {
  const editMode = useLab((s) => s.editMode)
  const setEditMode = useLab((s) => s.setEditMode)
  const selectedLink = useLab((s) => s.selectedLink)
  const setSelectedLink = useLab((s) => s.setSelectedLink)

  const machine = useLab((s) => s.machine)
  const sync = useLab((s) => s.syncMachine)
  const edge = selectedLink ? machine.edges.find((e) => e.id === selectedLink) : null

  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2" data-ui>
      <button
        onClick={() => setEditMode(!editMode)}
        aria-pressed={editMode}
        className={`rounded-[4px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
          editMode ? 'bg-gold text-ink-950' : 'bg-ink-850 text-bone-dim hover:text-bone'
        }`}
      >
        {editMode ? 'editing graph' : 'edit graph'}
      </button>
      {editMode && (
        <>
          <button
            onClick={() => {
              machine.addNode()
              sync()
              useLab.getState().setEditFocus(machine.nodes[machine.nodes.length - 1].id)
            }}
            className="rounded-[4px] bg-ink-850 px-3 py-1.5 text-[13px] font-semibold text-bone-dim transition-colors hover:text-bone"
          >
            add node
          </button>
          <span className="label-xs hidden max-w-[34ch] sm:inline">drag nodes (or arrows to nudge the focused one) · click an edge to weight or cut it</span>
        </>
      )}
      {edge && (
        <div className="flex items-center gap-2 rounded-[4px] bg-ink-850 px-2.5 py-1.5">
          <span className="label-xs">weight</span>
          <button
            onClick={() => {
              machine.setWeight(edge.id, edge.weight - 1)
              sync()
            }}
            disabled={edge.weight <= 1}
            aria-label="Decrease edge weight"
            className="mono-num grid h-6 w-6 place-items-center rounded-[4px] bg-ink-750 text-bone-dim transition-colors hover:text-bone disabled:opacity-30"
          >
            −
          </button>
          <span className="mono-num w-6 text-center text-[14px] text-bone" aria-live="polite">
            {edge.weight}
          </span>
          <button
            onClick={() => {
              machine.setWeight(edge.id, edge.weight + 1)
              sync()
            }}
            disabled={edge.weight >= 99}
            aria-label="Increase edge weight"
            className="mono-num grid h-6 w-6 place-items-center rounded-[4px] bg-ink-750 text-bone-dim transition-colors hover:text-bone disabled:opacity-30"
          >
            +
          </button>
          <button
            onClick={() => {
              machine.removeEdge(edge.id)
              setSelectedLink(null)
              sync()
            }}
            className="rounded-[4px] bg-bad/20 px-2.5 py-1 text-[13px] font-semibold text-bad transition-colors hover:bg-bad/30"
          >
            cut edge
          </button>
          <button onClick={() => setSelectedLink(null)} className="px-1 text-[13px] text-muted hover:text-bone" aria-label="Close edge editor">
            close
          </button>
        </div>
      )}
    </div>
  )
}
