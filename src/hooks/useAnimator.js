import { useRef, useCallback, useState } from 'react';

/**
 * useAnimator — clean step-based animation engine.
 *
 * Design goals:
 *  - Zero timer leaks: every timeout is tracked and cleared on cancel
 *  - Pause/resume via a Promise that resolves when unpaused
 *  - No mutable ref juggling for resolve callbacks
 *  - Speed changes take effect on the *next* step automatically
 */
export default function useAnimator(speed = 800) {
  const speedRef     = useRef(speed);
  const cancelledRef = useRef(false);
  const pausedRef    = useRef(false);
  const resumeRef    = useRef(null); // holds the resolve() for the pause promise
  const timerRef     = useRef(null); // current setTimeout handle
  const runningRef   = useRef(false);

  // Exposed refs for AnimationControls to read without causing re-renders
  const currentStep  = useRef(0);
  const totalSteps   = useRef(0);
  const isPaused     = useRef(false);

  const [animationId, setAnimationId] = useState(0);

  speedRef.current = speed;

  // ── Primitives ──────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Resolves after `ms` ms, or rejects if cancelled. Respects pause. */
  const wait = useCallback((ms) => {
    return new Promise((resolve, reject) => {
      const delay = ms ?? speedRef.current;

      const proceed = () => {
        if (cancelledRef.current) { reject(new Error('cancelled')); return; }
        if (pausedRef.current) {
          // Park here until resume() is called
          resumeRef.current = proceed;
          return;
        }
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (cancelledRef.current) { reject(new Error('cancelled')); return; }
          resolve();
        }, delay);
      };

      proceed();
    });
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Run `steps` sequentially, calling `onStep(step, index, total)` for each.
   * Waits `speedRef.current` ms between steps.
   */
  const animate = useCallback(async (steps, onStep) => {
    // Cancel any in-flight animation first
    if (runningRef.current) {
      cancelledRef.current = true;
      clearTimer();
      // Unblock any parked pause
      if (resumeRef.current) { resumeRef.current(); resumeRef.current = null; }
      // Give the previous loop one tick to exit
      await new Promise(r => setTimeout(r, 16));
    }

    if (!steps || steps.length === 0) return;

    runningRef.current   = true;
    cancelledRef.current = false;
    pausedRef.current    = false;
    isPaused.current     = false;
    currentStep.current  = 0;
    totalSteps.current   = steps.length;
    setAnimationId(id => id + 1);

    try {
      for (let i = 0; i < steps.length; i++) {
        if (cancelledRef.current) break;

        currentStep.current = i;
        await onStep(steps[i], i, steps.length);

        if (i < steps.length - 1) {
          await wait();
        }
      }
    } catch (e) {
      if (e.message !== 'cancelled') throw e;
    } finally {
      runningRef.current  = false;
      currentStep.current = 0;
      totalSteps.current  = 0;
    }
  }, [wait, clearTimer]);

  const pause = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    clearTimer();
    pausedRef.current = true;
    isPaused.current  = true;
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    isPaused.current  = false;
    if (resumeRef.current) {
      const fn = resumeRef.current;
      resumeRef.current = null;
      fn();
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    if (resumeRef.current) { resumeRef.current(); resumeRef.current = null; }
    pausedRef.current   = false;
    isPaused.current    = false;
    runningRef.current  = false;
    currentStep.current = 0;
    totalSteps.current  = 0;
  }, [clearTimer]);

  return {
    animate,
    wait,
    pause,
    resume,
    cancel,
    isPaused,
    isRunning: runningRef,
    currentStep,
    totalSteps,
    animationId,
  };
}