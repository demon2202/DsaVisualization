import React, { memo, useRef } from 'react';

/**
 * MetricCard — shows a single KPI with a flash animation when value changes.
 *
 * Flash is driven by a changing `key` on the value span (forces remount → CSS animation replays)
 * instead of a useEffect + setTimeout + state combo. Cleaner and no stale closure risk.
 */
const MetricCard = memo(function MetricCard({ label, value, icon, color = 'var(--accent)' }) {
  const display = typeof value === 'boolean'
    ? (value ? '✓ yes' : '✗ no')
    : String(value ?? '—');

  // Track direction (up/down arrow) between renders
  const prevRef  = useRef(value);
  const flashKey = useRef(0);

  let direction = null;
  if (prevRef.current !== value) {
    const prev = Number(prevRef.current);
    const curr = Number(value);
    if (!isNaN(prev) && !isNaN(curr)) direction = curr > prev ? '↑' : '↓';
    flashKey.current++;
    prevRef.current = value;
  }

  return (
    <div style={s.card}>
      <div style={{ ...s.accent, background: color }} />

      <span style={{ ...s.icon, background: color + '14' }}>
        <span style={s.iconChar}>{icon}</span>
      </span>

      <div style={s.body}>
        <div style={s.row}>
          {direction && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700,
              color: direction === '↑' ? 'var(--emerald)' : 'var(--rose)',
              marginRight: '2px',
            }}>
              {direction}
            </span>
          )}
          {/* key change triggers CSS animation restart without any JS timer */}
          <span
            key={flashKey.current}
            style={{ ...s.value, color }}
          >
            {display}
          </span>
        </div>
        <span style={s.label}>{label}</span>
      </div>
    </div>
  );
});

const s = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px 9px 0',
    borderRadius: '7px',
    border: '1px solid var(--border)',
    background: 'var(--bg-raised)',
    position: 'relative',
    overflow: 'hidden',
  },
  accent: {
    width: '2px',
    alignSelf: 'stretch',
    borderRadius: '0 2px 2px 0',
    flexShrink: 0,
    opacity: 0.65,
  },
  icon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconChar: {
    fontSize: '0.9rem',
    lineHeight: 1,
    fontFamily: 'var(--font-mono)',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'baseline',
  },
  value: {
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.2,
    animation: 'fadeIn 0.22s ease both',
  },
  label: {
    fontSize: '0.58rem',
    color: 'var(--text-dim)',
    fontWeight: 600,
    marginTop: '2px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
    display: 'block',
  },
};

export default MetricCard;