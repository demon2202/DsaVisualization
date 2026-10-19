import { useEffect, useRef } from 'react'
import { useLab } from '../../state/lab'
import { motion, AnimatePresence } from 'motion/react'

/**
 * Practice card — predict the next decision, check, retry, review.
 *
 * Flow: pick an option → "check" → wrong options strike out and you may try
 * again (the miss is recorded); solve or exhaust → the explanation appears,
 * which is the next frame's own narration, so revealing it and playing the
 * frame can never disagree. "Next decision" jumps to the next frame where the
 * algorithm actually decides something (no pseudocode filler frames).
 * Mistakes are reviewable and re-askable at their exact frame.
 */
export default function PracticePanel() {
  const practice = useLab((s) => s.practice)
  const pick = useLab((s) => s.pickPractice)
  const check = useLab((s) => s.checkPractice)
  const cont = useLab((s) => s.continuePractice)
  const off = useLab((s) => s.togglePractice)
  const review = useLab((s) => s.toggleReview)
  const retry = useLab((s) => s.retryMistake)
  const firstOptRef = useRef(null)

  /* focus the first option when a new question arrives (keyboard-ready) */
  useEffect(() => {
    if (practice.q && !practice.review) firstOptRef.current?.focus({ preventScroll: true })
  }, [practice.q, practice.review])

  const q = practice.q
  const solved = practice.checked && practice.picked == null ? practice.wrongPicks.length >= (q?.options.length || 0) - 1 && practice.wrong > 0 : false
  const missedReveal = practice.checked && practice.wrongPicks.length >= (q?.options.length || 0) - 1 && !practice.wrongPicks.includes(q?.answer ?? -1) && practice.picked == null && practice.wrong > 0
  const answeredRight = practice.checked && !missedReveal

  return (
    <AnimatePresence>
      {practice.on && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute left-4 top-4 z-30 max-h-[calc(100%-2rem)] w-[min(380px,calc(100%-2rem))] overflow-y-auto bg-ink-850 p-4"
          style={{ borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
          data-ui
          role="group"
          aria-label="Practice session"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="label-xs">
              practice ·{' '}
              <span className="text-gold">
                first-try {practice.first}/{practice.asked || 0}
                {practice.streak > 1 ? ` · streak ${practice.streak}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {practice.mistakes.length > 0 && (
                <button onClick={review} className="text-[13px] text-muted hover:text-bone">
                  review {practice.mistakes.length}
                </button>
              )}
              <button onClick={off} aria-label="End practice session" className="text-[13px] text-muted hover:text-bone">
                end
              </button>
            </div>
          </div>

          {practice.review ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-[14px] font-semibold text-bone">Mistakes to revisit</p>
              {practice.mistakes.map((m, i) => (
                <button
                  key={i}
                  onClick={() => retry(m)}
                  className="rounded-[4px] bg-ink-750 px-3 py-2 text-left text-[13px] leading-snug text-bone-dim transition-colors hover:bg-ink-700 hover:text-bone"
                >
                  <span className="mono-num text-faint">frame {m.frame} · </span>
                  {m.prompt} <span className="text-gold">→ {m.options[m.answer]}</span>
                </button>
              ))}
              <button onClick={review} className="mt-1 text-[13px] text-muted hover:text-bone">
                back to session
              </button>
            </div>
          ) : q ? (
            <>
              <p className="mt-2 text-[17px] font-semibold leading-snug text-bone">
                {q.prompt}
                <span className="ml-2 text-[12px] font-normal text-faint">{q.kind}</span>
              </p>
              <div className="mt-3 flex flex-col gap-1.5" role="radiogroup" aria-label={q.prompt}>
                {q.options.map((opt, i) => {
                  const isRight = i === q.answer
                  const isPicked = i === practice.picked
                  const wasWrong = practice.wrongPicks.includes(i)
                  let cls = 'bg-ink-750 text-bone-dim hover:bg-ink-700 hover:text-bone'
                  if (wasWrong) cls = 'bg-ink-750/40 text-faint line-through'
                  else if (practice.checked && isRight) cls = 'bg-gold text-ink-950'
                  else if (isPicked) cls = 'bg-ink-600 text-bone'
                  return (
                    <button
                      key={i}
                      ref={i === 0 ? firstOptRef : null}
                      role="radio"
                      aria-checked={isPicked}
                      disabled={practice.checked || wasWrong}
                      onClick={() => pick(i)}
                      className={`flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-left text-[14px] transition-colors ${cls}`}
                    >
                      <span className="mono-num w-4 shrink-0 opacity-60">{i + 1}</span>
                      <span className="truncate">{opt}</span>
                    </button>
                  )
                })}
              </div>

              <p aria-live="polite" className="min-h-[20px] text-[13px] leading-snug">
                {!practice.checked && practice.wrongPicks.length > 0 && (
                  <span className="text-bad">not quite — the struck-out option is gone; try again.</span>
                )}
                {practice.checked && answeredRight && <span className="text-gold">correct.</span>}
                {practice.checked && missedReveal && <span className="text-bad">exhausted — the gold option was it.</span>}
              </p>

              {practice.checked ? (
                <>
                  <p className="mt-1 text-[14px] leading-relaxed text-bone-dim">{q.explain}</p>
                  <button onClick={cont} className="mt-3 w-full bg-bone py-2.5 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-gold">
                    play to the next decision
                  </button>
                </>
              ) : (
                <button
                  onClick={check}
                  disabled={practice.picked == null}
                  className="mt-3 w-full bg-bone py-2.5 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-gold disabled:opacity-30"
                >
                  check
                </button>
              )}
            </>
          ) : (
            <p className="mt-3 text-[14px] text-muted">No question at this frame — step or run an operation.</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
