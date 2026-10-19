import { useEffect, useMemo, useRef, useState } from 'react'
import { machineFor, useLab } from '../state/lab'
import Stage from '../three/Stage'
import useLenis, { gsap, ScrollTrigger } from '../hooks/useLenis'
import { ENTRIES, entryById, FAMILIES } from '../lib/registry'
import Glyph from '../components/lab/Glyph'
import OpsPanel from '../components/lab/OpsPanel'
import CodePanel from '../components/lab/CodePanel'
import Transport from '../components/lab/Transport'
import Inspector from '../components/lab/Inspector'

/* ── the page's one signature move: masked line reveal ─────────────────── */
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useMaskedReveal(rootRef, selector, delay = 0.2) {
  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.set(`${selector} > span`, { yPercent: 115 })
      gsap.to(`${selector} > span`, { yPercent: 0, duration: 0.95, delay, ease: 'power4.out' })
    }, rootRef)
    return () => ctx.revert()
  }, [rootRef, selector, delay])
}

function useSectionEntrances(rootRef) {
  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-enter]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        )
      })
    }, rootRef)
    return () => ctx.revert()
  }, [rootRef])
}

/* ── hero ──────────────────────────────────────────────────────────────── */
function Hero() {
  const root = useRef(null)
  useMaskedReveal(root, '.hero-line', 0.15)
  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-late', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.75, stagger: 0.09, ease: 'power3.out' })
    }, root)
    return () => {
      ctx.revert()
    }
  }, [root])

  const setRoute = useLab((s) => s.setRoute)
  const setEntry = useLab((s) => s.setEntry)

  return (
    <section ref={root} className="relative grid min-h-[100svh] grid-rows-[1fr] md:grid-cols-2">
      <div className="relative flex flex-col justify-between bg-carnival-paper px-5 pb-10 pt-8 text-ink-950 md:px-10 md:pb-12 md:pt-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center bg-carnival-yellow text-ink-950">
            <Glyph name="trees" size={14} stroke={1.8} />
          </span>
          <span className="font-display text-[18px] font-semibold tracking-[-0.02em]">structure<span className="text-oxblood">.</span></span>
        </div>

        <div className="max-w-[54ch]">
          <p className="hero-late mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-oxblood">
            Interactive study · Vol. 01
          </p>
          <h1 className="hero-line display max-w-[13ch] text-[clamp(42px,5.4vw,78px)] leading-[0.94]" style={{ marginLeft: '-0.05em' }}>
            <span>a laboratory for data structures</span>
          </h1>
          <p className="hero-late mt-6 max-w-[42ch] text-[17px] leading-[1.55] text-ink-500 md:text-[18px]">
            Every operation is recorded as a timeline of complete 3D states. Play it, scrub it, step it. The pseudocode lights up on the line being executed.
          </p>
          <div className="hero-late mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              onClick={() => {
                setEntry('bst')
                setRoute('lab')
              }}
              className="bg-carnival-red px-6 py-3 text-[16px] font-semibold text-carnival-paper transition-colors duration-150 hover:bg-carnival-yellow hover:text-ink-950"
            >
              Open the lab <span aria-hidden="true" className="ml-2">↗</span>
            </button>
            <span className="text-[14px] text-ink-500">12 structures <span className="mx-1.5 text-oxblood">·</span> 40+ operations</span>
          </div>
        </div>
      </div>

      <div className="relative min-h-[58svh] overflow-hidden bg-carnival-ink md:min-h-0">
        <div className="absolute inset-0">
          <HeroStage />
        </div>
      </div>
    </section>
  )
}

