import React, { memo, useEffect, useState, useRef } from 'react';

const MetricCard = memo(function MetricCard({ label, value, icon, color = 'var(--accent-1)' }) {
  const [flash, setFlash] = useState(false);
  const [direction, setDirection] = useState(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      const prev = Number(prevRef.current);
      const curr = Number(value);
      if (!isNaN(prev) && !isNaN(curr)) {
        setDirection(curr > prev ? 'up' : 'down');
      } else {
        setDirection(null);
      }
      setFlash(true);
      prevRef.current = value;
      const t = setTimeout(() => { setFlash(false); setDirection(null); }, 900);
      return () => clearTimeout(t);
    }
  }, [value]);

  const display = typeof value === 'boolean'
    ? (value ? '✓ Yes' : '✗ No')
    : String(value ?? '—');

  return (
    <div style={{
      ...styles.card,
      borderColor: flash ? color + '50' : 'var(--glass-border)',
      background: flash ? color + '06' : 'var(--gradient-card)',
    }}>
      {/* Accent line */}
      <div style={{ ...styles.accentLine, background: color }} />

      {/* Icon */}
      <div style={{ ...styles.iconBox, background: color + '10' }}>
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.valueRow}>
          {direction === 'up' && <span style={{ ...styles.arrow, color: 'var(--accent-emerald)' }}>↑</span>}
          {direction === 'down' && <span style={{ ...styles.arrow, color: 'var(--accent-rose)' }}>↓</span>}
          <span style={{
            ...styles.value,
            color: flash ? color : 'var(--text-primary)',
          }}>{display}</span>
        </div>
        <span style={styles.label}>{label}</span>
      </div>

      {/* Flash bar */}
      {flash && (
        <div style={{ ...styles.flashBar, background: color }}>
          <div style={styles.flashFill} />
        </div>
      )}
    </div>
  );
});

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px 12px 0',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
    transition: 'all 0.35s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  accentLine: {
    width: '3px',
    alignSelf: 'stretch',
    borderRadius: '0 2px 2px 0',
    flexShrink: 0,
    opacity: 0.6,
  },
  iconBox: {
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  valueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  arrow: {
    fontSize: '0.72rem',
    fontWeight: 900,
    animation: 'fadeIn 0.3s ease',
  },
  value: {
    fontSize: '1rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.2,
    transition: 'color 0.3s ease',
  },
  label: {
    fontSize: '0.62rem',
    color: 'var(--text-muted)',
    fontWeight: 700,
    marginTop: '3px',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'block',
  },
  flashBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    overflow: 'hidden',
  },
  flashFill: {
    width: '100%',
    height: '100%',
    background: 'inherit',
    animation: 'progressShrink 0.9s ease forwards',
    transformOrigin: 'right',
    opacity: 0.5,
  },
};

export default MetricCard;