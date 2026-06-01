import React, { memo, useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppState';

const AnimationControls = memo(function AnimationControls() {
  const { app, animator } = useAppContext();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!app.state.isAnimating) { setProgress(0); return; }
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const total = animator.totalSteps.current;
      const step  = animator.currentStep.current;
      if (total > 0) setProgress(Math.min((step / total) * 100, 100));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [app.state.isAnimating, animator]);

  const step  = animator.currentStep.current + 1;
  const total = animator.totalSteps.current;
  const paused = app.state.isPaused;

  return (
    <div className="anim-bar">
      <div className="anim-rail">
        <div className="anim-prog" style={{ width: `${progress}%` }} />
      </div>
      <div className="anim-body">
        <span className="anim-cnt">
          <span className="anim-num">{step}</span>
          <span style={{ color:'var(--text3)' }}> / {total}</span>
        </span>
        <div className="anim-btns">
          <button
            className={`anim-btn ${paused ? 'resume-btn' : 'pause-btn'}`}
            onClick={() => {
              if (paused) { animator.resume(); app.setPaused(false); }
              else        { animator.pause();  app.setPaused(true);  }
            }}
          >
            {paused ? '▶ resume' : '⏸ pause'}
          </button>
          <button
            className="anim-btn stop-btn"
            onClick={() => { animator.cancel(); app.setAnimating(false); }}
          >
            ■ stop
          </button>
        </div>
        <span className="anim-pct">{Math.round(progress)}%</span>
      </div>
    </div>
  );
});

export default AnimationControls;
