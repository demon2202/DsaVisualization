import React, { memo, useRef, useLayoutEffect, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const STATE_STYLE = {
  push:    { bg: 'rgba(52,211,153,0.18)',  border: '#34d399', text: '#34d399', glow: '0 0 20px rgba(52,211,153,0.4)'  },
  pop:     { bg: 'rgba(248,113,113,0.18)', border: '#f87171', text: '#f87171', glow: '0 0 20px rgba(248,113,113,0.4)' },
  peek:    { bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24', text: '#fbbf24', glow: '0 0 16px rgba(251,191,36,0.35)' },
  compare: { bg: 'rgba(99,102,241,0.15)',  border: '#818cf8', text: '#a5b4fc', glow: '0 0 14px rgba(99,102,241,0.3)'  },
  found:   { bg: 'rgba(52,211,153,0.22)',  border: '#34d399', text: '#34d399', glow: '0 0 22px rgba(52,211,153,0.5)'  },
};
const DEFAULT = { bg: 'var(--bg-raised)', border: 'var(--border)', text: 'var(--text-primary)', glow: 'none' };

function StackItem({ item, actualIdx, isTop, itemState, isNew, isPop }) {
  const ref = useRef(null);
  const st  = STATE_STYLE[itemState] || DEFAULT;
  const active = !!itemState;

  // Push: drop in from above with spring
  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate([
      { opacity: 0, transform: 'translateY(-32px) scale(0.85)' },
      { opacity: 1, transform: 'translateY(4px)  scale(1.04)' },
      { opacity: 1, transform: 'translateY(0)    scale(1)'    },
    ], { duration: 360, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
  }, [isNew]);

  // Pop: fly up and fade
  useLayoutEffect(() => {
    if (!isPop || !ref.current) return;
    ref.current.animate([
      { opacity: 1, transform: 'translateY(0)    scale(1)'    },
      { opacity: 0, transform: 'translateY(-28px) scale(0.8)' },
    ], { duration: 280, delay: 80, easing: 'ease-in', fill: 'forwards' });
  }, [isPop]);

  return (
    <div ref={ref} style={{
      ...s.item,
      background:  st.bg,
      borderColor: st.border,
      boxShadow:   active ? st.glow : 'none',
      borderWidth: isTop ? '2px' : '1px',
      transform:   active && !isNew ? 'scale(1.03)' : 'scale(1)',
      transition:  'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease',
    }}>
      {/* Index */}
      <span style={s.idx}>[{actualIdx}]</span>

      {/* Value — scales up slightly when active */}
      <span style={{ ...s.value, color: active ? st.text : 'var(--text-primary)',
        fontSize: active ? '1.15rem' : '1rem',
        transition: 'color 0.22s ease, font-size 0.18s ease',
      }}>
        {item.value}
      </span>

      {/* TOP badge */}
      {isTop && (
        <div style={s.topBadge}>
          <span style={s.topArrow}>◄</span>
          <span>TOP</span>
        </div>
      )}

      {/* State label */}
      {active && (
        <span style={{ ...s.stateTag, color: st.text, borderColor: `${st.border}40`, background: `${st.border}15` }}>
          {itemState}
        </span>
      )}
    </div>
  );
}

const StackVisualizer = memo(function StackVisualizer() {
  const { stack } = useAppContext();
  const { items, itemStates } = stack;

  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());
  const popIds  = useRef(new Set());

  const currentIds = new Set(items.map(i => i.id));
  newIds.current = new Set([...currentIds].filter(id => !prevIds.current.has(id)));
  // Items that just disappeared = pop candidates
  popIds.current = new Set([...prevIds.current].filter(id => !currentIds.has(id)));
  prevIds.current = currentIds;

  if (!items.length) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">▤</div>
        <div className="empty-state-title">empty stack</div>
        <div className="empty-state-hint">Push values — each one lands on top. Pop removes from top (LIFO).</div>
      </div>
    );
  }

  const reversed = [...items].reverse();

  return (
    <div style={s.container}>
      {/* Utilization bar */}
      <div style={s.utilizationWrap}>
        <span style={s.utilLabel}>{items.length} / 20</span>
        <div style={s.utilTrack}>
          <div style={{ ...s.utilFill, width: `${(items.length / 20) * 100}%`,
            background: items.length > 16 ? 'var(--rose)' : items.length > 12 ? 'var(--amber)' : 'var(--emerald)',
          }} />
        </div>
      </div>

      {/* Push zone indicator */}
      <div style={s.pushZone}>
        <div style={s.pushArrow}>↓</div>
        <span style={s.pushLabel}>push / pop</span>
        <div style={s.pushArrow}>↓</div>
      </div>

      <div style={s.stack}>
        {reversed.map((item, vi) => {
          const actualIdx = items.length - 1 - vi;
          const isTop     = actualIdx === items.length - 1;
          return (
            <StackItem
              key={item.id}
              item={item}
              actualIdx={actualIdx}
              isTop={isTop}
              itemState={itemStates[item.id]}
              isNew={newIds.current.has(item.id)}
              isPop={itemStates[item.id] === 'pop'}
            />
          );
        })}

        {/* Closed bottom */}
        <div style={s.base}>
          <div style={s.baseLine} />
          <span style={s.baseLabel}>⊥ bottom</span>
        </div>
      </div>
    </div>
  );
});

const s = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto', padding: '14px 20px 20px', gap: '8px' },
  utilizationWrap: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '300px' },
  utilLabel: { fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 },
  utilTrack: { flex: 1, height: '3px', background: 'var(--bg-overlay)', borderRadius: '2px', overflow: 'hidden' },
  utilFill:  { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease, background 0.3s ease' },
  pushZone: { display: 'flex', alignItems: 'center', gap: '8px' },
  pushArrow: { fontSize: '0.7rem', color: 'var(--emerald)', animation: 'float 1.4s ease-in-out infinite', display: 'inline-block' },
  pushLabel: { fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.04em' },
  stack: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '3px', width: '100%', maxWidth: '300px' },
  item: { display: 'flex', alignItems: 'center', padding: '9px 14px', borderRadius: '7px', border: '1px solid', gap: '10px', cursor: 'default', position: 'relative' },
  idx: { fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', width: '28px', flexShrink: 0 },
  value: { fontWeight: 700, fontFamily: 'var(--font-mono)', flex: 1 },
  topBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--emerald)', fontWeight: 700, opacity: 0.8 },
  topArrow: { animation: 'float 1s ease-in-out infinite', display: 'inline-block' },
  stateTag: { fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '3px', border: '1px solid', flexShrink: 0 },
  base: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', marginTop: '2px' },
  baseLine: { width: '100%', height: '2.5px', borderRadius: '1px', background: 'var(--border-hover)' },
  baseLabel: { fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.06em' },
};

export default StackVisualizer;