/**
 * useLenis.js — Lenis smooth scrolling for the document.
 *
 * Only the landing opts in. The lab is an instrument: its transport and panels
 * keep native scroll. Lenis drives the real scroll position, so Motion's
 * `useScroll` reads the same progress without a bridge or a second RAF.
 * Reduced motion skips Lenis entirely and leaves native scrolling intact.
 */
import { useEffect, useMemo } from 'react'
import Lenis from 'lenis'

const reduce = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled || reduce()) return
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.25,
      smoothWheel: true,
      /* touch keeps its own inertia: fighting it reads as lag, not luxury */
      syncTouch: false,
    })
    window.__lenis = lenis

    let raf = 0
    const tick = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const refresh = () => lenis.resize()
    const t = setTimeout(refresh, 350)
    window.addEventListener('load', refresh)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('load', refresh)
      lenis.destroy()
      if (window.__lenis === lenis) delete window.__lenis
    }
  }, [enabled])

  return useMemo(
    () => ({
      scrollTo: (target, opts = {}) => {
        const el = typeof target === 'string' ? document.querySelector(target) : target
        const resolved = typeof target === 'string' || typeof target === 'number' ? target : el
        if (!resolved) return
        if (window.__lenis) {
          window.__lenis.scrollTo(resolved, {
            offset: opts.offset ?? -60,
            duration: opts.duration ?? 1.15,
            easing: (t) => 1 - Math.pow(1 - t, 3),
          })
        } else if (el) {
          el.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' })
        } else if (typeof resolved === 'number') {
          window.scrollTo({ top: resolved, behavior: reduce() ? 'auto' : 'smooth' })
        }
      },
      stop: () => window.__lenis?.stop(),
      start: () => window.__lenis?.start(),
    }),
    [],
  )
}
