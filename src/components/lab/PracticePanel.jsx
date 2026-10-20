import { useEffect, useRef } from 'react'
import { useLab } from '../../state/lab'
import { motion, AnimatePresence } from 'motion/react'
import Glyph from './Glyph'

/**
 * Practice — predict the next decision at real algorithm frames.
 * Pick an option → check. A wrong option is struck out and you may retry
 * (the miss is recorded); the explanation is the next frame's own narration,
 * so the reveal and the animation can never disagree.
 */
export default function PracticePanel() {
  const practice = useLab((s) => s.practice)
  const pick = useLab((s) => s.pickPractice)
  const check = useLab((s) => s.checkPractice)
  const cont = useLab((s) => s.continuePractice)
  const off = useLab((s) => s.togglePractice)
  const review = useLab((s) => s.toggleReview)
  const retry = useLab((s) => s.retryMistake)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (practice.q && !practice.review) dialogRef.current?.focus({ preventScroll: true })
  }, [practice.q, practice.review])

  const q = practice.q
  const missedReveal = practice.checked && q && practice.picked == null && practice.wrong > 0
  const answeredRight = practice.checked && !missedReveal

  return (
    <AnimatePresence>
      {practice.on && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <motion.button
            aria-label="Close practice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={off}
            className="absolute inset-0 bg-ink-950/85"
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            ref={dialogRef}
            tabIndex={-1}
            className="scroll relative z-10 max-h-[min(88dvh,660px)] w-[min(520px,100%)] overflow-y-auto border border-[var(--line-2)] bg-[#0a0a0a] p-5 outline-none md:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Practice session"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-signal">
                  <Glyph name="quiz" size={13} />
                  <span className="eyebrow text-signal">Practice</span>
                </div>
                <p className="mono-num mt-2 text-[10.5px] text-faint">
                  first try {practice.first}/{practice.asked || 0}
                  {practice.streak > 1 ? ` · streak ${practice.streak}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {practice.mistakes.length > 0 && (
                  <button onClick={review} className="text-[11.5px] text-muted transition-colors hover:text-bone">
                    Review {practice.mistakes.length}
                  </button>
                )}
                <button onClick={off} aria-label="End practice session" className="icon-btn h-8 w-8">
                  <Glyph name="close" size={13} />
                </button>
              </div>
            </div>

            {practice.review ? (
              <div className="mt-5 flex flex-col gap-px border-t border-[var(--line)] pt-4">
                <p className="mb-2 text-[15px] font-medium text-bone">Missed questions</p>
                {practice.mistakes.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => retry(m)}
                    className="border border-[var(--line)] px-3 py-2.5 text-left text-[12.5px] leading-[1.55] text-bone-dim transition-colors hover:border-[var(--line-2)] hover:text-bone"
                  >
                    <span className="mono-num text-faint">frame {m.frame} · </span>
                    {m.prompt} <span className="text-mint">→ {m.options[m.answer]}</span>
                  </button>
                ))}
                <button onClick={review} className="mt-3 self-start text-[11.5px] text-muted transition-colors hover:text-bone">
                  ← Back to session
                </button>
              </div>
            ) : q ? (
              <>
                <p className="mt-5 text-[17px] font-medium leading-[1.4] tracking-[-0.015em] text-bone">{q.prompt}</p>
                <div className="mt-4 flex flex-col gap-1.5" role="radiogroup" aria-label={q.prompt}>
                  {q.options.map((opt, i) => {
                    const isRight = i === q.answer
                    const isPicked = i === practice.picked
                    const wasWrong = practice.wrongPicks.includes(i)
                    let cls = 'border-[var(--line)] text-bone-dim hover:border-[var(--line-3)] hover:text-bone'
                    if (wasWrong) cls = 'border-[var(--line)] text-faint line-through opacity-60'
                    else if (practice.checked && isRight) cls = 'border-mint/70 bg-mint/[0.08] text-mint'
                    else if (isPicked) cls = 'border-signal/70 bg-signal/[0.06] text-bone'
                    return (
                      <button
                        key={i}
                        role="radio"
                        aria-checked={isPicked}
                        disabled={practice.checked || wasWrong}
                        onClick={() => pick(i)}
                        className={`flex items-center gap-3 border px-3.5 py-2.5 text-left text-[13.5px] transition-colors ${cls}`}
                      >
                        <span className="mono-num w-3 shrink-0 text-[11px] opacity-60">{i + 1}</span>
                        <span className="min-w-0 flex-1">{opt}</span>
                      </button>
                    )
                  })}
                </div>

                <p aria-live="polite" className="mt-2.5 min-h-[20px] text-[12.5px] leading-[1.5]">
                  {!practice.checked && practice.wrongPicks.length > 0 && (
                    <span className="text-bad">Wrong. Try again.</span>
                  )}
                  {practice.checked && answeredRight && <span className="text-mint">Correct.</span>}
                  {practice.checked && missedReveal && <span className="text-bad">No tries left. The answer is shown.</span>}
                </p>

                {practice.checked ? (
                  <>
                    <p className="mt-1 text-[13.5px] leading-[1.7] text-bone-dim">{q.explain}</p>
                    <button onClick={cont} className="btn btn-primary mt-4 h-10 w-full">
                      Next decision
                    </button>
                  </>
                ) : (
                  <button onClick={check} disabled={practice.picked == null} className="btn btn-primary mt-4 h-10 w-full">
                    Check
                  </button>
                )}
                <p className="mono-num mt-3 text-center text-[10px] text-faint">1–4 choose · enter check · p close</p>
              </>
            ) : (
              <p className="mt-5 text-[13.5px] leading-[1.7] text-muted">No question at this frame. Step or run an operation.</p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
