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
        <div className="max-w-[44ch]">
          <div className="display text-[clamp(26px,3vw,40px)] text-bone">Something broke.</div>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            This view failed to render. Reload the page to start again.
          </p>
          <p className="code-face mt-3 text-[12px] text-faint">{String(this.state.error?.message || this.state.error).slice(0, 140)}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn btn-primary px-4" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
            <button className="btn px-4" onClick={() => window.location.reload()}>
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
 * Two surfaces, one store: the landing page and the lab. The route swap is
 * masked by a short ink wipe so the view never flashes.
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
            <Suspense
              fallback={
                <div className="grid h-dvh place-items-center bg-ink-950">
                  <span className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 animate-pulse bg-signal" aria-hidden="true" />
                    <span className="eyebrow">loading</span>
                  </span>
                </div>
              }
            >
              {boomed() ? <Boom /> : route === 'lab' ? <Lab /> : route === 'compare' ? <Compare /> : <Landing />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
        <motion.div
          key={`wipe-${route}`}
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
          className="pointer-events-none fixed inset-0 z-50 origin-top bg-ink-950"
        />
      </ErrorBoundary>
    </MotionConfig>
  )
}
