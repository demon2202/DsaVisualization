import { motion } from 'motion/react'
import { useLab } from '../../state/lab'
import { FAMILIES, entriesByFamily } from '../../lib/registry'
import Glyph from './Glyph'

export default function Topbar() {
  const entry = useLab((s) => s.entry)
  const setEntry = useLab((s) => s.setEntry)
  const setRoute = useLab((s) => s.setRoute)
  const showInspectorPanel = useLab((s) => s.showInspectorPanel)
  const toggleInspectorPanel = useLab((s) => s.toggleInspectorPanel)
  const family = FAMILIES.find((item) => item.id === entry.family)
  const siblings = entriesByFamily(entry.family)

  const copyLink = async () => {
    if (!navigator.clipboard?.writeText) {
      useLab.getState().toastIt('error', 'Clipboard unavailable — copy the URL from your address bar')
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      useLab.getState().toastIt('ok', 'Link copied — it replays this exact frame')
    } catch {
      useLab.getState().toastIt('error', 'Clipboard blocked — copy the URL from your address bar')
    }
  }

  const utility =
    'grid h-8 w-8 place-items-center rounded-[4px] border border-[var(--line)] text-muted transition-colors hover:border-[var(--line-2)] hover:bg-ink-800 hover:text-bone'

  return (
    <header className="relative z-30 flex h-11 shrink-0 items-center gap-2 border-b border-[var(--line)] border-t-2 border-t-acid/70 bg-ink-900 px-2.5 sm:px-3.5">
      <button
        onClick={() => setRoute('landing')}
        className="group grid h-7 w-7 shrink-0 place-items-center rounded-[3px] bg-acid text-ink-950 transition-transform duration-200 hover:-rotate-3"
        aria-label="Back to overview"
        title="Overview"
      >
        <Glyph name={family?.id || 'trees'} size={14} stroke={1.7} />
      </button>

      <span className="hidden font-display text-[13px] font-semibold tracking-[-0.02em] text-bone sm:inline">
        structure<span className="text-acid">.</span>
      </span>

      <div className="h-5 w-px shrink-0 bg-[var(--line)]" />

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label={`${family?.name || 'Structure'} variants`}>
        {siblings.map((item) => {
          const active = item.id === entry.id
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setEntry(item.id)}
              whileHover={{ y: -1, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-current={active ? 'page' : undefined}
              aria-label={`Switch to ${item.name}`}
              title={item.name}
              className={`relative grid h-7 shrink-0 place-items-center rounded-[4px] px-2.5 text-[12px] font-semibold tracking-tight transition-colors ${
                active ? 'text-acid' : 'text-muted hover:text-bone'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="structure-dock-active"
                  className="absolute inset-0 rounded-[4px] border border-acid/35 bg-acid/10"
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                />
              )}
              <span className="relative">{item.abbr}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          onClick={() => setRoute('compare')}
          className={`${utility} hidden sm:grid`}
          aria-label="Compare algorithms"
          title="Compare algorithms"
        >
          <Glyph name="compare" size={15} />
        </button>
        <button onClick={copyLink} className={`${utility} hidden sm:grid`} aria-label="Copy replay link" title="Copy replay link">
          <Glyph name="link" size={14} />
        </button>
        <button
          onClick={toggleInspectorPanel}
          className={`${utility} hidden xl:grid ${showInspectorPanel ? 'border-acid/35 bg-acid/10 text-acid' : ''}`}
          aria-label="Toggle explanation sidebar"
          aria-pressed={showInspectorPanel}
          title="Toggle explanation sidebar"
        >
          <Glyph name="info" size={14} />
        </button>
        <button
          onClick={() => useLab.getState().setMobilePanel('ops')}
          className={`${utility} md:hidden`}
          aria-label="Operations"
          title="Open operations"
        >
          <Glyph name={family?.id || 'trees'} size={14} />
        </button>
        <button
          onClick={() => useLab.getState().setMobilePanel('info')}
          className={`${utility} xl:hidden`}
          aria-label="Inspector"
          title="Open explanation"
        >
          <Glyph name="info" size={14} />
        </button>
        <a
          href="https://github.com/demon2202/DsaVisualization"
          target="_blank"
          rel="noreferrer"
          className={utility}
          aria-label="Source repository"
          title="Source repository"
        >
          <Glyph name="github" size={14} />
        </a>
      </div>
    </header>
  )
}
