import React, { memo } from 'react';

const MessageBar = memo(function MessageBar({ message }) {
  if (!message) return null;
  return (
    <div style={s.bar} className="anim-fade">
      <span style={s.prompt}>›</span>
      <span style={s.text}>{message}</span>
    </div>
  );
});

const s = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 10px',
    borderRadius: '5px',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border)',
    borderLeft: '2px solid var(--accent)',
  },
  prompt: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--accent)',
    fontWeight: 700,
    flexShrink: 0,
    opacity: 0.7,
  },
  text: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.73rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
};

export default MessageBar;