import React, { memo } from 'react';

const MessageBar = memo(function MessageBar({ message }) {
  if (!message) return null;

  return (
    <div className="anim-fade" style={styles.bar}>
      <div style={styles.indicator} />
      <div style={styles.content}>
        <span style={styles.prefix}>→</span>
        <span style={styles.text}>{message}</span>
      </div>
    </div>
  );
});

const styles = {
  bar: {
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: '36px',
  },
  indicator: {
    width: '3px',
    background: 'var(--gradient-primary)',
    flexShrink: 0,
    borderRadius: '0 2px 2px 0',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    flex: 1,
    minWidth: 0,
  },
  prefix: {
    color: 'var(--accent-1)',
    fontSize: '0.85rem',
    fontWeight: 800,
    flexShrink: 0,
    opacity: 0.7,
    fontFamily: 'var(--font-mono)',
  },
  text: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
};

export default MessageBar;