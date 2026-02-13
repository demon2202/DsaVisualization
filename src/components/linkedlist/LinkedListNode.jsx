import React, { memo } from 'react';

const stateMap = {
  traverse: { bg: 'rgba(245,158,11,0.18)', border: '#f59e0b', glow: '0 0 14px rgba(245,158,11,0.35)' },
  compare: { bg: 'rgba(99,102,241,0.18)', border: '#818cf8', glow: '0 0 14px rgba(99,102,241,0.35)' },
  found: { bg: 'rgba(16,185,129,0.22)', border: '#10b981', glow: '0 0 18px rgba(16,185,129,0.45)' },
  insert: { bg: 'rgba(16,185,129,0.22)', border: '#10b981', glow: '0 0 20px rgba(16,185,129,0.5)' },
  delete: { bg: 'rgba(244,63,94,0.22)', border: '#f43f5e', glow: '0 0 18px rgba(244,63,94,0.45)' },
  'not-found': { bg: 'rgba(244,63,94,0.12)', border: '#f43f5e', glow: 'none' },
};

const defaultStyle = {
  bg: 'var(--node-bg)',
  border: 'var(--node-border)',
  glow: 'none',
};

const LinkedListNode = memo(function LinkedListNode({ value, isHead, isTail, state, index }) {
  const s = stateMap[state] || defaultStyle;
  const isActive = !!state;

  return (
    <div style={styles.wrapper} className="anim-fade-scale">
      {/* Head / Tail labels */}
      {isHead && (
        <div style={styles.label}>
          <span style={styles.labelBadge}>HEAD</span>
        </div>
      )}
      {isTail && !isHead && (
        <div style={styles.label}>
          <span style={{ ...styles.labelBadge, background: 'rgba(139,92,246,0.2)', color: 'var(--accent-2)', borderColor: 'rgba(139,92,246,0.3)' }}>TAIL</span>
        </div>
      )}

      {/* Index */}
      <div style={styles.indexLabel}>{index}</div>

      {/* Node box */}
      <div style={{
        ...styles.node,
        background: s.bg,
        borderColor: s.border,
        boxShadow: isActive ? s.glow : 'var(--shadow-xs)',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
      }}>
        {/* Data section */}
        <div style={styles.dataSection}>
          <span style={styles.dataLabel}>data</span>
          <span style={{
            ...styles.dataValue,
            color: isActive ? s.border : 'var(--text-primary)',
          }}>{value}</span>
        </div>

        {/* Separator */}
        <div style={{ ...styles.sep, background: s.border + '40' }} />

        {/* Next pointer */}
        <div style={styles.nextSection}>
          <span style={styles.nextLabel}>next</span>
          <span style={styles.nextValue}>{isTail ? '∅' : '•→'}</span>
        </div>
      </div>

      {/* Arrow connector */}
      {!isTail && (
        <div style={styles.arrow}>
          <svg width="36" height="24" viewBox="0 0 36 24">
            <defs>
              <linearGradient id={`arrowGrad_${index}`} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor={isActive ? s.border : 'var(--accent-1)'} stopOpacity="0.6" />
                <stop offset="100%" stopColor={isActive ? s.border : 'var(--accent-2)'} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <line x1="0" y1="12" x2="28" y2="12"
              stroke={`url(#arrowGrad_${index})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={isActive ? { strokeDasharray: '4 3', animation: 'edgeTravel 0.8s linear infinite' } : {}}
            />
            <polygon
              points="28,7 36,12 28,17"
              fill={isActive ? s.border : 'var(--accent-1)'}
              opacity={isActive ? 0.8 : 0.4}
            />
          </svg>
        </div>
      )}
    </div>
  );
});

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
    paddingTop: '22px',
  },
  label: {
    position: 'absolute',
    top: '0px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
  },
  labelBadge: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.58rem',
    fontWeight: 800,
    letterSpacing: '1px',
    background: 'rgba(99,102,241,0.2)',
    color: 'var(--accent-1)',
    border: '1px solid rgba(99,102,241,0.3)',
    whiteSpace: 'nowrap',
  },
  indexLabel: {
    position: 'absolute',
    bottom: '-16px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.6rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  node: {
    display: 'flex',
    alignItems: 'stretch',
    borderRadius: 'var(--radius-md)',
    border: '2px solid',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    minWidth: '88px',
    background: 'var(--node-bg)',
  },
  dataSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    flex: 1,
    gap: '2px',
  },
  dataLabel: {
    fontSize: '0.55rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dataValue: {
    fontSize: '1rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.3s ease',
  },
  sep: {
    width: '1.5px',
    alignSelf: 'stretch',
    transition: 'background 0.3s ease',
  },
  nextSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 10px',
    gap: '2px',
    minWidth: '38px',
  },
  nextLabel: {
    fontSize: '0.55rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  nextValue: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  arrow: {
    margin: '0 2px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
};

export default LinkedListNode;