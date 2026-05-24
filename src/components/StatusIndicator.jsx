import React, { memo, useEffect, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const CFG = {
  success: { color: '#34d399', icon: '✓' },
  error:   { color: '#f87171', icon: '✗' },
  info:    { color: '#22d3ee', icon: 'i' },
  running: { color: '#818cf8', icon: '⟳' },
};

const StatusIndicator = memo(function StatusIndicator() {
  const { app } = useAppContext();
  const status = app.state.operationStatus;
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (status.type === 'idle') { setVisible(false); return; }
    setVisible(true);
    setKey(k => k + 1);
    if (status.type === 'running') return;
    const t = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(t);
  }, [status]);

  if (!visible) return null;
  const cfg = CFG[status.type];
  if (!cfg) return null;

  return (
    <div key={key} className="anim-slide-up" style={{
      ...s.bar,
      borderColor: `${cfg.color}28`,
      background: `${cfg.color}08`,
    }}>
      <span style={{
        ...s.icon,
        color: cfg.color,
        animation: status.type === 'running' ? 'spin 0.8s linear infinite' : 'none',
        display: 'inline-block',
      }}>
        {cfg.icon}
      </span>
      <div style={s.text}>
        <span style={{ ...s.msg, color: cfg.color }}>{status.message}</span>
        {status.detail && <span style={s.detail}>{status.detail}</span>}
      </div>
      {status.type !== 'running' && (
        <div style={s.progressWrap}>
          <div style={{ ...s.progressBar, background: cfg.color }} />
        </div>
      )}
    </div>
  );
});

const s = {
  bar: {
    border: '1px solid',
    borderRadius: '7px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px 12px 10px',
  },
  icon: {
    fontSize: '0.78rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
    marginTop: '1px',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  msg: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  detail: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    wordBreak: 'break-all',
    lineHeight: 1.4,
  },
  progressWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    transformOrigin: 'right',
    animation: 'progressShrink 4.5s linear forwards',
    opacity: 0.35,
  },
};

export default StatusIndicator;