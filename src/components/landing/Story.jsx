/**
 * Story.jsx — one tree, three runs, scrubbed by the page itself.
 *
 * The section is pinned for roughly four screens. Motion's useScroll reads the
 * real document position that Lenis moves; the current chapter and frame are
 * therefore the reader's scroll, not a timeline playing beside it. Every frame
 * is an absolute engine snapshot, so stopping mid-scroll can never leave the
 * picture and the caption disagreeing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import SnapshotDiagram from '../diagram/SnapshotDiagram'
import { CodeRail } from './visuals'
import { bstInsertRun, bstSearchRun, inorderRun } from './liveDemos'

/* chapter windows across the pinned section; weighted by frame count */
const MARKS = [0, 0.2, 0.6, 1]

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value))

function metricRow(chapter, snapshot) {
  const stats = snapshot?.stats || {}
  if (chapter.id === 'traverse') {
    return [
      ['visited', snapshot?.aux?.items?.length ?? 0],
      ['nodes', stats.nodes ?? 0],
      ['depth', stats.height ?? 0],
    ]
  }
  return [
    ['comparisons', stats.comparisons ?? 0],
    ['nodes', stats.nodes ?? 0],
    ['height', stats.height ?? 0],
  ]
}

export default function Story({ scrollTo }) {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

  const chapters = useMemo(() => {
    const search = bstSearchRun(65)
    const insert = bstInsertRun(45)
    const traversal = inorderRun()
    return [
      {
        id: 'search',
        n: '01',
        label: 'Search',
        meta: 'search(65)',
        title: 'Search 65.',
        copy:
          '65 is not in the tree. The search visits 50, 70, then 60, and stops at an empty child.',
        block: 'bstSearch',
        steps: search.run.steps,
      },
      {
        id: 'insert',
        n: '02',
        label: 'Insert',
        meta: 'insert(45)',
        title: 'Insert 45.',
        copy:
          '45 follows the same comparisons and becomes a new leaf. Existing nodes keep their positions.',
        block: 'bstInsert',
        steps: insert.run.steps,
      },
      {
        id: 'traverse',
        n: '03',
        label: 'In-order',
        meta: 'in-order traversal',
        title: 'In-order traversal.',
        copy:
          'Left, node, right. The values come out in ascending order: 20, 30, 40, 50, 60, 70, 80.',
        block: 'traverseIn',
        steps: traversal.run.steps,
      },
    ]
  }, [])

  /* one fit for all three runs so the tree never jumps between chapters */
  const fitSteps = useMemo(() => chapters.flatMap((chapter) => chapter.steps), [chapters])

  const [view, setView] = useState({ chapter: 0, frame: 0 })

  const readProgress = useCallback(
    (value) => {
      const progress = clamp(value, 0, 1)
      const chapter = progress < MARKS[1] ? 0 : progress < MARKS[2] ? 1 : 2
      const start = MARKS[chapter]
      const end = MARKS[chapter + 1]
      const local = clamp((progress - start) / Math.max(0.0001, end - start), 0, 1)
      const frame = Math.round(local * (chapters[chapter].steps.length - 1))
      setView((previous) => (previous.chapter === chapter && previous.frame === frame ? previous : { chapter, frame }))
    },
    [chapters],
  )

  useMotionValueEvent(scrollYProgress, 'change', readProgress)

  useEffect(() => {
    const id = requestAnimationFrame(() => readProgress(scrollYProgress.get()))
    return () => cancelAnimationFrame(id)
  }, [readProgress, scrollYProgress])

  const chapter = chapters[view.chapter]
  const snapshot = chapter.steps[view.frame]
  const metrics = metricRow(chapter, snapshot)
  const totalFrames = chapter.steps.length

  const jumpTo = (index) => {
    const section = sectionRef.current
    if (!section) return
    const top = window.scrollY + section.getBoundingClientRect().top
    const travel = Math.max(0, section.offsetHeight - window.innerHeight)
    scrollTo(top + MARKS[index] * travel + (index === 0 ? 1 : 0), { offset: 0, duration: 1.4 })
  }

  return (
    <section
      ref={sectionRef}
      id="story"
      className="relative h-[420svh] scroll-mt-16 border-y border-[var(--line)] bg-ink-950"
    >
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          {/* ── figure header ─────────────────────────────────────────── */}
          <div className="flex h-12 shrink-0 items-center justify-between gap-5 border-b border-[var(--line)] px-5 md:px-8">
            <p className="eyebrow">Fig. 02 — One tree, three runs</p>
            <p className="meta hidden md:block">Scroll to scrub · choose a chapter</p>
            <p className="mono-num text-[10px] text-faint md:hidden">
              <span className="text-bone-dim">{String(view.frame + 1).padStart(2, '0')}</span> / {String(totalFrames).padStart(2, '0')}
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* ── stage ─────────────────────────────────────────────────── */}
            <div className="relative min-h-[38svh] flex-1 overflow-hidden">
              <div className="stage-dots pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
              <div className="absolute inset-0 px-2 pb-[122px] pt-10 sm:px-6 md:px-8">
                <SnapshotDiagram snapshot={snapshot} scene="tree" fitSteps={fitSteps} />
              </div>

              <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-4 md:inset-x-8 md:top-5">
                <span className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
                  <span className="mono-num text-[10.5px] text-bone-dim">{chapter.meta}</span>
                </span>
                <span className="mono-num hidden text-[10.5px] text-faint sm:block">
                  <span className="text-bone-dim">{String(view.frame + 1).padStart(2, '0')}</span> / {String(totalFrames).padStart(2, '0')}
                </span>
              </div>

              {/* narration + frame rail */}
              <div className="pointer-events-none absolute inset-x-4 bottom-4 md:inset-x-8 md:bottom-6">
                <div className={`border-l pl-3.5 ${snapshot?.banner ? 'border-signal/60' : 'border-[var(--line-3)]'}`}>
                  {snapshot?.banner && (
                    <span className="mono-num mb-1.5 block text-[10px] uppercase tracking-[0.13em] text-signal">
                      {snapshot.banner}
                    </span>
                  )}
                  <p className="line-clamp-2 max-w-[66ch] text-[12.5px] leading-[1.55] text-bone-dim md:text-[13.5px]">
                    {snapshot?.note}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-[2px]" aria-hidden="true">
                  {chapter.steps.map((step, index) => (
                    <span
                      key={index}
                      className={`h-[2px] flex-1 transition-colors duration-150 ${
                        index === view.frame ? 'bg-signal' : index < view.frame ? 'bg-ink-500' : 'bg-ink-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── reading column ───────────────────────────────────────── */}
            <aside className="scroll max-h-[44svh] shrink-0 overflow-y-auto border-t border-[var(--line)] bg-ink-950 px-5 pb-4 pt-4 lg:flex lg:max-h-none lg:w-[410px] lg:flex-col lg:overflow-hidden lg:border-l lg:border-t-0 lg:px-9 lg:pb-8 lg:pt-8 xl:w-[440px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="flex items-baseline gap-3">
                      <span className="mono-num text-[11px] text-signal">{chapter.n}</span>
                      <span className="eyebrow text-bone-dim">{chapter.label}</span>
                    </p>
                    <span className="mono-num text-[10px] text-faint">{totalFrames} frames</span>
                  </div>

                  <h2 className="display mt-3 max-w-[14ch] text-[clamp(30px,3.4vw,44px)] leading-[1.01]">{chapter.title}</h2>
                  <p className="mt-3.5 max-w-[46ch] text-[13px] leading-[1.68] text-muted lg:text-[14px]">{chapter.copy}</p>

                  <dl className="mt-5 grid grid-cols-3 border-y border-[var(--line)]">
                    {metrics.map(([label, value], index) => (
                      <div key={label} className={`py-2.5 ${index > 0 ? 'border-l border-[var(--line)] pl-3' : ''}`}>
                        <dt className="meta text-[9px]">{label}</dt>
                        <dd className="mono-num mt-1 text-[17px] leading-none text-bone">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 hidden lg:block">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="eyebrow">Pseudocode</span>
                      <span className="meta text-[9px]">current frame</span>
                    </div>
                    <CodeRail block={chapter.block} active={snapshot?.code || []} limit={12} className="opacity-95" />
                  </div>
                </motion.div>
              </AnimatePresence>

              <nav className="mt-5 grid grid-cols-3 border-t border-[var(--line-2)] lg:mt-auto lg:pt-6" aria-label="Story chapters">
                {chapters.map((item, index) => {
                  const active = index === view.chapter
                  return (
                    <button
                      key={item.id}
                      onClick={() => jumpTo(index)}
                      aria-current={active ? 'step' : undefined}
                      className={`group relative border-r border-[var(--line)] py-3 text-left last:border-r-0 ${
                        index === 0 ? 'pr-3' : 'px-3'
                      }`}
                    >
                      <span
                        className={`absolute inset-x-0 top-0 h-px transition-colors ${
                          active ? 'bg-signal' : 'bg-[var(--line-2)] group-hover:bg-[var(--line-3)]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={`mono-num block text-[9.5px] ${active ? 'text-signal' : 'text-faint'}`}>{item.n}</span>
                      <span className={`mt-1 block text-[12.5px] transition-colors ${active ? 'text-bone' : 'text-muted group-hover:text-bone-dim'}`}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
