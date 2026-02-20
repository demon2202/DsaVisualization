import { useRef, useCallback, useState } from 'react';

export default function useAnimator(speed = 1500) {
  const isRunning = useRef(false);
  const isPaused = useRef(false);
  const isCancelled = useRef(false);
  const pendingResolve = useRef(null);
  const currentStep = useRef(0);
  const totalSteps = useRef(0);
  const speedRef = useRef(speed);
  const [animationId, setAnimationId] = useState(0);

  // Keep speed ref in sync
  speedRef.current = speed;

  const wait = useCallback((ms) => {
    return new Promise((resolve, reject) => {
      const actualDelay = ms ?? speedRef.current;

      const attemptResolve = () => {
        if (isCancelled.current) {
          reject(new Error('animation_cancelled'));
          return;
        }
        if (isPaused.current) {
          pendingResolve.current = () => {
            if (isCancelled.current) {
              reject(new Error('animation_cancelled'));
              return;
            }
            const timer = setTimeout(() => {
              if (isCancelled.current) {
                reject(new Error('animation_cancelled'));
              } else if (isPaused.current) {
                pendingResolve.current = resolve;
              } else {
                resolve();
              }
            }, actualDelay);
            // Store timer for cleanup
            pendingResolve.current._timer = timer;
          };
          return;
        }

        const timer = setTimeout(() => {
          if (isCancelled.current) {
            reject(new Error('animation_cancelled'));
          } else if (isPaused.current) {
            pendingResolve.current = resolve;
          } else {
            resolve();
          }
        }, actualDelay);

        // Store for potential cleanup
        pendingResolve.current = null;
        pendingResolve.current = { _timer: timer, resolve };
      };

      attemptResolve();
    });
  }, []);

  const animate = useCallback(async (steps, onStep, onComplete) => {
    if (isRunning.current) {
      console.warn('Animation already running — cancelling previous');
      isCancelled.current = true;
      await new Promise(r => setTimeout(r, 50));
    }

    if (!steps || steps.length === 0) {
      onComplete?.();
      return;
    }

    isRunning.current = true;
    isCancelled.current = false;
    isPaused.current = false;
    currentStep.current = 0;
    totalSteps.current = steps.length;
    setAnimationId(id => id + 1);

    try {
      for (let i = 0; i < steps.length; i++) {
        if (isCancelled.current) break;

        currentStep.current = i;

        // Execute the step callback
        await onStep(steps[i], i, steps.length);

        // Wait between steps (except after the last one)
        if (i < steps.length - 1) {
          await wait();
        }
      }

      if (!isCancelled.current) {
        currentStep.current = steps.length;
        onComplete?.();
      }
    } catch (e) {
      if (e.message !== 'animation_cancelled') {
        console.error('Animation error:', e);
        throw e;
      }
    } finally {
      isRunning.current = false;
      currentStep.current = 0;
      totalSteps.current = 0;
    }
  }, [wait]);

  const pause = useCallback(() => {
    if (!isRunning.current || isPaused.current) return;
    isPaused.current = true;
  }, []);

  const resume = useCallback(() => {
    if (!isPaused.current) return;
    isPaused.current = false;
    if (pendingResolve.current) {
      const pending = pendingResolve.current;
      pendingResolve.current = null;
      if (typeof pending === 'function') {
        pending();
      } else if (pending.resolve) {
        pending.resolve();
      }
    }
  }, []);

  const cancel = useCallback(() => {
    isCancelled.current = true;
    isPaused.current = false;

    // Clear any pending timers
    if (pendingResolve.current?._timer) {
      clearTimeout(pendingResolve.current._timer);
    }
    pendingResolve.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    currentStep.current = 0;
    totalSteps.current = 0;
    isRunning.current = false;
  }, [cancel]);

  return {
    animate,
    wait,
    pause,
    resume,
    cancel,
    reset,
    isRunning,
    isPaused,
    isCancelled,
    currentStep,
    totalSteps,
    animationId,
  };
}