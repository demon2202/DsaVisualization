import React, { memo, useEffect, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const configs = {
  success: { icon: '✓', color: '#12d492', bg: 'rgba(18,212,146,0.06)', borderAlpha: '20' },
  error:   { icon: '✗', color: '#f7475e', bg: 'rgba(247,71,94,0.06)', borderAlpha: '20' },
  info:    { icon: 'ℹ', color: '#2ee8d6', bg: 'rgba(46,232,214,0.05)', borderAlpha: '18' },
  running: { icon: '⟳', color: '#7c7cf7', bg: 'rgba(124,124,247,0.05)', borderAlpha: '18' },
};

const StatusIndicator = memo(function StatusIndicator() {
  const { app } = useAppContext();
  const status = app.state.operationStatus;
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (status.type !== 'idle') {
      setVisible(true);
      setKey(k => k + 1);
      if (status.type !== 'running') {
        const t = setTimeout(() => setVisible(false), 5000);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [status]);

  const cfg = configs[status.type];
  if (!cfg || !visible) return null;

  return (
    <div
      key={key}
      className="anim-slide-up"
      style={{
        ...styles.container,
        background: cfg.bg,
        borderColor: cfg.color + cfg.borderAlpha,
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Left accent */}
      <div style={{ ...styles.accent, background: cfg.color }} />

      <div style={styles.body}>
        <div style={{
          ...styles.iconBox,
          background: cfg.color + '12',
          color: cfg.color,
        }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 900,
            ...(status.type === 'running' ? { display: 'inline-block', animation: 'spin 0.7s linear infinite' } : {}),
          }}>{cfg.icon}</span>
        </div>

        <div style={styles.text}>
          <span style={{ ...styles.msg, color: cfg.color }}>{status.message}</span>
          {status.detail && <span style={styles.detail}>{status.detail}</span>}
        </div>
      </div>

      {/* Auto-dismiss bar */}
      {status.type !== 'running' && (
        <div style={styles.progressWrap}>
          <div style={{
            ...styles.progressBar,
            background: cfg.color,
          }} />
        </div>
      )}
    </div>
  );
});

const styles = {
  container: {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '3px',
    bottom: 0,
    borderRadius: '0 2px 2px 0',
    opacity: 0.7,
  },
  body: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '11px 14px 11px 16px',
  },
  iconBox: {
    width: '26px',
    height: '26px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    paddingTop: '2px',
  },
  msg: {
    fontSize: '0.8rem',
    fontWeight: 650,
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  detail: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    lineHeight: 1.4,
    wordBreak: 'break-all',
  },
  progressWrap: {
    height: '2px',
    background: 'rgba(255,255,255,0.02)',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    transformOrigin: 'right',
    animation: 'progressShrink 5s linear forwards',
    opacity: 0.4,
  },
};

export default StatusIndicator;