import React, { memo } from 'react';

const TraversalSelector = memo(function TraversalSelector({ value, onChange, options, disabled }) {
  return (
    <div style={tsStyles.wrapper}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={tsStyles.select}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span style={tsStyles.arrow}>▾</span>
    </div>
  );
});

const tsStyles = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  select: {
    width: '100%',
    padding: '11px 40px 11px 14px',
    borderRadius: '12px',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    fontSize: '0.88rem',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    transition: 'all 0.3s ease',
    lineHeight: 1.4,
  },
  arrow: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    pointerEvents: 'none',
  },
};

export default TraversalSelector;