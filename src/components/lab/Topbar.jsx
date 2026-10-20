import { useLab } from '../../state/lab'
import { FAMILIES } from '../../lib/registry'
import Glyph from './Glyph'

/**
 * Topbar — identity, and the few doors that are not the stage.
 * The current model and its operations live behind the hover-reveal LAB rail;
 * notes behind NOTES. On touch both become drawers from the same two buttons.
 */
function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span className="wordmark text-[20px] text-bone">structure</span>
      <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
    </span>
  )
}

export default function Topbar({ panel, onOpenLab, onOpenNotes }) {
  const entry = useLab((state) => state.entry)
  const setRoute = useLab((state) => state.setRoute)
  const practiceOn = useLab((state) => state.practice.on)
  const togglePractice = useLab((state) => state.togglePractice)
  const family = FAMILIES.find((item) => item.id === entry.family)

  const copyLink = async () => {
    if (!navigator.clipboard?.writeText) {
      useLab.getState().toastIt('error', 'Clipboard unavailable. Copy the URL from the address bar.')
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      useLab.getState().toastIt('ok', 'Link copied.')
    } catch {
      useLab.getState().toastIt('error', 'Clipboard blocked. Copy the URL from the address bar.')
    }
  }

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--line)] bg-ink-950 px-3 md:px-5">
      <button onClick={() => setRoute('landing')} className="flex h-9 shrink-0 items-center" aria-label="Structure — home">
        <Wordmark />
      </button>

      <span className="hidden h-5 w-px shrink-0 bg-[var(--line-2)] md:block" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <span className="eyebrow hidden shrink-0 sm:block">{family?.name}</span>
        <span className="hidden text-faint sm:block" aria-hidden="true">
          /
        </span>
        <span className="truncate text-[13.5px] font-medium text-bone">{entry.name}</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          onClick={onOpenLab}
          className="icon-btn lg:hidden"
          aria-label="Open lab controls"
          title="Lab controls"
        >
          <Glyph name="menu" size={16} />
        </button>

        <button
          onClick={togglePractice}
          aria-pressed={practiceOn}
          aria-label="Practice mode"
          className={`btn btn-ghost h-8 px-2 text-[12.5px] sm:px-3 ${practiceOn ? 'text-signal' : ''}`}
          title="Practice mode (p)"
        >
          <Glyph name="quiz" size={14} />
          <span className="hidden sm:inline">Practice</span>
        </button>

        <button onClick={copyLink} className="icon-btn hidden sm:grid" aria-label="Copy replay link" title="Copy link">
          <Glyph name="link" size={15} />
        </button>

        <button
          onClick={onOpenNotes}
          className="icon-btn"
          data-active={panel === 'notes'}
          aria-expanded={panel === 'notes'}
          aria-label="Toggle the notes panel"
          title="Notes (i)"
        >
          <Glyph name="book" size={15} />
        </button>
      </div>
    </header>
  )
}
