import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLab } from '../state/lab'
import Topbar from '../components/lab/Topbar'
import Sidebar from '../components/lab/Sidebar'
import Inspector from '../components/lab/Inspector'
import PracticePanel from '../components/lab/PracticePanel'
import GraphEdit from '../components/lab/GraphEdit'
import Transport from '../components/lab/Transport'
import StageChrome from '../components/lab/StageChrome'
import ArrayStage from '../components/lab/ArrayStage'
import SnapshotDiagram from '../components/diagram/SnapshotDiagram'

function Toast() {
  const toast = useLab((state) => state.toast)
  return (
    <div className="pointer-events-none absolute right-3 top-[60px] z-30 md:right-5 md:top-2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.at}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            role="status"
            className={`flex w-max max-w-[calc(100vw-1.5rem)] items-center gap-2 border bg-[#0b0b0b] px-3 py-2 text-[12px] md:max-w-[340px] ${
              toast.kind === 'error' ? 'border-bad/40 text-bad' : 'border-[var(--line-2)] text-bone-dim'
            }`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 ${toast.kind === 'error' ? 'bg-bad' : 'bg-mint'}`} />
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── the 2.5D stage ────────────────────────────────────────────────────── */

function StageView({ editMode, selected, selectedLink, setSelectedLink, onSelect, onHover }) {
  const snapshot = useLab((state) => state.snapshot)
  const steps = useLab((state) => state.steps)
  const entry = useLab((state) => state.entry)

  return (
    <div className="absolute inset-0 px-2 pb-[148px] pt-10 sm:px-5 md:px-9 md:pb-[152px] md:pt-8">
      <SnapshotDiagram
        snapshot={snapshot}
        scene={entry.scene}
        fitSteps={steps.length ? steps : [snapshot]}
        editMode={editMode && entry.scene === 'graph'}
        onNodeMove={(id, point) => {
          const state = useLab.getState()
          state.machine.moveNode(id, point.x, point.y, point.z)
          state.setEditFocus(id)
          state.syncMachine()
        }}
        onLinkSelect={(id) => setSelectedLink(id)}
        selectedLink={selectedLink}
        selected={selected}
        onSelect={onSelect}
        onHover={onHover}
      />
    </div>
  )
}

/* ── hover-reveal edge rails ───────────────────────────────────────────── */

function EdgeRail({ side, label, open, onOpen, onClose, width, children }) {
  const closeTimer = useRef(null)

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const enter = () => {
    clearTimeout(closeTimer.current)
    onOpen()
  }
  const leave = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(onClose, 220)
  }

  return (
    <div
      className={`absolute inset-y-0 z-30 flex ${side === 'left' ? 'left-0' : 'right-0 flex-row-reverse'}`}
      onPointerEnter={enter}
      onPointerLeave={leave}
    >
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key={label}
            initial={{ opacity: 0, x: side === 'left' ? -18 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: side === 'left' ? -12 : 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`relative h-full shrink-0 border-[var(--line)] bg-[#080808] ${
              side === 'left' ? 'border-r' : 'border-l'
            }`}
            style={{ width }}
            aria-label={label === 'LAB' ? 'Lab controls' : 'Notes'}
          >
            {children}
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        className={`relative flex h-full w-11 shrink-0 flex-col items-center justify-between border-[var(--line)] bg-[#070707] py-5 transition-colors hover:bg-[#0b0b0b] ${
          side === 'left' ? 'border-r' : 'border-l'
        }`}
      >
        <span className="mono-num text-[9px] text-faint">{side === 'left' ? '01' : '02'}</span>
        <span
          className="eyebrow text-[9px] text-muted transition-colors hover:text-bone"
          style={{ writingMode: 'vertical-rl', transform: side === 'left' ? 'rotate(180deg)' : 'none' }}
        >
          {label}
        </span>
        <span
          className={`grid h-5 w-5 place-items-center border transition-colors ${
            open ? 'border-signal/50 text-signal' : 'border-[var(--line-2)] text-faint'
          }`}
          aria-hidden="true"
        >
          <span className="text-[11px] leading-none">{side === 'left' ? '›' : '‹'}</span>
        </span>
      </button>
    </div>
  )
}

/* ── the console ───────────────────────────────────────────────────────── */

export default function Lab() {
  const entry = useLab((state) => state.entry)
  const selected = useLab((state) => state.selected)
  const editMode = useLab((state) => state.editMode)
  const selectedLink = useLab((state) => state.selectedLink)
  const setSelectedLink = useLab((state) => state.setSelectedLink)
  const [panel, setPanel] = useState(null)
  const painting = useRef(false)

  const togglePanel = useCallback((name) => {
    setPanel((current) => (current === name ? null : name))
  }, [])

  const openFromTopbar = useCallback(
    (name) => {
      if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
        togglePanel(name)
      } else {
        useLab.getState().setMobilePanel(name === 'lab' ? 'ops' : 'info')
      }
    },
    [togglePanel],
  )

  const paintCell = useCallback((id) => {
    const state = useLab.getState()
    const [row, column] = String(id).split('_').map(Number)
    if (!Number.isFinite(row) || !Number.isFinite(column)) return
    if (state.brush === 'start') state.machine.setStart(row, column)
    else if (state.brush === 'goal') state.machine.setGoal(row, column)
    else state.machine.paint(row, column, state.brush)
    state.paintCellRefresh()
  }, [])

  const onSelect = useCallback(
    (id) => {
      const state = useLab.getState()
      if (state.paintMode && state.entry.paintable) {
        painting.current = true
        paintCell(id)
        return
      }
      state.setSelected(id === state.selected ? null : id)
    },
    [paintCell],
  )

  const onHover = useCallback(
    (id) => {
      const state = useLab.getState()
      if (painting.current && state.paintMode && state.entry.paintable && id?.includes('_')) paintCell(id)
    },
    [paintCell],
  )

  useEffect(() => {
    const up = () => {
      painting.current = false
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  /* keyboard transport — ignored while typing, never steals a text field */
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const state = useLab.getState()

      if (state.practice.on) {
        if (event.key === 'Escape' || event.key === 'p') {
          event.preventDefault()
          state.togglePractice()
        } else if (state.practice.q && !state.practice.review) {
          if (['1', '2', '3', '4'].includes(event.key)) {
            event.preventDefault()
            if (!state.practice.checked) state.pickPractice(Number(event.key) - 1)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            if (!state.practice.checked) state.checkPractice()
            else state.continuePractice()
          }
        }
        return
      }

      switch (event.key) {
        case ' ':
          event.preventDefault()
          state.togglePlay()
          break
        case 'ArrowRight':
        case 'ArrowLeft':
          event.preventDefault()
          if (state.editMode && state.editFocus && state.entry.scene === 'graph') {
            const node = state.machine.nodes.find((item) => item.id === state.editFocus)
            if (node) {
              const distance = event.shiftKey ? 0.25 : 0.75
              state.machine.moveNode(
                node.id,
                node.pos[0] + (event.key === 'ArrowRight' ? distance : -distance),
                node.pos[1],
                node.pos[2],
              )
              state.syncMachine()
              break
            }
          }
          state.stepBy(event.key === 'ArrowRight' ? 1 : -1)
          break
        case 'ArrowUp':
        case 'ArrowDown':
          if (state.editMode && state.editFocus && state.entry.scene === 'graph') {
            event.preventDefault()
            const node = state.machine.nodes.find((item) => item.id === state.editFocus)
            if (node) {
              const distance = event.shiftKey ? 0.25 : 0.75
              state.machine.moveNode(node.id, node.pos[0], node.pos[1], node.pos[2] + (event.key === 'ArrowDown' ? distance : -distance))
              state.syncMachine()
            }
          }
          break
        case 'r':
          state.restart()
          break
        case 'e':
          state.jumpEnd()
          break
        case 'f':
          state.frame()
          break
        case 'c':
          state.setPanelTab('code')
          setPanel('notes')
          break
        case 'i':
          setPanel((current) => (current === 'notes' ? null : 'notes'))
          break
        case 'p':
          state.togglePractice()
          break
        case 'Delete':
        case 'Backspace':
          if (state.selectedLink && state.entry.scene === 'graph') {
            event.preventDefault()
            state.machine.removeEdge(state.selectedLink)
            state.setSelectedLink(null)
            state.syncMachine()
          }
          break
        case 'Escape':
          if (panel) setPanel(null)
          else if (state.mobilePanel) state.setMobilePanel(null)
          else if (state.selectedLink) state.setSelectedLink(null)
          else if (state.editMode) state.setEditMode(false)
          else if (state.selected) state.setSelected(null)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel])

  const isArray = entry.scene === 'array'

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink-950 text-bone">
      <Topbar panel={panel} onOpenLab={() => openFromTopbar('lab')} onOpenNotes={() => openFromTopbar('notes')} />

      <div className="relative flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          {isArray ? (
            <ArrayStage />
          ) : (
            <StageView
              editMode={editMode}
              selected={selected}
              selectedLink={selectedLink}
              setSelectedLink={setSelectedLink}
              onSelect={onSelect}
              onHover={onHover}
            />
          )}

          <StageChrome />
          {entry.scene === 'graph' && <GraphEdit />}
          <PracticePanel />
          <Transport />
          <Toast />
        </main>

        <div className="hidden lg:block">
          <EdgeRail
            side="left"
            label="LAB"
            open={panel === 'lab'}
            onOpen={() => setPanel('lab')}
            onClose={() => setPanel((current) => (current === 'lab' ? null : current))}
            width="min(380px, calc(100vw - 8rem))"
          >
            <Sidebar onClose={() => setPanel(null)} onNavigate={() => setPanel(null)} />
          </EdgeRail>

          <EdgeRail
            side="right"
            label="NOTES"
            open={panel === 'notes'}
            onOpen={() => setPanel('notes')}
            onClose={() => setPanel((current) => (current === 'notes' ? null : current))}
            width="min(430px, calc(100vw - 8rem))"
          >
            <Inspector onClose={() => setPanel(null)} />
          </EdgeRail>
        </div>
      </div>

      <MobileDrawer />
    </div>
  )
}

function MobileDrawer() {
  const panel = useLab((state) => state.mobilePanel)
  const setPanel = useLab((state) => state.setMobilePanel)
  return (
    <AnimatePresence>
      {panel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
            className="absolute inset-0 bg-ink-950/80"
          />
          <motion.aside
            key={panel}
            initial={{ x: panel === 'ops' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: panel === 'ops' ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            className={`absolute inset-y-0 w-full border-[var(--line)] bg-[#080808] sm:w-[min(360px,92vw)] ${
              panel === 'ops' ? 'left-0 border-r' : 'right-0 border-l'
            }`}
            role="dialog"
            aria-label={panel === 'ops' ? 'Lab controls' : 'Notes'}
          >
            {panel === 'ops' ? (
              <Sidebar mobile onClose={() => setPanel(null)} onNavigate={() => setPanel(null)} />
            ) : (
              <Inspector onClose={() => setPanel(null)} />
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
