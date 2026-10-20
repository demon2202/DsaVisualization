import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useLab } from '../state/lab'
import useLenis from '../hooks/useLenis'
import { ENTRIES, FAMILIES } from '../lib/registry'
import Story from '../components/landing/Story'
import SnapshotDiagram from '../components/diagram/SnapshotDiagram'
import { Reveal } from '../components/landing/visuals'
import { heroRun } from '../components/landing/liveDemos'

const OP_COUNT = ENTRIES.reduce((total, entry) => total + entry.ops.length, 0)

/* ── identity ──────────────────────────────────────────────────────────── */

function Mark({ small = false }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`wordmark text-bone ${small ? 'text-[18px]' : ''}`}>structure</span>
      <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
    </span>
  )
}

/* ── fixed masthead ───────────────────────────────────────────────────── */

function Header({ onOpen, scrollTo }) {
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    ['How it works', '#how'],
    ['The run', '#story'],
    ['Index', '#collection'],
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
        lifted ? 'border-[var(--line)] bg-ink-950/92 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-5 md:px-9">
        <button onClick={() => scrollTo('#top', { offset: 0 })} aria-label="Structure — top of page" className="flex h-10 items-center">
          <Mark />
        </button>

        <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Sections">
          {links.map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id, { offset: -64 })}
              className="text-[13px] text-muted transition-colors hover:text-bone"
            >
              {label}
            </button>
          ))}
        </nav>

        <button onClick={onOpen} className="btn btn-primary ml-auto h-9 px-4 text-[12.5px] md:ml-0">
          Open the lab
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </header>
  )
}

/* ── figure 01: a seven-node tree running search(65) on loop ───────────── */

function HeroVisual() {
  const { run } = useMemo(() => heroRun(), [])
  const steps = run.steps
  const reduced = useReducedMotion()
  const [frame, setFrame] = useState(() => (reduced ? steps.length - 1 : 0))

  useEffect(() => {
    if (reduced) return
    let next = 0
    const timer = setInterval(() => {
      next = (next + 1) % steps.length
      setFrame(next)
    }, 1750)
    return () => clearInterval(timer)
  }, [reduced, steps.length])

  const snapshot = steps[frame]
  const stats = snapshot?.stats || {}

  return (
    <figure className="flex h-full flex-col border border-[var(--line-2)] bg-[#080808] p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-3">
        <figcaption className="eyebrow text-bone-dim">Fig. 01 — Search / seven nodes</figcaption>
        <span className="mono-num text-[10px] text-faint">
          {stats.nodes ?? 0} N · H {stats.height ?? 0}
        </span>
      </div>

      <div className="relative min-h-[270px] flex-1">
        <SnapshotDiagram snapshot={snapshot} scene="tree" fitSteps={steps} />
        <div className="pointer-events-none absolute left-0 top-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
          <span className="mono-num text-[10.5px] text-bone-dim">search(65)</span>
        </div>
        <span className="mono-num pointer-events-none absolute right-0 top-3 text-[10px] text-faint">
          {String(frame + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
      </div>

      <div className="border-t border-[var(--line)] pt-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="mono-num mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-signal">
              {snapshot?.banner || 'SEARCH'}
            </span>
            <p className="line-clamp-2 text-[12.5px] leading-[1.5] text-bone-dim">{snapshot?.note}</p>
          </div>
          <span className="mono-num hidden shrink-0 pt-1 text-[10px] text-faint sm:block">BST / auto</span>
        </div>
        <div className="mt-3 flex items-center gap-1" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`h-[2px] flex-1 transition-colors duration-300 ${index === frame ? 'bg-signal' : index < frame ? 'bg-ink-600' : 'bg-ink-700'}`}
            />
          ))}
        </div>
      </div>
    </figure>
  )
}

/* ── the typographic index ─────────────────────────────────────────────── */

