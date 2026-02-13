import React, { memo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppState';
import OperationButton from './OperationButton';

const AnimationControls = memo(function AnimationControls() {
  const { app, animator } = useAppContext();
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (animator.totalSteps.current > 0) {
        setProgress((animator.currentStep.current / animator.totalSteps.current) * 100);
      }
      setPaused(animator.isPaused.current);
    }, 80);
    return () => clearInterval(interval);
  }, [animator]);

  if (!app.state.isAnimating) return null;

  const step = animator.currentStep.current + 1;
  const total = animator.totalSteps.current || '—';

  return (
    <div style={styles.wrapper}>
      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: progress + '%' }}>
          <div style={styles.progressTip} />
        </div>
      </div>

      <div style={styles.controls}>
        {/* Step info */}
        <div style={styles.info}>
          <span style={styles.stepLabel}>Step</span>
          <span style={styles.stepNum}>{step}</span>
          <span style={styles.stepDivider}>/</span>
          <span style={styles.stepTotal}>{total}</span>
        </div>

        {/* Buttons */}
        <div style={styles.btns}>
          <OperationButton
            label={paused ? '▶ Resume' : '⏸ Pause'}
            onClick={paused
              ? () => { animator.resume(); app.setPaused(false); }
              : () => { animator.pause(); app.setPaused(true); }
            }
            variant={paused ? 'success' : 'secondary'}
            size="sm"
            fullWidth={false}
          />
          <OperationButton
            label="⏹ Stop"
            onClick={() => { animator.cancel(); app.setAnimating(false); }}
            variant="danger"
            size="sm"
            fullWidth={false}
          />
        </div>

        {/* Percentage */}
        <span style={styles.pct}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
});

const styles = {
  wrapper: {
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    overflow: 'hidden',
    animation: 'slideUp 0.35s ease both',
  },
  progressTrack: {
    height: '3px',
    background: 'var(--bg-tertiary)',
  },
  progressFill: {
    height: '100%',
    background: 'var(--gradient-primary)',
    transition: 'width 0.15s ease',
    position: 'relative',
    borderRadius: '0 3px 3px 0',
  },
  progressTip: {
    position: 'absolute',
    right: '-1px',
    top: '-3px',
    width: '8px',
    height: '9px',
    borderRadius: '50%',
    background: 'var(--accent-1)',
    filter: 'blur(3px)',
    opacity: 0.7,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  info: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  stepLabel: {
    fontSize: '0.62rem',
    color: 'var(--text-dim)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginRight: '2px',
  },
  stepNum: {
    fontSize: '0.9rem',
    color: 'var(--accent-3)',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
  },
  stepDivider: {
    fontSize: '0.75rem',
    color: 'var(--text-ghost)',
    fontWeight: 400,
  },
  stepTotal: {
    fontSize: '0.78rem',
    color: 'var(--text-dim)',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
  },
  btns: {
    display: 'flex',
    gap: '6px',
  },
  pct: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    minWidth: '36px',
    textAlign: 'right',
  },
};

export default AnimationControls;