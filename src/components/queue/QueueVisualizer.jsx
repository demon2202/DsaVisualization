import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const STATE_STYLE = {
  enqueue: { bg: 'rgba(52,211,153,0.14)',  border: '#34d399', text: '#34d399' },
  dequeue: { bg: 'rgba(248,113,113,0.14)', border: '#f87171', text: '#f87171' },
  peek:    { bg: 'rgba(251,191,36,0.12)',  border: '#fbbf24', text: '#fbbf24' },
  compare: { bg: 'rgba(99,102,241,0.12)',  border: '#818cf8', text: '#a5b4fc' },
  found:   { bg: 'rgba(52,211,153,0.18)',  border: '#34d399', text: '#34d399' },
};

const DEFAULT_STYLE = {
  bg: 'var(--bg-raised)',
  border: 'var(--border)',
  text: 'var(--text-primary)',
};

function QueueItem({ item, idx, isFront, isRear, itemState, isNew }) {
  const ref = useRef(null);
  const st = STATE_STYLE[itemState] || DEFAULT_STYLE;
  const active = !!itemState;

  // Enqueue: slide in from the right
  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate(
      [
        { opacity: 0, transform: 'translateX(20px) scale(0.88)' },
        { opacity: 1, transform: 'translateX(0) scale(1)' },
      ],
      { duration: 260, easing: 'cubic-bezier(0.34,1.4,0.64,1)', fill: 'forwards' }
    );
  }, [isNew]);

  // Dequeue: slide out to the left
  useLayoutEffect(() => {
    if (itemState !== 'dequeue' || !ref.current) return;
    ref.current.animate(
      [
        { opacity: 1, transform: 'translateX(0) scale(1)' },
        { opacity: 0, transform: 'translateX(-18px) scale(0.85)' },
      ],
      { duration: 220, delay: 180, easing: 'ease-in', fill: 'forwards' }
    );
  }, [itemState]);

  return (
    <div
      ref={ref}
      style={{
        ...s.item,
        background: st.bg,
        borderColor: st.border,
        transform: active ? 'translateY(-2px) scale(1.04)' : 'none',
        transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.18s ease',
      }}
    >
      {/* Front / Rear badge */}
      {(isFront || isRear) && (
        <div style={s.posBadge}>
          {isFront && <span style={{ ...s.posText, color: 'var(--rose)' }}>FRONT</span>}
          {isRear  && <span style={{ ...s.posText, color: 'var(--emerald)' }}>REAR</span>}
        </div>
      )}

      <span style={s.idx}>{idx}</span>
      <span style={{ ...s.value, color: active ? st.text : 'var(--text-primary)' }}>
        {item.value}
      </span>
    </div>
  );
}

const QueueVisualizer = memo(function QueueVisualizer() {
  const { queue } = useAppContext();
  const { items, itemStates } = queue;

  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());

  const currentIds = new Set(items.map(i => i.id));
  newIds.current = new Set([...currentIds].filter(id => !prevIds.current.has(id)));
  prevIds.current = currentIds;

  if (items.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">▶</div>
        <div className="empty-state-title">empty queue</div>
        <div className="empty-state-hint">Enqueue values — first in, first out</div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Direction strip */}
      <div style={s.dirRow}>
        <span style={{ ...s.dirLabel, color: 'var(--rose)' }}>← dequeue</span>
        <div style={s.dirLine} />
        <span style={{ ...s.dirLabel, color: 'var(--emerald)' }}>enqueue →</span>
      </div>

      {/* Items row */}
      <div style={s.queueRow}>
        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            <QueueItem
              item={item}
              idx={i}
              isFront={i === 0}
              isRear={i === items.length - 1}
              itemState={itemStates[item.id]}
              isNew={newIds.current.has(item.id)}
            />
            {/* Connector between items */}
            {i < items.length - 1 && (
              <svg width="20" height="16" viewBox="0 0 20 16" style={{ flexShrink: 0, opacity: 0.3 }}>
                <line x1="0" y1="8" x2="16" y2="8" stroke="var(--edge-default)" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="16,4 20,8 16,12" fill="var(--edge-default)" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

const s = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto',
    padding: '20px',
    gap: '14px',
  },
  dirRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    maxWidth: '600px',
  },
  dirLabel: {
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'lowercase',
    flexShrink: 0,
    opacity: 0.65,
  },
  dirLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border)',
  },
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: '12px',
  },
  item: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '12px 16px',
    paddingTop: '20px',
    borderRadius: '6px',
    border: '1px solid',
    minWidth: '58px',
    cursor: 'default',
  },
  posBadge: {
    position: 'absolute',
    top: '-9px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '3px',
  },
  posText: {
    fontSize: '0.52rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: 'var(--bg-surface)',
    padding: '1px 5px',
    borderRadius: '3px',
    border: '1px solid currentColor',
    opacity: 0.9,
  },
  idx: {
    fontSize: '0.58rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
  },
  value: {
    fontSize: '1.05rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.2s ease',
  },
};

export default QueueVisualizer;