import React, { memo } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const SM = {
  hash:       { bg:'rgba(244,166,35,0.14)',  border:'#f4a623' },
  insert:     { bg:'rgba(31,212,160,0.18)',  border:'#1fd4a0' },
  delete:     { bg:'rgba(239,96,112,0.18)',  border:'#ef6070' },
  compare:    { bg:'rgba(108,99,255,0.16)',  border:'#9d8ffa' },
  found:      { bg:'rgba(31,212,160,0.22)',  border:'#1fd4a0' },
  duplicate:  { bg:'rgba(239,96,112,0.14)',  border:'#ef6070' },
  'not-found':{ bg:'rgba(239,96,112,0.08)',  border:'#ef6070' },
};
const BC = ['#6c63ff','#1fd4a0','#f4a623','#36bcf7','#ef6070','#a78bfa','#34d399','#fb923c'];

const HashSetVisualizer = memo(function HashSetVisualizer() {
  const { hashSet } = useAppContext();
  const { buckets, itemStates } = hashSet;
  const isEmpty = buckets.every(b => b.length === 0);

  if (isEmpty) return (
    <div className="empty-state">
      <div className="empty-icon">⬡</div>
      <div className="empty-title">empty hash set</div>
      <div className="empty-hint">Add values to see them distributed across 8 buckets using a hash function</div>
    </div>
  );

  return (
    <div className="hs-wrap">
      <div className="hs-grid">
        {buckets.map((bucket, idx) => {
          const color = BC[idx % BC.length];
          const bhl = itemStates[`bucket_${idx}`];
          return (
            <div key={idx} className="hs-bucket" style={{ borderColor: bhl ? color : 'var(--bd)', boxShadow: bhl ? `0 0 14px ${color}22` : 'none' }}>
              <div className="hs-bhd">
                <span className="hs-bidx" style={{ color }}>{idx}</span>
                <span className="hs-blbl">bucket</span>
                <span className="hs-bcnt">({bucket.length})</span>
              </div>
              <div className="hs-items">
                {bucket.length === 0
                  ? <div className="hs-empty-bkt"><span className="hs-empty-txt">empty</span></div>
                  : bucket.map((item, ii) => {
                      const s = SM[itemStates[item.id]] || {};
                      const active = !!itemStates[item.id];
                      return (
                        <div key={item.id} className="hs-item" style={{ background: s.bg || `${color}14`, borderColor: s.border || `${color}40`, boxShadow: active ? `0 0 10px ${s.border}33` : 'none', transform: active ? 'scale(1.05)' : 'scale(1)' }}>
                          <span className="hs-ival" style={{ color: active ? s.border : color }}>{item.value}</span>
                          {ii < bucket.length - 1 && <span className="hs-chain">→</span>}
                        </div>
                      );
                    })
                }
              </div>
            </div>
          );
        })}
      </div>
      <div className="hs-footer">
        <span className="hs-footer-lbl">Hash function</span>
        <code className="hs-footer-code">djb2(key) mod 8</code>
      </div>
    </div>
  );
});

export default HashSetVisualizer;