function Collection({ onOpen }) {
  const familyOf = (id) => FAMILIES.find((family) => family.id === id)

  return (
    <section id="collection" className="scroll-mt-20 border-t border-[var(--line)] px-5 py-20 md:px-9 md:py-28">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="eyebrow">Index / {ENTRIES.length} structures</p>
            <h2 className="display mt-5 max-w-[17ch] text-[clamp(36px,5.2vw,72px)]">
              All twelve structures.
            </h2>
          </div>
          <p className="max-w-[42ch] text-[14px] leading-[1.7] text-muted md:justify-self-end">
            Open any entry to run it. Every structure uses the same timeline, transport, pseudocode, and notes.
          </p>
        </Reveal>

        <div className="mt-12 border-t border-[var(--line-2)]">
          <div className="hidden grid-cols-[3rem_minmax(0,1.2fr)_minmax(8rem,0.6fr)_4rem_2rem] items-center gap-4 border-b border-[var(--line)] py-2.5 md:grid">
            <span className="eyebrow">No.</span>
            <span className="eyebrow">Structure</span>
            <span className="eyebrow">Family</span>
            <span className="eyebrow text-right">Ops</span>
            <span />
          </div>

          {ENTRIES.map((entry, index) => (
            <Reveal key={entry.id} delay={Math.min(index * 0.025, 0.16)}>
              <button
                onClick={() => onOpen(entry.id)}
                className="group grid w-full grid-cols-[2.4rem_minmax(0,1fr)_1.5rem] items-baseline gap-4 border-b border-[var(--line)] py-4 text-left transition-colors hover:bg-white/[0.018] md:grid-cols-[3rem_minmax(0,1.2fr)_minmax(8rem,0.6fr)_4rem_2rem] md:items-center md:py-5"
              >
                <span className="mono-num text-[11px] text-faint transition-colors group-hover:text-signal">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[18px] font-medium tracking-[-0.02em] text-bone transition-transform duration-300 group-hover:translate-x-1 md:text-[21px]">
                      {entry.name}
                    </span>
                    <span className="eyebrow md:hidden">{familyOf(entry.family)?.name}</span>
                  </span>
                  <span className="mt-1 hidden max-w-[62ch] text-[13px] leading-[1.55] text-faint sm:block">{entry.tagline}</span>
                </span>

                <span className="eyebrow hidden md:block">{familyOf(entry.family)?.name}</span>
                <span className="mono-num hidden text-right text-[12px] text-muted md:block">{entry.ops.length}</span>
                <span className="text-right text-[15px] text-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-signal" aria-hidden="true">
                  ↗
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── the page ──────────────────────────────────────────────────────────── */

export default function Landing() {
  const setRoute = useLab((state) => state.setRoute)
  const setEntry = useLab((state) => state.setEntry)
  const reduced = useReducedMotion()
  const { scrollTo } = useLenis(!reduced)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 34, restDelta: 0.001 })

  const open = (id) => {
    if (id) setEntry(id)
    setRoute('lab')
  }

  return (
    <div id="top" className="relative min-h-dvh overflow-x-clip bg-ink-950 text-bone">
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-signal"
        aria-hidden="true"
      />
      <Header onOpen={() => open()} scrollTo={scrollTo} />

      {/* ── hero ────────────────────────────────────────────────────────── */}
      <section className="px-5 pb-16 pt-28 md:px-9 md:pb-24 md:pt-36">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)] lg:gap-16">
          <div>
            <Reveal>
              <p className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
                <span className="eyebrow text-bone-dim">Data structures & algorithms</span>
              </p>
            </Reveal>

            <h1 className="display mt-7 text-[clamp(54px,8.1vw,118px)] leading-[0.86]">
              <span className="line-mask">
                <motion.span
                  initial={reduced ? false : { y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                >
                  Algorithms
                </motion.span>
              </span>
              <span className="line-mask">
                <motion.span
                  initial={reduced ? false : { y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.13 }}
                  className="display-soft"
                >
                  frame by frame<span className="font-bold text-signal">.</span>
                </motion.span>
              </span>
            </h1>

            <Reveal delay={0.18}>
              <p className="mt-7 max-w-[50ch] text-[15.5px] leading-[1.7] text-muted">
                Run an operation and step through every recorded frame. The diagram, counters, and pseudocode stay on
                the same step.
              </p>
            </Reveal>

            <Reveal delay={0.26} className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={() => open()} className="btn btn-primary h-11 px-5 text-[13.5px]">
                Open the lab
                <span aria-hidden="true">↗</span>
              </button>
              <button onClick={() => scrollTo('#how', { offset: -64 })} className="btn h-11 px-5 text-[13.5px]">
                See how it works
              </button>
            </Reveal>

            <Reveal delay={0.34}>
              <dl className="mt-14 grid max-w-[520px] grid-cols-3 border-t border-[var(--line-2)]">
                {[
                  ['Structures', String(ENTRIES.length)],
                  ['Operations', String(OP_COUNT)],
                  ['Families', String(FAMILIES.length)],
                ].map(([label, value], index) => (
                  <div key={label} className={`py-4 ${index > 0 ? 'border-l border-[var(--line)] pl-5' : ''}`}>
                    <dt className="eyebrow">{label}</dt>
                    <dd className="display mt-2 text-[34px] leading-none text-bone">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.12} y={34}>
            <div className="h-[440px] sm:h-[520px] lg:h-[min(68vh,590px)]">
              <HeroVisual />
            </div>
          </Reveal>
        </div>

        <div className="mx-auto mt-16 flex max-w-[1600px] items-center justify-between border-t border-[var(--line)] pt-4">
          <span className="meta">01</span>
          <span className="meta hidden sm:block">Scroll for the run</span>
        </div>
      </section>

      {/* ── how it works ────────────────────────────────────────────────── */}
      <section id="how" className="scroll-mt-20 border-t border-[var(--line)] px-5 py-20 md:px-9 md:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-20">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="display mt-5 max-w-[14ch] text-[clamp(36px,5.4vw,76px)]">
              A recorded run, not an animation.
            </h2>
            <p className="mt-7 max-w-[42ch] text-[15px] leading-[1.72] text-muted">
              Each operation stores complete frames. Play, pause, scrub, or step; the diagram and code always read the
              same frame.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border-t border-[var(--line-2)]">
              {[
                ['01', 'Recorded frames', 'Stepping backward is exact. Nothing is replayed from the start.'],
                ['02', 'Synced views', 'Diagram, counters, pseudocode, and notes read the same frame.'],
                ['03', 'Editable inputs', 'Change the data, paint the grid, or edit the graph, then run again.'],
              ].map(([number, title, copy]) => (
                <div key={number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-[var(--line)] py-5">
                  <span className="mono-num pt-1 text-[10.5px] text-signal">{number}</span>
                  <div>
                    <h3 className="text-[16px] font-medium tracking-[-0.01em] text-bone">{title}</h3>
                    <p className="mt-1.5 max-w-[48ch] text-[13.5px] leading-[1.65] text-muted">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Story scrollTo={scrollTo} />

      <Collection onOpen={open} />

      {/* ── closing ─────────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--line)] px-5 py-20 md:px-9 md:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="eyebrow">Open source · MIT</p>
            <h2 className="display mt-5 max-w-[15ch] text-[clamp(42px,7vw,102px)]">
              Run it yourself.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-5 md:items-end">
            <button onClick={() => open('bst')} className="btn btn-primary h-12 px-6 text-[14px]">
              Open the lab
              <span aria-hidden="true">↗</span>
            </button>
            <p className="code-face text-[10.5px] leading-relaxed text-faint md:text-right">
              space play/pause · ← → step · i notes
            </p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-5 border-t border-[var(--line)] px-5 py-7 text-[11.5px] text-faint sm:flex-row sm:items-center sm:justify-between md:px-9">
        <Mark small />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span>MIT licensed</span>
          <a
            href="https://github.com/demon2202/DsaVisualization"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-bone-dim"
          >
            Source on GitHub
          </a>
          <span>Original project by demon2202</span>
        </div>
      </footer>
    </div>
  )
}