function HeroStage() {
  const machine = useMemo(() => machineFor(entryById('bst')), [])
  const [snapshot, setSnapshot] = useState(() => machine.snapshot())
  const [value, setValue] = useState('42')
  const [error, setError] = useState('')

  const insertValue = () => {
    const raw = value.trim()
    const result = raw ? machine.insert(Number(raw)) : { ok: false, error: 'Enter a number' }
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSnapshot(machine.snapshot())
    setError('')
  }

  return (
    <>
      <Stage snapshot={snapshot} scene="tree" frameToken={1} autoRotate={false} quality="high" frameScale={1.05} />
      <div data-ui className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between gap-3 sm:inset-x-7 sm:top-7">
        <div className="border border-carnival-paper/15 bg-carnival-ink/85 px-3.5 py-2.5 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-carnival-yellow">Live model</p>
          <p className="mt-0.5 text-[14px] font-medium text-carnival-paper">Binary search tree</p>
        </div>
        <div className="border border-carnival-paper/15 bg-carnival-ink/85 px-3.5 py-2.5 text-right backdrop-blur-sm">
          <p className="font-mono text-[14px] tabular-nums text-carnival-paper">{snapshot.nodes.length} nodes</p>
          <p className="mt-0.5 text-[11px] text-carnival-paper/65">left &lt; node &lt; right</p>
        </div>
      </div>
      <form
        data-ui
        onSubmit={(event) => {
          event.preventDefault()
          insertValue()
        }}
        className="absolute inset-x-4 bottom-4 border border-carnival-paper/15 bg-carnival-ink/95 p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.24)] sm:inset-x-7 sm:bottom-7 sm:p-4"
      >
        <div className="flex flex-wrap items-end gap-2.5">
          <label className="mr-auto min-w-0 pb-0.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-carnival-paper/65">Try an insert</span>
            <span className="mt-0.5 block text-[14px] text-carnival-paper">Add a value to the tree</span>
          </label>
          <input
            id="hero-insert"
            aria-label="Value to insert into the tree"
            type="number"
            step="any"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError('')
            }}
            className="h-10 w-24 border border-carnival-paper/20 bg-ink-800 px-3 text-[16px] font-medium tabular-nums text-bone outline-none focus-visible:border-carnival-yellow focus-visible:outline-2 focus-visible:outline-gold"
          />
          <button
            type="submit"
            className="h-10 bg-carnival-yellow px-4 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-carnival-paper focus-visible:outline-2 focus-visible:outline-carnival-paper"
          >
            Insert <span aria-hidden="true" className="ml-1">↗</span>
          </button>
        </div>
        <p aria-live="polite" className={`mt-2 min-h-4 text-[12px] ${error ? 'text-[#ff9a87]' : 'text-carnival-paper/55'}`}>
          {error || 'Drag to orbit · scroll to zoom'}
        </p>
      </form>
    </>
  )
}

/* ── showcase: lit panel, dark row ─────────────────────────────────────── */
const PANELS = [
  {
    name: 'the composer',
    lines: 'Pick an operation, give it arguments, run it. Every control is the real one from the lab.',
    Fragment: () => (
      <div className="h-[min(430px,62svh)] w-[min(286px,calc(100vw-64px))] overflow-hidden">
        <OpsPanel />
      </div>
    ),
  },
  {
    name: 'the pseudocode',
    lines: 'Frames carry the lines they execute. The panel highlights them as the player advances.',
    Fragment: () => (
      <div className="relative h-[min(300px,48svh)] w-[min(380px,calc(100vw-64px))] overflow-hidden">
        <CodePanel />
      </div>
    ),
  },
  {
    name: 'the transport',
    lines: 'Restart, step, scrub, change speed. Frames are absolute snapshots, so backwards is exact.',
    Fragment: () => (
      <div className="relative h-[120px] w-[min(600px,calc(100vw-64px))] overflow-hidden">
        <Transport />
      </div>
    ),
  },
  {
    name: 'the inspector',
    lines: 'Narration for the current frame, live metrics, complexity and the places this structure earns its keep.',
    Fragment: () => (
      <div className="h-[min(430px,62svh)] w-[min(300px,calc(100vw-64px))] overflow-hidden">
        <Inspector />
      </div>
    ),
  },
]

