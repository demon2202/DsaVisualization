import React, { memo, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppState';

const AnalyticsPanel = memo(function AnalyticsPanel() {
  const { app, bst, linkedList, graph, stack, queue, hashSet } = useAppContext();
  const active = app.state.activeStructure;

  const metrics = useMemo(() => {
    switch (active) {
      case 'bst':        return bst.getMetrics();
      case 'linkedlist': return linkedList.getMetrics();
      case 'graph':      return graph.getMetrics();
      case 'stack':      return stack.getMetrics();
      case 'queue':      return queue.getMetrics();
      case 'hashset':    return hashSet.getMetrics();
      default:           return {};
    }
  }, [active, bst.treeVersion, linkedList.nodes, graph.getMetrics,
      stack.items, queue.items, hashSet.buckets]);

  const cards = useMemo(() => {
    switch (active) {
      case 'bst': return [
        { icon:'⬡', label:'Height',      value: metrics.height,        color:'var(--a)' },
        { icon:'#', label:'Nodes',        value: metrics.nodeCount,     color:'var(--vi)' },
        { icon:'⚖', label:'Balanced',     value: metrics.isBalanced,    color: metrics.isBalanced ? 'var(--em)' : 'var(--am)' },
        { icon:'↕', label:'Balance Δ',    value: metrics.balanceFactor, color:'var(--cy)' },
        ...(metrics.min !== null ? [{ icon:'↓', label:'Min', value: metrics.min, color:'var(--em)' }] : []),
        ...(metrics.max !== null ? [{ icon:'↑', label:'Max', value: metrics.max, color:'var(--am)' }] : []),
      ];
      case 'linkedlist': return [
        { icon:'#', label:'Length', value: metrics.length,      color:'var(--a)' },
        { icon:'←', label:'Head',   value: metrics.head ?? '—', color:'var(--em)' },
        { icon:'→', label:'Tail',   value: metrics.tail ?? '—', color:'var(--vi)' },
      ];
      case 'graph': return [
        { icon:'⬡', label:'Nodes',      value: metrics.nodeCount,  color:'var(--a)' },
        { icon:'—', label:'Edges',      value: metrics.edgeCount,  color:'var(--vi)' },
        { icon:'~', label:'Density',    value: metrics.density,    color:'var(--cy)' },
        { icon:'◎', label:'Components', value: metrics.components, color:'var(--em)' },
        { icon:'∑', label:'Avg Degree', value: metrics.avgDegree,  color:'var(--am)' },
      ];
      case 'stack': return [
        { icon:'#', label:'Size',        value:`${metrics.size}/${metrics.capacity}`, color:'var(--a)' },
        { icon:'↑', label:'Top',         value: metrics.top ?? '—',                   color:'var(--em)' },
        { icon:'%', label:'Utilization', value:`${metrics.utilization}%`,             color: metrics.utilization > 80 ? 'var(--ro)' : 'var(--cy)' },
      ];
      case 'queue': return [
        { icon:'#', label:'Size',        value:`${metrics.size}/${metrics.capacity}`, color:'var(--a)' },
        { icon:'←', label:'Front',       value: metrics.front ?? '—',                 color:'var(--ro)' },
        { icon:'→', label:'Rear',        value: metrics.rear  ?? '—',                 color:'var(--em)' },
        { icon:'%', label:'Util',        value:`${metrics.utilization}%`,             color: metrics.utilization > 80 ? 'var(--ro)' : 'var(--cy)' },
      ];
      case 'hashset': return [
        { icon:'#', label:'Size',        value: metrics.size,                                     color:'var(--a)' },
        { icon:'⬡', label:'Buckets',     value:`${metrics.usedBuckets}/${metrics.bucketCount}`,  color:'var(--vi)' },
        { icon:'~', label:'Load Factor', value: metrics.loadFactor,                              color: metrics.loadFactor > 1 ? 'var(--ro)' : 'var(--cy)' },
        { icon:'!', label:'Collisions',  value: metrics.collisions,                              color: metrics.collisions > 0 ? 'var(--am)' : 'var(--em)' },
      ];
      default: return [];
    }
  }, [active, metrics]);

  const history = app.state.operationHistory;

  return (
    <>
      <div className="r-hd">
        <div className="r-title">
          <span className="r-t">analytics</span>
          <span className="r-s">live metrics</span>
        </div>
      </div>

      <div className="metrics">
        {cards.map((c, i) => {
          const display = typeof c.value === 'boolean'
            ? (c.value ? '✓ yes' : '✗ no')
            : String(c.value ?? '—');
          return (
            <div key={i} className="mc">
              <div className="mc-bar" style={{ background: c.color }} />
              <div className="mc-ic" style={{ background: `${c.color}1a` }}>
                <span className="mc-ic-ch">{c.icon}</span>
              </div>
              <div className="mc-b">
                <div className="mc-v" style={{ color: c.color }}>{display}</div>
                <span className="mc-l">{c.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="log-sec">
        <div className="log-hd">
          <span className="log-tit">operation log</span>
          <button className="log-clr" onClick={app.clearHistory}>clear</button>
        </div>
        <div className="log-list">
          {history.map((h, i) => {
            const t = new Date(h.timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
            return (
              <div key={`${h.timestamp}_${i}`} className="log-it">
                <span className="log-dot" style={{ background: h.success ? 'var(--em)' : 'var(--ro)' }} />
                <span className="log-tx">{h.message}</span>
                <span className="log-ti">{t}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});

export default AnalyticsPanel;
