import { Component, Suspense, lazy } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useLab } from './state/lab'

/* route-level split: the landing never pays for the lab's UI and vice-versa */
const Lab = lazy(() => import('./pages/Lab'))
const Landing = lazy(() => import('./pages/Landing'))
const Compare = lazy(() => import('./pages/Compare'))

/**
 * One render exception anywhere should not mean a white screen.
 * The boundary names the surface that died and offers a clean reload
 * of either the lab state or the whole page.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('[structure] render failure', error, info?.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-950 px-6 text-center">
        <div className="max-w-[46ch]">
          <div className="display text-[clamp(28px,3vw,44px)] text-bone">the instrument jammed.</div>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Something in this view threw while rendering. Your structures and settings are safe — they live in the
            store, not in the view.
          </p>
          <p className="mono-num mt-3 text-[14px] text-faint">{String(this.state.error?.message || this.state.error).slice(0, 140)}</p>
          <div className="mt-7 flex justify-center gap-3">
            <button
              className="bg-bone px-5 py-2.5 text-[17px] font-semibold text-ink-950 hover:bg-gold"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <button
              className="border border-[var(--line-2)] px-5 py-2.5 text-[17px] font-semibold text-bone-dim hover:text-bone"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}

/* DEV-only: #boom renders a throwing component so error recovery is testable */
function Boom() {
  throw new Error('dev boom')
}
const boomed = () => import.meta.env.DEV && typeof window !== 'undefined' && window.location.hash === '#boom'

/**
 * Two surfaces, one store: the scrolling story (Landing) and the instrument
 * (Lab). The route swap is masked by a short ink wipe so the WebGL world
 * never appears to "reload".
 */
export default function App() {
  const route = useLab((s) => s.route)

  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary key={route}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={route}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="min-h-dvh"
          >
            <Suspense fallback={<div className="grid h-dvh place-items-center bg-ink-950 text-[14px] text-muted">loading…</div>}>
              {boomed() ? <Boom /> : route === 'lab' ? <Lab /> : route === 'compare' ? <Compare /> : <Landing />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
        <motion.div
          key={`wipe-${route}`}
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="pointer-events-none fixed inset-0 z-50 origin-top bg-ink-950"
        />
      </ErrorBoundary>
    </MotionConfig>
  )
}
