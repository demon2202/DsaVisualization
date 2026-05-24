import React, { memo, useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppState';

const AnimationControls = memo(function AnimationControls() {
  const { app, animator } = useAppContext();
  const [progress, setProgress] = useState(0);
  const [paused, setPaused]     = useState(false);
  const rafRef = useRef(null);

  // Drive progress via rAF — far cheaper than setInterval and perfectly smooth
  useEffect(() => {
    if (!app.state.isAnimating) {
      setProgress(0);
      setPaused(false);
      return;
    }

    let alive = true;
    const tick = () => {
      if (!alive) return;
      const total = animator.totalSteps.current;
      const step  = animator.currentStep.current;
      if (total > 0) setProgress(Math.min((step / total) * 100, 100));
      setPaused(animator.isPaused.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [app.state.isAnimating, animator]);

  if (!app.state.isAnimating) return null;

  const step  = animator.currentStep.current + 1;
  const total = animator.totalSteps.current;

  return (
    <div style={s.wrapper} className="anim-slide-up">
      {/* Progress bar — top edge */}
      <div style={s.rail}>
        <div style={{ ...s.fill, width: `${progress}%` }} />
      </div>

      <div style={s.body}>
        {/* Step counter */}
        <span style={s.counter}>
          <span style={s.stepNum}>{step}</span>
          <span style={s.stepOf}> / {total}</span>
        </span>

        {/* Controls */}
        <div style={s.btns}>
          <button
            style={{ ...s.btn, ...(paused ? s.btnResume : s.btnPause) }}
            onClick={() => {
              if (paused) { animator.resume(); app.setPaused(false); }
              else        { animator.pause();  app.setPaused(true);  }
            }}
          >
            {paused ? '▶ resume' : '⏸ pause'}
          </button>
          <button
            style={{ ...s.btn, ...s.btnStop }}
            onClick={() => { animator.cancel(); app.setAnimating(false); }}
          >
            ■ stop
          </button>
        </div>

        {/* Percentage */}
        <span style={s.pct}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
});

const s = {
  wrapper: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  rail: {
    height: '2px',
    background: 'var(--bg-raised)',
  },
  fill: {
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.12s linear',
    opacity: 0.9,
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    flexWrap: 'wrap',
  },
  counter: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    minWidth: '60px',
  },
  stepNum: {
    color: 'var(--accent)',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  stepOf: {
    color: 'var(--text-dim)',
  },
  btns: {
    display: 'flex',
    gap: '6px',
    flex: 1,
    justifyContent: 'center',
  },
  btn: {
    padding: '4px 12px',
    borderRadius: '5px',
    fontSize: '0.72rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    border: '1px solid var(--border)',
    background: 'var(--bg-raised)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s',
    letterSpacing: '0.02em',
  },
  btnPause: {
    color: 'var(--amber)',
    borderColor: 'rgba(251,191,36,0.25)',
    background: 'rgba(251,191,36,0.06)',
  },
  btnResume: {
    color: 'var(--emerald)',
    borderColor: 'rgba(52,211,153,0.25)',
    background: 'rgba(52,211,153,0.06)',
  },
  btnStop: {
    color: 'var(--rose)',
    borderColor: 'rgba(248,113,113,0.25)',
    background: 'rgba(248,113,113,0.06)',
  },
  pct: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--text-dim)',
    minWidth: '32px',
    textAlign: 'right',
  },
};

export default AnimationControls;