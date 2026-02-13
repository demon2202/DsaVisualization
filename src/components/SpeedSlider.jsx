import React, { memo, useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const presets = [
  { value: 100, label: 'Instant', icon: '⚡', color: '#f7475e' },
  { value: 350, label: 'Fast', icon: '🏃', color: '#fb7e1a' },
  { value: 700, label: 'Normal', icon: '▶️', color: '#12d492' },
  { value: 1100, label: 'Slow', icon: '🐢', color: '#2ee8d6' },
  { value: 1500, label: 'Detailed', icon: '🔬', color: '#9b7bfa' },
];

const SpeedSlider = memo(function SpeedSlider() {
  const { app } = useAppContext();
  const speed = app.state.animationSpeed;
  const [dragging, setDragging] = useState(false);

  const activePreset = useMemo(() => {
    let closest = presets[0];
    let minDiff = Infinity;
    for (const p of presets) {
      const diff = Math.abs(p.value - speed);
      if (diff < minDiff) { minDiff = diff; closest = p; }
    }
    return closest;
  }, [speed]);

  const pct = ((speed - 50) / (1500 - 50)) * 100;

  return (
    <div style={styles.outer}>
      {/* Title row */}
      <div style={styles.topRow}>
        <span style={styles.title}>Animation Speed</span>
        <span style={{
          ...styles.currentBadge,
          background: activePreset.color + '12',
          color: activePreset.color,
          borderColor: activePreset.color + '25',
        }}>
          {activePreset.icon} {activePreset.label}
        </span>
      </div>

      {/* Slider area */}
      <div style={styles.sliderArea}>
        <div style={styles.trackOuter}>
          {/* Track background segments */}
          <div style={styles.trackBg}>
            {presets.map((p, i) => {
              const segStart = i === 0 ? 0 : ((presets[i - 1].value + p.value) / 2 - 50) / (1500 - 50) * 100;
              const segEnd = i === presets.length - 1 ? 100 : ((p.value + presets[i + 1].value) / 2 - 50) / (1500 - 50) * 100;
              const isActive = speed >= (i === 0 ? 50 : (presets[i - 1].value + p.value) / 2) &&
                               speed <= (i === presets.length - 1 ? 1500 : (p.value + presets[i + 1].value) / 2);
              return (
                <div key={p.value} style={{
                  position: 'absolute',
                  left: segStart + '%',
                  width: (segEnd - segStart) + '%',
                  height: '100%',
                  background: isActive ? p.color + '18' : 'transparent',
                  transition: 'background 0.3s ease',
                  borderRadius: '4px',
                }} />
              );
            })}
          </div>

          {/* Fill */}
          <div style={{
            ...styles.trackFill,
            width: pct + '%',
            background: `linear-gradient(90deg, #f7475e, ${activePreset.color})`,
          }} />

          {/* Thumb */}
          <div style={{
            ...styles.thumb,
            left: pct + '%',
            borderColor: activePreset.color,
            boxShadow: dragging
              ? `0 0 0 6px ${activePreset.color}18, 0 0 20px ${activePreset.color}30`
              : `0 0 0 3px ${activePreset.color}12, 0 0 12px ${activePreset.color}15`,
          }}>
            <div style={{ ...styles.thumbDot, background: activePreset.color }} />
          </div>

          {/* Native range input */}
          <input
            type="range"
            min="50"
            max="1500"
            step="25"
            value={speed}
            onChange={e => app.setSpeed(Number(e.target.value))}
            onMouseDown={() => setDragging(true)}
            onMouseUp={() => setDragging(false)}
            onTouchStart={() => setDragging(true)}
            onTouchEnd={() => setDragging(false)}
            style={styles.nativeRange}
            aria-label="Animation speed"
          />
        </div>

        {/* Time display */}
        <div style={styles.timeDisplay}>
          <span style={styles.timeValue}>{speed}</span>
          <span style={styles.timeUnit}>ms</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div style={styles.presetRow}>
        {presets.map((p) => {
          const isActive = activePreset.value === p.value;
          return (
            <button
              key={p.value}
              onClick={() => app.setSpeed(p.value)}
              style={{
                ...styles.presetBtn,
                background: isActive ? p.color + '15' : 'transparent',
                color: isActive ? p.color : 'var(--text-dim)',
                borderColor: isActive ? p.color + '30' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
              title={`Set speed to ${p.value}ms`}
            >
              <span style={styles.presetIcon}>{p.icon}</span>
              <span style={styles.presetLabel}>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const styles = {
  outer: {
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '8px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.2px',
  },
  currentBadge: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.68rem',
    fontWeight: 700,
    border: '1px solid',
    letterSpacing: '0.2px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  sliderArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '14px',
  },
  trackOuter: {
    position: 'relative',
    flex: 1,
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '6px',
    borderRadius: '3px',
    background: 'var(--bg-tertiary)',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: '6px',
    borderRadius: '3px',
    transition: 'width 0.1s ease',
    pointerEvents: 'none',
    zIndex: 1,
  },
  thumb: {
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '2.5px solid',
    transform: 'translateX(-50%)',
    transition: 'box-shadow 0.2s ease, border-color 0.3s ease',
    pointerEvents: 'none',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    transition: 'background 0.3s ease',
  },
  nativeRange: {
    position: 'absolute',
    width: '100%',
    height: '32px',
    margin: 0,
    opacity: 0,
    cursor: 'pointer',
    zIndex: 3,
  },
  timeDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border)',
    minWidth: '64px',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timeValue: {
    fontSize: '0.88rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
  timeUnit: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  presetRow: {
    display: 'flex',
    gap: '4px',
    marginBottom: '10px',
  },
  presetBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '8px 4px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    background: 'transparent',
    minWidth: 0,
  },
  presetIcon: {
    fontSize: '0.9rem',
    lineHeight: 1,
  },
  presetLabel: {
    fontSize: '0.58rem',
    letterSpacing: '0.3px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  desc: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    fontWeight: 450,
    fontStyle: 'italic',
    margin: 0,
    paddingLeft: '2px',
  },
};

export default SpeedSlider;