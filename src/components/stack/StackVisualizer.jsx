import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const STATE_STYLE = {
  push:    { bg: 'rgba(52,211,153,0.14)',  border: '#34d399', text: '#34d399' },
  pop:     { bg: 'rgba(248,113,113,0.14)', border: '#f87171', text: '#f87171' },
  peek:    { bg: 'rgba(251,191,36,0.12)',  border: '#fbbf24', text: '#fbbf24' },
  compare: { bg: 'rgba(99,102,241,0.12)',  border: '#818cf8', text: '#a5b4fc' },
  found:   { bg: 'rgba(52,211,153,0.18)',  border: '#34d399', text: '#34d399' },
};

const DEFAULT_STYLE = {
  bg: 'var(--bg-raised)',
  border: 'var(--border)',
  text: 'var(--text-primary)',
};

/** Animates enter via Web Animations API so it's decoupled from React re-renders */
function StackItem({ item, actualIdx, isTop, itemState, isNew }) {
  const ref = useRef(null);
  const st = STATE_STYLE[itemState] || DEFAULT_STYLE;
  const active = !!itemState;

  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate(
      [
        { opacity: 0, transform: 'translateY(-16px) scale(0.9)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.34,1.4,0.64,1)', fill: 'forwards' }
    );
  }, [isNew]);

  // Pop highlight — brief flash then item disappears (handled by state removal)
  useLayoutEffect(() => {
    if (itemState !== 'pop' || !ref.current) return;
    ref.current.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'translateY(-12px) scale(0.85)' },
      ],
      { duration: 220, delay: 200, easing: 'ease-in', fill: 'forwards' }
    );
  }, [itemState]);

  return (
    <div
      ref={ref}
      style={{
        ...s.item,
        background: st.bg,
        borderColor: st.border,
        borderWidth: isTop ? '1.5px' : '1px',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.18s ease',
      }}
    >
      <span style={s.idx}>{actualIdx}</span>
      <span style={{ ...s.value, color: active ? st.text : 'var(--text-primary)' }}>
        {item.value}
      </span>
      {isTop && (
        <span style={s.topBadge}>← TOP</span>
      )}
    </div>
  );
}

const StackVisualizer = memo(function StackVisualizer() {
  const { stack } = useAppContext();
  const { items, itemStates } = stack;

  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());

  // Detect new items each render
  const currentIds = new Set(items.map(i => i.id));
  newIds.current = new Set([...currentIds].filter(id => !prevIds.current.has(id)));
  prevIds.current = currentIds;

  if (items.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">▤</div>
        <div className="empty-state-title">empty stack</div>
        <div className="empty-state-hint">Push values — last in, first out</div>
      </div>
    );
  }

  const reversed = [...items].reverse(); // top of stack is visually at top

  return (
    <div style={s.container}>
      <div style={s.stack}>
        {/* TOP label */}
        <div style={s.topLabel}>
          <span style={s.topArrow}>↓</span>
          <span style={s.topText}>push here</span>
        </div>

        {reversed.map((item, vi) => {
          const actualIdx = items.length - 1 - vi;
          const isTop = actualIdx === items.length - 1;
          return (
            <StackItem
              key={item.id}
              item={item}
              actualIdx={actualIdx}
              isTop={isTop}
              itemState={itemStates[item.id]}
              isNew={newIds.current.has(item.id)}
            />
          );
        })}

        {/* Base */}
        <div style={s.base}>
          <div style={s.baseLine} />
          <span style={s.baseLabel}>base</span>
        </div>
      </div>
    </div>
  );
});

const s = {
  container: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'auto',
    padding: '16px 20px 20px',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '4px',
    width: '100%',
    maxWidth: '300px',
  },
  topLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    paddingLeft: '2px',
  },
  topArrow: {
    fontSize: '0.75rem',
    color: 'var(--emerald)',
    animation: 'float 1.6s ease-in-out infinite',
    display: 'inline-block',
  },
  topText: {
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid',
    gap: '12px',
    cursor: 'default',
  },
  idx: {
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
    width: '20px',
    flexShrink: 0,
  },
  value: {
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    flex: 1,
    transition: 'color 0.2s ease',
  },
  topBadge: {
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--emerald)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    opacity: 0.7,
  },
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  baseLine: {
    width: '100%',
    height: '2px',
    borderRadius: '1px',
    background: 'var(--border-hover)',
  },
  baseLabel: {
    fontSize: '0.58rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
    letterSpacing: '0.06em',
  },
};

// Float keyframe — injected once
if (typeof document !== 'undefined' && !document.getElementById('stack-kf')) {
  const style = document.createElement('style');
  style.id = 'stack-kf';
  style.textContent = `@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`;
  document.head.appendChild(style);
}

export default StackVisualizer;