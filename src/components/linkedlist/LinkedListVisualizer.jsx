import React, { memo, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const SS = {
  traverse:    { bg:'rgba(244,166,35,0.14)',  border:'#f4a623', text:'#f4a623', glow:'0 0 14px rgba(244,166,35,0.3)'   },
  compare:     { bg:'rgba(108,99,255,0.14)',  border:'#9d8ffa', text:'#b8acfc', glow:'0 0 12px rgba(108,99,255,0.28)'  },
  found:       { bg:'rgba(31,212,160,0.18)',  border:'#1fd4a0', text:'#1fd4a0', glow:'0 0 18px rgba(31,212,160,0.4)'  },
  insert:      { bg:'rgba(31,212,160,0.18)',  border:'#1fd4a0', text:'#1fd4a0', glow:'0 0 18px rgba(31,212,160,0.4)'  },
  delete:      { bg:'rgba(239,96,112,0.16)',  border:'#ef6070', text:'#ef6070', glow:'0 0 16px rgba(239,96,112,0.32)' },
  'not-found': { bg:'rgba(239,96,112,0.07)',  border:'#ef6070', text:'#ef6070', glow:'none'                            },
};
const DF = { bg:'var(--bg3)', border:'var(--node-border)', text:'var(--text)', glow:'none' };

function LLNode({ node, isHead, isTail, state, index, isNew }) {
  const ref = useRef(null);
  const st = SS[state] || DF;
  const active = !!state;

  useLayoutEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate(
      [{ opacity:0, transform:'translateY(-16px) scale(0.85)' },
       { opacity:1, transform:'translateY(2px) scale(1.04)'   },
       { opacity:1, transform:'translateY(0) scale(1)'         }],
      { duration:340, easing:'cubic-bezier(0.34,1.4,0.64,1)', fill:'forwards' }
    );
  }, [isNew]);

  return (
    <div ref={ref} className="ll-nw">
      {isHead && <div className="ll-badge"><span className="ll-bt" style={{ color:'var(--em)' }}>HEAD</span></div>}
      {isTail && !isHead && <div className="ll-badge"><span className="ll-bt" style={{ color:'var(--a)' }}>TAIL</span></div>}
      <div className="ll-box" style={{ background:st.bg, borderColor:st.border, boxShadow:active ? st.glow : 'none', transform:active ? 'scale(1.06) translateY(-2px)' : 'scale(1)' }}>
        <div className="ll-dc">
          <span className="ll-cl">data</span>
          <span className="ll-cv" style={{ color:active ? st.text : 'var(--text)', fontSize:active ? '1.08rem' : '0.92rem' }}>{node.value}</span>
        </div>
        <div className="ll-div" style={{ background:`${st.border}35` }} />
        <div className="ll-nc">
          <span className="ll-cl">next</span>
          <span className="ll-cn" style={{ color:active ? st.text : 'var(--text3)' }}>{isTail ? '∅' : '→'}</span>
        </div>
      </div>
      {active && <div className="ll-sl" style={{ color:st.text }}>{state}</div>}
      <span className="ll-idx">[{index}]</span>
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

  if (!nodes.length) return (
    <div className="empty-state">
      <div className="empty-icon">○</div>
      <div className="empty-title">empty list</div>
      <div className="empty-hint">Append or prepend — watch each pointer link form in real time</div>
    </div>
  );

  return (
    <div className="ll-outer">
      <div className="ll-list">
        {nodes.map((node, i) => {
          const state = nodeStates[node.id];
          const st = SS[state] || DF;
          const isLast = i === nodes.length - 1;
          return (
            <React.Fragment key={node.id}>
              <LLNode node={node} isHead={i===0} isTail={isLast} state={state} index={i} isNew={newIds.current.has(node.id)} />
              {!isLast && (
                <div className="ll-aw">
                  <svg width="34" height="20" viewBox="0 0 34 20">
                    <line x1="0" y1="10" x2="26" y2="10"
                      stroke={state ? st.border : 'var(--edge-default)'}
                      strokeWidth={state ? 2 : 1.5} strokeLinecap="round"
                      strokeDasharray={state ? '5 3' : 'none'}
                      style={{ transition:'stroke 0.22s' }}
                    />
                    <polygon points="26,5 34,10 26,15"
                      fill={state ? st.border : 'var(--edge-default)'}
                      opacity={state ? 0.9 : 0.32}
                      style={{ transition:'fill 0.22s' }}
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div style={{ display:'flex', alignItems:'center', paddingTop:'20px', flexShrink:0 }}>
          <svg width="26" height="20" viewBox="0 0 26 20" style={{ flexShrink:0, opacity:0.24 }}>
            <line x1="0" y1="10" x2="18" y2="10" stroke="var(--ro)" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="18,5 26,10 18,15" fill="var(--ro)" />
          </svg>
          <div className="ll-nbox"><span className="ll-null">NULL</span></div>
        </div>
      </div>
    </div>
  );
});

export default LinkedListVisualizer;
