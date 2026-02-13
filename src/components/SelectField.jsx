import React, { memo, useState } from 'react';

const SelectField = memo(function SelectField({ value, onChange, options, disabled, label, icon }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value !== '' && value !== options[0]?.value;

  return (
    <div style={styles.wrapper}>
      {label && <label style={styles.label}>{label}</label>}
      <div style={{
        ...styles.selectContainer,
        borderColor: focused ? 'var(--accent-1)' : 'var(--glass-border)',
        boxShadow: focused
          ? '0 0 0 3px rgba(124,124,247,0.08), inset 0 1px 4px rgba(0,0,0,0.2)'
          : 'inset 0 1px 4px rgba(0,0,0,0.15)',
        background: focused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
      }}>
        {icon && (
          <span style={{
            ...styles.icon,
            color: focused ? 'var(--accent-1)' : 'var(--text-dim)',
          }}>{icon}</span>
        )}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          style={{
            ...styles.select,
            paddingLeft: icon ? '38px' : '14px',
            opacity: disabled ? 0.4 : 1,
            color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div style={{
          ...styles.arrow,
          transform: focused ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke={focused ? 'var(--accent-1)' : 'var(--text-muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    paddingLeft: '2px',
  },
  selectContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid',
    transition: 'all 0.25s ease',
    overflow: 'hidden',
  },
  icon: {
    position: 'absolute',
    left: '12px',
    fontSize: '0.92rem',
    pointerEvents: 'none',
    zIndex: 2,
    lineHeight: 1,
    transition: 'color 0.25s ease',
  },
  select: {
    width: '100%',
    padding: '11px 36px 11px 14px',
    background: 'transparent',
    color: 'var(--text-primary)',
    border: 'none',
    fontSize: '0.88rem',
    fontWeight: 550,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    outline: 'none',
    lineHeight: 1.4,
    boxShadow: 'none',
  },
  arrow: {
    position: 'absolute',
    right: '12px',
    pointerEvents: 'none',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.25s ease',
  },
};

export default SelectField;