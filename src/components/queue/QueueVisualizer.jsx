import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const QS = {
  enqueue: { bg:'rgba(31,212,160,0.16)',  border:'#1fd4a0', text:'#1fd4a0', glow:'0 0 16px rgba(31,212,160,0.32)'  },
  dequeue: { bg:'rgba(239,96,112,0.16)',  border:'#ef6070', text:'#ef6070', glow:'0 0 16px rgba(239,96,112,0.32)'  },
  peek:    { bg:'rgba(244,166,35,0.14)',  border:'#f4a623', text:'#f4a623', glow:'0 0 12px rgba(244,166,35,0.28)'  },
  compare: { bg:'rgba(108,99,255,0.14)',  border:'#9d8ffa', text:'#b8acfc', glow:'0 0 10px rgba(108,99,255,0.24)'  },
  found:   { bg:'rgba(31,212,160,0.20)',  border:'#1fd4a0', text:'#1fd4a0', glow:'0 0 20px rgba(31,212,160,0.42)'  },
};
const QD = { bg:'var(--bg3)', border:'var(--bd)', text:'var(--text)', glow:'none' };

function QueueItem({ item, idx, isFront, isRear, itemState, isNew }) {
  const ref = useRef(null);
  const st = QS[itemState] || QD;
  const active = !!itemState;

  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate(
      [{ opacity:0, transform:'translateX(32px) scale(0.84)' },
       { opacity:1, transform:'translateX(-3px) scale(1.05)'  },
       { opacity:1, transform:'translateX(0) scale(1)'         }],
      { duration:320, easing:'cubic-bezier(0.22,1,0.36,1)', fill:'forwards' }
    );
  }, [isNew]);

  return (
    <div ref={ref} className="q-item" style={{ background:st.bg, borderColor:st.border, boxShadow:active ? st.glow : 'none', transform:active ? 'translateY(-3px) scale(1.05)' : 'none' }}>
      {(isFront || isRear) && (
        <div className="q-end-badge">
          {isFront && <span className="q-end-txt" style={{ color:'var(--ro)', borderColor:'var(--ro)' }}>FRONT</span>}
          {isRear  && <span className="q-end-txt" style={{ color:'var(--em)', borderColor:'var(--em)' }}>REAR</span>}
        </div>
      )}
      <span className="q-idx">[{idx}]</span>
      <span className="q-val" style={{ color:active ? st.text : 'var(--text)', fontSize:active ? '1.08rem' : '0.92rem' }}>{item.value}</span>
      {active && <span className="q-state-tag" style={{ color:st.text, borderColor:`${st.border}40`, background:`${st.border}15` }}>{itemState}</span>}
    </div>
  );
}

const QueueVisualizer = memo(function QueueVisualizer() {
  const { queue } = useAppContext();
  const { items, itemStates } = queue;
  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());
  const curIds  = new Set(items.map(i => i.id));
  newIds.current = new Set([...curIds].filter(id => !prevIds.current.has(id)));
  prevIds.current = curIds;

  if (!items.length) return (
    <div className="empty-state">
      <div className="empty-icon">▶</div>
      <div className="empty-title">empty queue</div>
      <div className="empty-hint">Enqueue at rear, dequeue from front — first in, first out.</div>
    </div>
  );

  const util = Math.round((items.length / 15) * 100);
  const anyActive = items.some(i => !!itemStates[i.id]);

  return (
    <div className="q-wrap">
      <div className="q-dir">
        <div className="q-dir-end">
          <span className="q-dir-arr" style={{ color:'var(--ro)' }}>◄</span>
          <span className="q-dir-lbl" style={{ color:'var(--ro)' }}>dequeue</span>
        </div>
        <div className="q-dir-line" />
        <div className="q-dir-end">
          <span className="q-dir-lbl" style={{ color:'var(--em)' }}>enqueue</span>
          <span className="q-dir-arr" style={{ color:'var(--em)' }}>►</span>
        </div>
      </div>
      <div className="q-row">
        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            <QueueItem item={item} idx={i} isFront={i===0} isRear={i===items.length-1}
              itemState={itemStates[item.id]} isNew={newIds.current.has(item.id)} />
            {i < items.length - 1 && (
              <svg className="q-arrow" width="22" height="22" viewBox="0 0 22 22" style={{ opacity: anyActive ? 0.65 : 0.18, flexShrink:0 }}>
                <line x1="2" y1="11" x2="16" y2="11" stroke={anyActive ? 'var(--cy)' : 'var(--text3)'} strokeWidth="1.5" strokeLinecap="round" style={{ transition:'stroke 0.2s' }} />
                <polygon points="16,6 22,11 16,16" fill={anyActive ? 'var(--cy)' : 'var(--text3)'} style={{ transition:'fill 0.2s' }} />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="q-size">
        <span className="q-size-lbl">size: {items.length} / 15</span>
        <div className="q-size-track">
          <div className="q-size-fill" style={{ width:`${util}%`, background: items.length>12 ? 'var(--ro)' : 'var(--cy)' }} />
        </div>
      </div>
    </div>
  );
});

export default QueueVisualizer;