function Showcase() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const triggerRef = useRef(null)
  const [active, setActive] = useState(0)
  const animated = !reduced()

  useEffect(() => {
    if (reduced()) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
          if (visible) setActive(Number(visible.target.dataset.panelIndex))
        },
        { threshold: [0.5, 0.75] },
      )
      sectionRef.current?.querySelectorAll('[data-panel]').forEach((panel) => observer.observe(panel))
      return () => observer.disconnect()
    }
    let current = -1
    const ctx = gsap.context(() => {
      const tween = gsap.to(trackRef.current, {
        xPercent: -((PANELS.length - 1) / PANELS.length) * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          snap: {
            snapTo: 1 / (PANELS.length - 1),
            duration: { min: 0.2, max: 0.65 },
            delay: 0.04,
            ease: 'power2.inOut',
          },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const next = Math.round(self.progress * (PANELS.length - 1))
            if (next !== current) {
              current = next
              setActive(next)
            }
          },
        },
      })
      triggerRef.current = tween.scrollTrigger
    }, sectionRef)
    return () => {
      ctx.revert()
      triggerRef.current = null
    }
  }, [])

  const goTo = (index) => {
    const trigger = triggerRef.current
    if (!trigger) {
      const panel = sectionRef.current?.querySelector(`[data-panel-index="${index}"]`)
      if (panel) {
        const top = panel.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' })
      }
      return
    }
    const target = trigger.start + ((trigger.end - trigger.start) * index) / (PANELS.length - 1)
    if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.1 })
    else window.scrollTo({ top: target, behavior: reduced() ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      className="relative bg-carnival-ink text-carnival-paper"
      style={animated ? { height: `${PANELS.length * 100}svh` } : undefined}
    >
      <div className={`flex flex-col ${animated ? 'sticky top-0 h-svh min-h-[600px]' : ''}`}>
        <header className="flex shrink-0 items-end justify-between gap-5 border-b border-carnival-paper/20 px-5 py-5 md:px-10 md:py-6">
          <div>
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-carnival-yellow">Inside the lab</p>
            <h2 className="display text-[clamp(24px,3vw,38px)]">A closer look at the instrument</h2>
          </div>
          <span className="hidden font-display text-[14px] uppercase tracking-[0.12em] text-carnival-paper/65 sm:block">
            Scroll to explore
          </span>
        </header>

        <div className={`min-h-0 flex-1 overflow-hidden ${animated ? '' : 'overflow-visible'}`}>
          <div ref={trackRef} className={`flex h-full ${animated ? 'w-[400%]' : 'w-full flex-col'}`}>
            {PANELS.map((p, i) => (
              <article
                key={p.name}
                data-panel
                data-panel-index={i}
                className={`flex shrink-0 items-center justify-center ${animated ? 'h-full w-1/4' : 'min-h-[80svh] w-full border-b border-carnival-paper/15'}`}
                aria-label={`${i + 1}. ${p.name}`}
              >
                <div className="grid h-full w-full max-w-[1280px] grid-cols-1 items-center gap-5 px-5 py-6 sm:gap-8 md:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.28fr)] md:gap-12 md:px-10 lg:gap-20">
                  <div className="max-w-[42ch]">
                    <span className="mb-4 block font-display text-[15px] tracking-[0.12em] text-carnival-yellow">
                      {String(i + 1).padStart(2, '0')} <span className="text-carnival-paper/40">/ {String(PANELS.length).padStart(2, '0')}</span>
                    </span>
                    <h3 className="display text-[clamp(34px,4.4vw,62px)] leading-[0.98]">{p.name}</h3>
                    <p className="mt-5 max-w-[36ch] text-[16px] leading-relaxed text-carnival-paper/75 md:text-[18px]">
                      {p.lines}
                    </p>
                  </div>
                  <div className="showcase-preview relative flex max-h-[68svh] min-h-[220px] items-center justify-center overflow-hidden border border-carnival-paper/20 bg-ink-900 px-3 py-4 md:min-h-[360px] md:px-8 md:py-7" data-ui>
                    <p.Fragment />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-4 border-t border-carnival-paper/20 px-5 py-4 md:px-10">
          <div className="flex items-center gap-2" role="group" aria-label="Showcase panels">
            {PANELS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => goTo(i)}
                aria-label={`Go to panel ${i + 1}: ${p.name}`}
                aria-current={active === i ? 'step' : undefined}
                className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ${active === i ? 'w-8 bg-carnival-yellow' : 'w-2.5 bg-carnival-paper/35 hover:bg-carnival-paper/70'}`}
              />
            ))}
          </div>
          <span className="font-display text-[13px] tabular-nums text-carnival-paper/70">
            {String(active + 1).padStart(2, '0')} / {String(PANELS.length).padStart(2, '0')}
          </span>
          <span className="ml-auto text-[13px] text-carnival-paper/55">Wheel or trackpad to move through the interface</span>
        </footer>
      </div>
    </section>
  )
}

/* ── features: small proof beside text ─────────────────────────────────── */
const MODULES = [
  {
    h: 'Frame-accurate playback',
    p: [
      'An operation records complete states: positions, colours, counters and a sentence of narration per frame. Nothing is derived from deltas.',
      'Scrub to frame 47 of 180 and the structure is exactly as it was there.',
    ],
    proof: (
      <div className="relative h-[72px] w-full overflow-hidden" data-ui>
        <Transport />
      </div>
    ),
  },
  {
    h: 'Code and picture, one clock',
    p: [
      'Each frame references the pseudocode lines it executes, so the highlight moves with the algorithm instead of approximating it.',
      'Thirty-seven blocks cover every operation in the lab.',
    ],
    proof: (
      <div className="relative h-[170px] w-full overflow-hidden" data-ui>
        <CodePanel />
      </div>
    ),
  },
  {
    h: 'The numbers interviews ask for',
    p: [
      'Comparisons, swaps, writes, expansions, load factor, balance factor, path cost, updated per frame rather than revealed at the end.',
      'Complexity tables sit beside them, average and worst case.',
    ],
    proof: (
      <div className="h-[112px] w-full overflow-hidden" data-ui>
        <Inspector />
      </div>
    ),
  },
  {
    h: 'One colour language',
    p: [
      'Amber means comparing. Dusty violet means restructuring. Sky means traversed. Bone-white means settled. Rose means removed.',
      'Learn it once and every one of the twelve scenes reads the same way.',
    ],
    proof: (
      <div className="flex h-[120px] w-full items-center gap-2 px-4">
        {[
          ['#e3a83e', 'comparing'],
          ['#a98bd9', 'restructuring'],
          ['#7fb6d9', 'traversed'],
          ['#eae4d9', 'settled'],
          ['#e06a5e', 'removed'],
        ].map(([hex, name]) => (
          <div key={name} className="flex-1">
            <div className="h-10 w-full" style={{ background: hex, borderRadius: 4 }} />
            <div className="mt-2 text-[13px] text-muted">{name}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    h: 'A camera that pays attention',
    p: [
      'Drag to orbit, scroll to zoom, click any node to target it. While an algorithm runs the rig drifts toward the action and reframes as the structure grows.',
      'It never fights your input; touch it and it yields.',
    ],
    proof: (
      <div className="relative h-[140px] w-full overflow-hidden halftone bg-paper-2" style={{ borderRadius: 4 }}>
        <div className="absolute inset-0 grid place-items-center">
          <span className="bg-paper px-3 py-1.5 text-[14px] font-semibold text-ink-950" style={{ borderRadius: 4 }}>
            drag · scroll · click · f to frame
          </span>
        </div>
      </div>
    ),
  },
]

function Features() {
  return (
    <section className="relative overflow-hidden bg-carnival-paper text-ink-950">
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <header data-enter className="grid gap-8 border-b border-oxblood/35 pb-9 md:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] md:items-end md:gap-16 md:pb-12">
          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.17em] text-oxblood">Field notes · 05 principles</p>
            <h2 className="display max-w-[14ch] text-[clamp(42px,6vw,82px)] leading-[0.92]" style={{ marginLeft: '-0.04em' }}>
              How the instrument thinks
            </h2>
          </div>
          <p className="max-w-[42ch] text-[16px] leading-relaxed text-ink-500 md:pb-1 md:text-[18px]">
            Not just a picture of an algorithm. Each control, frame and number follows the same live state—so you can inspect what changed and why.
          </p>
        </header>

        <div>
          {MODULES.map((m, i) => (
            <article
              key={m.h}
              data-enter
              className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-4 gap-y-5 border-b border-oxblood/25 py-7 md:grid-cols-[56px_minmax(220px,0.78fr)_minmax(0,1.22fr)] md:gap-x-7 md:gap-y-0 md:py-8 xl:gap-x-12"
            >
              <span className="self-start pt-1 font-display text-[22px] text-oxblood md:text-[26px]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="max-w-[42ch]">
                <h3 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.025em] md:text-[26px]">{m.h}</h3>
                {m.p.map((t) => (
                  <p key={t} className="mt-2.5 text-[15px] leading-relaxed text-ink-500 md:text-[16px]">
                    {t}
                  </p>
                ))}
              </div>
              <div className="col-span-2 min-w-0 overflow-hidden border-l-4 border-carnival-yellow bg-carnival-red text-bone md:col-span-1">
                {m.proof}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── list: family tabs, banded entries ─────────────────────────────────── */
function EntryList() {
  const [fam, setFam] = useState(FAMILIES[0].id)
  const setRoute = useLab((s) => s.setRoute)
  const entries = ENTRIES.filter((e) => e.family === fam)

  return (
    <section className="bg-ink-900 px-5 py-28 md:px-10 md:py-36">
      <div data-enter className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="display text-[clamp(36px,4.4vw,64px)] leading-[0.95]" style={{ marginLeft: '-0.04em' }}>
          <span className="block text-muted">twelve structures,</span>
          <span className="block text-bone">forty-plus operations</span>
        </h2>
        <button onClick={() => setRoute('lab')} className="bg-bone px-5 py-2.5 text-[17px] font-semibold text-ink-950 hover:bg-gold">
          Open the lab
        </button>
      </div>

      <div data-enter className="mt-14 flex flex-col gap-8 md:flex-row md:gap-10">
        <div className="flex shrink-0 gap-1.5 overflow-x-auto md:w-[150px] md:flex-col md:overflow-visible">
          {FAMILIES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFam(f.id)}
              className={`flex h-16 shrink-0 items-center gap-2.5 px-4 text-left text-[17px] transition-colors duration-200 md:w-[150px] ${
                fam === f.id ? 'bg-ink-700 text-bone' : 'bg-ink-850 text-muted hover:text-bone-dim'
              }`}
              style={{ borderRadius: 6 }}
            >
              <Glyph name={f.id} size={16} />
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {entries.map((e, i) => (
            <button
              key={e.id}
              onClick={() => {
                useLab.getState().setEntry(e.id)
                setRoute('lab')
              }}
              className={`group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-ink-750 md:h-[76px] md:px-6 ${
                i % 2 ? 'bg-ink-850' : 'bg-ink-800'
              }`}
              style={{ borderRadius: 8 }}
            >
              <div className="min-w-0">
                <div className="truncate text-[17px] font-semibold tracking-[-0.01em] text-bone">{e.name}</div>
                <div className="mt-0.5 truncate text-[14px] text-muted">{e.tagline}</div>
              </div>
              <div className="mono-num text-right text-[14px] text-gold">{e.complexity[0]?.avg}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── cta: first step, already open ─────────────────────────────────────── */
function Closing() {
  const root = useRef(null)
  const [seg, setSeg] = useState('insert')
  useMaskedReveal(root, '.closing-line', 0)
  const setRoute = useLab((s) => s.setRoute)

  return (
    <section ref={root} className="relative grid min-h-[90svh] grid-rows-2 bg-gold md:grid-cols-12 md:grid-rows-1">
      <div className="flex flex-col justify-end px-5 pb-10 pt-16 md:col-span-5 md:col-start-1 md:px-10">
        <h2 className="display text-[clamp(40px,4.4vw,64px)] leading-[0.95] text-ink-950" style={{ marginLeft: '-0.04em' }}>
          <span className="closing-line line-mask">
            <span className="whitespace-nowrap">stop memorising.</span>
          </span>
          <span className="closing-line line-mask">
            <span className="whitespace-nowrap">start watching.</span>
          </span>
        </h2>
        <p className="mt-6 max-w-[38ch] text-[17px] leading-[1.5] text-ink-950/80">
          The lab opens with whatever you leave running here. Type a value in the panel and it inserts into the live tree before you cross over.
        </p>
      </div>
      <div className="flex items-center px-5 pb-16 md:col-span-5 md:col-start-7 md:px-0">
        <div className="w-full max-w-[440px] bg-ink-900 p-5" style={{ borderRadius: 6, boxShadow: '0 32px 80px rgba(12,10,8,0.45)' }} data-ui>
          <div className="text-[17px] font-semibold text-bone">Name your first run</div>
          <div className="mt-4 flex items-center gap-2">
            <input
              defaultValue={42}
              inputMode="numeric"
              aria-label="value to insert"
              className="w-20 border-0 bg-ink-750 px-3 py-2.5 text-[14px] text-bone tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-gold"
              id="cta-value"
            />
            <div className="flex flex-1 bg-ink-750 p-1" style={{ borderRadius: 4 }}>
              {['insert', 'search'].map((op) => (
                <button
                  key={op}
                  aria-pressed={seg === op}
                  className={`flex-1 py-1.5 text-[14px] font-semibold transition-colors ${seg === op ? 'bg-ink-600 text-bone' : 'text-muted hover:text-bone-dim'}`}
                  style={{ borderRadius: 3 }}
                  onClick={() => setSeg(op)}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
          <button
            className="mt-4 w-full bg-bone py-3.5 text-[17px] font-semibold text-ink-950 hover:bg-gold"
            onClick={() => {
              const s = useLab.getState()
              if (s.entry.id !== 'bst') s.setEntry('bst')
              const op = useLab.getState().entry.ops.find((o) => o.id === seg)
              if (op) s.runOp(op, { value: Number(document.getElementById('cta-value').value) || 0 })
              setRoute('lab')
            }}
          >
            Open the lab with this run
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── footer: a single quiet line ───────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-ink-950 px-5 pb-8 pt-[30svh] md:px-10">
      <div className="grid grid-cols-1 gap-2 text-[14px] md:grid-cols-[1fr_auto_1fr] md:items-baseline md:gap-6">
        <div className="text-muted">a 3d algorithms laboratory</div>
        <div className="flex gap-6">
          <button
            className="text-bone transition-colors hover:text-gold"
            onClick={() => window.__lenis?.scrollTo('#showcase', { duration: 1.2 })}
          >
            the panels
          </button>
          <button
            className="text-bone transition-colors hover:text-gold"
            onClick={() => window.__lenis?.scrollTo('#list', { duration: 1.2 })}
          >
            the syllabus
          </button>
          <a className="text-bone transition-colors hover:text-gold" href="https://github.com/demon2202/DsaVisualization" target="_blank" rel="noreferrer">
            source
          </a>
        </div>
        <div className="text-muted md:text-right">2026 · mit licence</div>
      </div>
    </footer>
  )
}

export default function Landing() {
  useLenis(true)
  const root = useRef(null)
  useSectionEntrances(root)

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#showcase',
      start: 'top top',
      onEnter: () => gsap.to('[data-corner-link]', { opacity: 0, pointerEvents: 'none', duration: 0.3 }),
      onEnterBack: () => gsap.to('[data-corner-link]', { opacity: 0, pointerEvents: 'none', duration: 0.3 }),
      onLeaveBack: () => gsap.to('[data-corner-link]', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }),
    })
    return () => st.kill()
  }, [])

  /* seed one paused run so every fragment on the page has real content */
  useEffect(() => {
    const s = useLab.getState()
    if (s.entry.id !== 'bst') s.setEntry('bst')
    const st = useLab.getState()
    if (st.steps.length === 0) {
      const op = st.entry.ops.find((o) => o.id === 'search')
      st.runOp(op, { value: 35 }, { autoplay: false })
      const n = useLab.getState().steps.length
      if (n) useLab.getState().seek(Math.floor(n * 0.6))
    }
  }, [])

  return (
    <div ref={root} className="relative min-h-[100svh] bg-ink-950 text-bone">
      <a
        href="#showcase"
        data-corner-link
        onClick={(e) => {
          e.preventDefault()
          window.__lenis?.scrollTo('#showcase', { duration: 1.3 })
        }}
        className="fixed right-5 top-10 z-40 text-[14px] text-muted transition-[color,opacity] duration-300 hover:text-bone md:right-10"
      >
        see it run
      </a>
      <Hero />
      <div id="showcase">
        <Showcase />
      </div>
      <Features />
      <div id="list">
        <EntryList />
      </div>
      <Closing />
      <Footer />
    </div>
  )
}
