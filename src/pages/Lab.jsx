import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLab } from '../state/lab'
import Stage from '../three/Stage'
import Topbar from '../components/lab/Topbar'
import NavigationDock from '../components/lab/NavigationDock'
import OpsPanel from '../components/lab/OpsPanel'
import Inspector from '../components/lab/Inspector'
import PracticePanel from '../components/lab/PracticePanel'
import GraphEdit from '../components/lab/GraphEdit'
import Transport from '../components/lab/Transport'
import CodePanel from '../components/lab/CodePanel'
import Glyph from '../components/lab/Glyph'

function StageToggles() {
  const showCode = useLab((s) => s.showCode)
  const showInfo = useLab((s) => s.showInfo)
  const autoRotate = useLab((s) => s.autoRotate)
  const quality = useLab((s) => s.quality)
  const toggleCode = useLab((s) => s.toggleCode)
  const toggleInfo = useLab((s) => s.toggleInfo)
  const setAutoRotate = useLab((s) => s.setAutoRotate)
  const setQuality = useLab((s) => s.setQuality)

  const btn = (on) =>
    `grid h-8 w-8 place-items-center rounded-[4px] border transition-colors duration-200 ${
      on ? 'border-acid/40 bg-acid/10 text-acid' : 'border-[var(--line)] bg-ink-900/70 text-muted hover:text-bone'
    }`

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-20 flex gap-1.5">
      <button
        className={btn(false)}
        aria-label="Save a PNG of the viewport"
        onClick={() => {
          const canvas = document.querySelector('canvas')
          if (!canvas) return
          canvas.toBlob((blob) => {
            if (!blob) return
            const a = document.createElement('a')
            const st = useLab.getState()
            a.href = URL.createObjectURL(blob)
            a.download = `structure-${st.entry.id}-frame-${st.index + 1}.png`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 4000)
            st.toastIt('ok', 'Frame saved as PNG')
          }, 'image/png')
        }}
        title="Save this frame as PNG"
      >
        <Glyph name="camera" size={14} />
      </button>
      <button className={btn(showCode)} onClick={toggleCode} aria-label="Toggle pseudocode (c)" title="Toggle pseudocode (c)">
        <Glyph name="code" size={14} />
      </button>
      <button className={btn(showInfo)} onClick={toggleInfo} aria-label="Toggle detail panel (i)" title="Toggle detail panel (i)">
        <Glyph name="info" size={14} />
      </button>
      <button className={btn(autoRotate)} onClick={() => setAutoRotate(!autoRotate)} aria-label="Toggle slow orbit" title="Slow orbit when idle">
        <Glyph name="orbit" size={14} />
      </button>
      <button
        className={`${btn(quality === 'high')} w-auto px-2 text-[12px] font-semibold`}
        onClick={() => setQuality(quality === 'high' ? 'eco' : 'high')}
        aria-label="Toggle render quality"
        title="Render quality"
      >
        {quality === 'high' ? 'HQ' : 'ECO'}
      </button>
    </div>
  )
}

