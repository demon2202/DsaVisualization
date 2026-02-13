import React, { memo, forwardRef, useState } from 'react';

const InputField = memo(forwardRef(function InputField({
  value, onChange, onKeyDown, placeholder, disabled, type = 'number', icon, label
}, ref) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={styles.wrapper}>
      {label && <label style={styles.label}>{label}</label>}
      <div style={{
        ...styles.inputContainer,
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
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            ...styles.input,
            paddingLeft: icon ? '38px' : '14px',
            opacity: disabled ? 0.4 : 1,
          }}
        />
      </div>
    </div>
  );
}));

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
  inputContainer: {
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
  input: {
    width: '100%',
    padding: '11px 14px',
    background: 'transparent',
    color: 'var(--text-primary)',
    border: 'none',
    fontSize: '0.88rem',
    fontWeight: 550,
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.4,
    outline: 'none',
    boxShadow: 'none',
  },
};

export default InputField;