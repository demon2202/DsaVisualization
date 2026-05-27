import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const STATE_STYLE = {
  enqueue: { bg: 'rgba(52,211,153,0.18)',  border: '#34d399', text: '#34d399', glow: '0 0 18px rgba(52,211,153,0.4)'  },
  dequeue: { bg: 'rgba(248,113,113,0.18)', border: '#f87171', text: '#f87171', glow: '0 0 18px rgba(248,113,113,0.4)' },
  peek:    { bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24', text: '#fbbf24', glow: '0 0 14px rgba(251,191,36,0.35)' },
  compare: { bg: 'rgba(99,102,241,0.15)',  border: '#818cf8', text: '#a5b4fc', glow: '0 0 12px rgba(99,102,241,0.3)'  },
  found:   { bg: 'rgba(52,211,153,0.22)',  border: '#34d399', text: '#34d399', glow: '0 0 22px rgba(52,211,153,0.5)'  },
};
const DEFAULT = { bg: 'var(--bg-raised)', border: 'var(--border)', text: 'var(--text-primary)', glow: 'none' };

function QueueItem({ item, idx, isFront, isRear, itemState, isNew, isDequeue }) {
  const ref = useRef(null);
  const st  = STATE_STYLE[itemState] || DEFAULT;
  const active = !!itemState;

  // Enqueue: slide in from right
  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate([
      { opacity: 0, transform: 'translateX(36px) scale(0.82)' },
      { opacity: 1, transform: 'translateX(-4px) scale(1.06)' },
      { opacity: 1, transform: 'translateX(0)    scale(1)'    },
    ], { duration: 340, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
  }, [isNew]);

  // Dequeue: slide left and fade
  useLayoutEffect(() => {
    if (!isDequeue || !ref.current) return;
    ref.current.animate([
      { opacity: 1, transform: 'translateX(0)    scale(1)'    },
      { opacity: 0, transform: 'translateX(-32px) scale(0.8)' },
    ], { duration: 260, delay: 80, easing: 'ease-in', fill: 'forwards' });
  }, [isDequeue]);

  return (
    <div ref={ref} style={{
      ...s.item,
      background:  st.bg,
      borderColor: st.border,
      boxShadow:   active ? st.glow : 'none',
      transform:   active && !isNew ? 'translateY(-3px) scale(1.05)' : 'none',
      transition:  'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease',
    }}>
      {/* FRONT / REAR label */}
      {(isFront || isRear) && (
        <div style={s.endBadge}>
          {isFront && <span style={{ ...s.endText, color: 'var(--rose)' }}>FRONT</span>}
          {isRear  && <span style={{ ...s.endText, color: 'var(--emerald)' }}>REAR</span>}
        </div>
      )}

      <span style={s.qIdx}>[{idx}]</span>
      <span style={{ ...s.value, color: active ? st.text : 'var(--text-primary)',
        fontSize: active ? '1.12rem' : '1rem',
        transition: 'color 0.22s ease, font-size 0.18s ease',
      }}>
        {item.value}
      </span>

      {active && (
        <span style={{ ...s.stateTag, color: st.text, borderColor: `${st.border}40`, background: `${st.border}15` }}>
          {itemState}
        </span>
      )}
    </div>
  );
}

// Connector arrow between items
function Arrow({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: active ? 0.7 : 0.25 }}>
      <line x1="2" y1="12" x2="18" y2="12"
        stroke={active ? 'var(--cyan)' : 'var(--edge-default)'}
        strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: 'stroke 0.2s' }}
      />
      <polygon points="18,7 24,12 18,17"
        fill={active ? 'var(--cyan)' : 'var(--edge-default)'}
        style={{ transition: 'fill 0.2s' }}
      />
    </svg>
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

  if (!items.length) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">▶</div>
        <div className="empty-state-title">empty queue</div>
        <div className="empty-state-hint">Enqueue at rear, dequeue from front — first in, first out.</div>
      </div>
    );
  }

  const anyActive = items.some(i => !!itemStates[i.id]);

  return (
    <div style={s.container}>
      {/* Direction indicators */}
      <div style={s.dirRow}>
        <div style={s.dirEnd}>
          <span style={{ ...s.dirIcon, color: 'var(--rose)' }}>◄</span>
          <span style={{ ...s.dirLabel, color: 'var(--rose)' }}>dequeue</span>
        </div>
        <div style={s.dirLine} />
        <div style={s.dirEnd}>
          <span style={{ ...s.dirLabel, color: 'var(--emerald)' }}>enqueue</span>
          <span style={{ ...s.dirIcon, color: 'var(--emerald)' }}>►</span>
        </div>
      </div>

      {/* Queue items + arrows */}
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
              isDequeue={itemStates[item.id] === 'dequeue'}
            />
            {i < items.length - 1 && <Arrow active={anyActive} />}
          </React.Fragment>
        ))}
      </div>

      {/* Size indicator */}
      <div style={s.sizeRow}>
        <span style={s.sizeLabel}>size: {items.length} / 15</span>
        <div style={s.sizeTrack}>
          <div style={{
            ...s.sizeFill,
            width: `${(items.length / 15) * 100}%`,
            background: items.length > 12 ? 'var(--rose)' : 'var(--cyan)',
          }} />
        </div>
      </div>
    </div>
  );
});

const s = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '20px', gap: '16px' },
  dirRow: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '640px' },
  dirEnd:  { display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 },
  dirIcon: { fontSize: '0.75rem', animation: 'float 1.5s ease-in-out infinite', display: 'inline-block' },
  dirLabel:{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em', opacity: 0.7 },
  dirLine: { flex: 1, height: '1px', background: 'var(--border)' },
  queueRow:{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', justifyContent: 'center', rowGap: '12px' },
  item: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '12px 16px', paddingTop: '22px', borderRadius: '7px', border: '1px solid', minWidth: '60px', cursor: 'default' },
  endBadge:{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px' },
  endText: { fontSize: '0.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-surface)', border: '1px solid currentColor' },
  qIdx:    { fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' },
  value:   { fontWeight: 700, fontFamily: 'var(--font-mono)' },
  stateTag:{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '3px', border: '1px solid', flexShrink: 0, marginTop: '2px' },
  sizeRow: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '640px' },
  sizeLabel:{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 },
  sizeTrack:{ flex: 1, height: '2px', background: 'var(--bg-overlay)', borderRadius: '2px', overflow: 'hidden' },
  sizeFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease, background 0.3s ease' },
};

export default QueueVisualizer;