function Toast() {
  const toast = useLab((s) => s.toast)
  return (
    <div className="pointer-events-none absolute bottom-24 right-4 z-30">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.at}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`panel flex items-center gap-2.5 px-3.5 py-2.5 text-[11.5px] shadow-[0_14px_40px_-10px_rgba(0,0,0,0.9)] ${
              toast.kind === 'error' ? 'border-bad/40 text-bad' : 'border-acid/30 text-bone-dim'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${toast.kind === 'error' ? 'bg-bad' : 'bg-acid'}`} />
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Lab() {
  const snapshot = useLab((s) => s.snapshot)
  const entry = useLab((s) => s.entry)
  const selected = useLab((s) => s.selected)
  const index = useLab((s) => s.index)
  const editMode = useLab((s) => s.editMode)
  const setEditMode = useLab((s) => s.setEditMode)
  const selectedLink = useLab((s) => s.selectedLink)
  const setSelectedLink = useLab((s) => s.setSelectedLink)
  const showInspectorPanel = useLab((s) => s.showInspectorPanel)
  const frameToken = useLab((s) => s.frameToken)
  const autoRotate = useLab((s) => s.autoRotate)
  const quality = useLab((s) => s.quality)
  const reduceMotion = useReducedMotion()
  const painting = useRef(false)

  const paintCell = useCallback((id) => {
    const s = useLab.getState()
    const [r, c] = String(id).split('_').map(Number)
    if (!Number.isFinite(r) || !Number.isFinite(c)) return
    if (s.brush === 'start') s.machine.setStart(r, c)
    else if (s.brush === 'goal') s.machine.setGoal(r, c)
    else s.machine.paint(r, c, s.brush)
    s.paintCellRefresh()
  }, [])

  const onSelect = useCallback(
    (id) => {
      const s = useLab.getState()
      if (s.paintMode && s.entry.paintable) {
        paintCell(id)
        return
      }
      s.setSelected(id === s.selected ? null : id)
    },
    [paintCell],
  )

  const onHover = useCallback(
    (id) => {
      const s = useLab.getState()
      if (painting.current && s.paintMode && s.entry.paintable && id && id.includes('_')) paintCell(id)
    },
    [paintCell],
  )

  useEffect(() => {
    const down = (e) => {
      if (e.target?.tagName === 'CANVAS') painting.current = true
    }
    const up = () => (painting.current = false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  // keyboard transport
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      const s = useLab.getState()
      switch (e.key) {
        case ' ':
          e.preventDefault()
          s.togglePlay()
          break
        case 'ArrowRight':
        case 'ArrowLeft':
          e.preventDefault()
          /* in graph edit mode the arrows nudge the focused node instead of stepping */
          if (s.editMode && s.editFocus && s.entry.scene === 'graph') {
            const n = s.machine.nodes.find((n) => n.id === s.editFocus)
            if (n) {
              const d = e.shiftKey ? 0.25 : 0.75
              s.machine.moveNode(n.id, n.pos[0] + (e.key === 'ArrowRight' ? d : -d), n.pos[1], n.pos[2])
              s.syncMachine()
              break
            }
          }
          s.stepBy(e.key === 'ArrowRight' ? 1 : -1)
          break
        case 'r':
          s.restart()
          break
        case 'e':
          s.jumpEnd()
          break
        case 'f':
          s.frame()
          break
        case 'c':
          s.toggleCode()
          break
        case 'i':
          s.toggleInfo()
          break
        case 'p':
          s.togglePractice()
          break
        case '1':
        case '2':
        case '3':
        case '4':
          if (s.practice.on && s.practice.q && !s.practice.review) {
            e.preventDefault()
            if (!s.practice.checked) s.pickPractice(Number(e.key) - 1)
          }
          break
        case 'ArrowUp':
        case 'ArrowDown':
          if (s.editMode && s.editFocus && s.entry.scene === 'graph') {
            e.preventDefault()
            const n = s.machine.nodes.find((n) => n.id === s.editFocus)
            if (n) {
              const d = e.shiftKey ? 0.25 : 0.75
              s.machine.moveNode(n.id, n.pos[0], n.pos[1], n.pos[2] + (e.key === 'ArrowDown' ? d : -d))
              s.syncMachine()
            }
          }
          break
        case 'Delete':
        case 'Backspace':
          if (s.selectedLink && s.entry.scene === 'graph') {
            e.preventDefault()
            s.machine.removeEdge(s.selectedLink)
            s.setSelectedLink(null)
            s.syncMachine()
          }
          break
        case 'Escape':
          if (s.selectedLink) s.setSelectedLink(null)
          else if (s.editMode) s.setEditMode(false)
          break
        case 'Enter':
          if (s.practice.on && s.practice.q && !s.practice.review) {
            e.preventDefault()
            if (!s.practice.checked) s.checkPractice()
            else s.continuePractice()
          }
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink-950 text-bone">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <NavigationDock />

        <main className="relative min-w-0 flex-1">
          <div className="absolute inset-0">
            <Stage
              frameIndex={index}
              editMode={editMode && entry.scene === 'graph'}
              onNodeMove={(id, pt) => {
                useLab.getState().machine.moveNode(id, pt.x, pt.y, pt.z)
                useLab.getState().setEditFocus(id)
                useLab.getState().syncMachine()
              }}
              onLinkSelect={(id) => setSelectedLink(id)}
              selectedLink={selectedLink}
              snapshot={snapshot}
              scene={entry.scene}
              selected={selected}
              onSelect={onSelect}
              onHover={onHover}
              frameToken={frameToken}
              autoRotate={autoRotate}
              quality={quality}
            />
          </div>

          {entry.scene === 'graph' && <GraphEdit />}
          <CodePanel />
          <StageToggles />
          <PracticePanel />
          <Transport />
          <Toast />

          <div className="pointer-events-none absolute right-4 top-[52px] z-10 hidden text-right text-[12px] leading-relaxed text-faint xl:block">
            drag orbit · scroll zoom · click a node to target it
            <br />
            space play · ← → step · f frame · c code
          </div>
        </main>

        <motion.aside
          aria-hidden={!showInspectorPanel}
          inert={!showInspectorPanel}
          initial={false}
          animate={{ width: showInspectorPanel ? 320 : 0, opacity: showInspectorPanel ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`hidden shrink-0 overflow-hidden bg-ink-900 xl:block ${showInspectorPanel ? 'border-l border-[var(--line)]' : ''}`}
        >
          <div className="h-full w-[320px]"><Inspector /></div>
        </motion.aside>
      </div>

      <MobileDrawer />
    </div>
  )
}

function MobileDrawer() {
  const panel = useLab((s) => s.mobilePanel)
  const setPanel = useLab((s) => s.setMobilePanel)
  return (
    <AnimatePresence>
      {panel && (
        <>
          <motion.button
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm"
          />
          <motion.aside
            key={panel}
            initial={{ x: panel === 'ops' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: panel === 'ops' ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={`fixed inset-y-0 z-50 w-[min(320px,86vw)] border-[var(--line)] bg-ink-900 ${
              panel === 'ops' ? 'left-0 border-r' : 'right-0 border-l'
            }`}
          >
            <div className="flex h-12 items-center justify-between border-b border-[var(--line)] px-4">
              <span className="label-xs">{panel === 'ops' ? 'operations' : 'inspector'}</span>
              <button onClick={() => setPanel(null)} className="text-[13px] text-muted hover:text-bone">
                close ✕
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">{panel === 'ops' ? <OpsPanel /> : <Inspector />}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
