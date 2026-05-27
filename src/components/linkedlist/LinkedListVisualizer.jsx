import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const STATE_STYLE = {
  traverse:    { bg: 'rgba(251,191,36,0.16)',  border: '#fbbf24', text: '#fbbf24', glow: '0 0 16px rgba(251,191,36,0.4)'  },
  compare:     { bg: 'rgba(99,102,241,0.16)',  border: '#818cf8', text: '#a5b4fc', glow: '0 0 14px rgba(99,102,241,0.35)' },
  found:       { bg: 'rgba(52,211,153,0.2)',   border: '#34d399', text: '#34d399', glow: '0 0 20px rgba(52,211,153,0.5)'  },
  insert:      { bg: 'rgba(52,211,153,0.2)',   border: '#34d399', text: '#34d399', glow: '0 0 20px rgba(52,211,153,0.5)'  },
  delete:      { bg: 'rgba(248,113,113,0.18)', border: '#f87171', text: '#f87171', glow: '0 0 18px rgba(248,113,113,0.4)' },
  'not-found': { bg: 'rgba(248,113,113,0.09)', border: '#f87171', text: '#f87171', glow: 'none'                            },
};
const DEFAULT = { bg: 'var(--bg-raised)', border: 'var(--node-border)', text: 'var(--text-primary)', glow: 'none' };

function LLNode({ node, isHead, isTail, state, index, isNew }) {
  const ref = useRef(null);
  const st  = STATE_STYLE[state] || DEFAULT;
  const active = !!state;

  // New node slide-in (from above for prepend, from below for append)
  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate([
      { opacity: 0, transform: 'translateY(-20px) scale(0.8)' },
      { opacity: 1, transform: 'translateY(3px)   scale(1.05)' },
      { opacity: 1, transform: 'translateY(0)     scale(1)'    },
    ], { duration: 380, easing: 'cubic-bezier(0.34,1.4,0.64,1)', fill: 'forwards' });
  }, [isNew]);

  return (
    <div ref={ref} style={{ ...s.wrapper, paddingTop: '22px', paddingBottom: '18px', flexShrink: 0 }}>
      {/* HEAD / TAIL badge */}
      {(isHead || isTail) && (
        <div style={s.badge}>
          {isHead && <span style={{ ...s.badgeText, color: 'var(--emerald)' }}>HEAD</span>}
          {isTail && !isHead && <span style={{ ...s.badgeText, color: 'var(--accent)' }}>TAIL</span>}
        </div>
      )}

      {/* Node box */}
      <div style={{
        ...s.box,
        background:  st.bg,
        borderColor: st.border,
        boxShadow:   active ? st.glow : 'none',
        transform:   active ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
        transition:  'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease',
      }}>
        {/* Data cell */}
        <div style={s.dataCell}>
          <span style={s.cellLabel}>data</span>
          <span style={{ ...s.cellValue, color: active ? st.text : 'var(--text-primary)',
            fontSize: active ? '1.1rem' : '0.95rem',
            transition: 'color 0.25s ease, font-size 0.18s ease',
          }}>
            {node.value}
          </span>
        </div>
        {/* Divider */}
        <div style={{ width: '1px', alignSelf: 'stretch', background: `${st.border}35`, transition: 'background 0.25s ease' }} />
        {/* next cell */}
        <div style={s.nextCell}>
          <span style={s.cellLabel}>next</span>
          <span style={{ ...s.nextVal, color: active ? st.text : 'var(--text-muted)' }}>
            {isTail ? '∅' : '→'}
          </span>
        </div>
      </div>

      {/* State label below */}
      {active && (
        <div style={{ ...s.stateLabel, color: st.text }}>
          {state}
        </div>
      )}

      {/* Index */}
      <span style={s.index}>[{index}]</span>
    </div>
  );
}

// Animated arrow connector
function LLArrow({ active, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, margin: '0 2px', paddingTop: '22px' }}>
      <svg width="36" height="20" viewBox="0 0 36 20">
        <line x1="0" y1="10" x2="28" y2="10"
          stroke={active ? color : 'var(--edge-default)'}
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
          strokeDasharray={active ? '5 3' : 'none'}
          style={{ transition: 'stroke 0.25s ease, stroke-width 0.2s ease',
            animation: active ? 'edgeTravel 0.6s linear infinite' : 'none',
          }}
        />
        <polygon points="28,5 36,10 28,15"
          fill={active ? color : 'var(--edge-default)'}
          opacity={active ? 0.9 : 0.35}
          style={{ transition: 'fill 0.25s ease' }}
        />
      </svg>
    </div>
  );
}

const LinkedListVisualizer = memo(function LinkedListVisualizer() {
  const { linkedList } = useAppContext();
  const { nodes, nodeStates } = linkedList;

  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());
  const curIds  = new Set(nodes.map(n => n.id));
  newIds.current = new Set([...curIds].filter(id => !prevIds.current.has(id)));
  prevIds.current = curIds;

  if (!nodes.length) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">○</div>
        <div className="empty-state-title">empty list</div>
        <div className="empty-state-hint">Append or prepend — watch each pointer link form in real time</div>
      </div>
    );
  }

  return (
    <div style={s.outer}>
      <div style={s.list}>
        {nodes.map((node, i) => {
          const state   = nodeStates[node.id];
          const stStyle = STATE_STYLE[state] || DEFAULT;
          const isLast  = i === nodes.length - 1;
          return (
            <React.Fragment key={node.id}>
              <LLNode
                node={node}
                isHead={i === 0}
                isTail={isLast}
                state={state}
                index={i}
                isNew={newIds.current.has(node.id)}
              />
              {!isLast && (
                <LLArrow
                  active={!!state}
                  color={stStyle.border}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* NULL sentinel */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px', flexShrink: 0 }}>
          <svg width="28" height="20" viewBox="0 0 28 20" style={{ flexShrink: 0, opacity: 0.3 }}>
            <line x1="0" y1="10" x2="20" y2="10" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="20,5 28,10 20,15" fill="var(--rose)" />
          </svg>
          <div style={s.nullBox}>
            <span style={s.null}>NULL</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const s = {
  outer: { height: '100%', display: 'flex', alignItems: 'center', overflow: 'auto', padding: '32px 18px 26px' },
  list:  { display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: '44px' },
  wrapper: { display: 'flex', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)' },
  badgeText: { fontSize: '0.55rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  box: { display: 'flex', alignItems: 'stretch', border: '1.5px solid', borderRadius: '6px', overflow: 'hidden', minWidth: '84px' },
  dataCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 14px', gap: '1px', flex: 1 },
  nextCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', gap: '1px', minWidth: '34px' },
  cellLabel: { fontSize: '0.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cellValue: { fontWeight: 700, fontFamily: 'var(--font-mono)' },
  nextVal:   { fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', transition: 'color 0.25s ease' },
  stateLabel:{ position: 'absolute', bottom: '0px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.52rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease both' },
  index: { position: 'absolute', bottom: '-2px', right: '2px', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' },
  nullBox: { padding: '6px 12px', border: '1.5px dashed rgba(248,113,113,0.25)', borderRadius: '5px' },
  null:    { fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--rose)', opacity: 0.5, letterSpacing: '0.06em' },
};

export default LinkedListVisualizer;