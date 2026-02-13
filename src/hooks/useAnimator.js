import { useRef, useCallback } from 'react';

export default function useAnimator(speed = 500) {
  const isRunning = useRef(false);
  const isPaused = useRef(false);
  const isCancelled = useRef(false);
  const pendingResolve = useRef(null);
  const currentStep = useRef(0);
  const totalSteps = useRef(0);

  const wait = useCallback((ms) => {
    return new Promise((resolve, reject) => {
      const tick = () => {
        if (isCancelled.current) {
          reject(new Error('animation_cancelled'));
          return;
        }
        if (isPaused.current) {
          pendingResolve.current = () => {
            setTimeout(() => {
              if (isCancelled.current) {
                reject(new Error('animation_cancelled'));
              } else {
                resolve();
              }
            }, ms || speed);
          };
          return;
        }
        setTimeout(() => {
          if (isCancelled.current) {
            reject(new Error('animation_cancelled'));
          } else if (isPaused.current) {
            pendingResolve.current = resolve;
          } else {
            resolve();
          }
        }, ms || speed);
      };
      tick();
    });
  }, [speed]);

  const animate = useCallback(async (steps, onStep, onProgress) => {
    if (isRunning.current) return;
    isRunning.current = true;
    isCancelled.current = false;
    isPaused.current = false;
    currentStep.current = 0;
    totalSteps.current = steps.length;

    try {
      for (let i = 0; i < steps.length; i++) {
        if (isCancelled.current) break;
        currentStep.current = i;
        if (onProgress) onProgress(i, steps.length);
        await onStep(steps[i], i, steps.length);
        if (i < steps.length - 1) {
          await wait();
        }
      }
      if (onProgress && !isCancelled.current) onProgress(steps.length, steps.length);
    } catch (e) {
      if (e.message !== 'animation_cancelled') throw e;
    } finally {
      isRunning.current = false;
      currentStep.current = 0;
      totalSteps.current = 0;
    }
  }, [wait]);

  const pause = useCallback(() => {
    isPaused.current = true;
  }, []);

  const resume = useCallback(() => {
    isPaused.current = false;
    if (pendingResolve.current) {
      const fn = pendingResolve.current;
      pendingResolve.current = null;
      fn();
    }
  }, []);

  const cancel = useCallback(() => {
    isCancelled.current = true;
    isPaused.current = false;
    if (pendingResolve.current) {
      pendingResolve.current = null;
    }
  }, []);

  return {
    animate,
    wait,
    pause,
    resume,
    cancel,
    isRunning,
    isPaused,
    currentStep,
    totalSteps,
  };
}