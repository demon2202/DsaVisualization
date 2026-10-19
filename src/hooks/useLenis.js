/**
 * useLenis.js — Lenis smooth scrolling wired into GSAP's ticker so
 * ScrollTrigger and the inertia never disagree about where the page is.
 */
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    const onScroll = () => ScrollTrigger.update()
    const raf = (time) => lenis.raf(time * 1000)
    lenis.on('scroll', onScroll)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    if (typeof window !== 'undefined') window.__lenis = lenis
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      if (typeof window !== 'undefined' && window.__lenis === lenis) delete window.__lenis
    }
  }, [enabled])

  return {
    scrollTo: (target) => window.__lenis?.scrollTo(target, { offset: 0, duration: 1.4 }),
  }
}

export { gsap, ScrollTrigger }
