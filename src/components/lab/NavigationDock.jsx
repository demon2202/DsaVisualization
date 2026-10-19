import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useLab } from '../../state/lab'
import { FAMILIES, entriesByFamily } from '../../lib/registry'
import Glyph from './Glyph'
import OpsPanel from './OpsPanel'

export default function NavigationDock() {
  const entry = useLab((s) => s.entry)
  const setEntry = useLab((s) => s.setEntry)
  const setMobilePanel = useLab((s) => s.setMobilePanel)
  const [pinned, setPinned] = useState(false)
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const update = () => setDesktop(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const chooseFamily = (familyId) => {
    const first = entriesByFamily(familyId)[0]
    if (!first) return
    if (entry.family !== familyId) setEntry(first.id)
    if (desktop) setPinned((current) => (entry.family === familyId ? !current : true))
    else setMobilePanel('ops')
  }

  return (
    <motion.aside
      className={`navigation-dock relative z-30 flex h-full shrink-0 overflow-hidden border-r border-[var(--line)] bg-ink-900 transition-[width] duration-300 ease-out motion-reduce:transition-none ${
        pinned && desktop
          ? 'navigation-dock--pinned w-[356px]'
          : 'w-14'
      }`}
      aria-label="Structure navigation and operations"
    >
      <nav className="flex w-14 shrink-0 flex-col items-center gap-1.5 border-r border-[var(--line)] bg-ink-900 py-2.5" aria-label="Structure families">
        {FAMILIES.map((family) => {
          const active = family.id === entry.family
          return (
            <motion.button
              key={family.id}
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              aria-label={`Switch to ${family.name}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => chooseFamily(family.id)}
              title={`${family.name} — ${family.note}`}
              className={`relative grid h-9 w-9 place-items-center rounded-[4px] transition-colors duration-150 ${
                active ? 'text-acid' : 'text-muted hover:bg-ink-800 hover:text-bone-dim'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="dock-active-family"
                  className="absolute inset-0 rounded-[4px] border border-acid/40 bg-acid/12"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative"><Glyph name={family.id} size={17} /></span>
            </motion.button>
          )
        })}
        <div className="mt-auto">
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => useLab.getState().setRoute('landing')}
            aria-label="Back to overview"
            title="Overview"
            className="grid h-9 w-9 place-items-center rounded-[4px] text-muted transition-colors hover:bg-ink-800 hover:text-bone-dim"
          >
            <Glyph name="home" size={17} />
          </motion.button>
        </div>
      </nav>

      <div
        className={`navigation-dock__panel relative h-full w-[300px] shrink-0 transition-[opacity,visibility] duration-150 motion-reduce:transition-none ${
          desktop
            ? pinned
              ? 'visible opacity-100 pointer-events-auto'
              : 'invisible opacity-0 pointer-events-none'
            : 'hidden'
        }`}
      >
        <button
          type="button"
          onClick={() => setPinned((value) => !value)}
          aria-label={pinned ? 'Unpin operations sidebar' : 'Pin operations sidebar'}
          aria-pressed={pinned}
          title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          className={`absolute right-2.5 top-2.5 z-20 grid h-7 w-7 place-items-center rounded-[4px] border transition-colors ${
            pinned ? 'border-acid/35 bg-acid/10 text-acid' : 'border-[var(--line)] bg-ink-900 text-muted hover:text-bone'
          }`}
        >
          <Glyph name="pin" size={14} />
        </button>
        <OpsPanel />
      </div>
    </motion.aside>
  )
}
