import React, { memo, useState, useRef, useEffect, useCallback } from 'react';

const Tooltip = memo(function Tooltip({ text, children, position = 'top', delay = 400 }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const posStyles = {
    top: { bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' },
    left: { right: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' },
    right: { left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <span
      style={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && text && (
        <span className="anim-fade" style={{ ...styles.bubble, ...posStyles[position] }}>
          {text}
          <span style={{ ...styles.arrow, ...arrowStyles[position] }} />
        </span>
      )}
    </span>
  );
});

const arrowStyles = {
  top: {
    top: '100%', left: '50%', transform: 'translateX(-50%)',
    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
    borderTop: '5px solid var(--bg-tertiary)',
  },
  bottom: {
    bottom: '100%', left: '50%', transform: 'translateX(-50%)',
    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
    borderBottom: '5px solid var(--bg-tertiary)',
  },
  left: {
    left: '100%', top: '50%', transform: 'translateY(-50%)',
    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
    borderLeft: '5px solid var(--bg-tertiary)',
  },
  right: {
    right: '100%', top: '50%', transform: 'translateY(-50%)',
    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
    borderRight: '5px solid var(--bg-tertiary)',
  },
};

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  bubble: {
    position: 'absolute',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border-hover)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 14px',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    zIndex: 9999,
    boxShadow: 'var(--shadow-lg)',
    backdropFilter: 'blur(16px)',
    pointerEvents: 'none',
    lineHeight: 1.4,
    maxWidth: '280px',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
};

export default Tooltip;