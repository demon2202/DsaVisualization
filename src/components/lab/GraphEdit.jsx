import { useLab } from '../../state/lab'
import Glyph from './Glyph'

/**
 * Graph editing bar. Every control mutates the real graph machine and
 * re-snapshots, so whatever you sculpt is exactly what the algorithms run on.
 * Delete removes the selected edge; Escape leaves edit mode.
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
    <div className="pointer-events-auto absolute left-1/2 top-3 z-10 flex w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => setEditMode(!editMode)}
        aria-pressed={editMode}
        className={`btn h-8 px-3 text-[12px] ${
          editMode ? 'border-signal/60 bg-signal/10 text-signal' : 'bg-[#080808]/95'
        }`}
      >
        <Glyph name="graphs" size={13} />
        {editMode ? 'Done editing' : 'Edit graph'}
      </button>

      {editMode && (
        <>
          <button
            onClick={() => {
              machine.addNode()
              sync()
              useLab.getState().setEditFocus(machine.nodes[machine.nodes.length - 1].id)
            }}
            className="btn h-8 bg-[#080808]/95 px-3 text-[12px]"
          >
            Add node
          </button>
          <span className="hidden border border-[var(--line)] bg-[#080808]/95 px-2.5 py-1.5 text-[10.5px] text-faint lg:block">
            drag to move · click an edge to edit
          </span>
        </>
      )}

      {edge && (
        <div className="flex items-center gap-1 border border-[var(--line-2)] bg-[#080808] px-1.5 py-1">
          <span className="px-1 text-[10px] uppercase tracking-[0.12em] text-faint">weight</span>
          <button
            onClick={() => {
              machine.setWeight(edge.id, edge.weight - 1)
              sync()
            }}
            disabled={edge.weight <= 1}
            aria-label="Decrease edge weight"
            className="icon-btn h-6 w-6 disabled:opacity-30"
          >
            <span aria-hidden="true">−</span>
          </button>
          <span className="mono-num w-5 text-center text-[12.5px] text-bone" aria-live="polite">
            {edge.weight}
          </span>
          <button
            onClick={() => {
              machine.setWeight(edge.id, edge.weight + 1)
              sync()
            }}
            disabled={edge.weight >= 99}
            aria-label="Increase edge weight"
            className="icon-btn h-6 w-6 disabled:opacity-30"
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            onClick={() => {
              machine.removeEdge(edge.id)
              setSelectedLink(null)
              sync()
            }}
            className="ml-1 px-2 py-1 text-[11px] font-medium text-bad transition-colors hover:bg-bad/10"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
