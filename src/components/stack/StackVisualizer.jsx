import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const SS = {
  push:    { bg:'rgba(31,212,160,0.16)',  border:'#1fd4a0', text:'#1fd4a0', glow:'0 0 18px rgba(31,212,160,0.32)'  },
  pop:     { bg:'rgba(239,96,112,0.16)',  border:'#ef6070', text:'#ef6070', glow:'0 0 18px rgba(239,96,112,0.32)'  },
  peek:    { bg:'rgba(244,166,35,0.14)',  border:'#f4a623', text:'#f4a623', glow:'0 0 14px rgba(244,166,35,0.28)'  },
  compare: { bg:'rgba(108,99,255,0.14)',  border:'#9d8ffa', text:'#b8acfc', glow:'0 0 12px rgba(108,99,255,0.24)'  },
  found:   { bg:'rgba(31,212,160,0.20)',  border:'#1fd4a0', text:'#1fd4a0', glow:'0 0 22px rgba(31,212,160,0.42)'  },
};
const SD = { bg:'var(--bg3)', border:'var(--bd)', text:'var(--text)', glow:'none' };

function StackItem({ item, actualIdx, isTop, itemState, isNew }) {
  const ref = useRef(null);
  const st = SS[itemState] || SD;
  const active = !!itemState;

  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate(
      [{ opacity:0, transform:'translateY(-28px) scale(0.85)' },
       { opacity:1, transform:'translateY(3px) scale(1.04)'   },
       { opacity:1, transform:'translateY(0) scale(1)'         }],
      { duration:340, easing:'cubic-bezier(0.22,1,0.36,1)', fill:'forwards' }
    );
  }, [isNew]);

  return (
    <div ref={ref} className="stk-item" style={{ background:st.bg, borderColor:st.border, borderWidth:isTop?'2px':'1px', boxShadow:active ? st.glow : 'none' }}>
      <span className="stk-idx">[{actualIdx}]</span>
      <span className="stk-val" style={{ color:active ? st.text : 'var(--text)', fontSize:active ? '1.08rem' : '0.92rem' }}>{item.value}</span>
      {isTop && <div className="stk-top"><span className="stk-top-arr">◄</span><span>TOP</span></div>}
      {active && <span className="stk-state-tag" style={{ color:st.text, borderColor:`${st.border}40`, background:`${st.border}15` }}>{itemState}</span>}
    </div>
  );
}

const StackVisualizer = memo(function StackVisualizer() {
  const { stack } = useAppContext();
  const { items, itemStates } = stack;
  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());
  const curIds  = new Set(items.map(i => i.id));
  newIds.current = new Set([...curIds].filter(id => !prevIds.current.has(id)));
  prevIds.current = curIds;

  if (!items.length) return (
    <div className="empty-state">
      <div className="empty-icon">▤</div>
      <div className="empty-title">empty stack</div>
      <div className="empty-hint">Push values — each one lands on top. Pop removes from top (LIFO).</div>
    </div>
  );

  const util = Math.round((items.length / 20) * 100);
  return (
    <div className="stk-wrap">
      <div className="stk-util">
        <span className="stk-ulbl">{items.length} / 20</span>
        <div className="stk-utr">
          <div className="stk-ufi" style={{ width:`${util}%`, background: items.length>16 ? 'var(--ro)' : items.length>12 ? 'var(--am)' : 'var(--em)' }} />
        </div>
      </div>
      <div className="push-zone">
        <div className="push-arr">↓</div>
        <span className="push-zone-lbl">push / pop</span>
        <div className="push-arr">↓</div>
      </div>
      <div className="stk-inner">
        {[...items].reverse().map((item, vi) => {
          const ai = items.length - 1 - vi;
          return (
            <StackItem key={item.id} item={item} actualIdx={ai} isTop={ai===items.length-1}
              itemState={itemStates[item.id]} isNew={newIds.current.has(item.id)} />
          );
        })}
        <div className="stk-base">
          <div className="stk-base-line" />
          <span className="stk-base-lbl">⊥ bottom</span>
        </div>
      </div>
    </div>
  );
});

export default StackVisualizer;
