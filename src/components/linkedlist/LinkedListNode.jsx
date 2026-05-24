import React, { memo, useLayoutEffect, useRef } from 'react';

const STATE = {
  traverse:    { bg: 'rgba(251,191,36,0.12)',  border: '#fbbf24', text: '#fbbf24' },
  compare:     { bg: 'rgba(99,102,241,0.12)',  border: '#818cf8', text: '#a5b4fc' },
  found:       { bg: 'rgba(52,211,153,0.15)',  border: '#34d399', text: '#34d399' },
  insert:      { bg: 'rgba(52,211,153,0.15)',  border: '#34d399', text: '#34d399' },
  delete:      { bg: 'rgba(248,113,113,0.14)', border: '#f87171', text: '#f87171' },
  'not-found': { bg: 'rgba(248,113,113,0.08)', border: '#f87171', text: '#f87171' },
};

const DEFAULT = {
  bg: 'var(--bg-raised)',
  border: 'var(--node-border)',
  text: 'var(--text-primary)',
};

const LinkedListNode = memo(function LinkedListNode({
  value, isHead, isTail, state, index, isNew
}) {
  const st = STATE[state] || DEFAULT;
  const active = !!state;
  const nodeRef = useRef(null);

  // Slide-in animation for newly added nodes
  useLayoutEffect(() => {
    if (!isNew || !nodeRef.current) return;
    nodeRef.current.animate(
      [
        { opacity: 0, transform: 'translateY(-10px) scale(0.88)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 300, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
    );
  }, [isNew]);

  return (
    <div ref={nodeRef} style={s.wrapper}>
      {/* HEAD / TAIL badge */}
      {isHead && (
        <div style={s.badge}>
          <span style={{ ...s.badgeText, color: 'var(--emerald)' }}>HEAD</span>
        </div>
      )}
      {isTail && !isHead && (
        <div style={s.badge}>
          <span style={{ ...s.badgeText, color: 'var(--accent)' }}>TAIL</span>
        </div>
      )}

      {/* Node box */}
      <div style={{
        ...s.box,
        background: st.bg,
        borderColor: st.border,
        boxShadow: active ? `0 0 0 1px ${st.border}40` : 'none',
        transform: active ? 'scale(1.04)' : 'scale(1)',
      }}>
        {/* Data cell */}
        <div style={s.dataCell}>
          <span style={s.cellLabel}>data</span>
          <span style={{ ...s.cellValue, color: active ? st.text : 'var(--text-primary)' }}>
            {value}
          </span>
        </div>
        {/* Divider */}
        <div style={{ ...s.divider, background: `${st.border}35` }} />
        {/* Next pointer cell */}
        <div style={s.nextCell}>
          <span style={s.cellLabel}>next</span>
          <span style={{ ...s.cellValue, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isTail ? '∅' : '→'}
          </span>
        </div>
      </div>

      {/* Index tag */}
      <span style={s.index}>[{index}]</span>

      {/* Arrow connector to next node */}
      {!isTail && (
        <div style={s.arrow}>
          <svg width="32" height="16" viewBox="0 0 32 16">
            <line x1="0" y1="8" x2="26" y2="8"
              stroke={active ? st.border : 'var(--edge-default)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={active ? '4 2' : 'none'}
              style={{ transition: 'stroke 0.2s ease' }}
            />
            <polygon points="26,4 32,8 26,12"
              fill={active ? st.border : 'var(--edge-default)'}
              opacity={active ? 0.9 : 0.4}
              style={{ transition: 'fill 0.2s ease' }}
            />
          </svg>
        </div>
      )}
    </div>
  );
});

const s = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    paddingTop: '20px',
    paddingBottom: '16px',
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: '2px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  badgeText: {
    fontSize: '0.58rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  index: {
    position: 'absolute',
    bottom: '0px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.58rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
  },
  box: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1.5px solid',
    borderRadius: '6px',
    overflow: 'hidden',
    minWidth: '80px',
    transition: 'background 0.22s ease, border-color 0.22s ease, transform 0.2s ease',
  },
  dataCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 14px',
    gap: '1px',
    flex: 1,
  },
  nextCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 10px',
    gap: '1px',
    minWidth: '36px',
  },
  cellLabel: {
    fontSize: '0.52rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  cellValue: {
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.22s ease',
  },
  divider: {
    width: '1px',
    alignSelf: 'stretch',
    transition: 'background 0.22s ease',
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    margin: '0 2px',
    flexShrink: 0,
  },
};

export default LinkedListNode;