import React, { memo, useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const presets = [
  { value: 100,  label: '0.1s', tag: 'instant' },
  { value: 400,  label: '0.4s', tag: 'fast' },
  { value: 800,  label: '0.8s', tag: 'normal' },
  { value: 1200, label: '1.2s', tag: 'slow' },
  { value: 1500, label: '1.5s', tag: 'step' },
];

const SpeedSlider = memo(function SpeedSlider() {
  const { app } = useAppContext();
  const speed = app.state.animationSpeed;

  const activePreset = useMemo(() => {
    return presets.reduce((closest, p) =>
      Math.abs(p.value - speed) < Math.abs(closest.value - speed) ? p : closest
    , presets[0]);
  }, [speed]);

  const pct = ((speed - 50) / (1500 - 50)) * 100;

  return (
    <div style={s.wrapper}>
      <div style={s.row}>
        <span style={s.label}>step delay</span>
        <span style={s.value}>{speed}ms</span>
      </div>

      <div style={s.trackOuter}>
        <div style={{ ...s.trackFill, width: pct + '%' }} />
        <input
          type="range"
          min="50"
          max="1500"
          step="25"
          value={speed}
          onChange={e => app.setSpeed(Number(e.target.value))}
          style={s.range}
          aria-label="Animation step delay"
        />
      </div>

      <div style={s.presets}>
        {presets.map(p => (
          <button
            key={p.value}
            onClick={() => app.setSpeed(p.value)}
            style={{
              ...s.preset,
              ...(activePreset.value === p.value ? s.presetActive : {}),
            }}
            title={`Set to ${p.value}ms`}
          >
            {p.tag}
          </button>
        ))}
      </div>
    </div>
  );
});

const s = {
  wrapper: {
    padding: '10px 12px',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  label: {
    fontSize: '0.68rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'lowercase',
    letterSpacing: '0.02em',
  },
  value: {
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent)',
  },
  trackOuter: {
    position: 'relative',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '3px',
    background: 'var(--bg-overlay)',
    borderRadius: '2px',
    pointerEvents: 'none',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: '3px',
    background: 'var(--accent)',
    borderRadius: '2px',
    transition: 'width 0.08s linear',
    pointerEvents: 'none',
    opacity: 0.75,
  },
  range: {
    position: 'absolute',
    width: '100%',
    height: '20px',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 1,
    margin: 0,
  },
  presets: {
    display: 'flex',
    gap: '4px',
  },
  preset: {
    flex: 1,
    padding: '4px 0',
    fontSize: '0.6rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'color 0.14s, background 0.14s, border-color 0.14s',
    letterSpacing: '0.02em',
  },
  presetActive: {
    color: 'var(--accent)',
    background: 'rgba(99,102,241,0.08)',
    borderColor: 'rgba(99,102,241,0.2)',
  },
};

export default SpeedSlider;