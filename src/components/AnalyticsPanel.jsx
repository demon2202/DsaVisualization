import React, { memo, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppState';
import MetricCard from './MetricCard';

// Each getMetrics() is already memoized on treeVersion inside the hook.
// Here we just need to call it — no additional memoization needed.

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
  // Only recompute when the active DS changes or its version bumps.
  // Each hook's getMetrics is already stable between structural ops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, bst.treeVersion, linkedList.nodes, graph.getMetrics,
      stack.items, queue.items, hashSet.buckets]);

  const cards = useMemo(() => {
    switch (active) {
      case 'bst': return [
        { icon: '⬡', label: 'Height',         value: metrics.height,        color: 'var(--accent)' },
        { icon: '#', label: 'Nodes',           value: metrics.nodeCount,     color: 'var(--accent-2)' },
        { icon: '⚖', label: 'Balanced',        value: metrics.isBalanced,    color: metrics.isBalanced ? 'var(--emerald)' : 'var(--amber)' },
        { icon: '↕', label: 'Balance factor',  value: metrics.balanceFactor, color: 'var(--cyan)' },
        ...(metrics.min !== null ? [{ icon: '↓', label: 'Min', value: metrics.min, color: 'var(--emerald)' }] : []),
        ...(metrics.max !== null ? [{ icon: '↑', label: 'Max', value: metrics.max, color: 'var(--amber)' }] : []),
      ];
      case 'linkedlist': return [
        { icon: '#', label: 'Length', value: metrics.length,       color: 'var(--accent)' },
        { icon: '←', label: 'Head',   value: metrics.head ?? '—',  color: 'var(--emerald)' },
        { icon: '→', label: 'Tail',   value: metrics.tail ?? '—',  color: 'var(--accent-2)' },
      ];
      case 'graph': return [
        { icon: '⬡', label: 'Nodes',      value: metrics.nodeCount,  color: 'var(--accent)' },
        { icon: '—', label: 'Edges',      value: metrics.edgeCount,  color: 'var(--accent-2)' },
        { icon: '~', label: 'Density',    value: metrics.density,    color: 'var(--cyan)' },
        { icon: '◎', label: 'Components', value: metrics.components, color: 'var(--emerald)' },
        { icon: '∑', label: 'Avg degree', value: metrics.avgDegree,  color: 'var(--amber)' },
      ];
      case 'stack': return [
        { icon: '#', label: 'Size',        value: `${metrics.size}/${metrics.capacity}`, color: 'var(--accent)' },
        { icon: '↑', label: 'Top',         value: metrics.top ?? '—',                    color: 'var(--emerald)' },
        { icon: '%', label: 'Utilization', value: `${metrics.utilization}%`,             color: metrics.utilization > 80 ? 'var(--rose)' : 'var(--cyan)' },
      ];
      case 'queue': return [
        { icon: '#', label: 'Size',        value: `${metrics.size}/${metrics.capacity}`, color: 'var(--accent)' },
        { icon: '←', label: 'Front',       value: metrics.front ?? '—',                  color: 'var(--rose)' },
        { icon: '→', label: 'Rear',        value: metrics.rear ?? '—',                   color: 'var(--emerald)' },
        { icon: '%', label: 'Utilization', value: `${metrics.utilization}%`,             color: metrics.utilization > 80 ? 'var(--rose)' : 'var(--cyan)' },
      ];
      case 'hashset': return [
        { icon: '#',  label: 'Size',        value: metrics.size,                                      color: 'var(--accent)' },
        { icon: '⬡',  label: 'Buckets',     value: `${metrics.usedBuckets}/${metrics.bucketCount}`,  color: 'var(--accent-2)' },
        { icon: '~',  label: 'Load factor', value: metrics.loadFactor,                               color: metrics.loadFactor > 1 ? 'var(--rose)' : 'var(--cyan)' },
        { icon: '!',  label: 'Collisions',  value: metrics.collisions,                               color: metrics.collisions > 0 ? 'var(--amber)' : 'var(--emerald)' },
      ];
      default: return [];
    }
  }, [active, metrics]);

  const history = app.state.operationHistory;

  return (
    <div className="glass-panel anim-slide-right" style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>analytics</span>
        <span style={s.sub}>live metrics</span>
      </div>

      <div style={s.grid}>
        {cards.map((c, i) => (
          <MetricCard key={i} icon={c.icon} label={c.label} value={c.value} color={c.color} />
        ))}
      </div>

      {history.length > 0 && (
        <>
          <div className="divider" style={{ margin: '10px 0 8px' }} />
          <div style={s.histHeader}>
            <span style={s.histTitle}>log</span>
            <button onClick={app.clearHistory} style={s.clearBtn}>clear</button>
          </div>
          <div style={s.histList}>
            {history.map((h, i) => (
              <div key={`${h.timestamp}_${i}`} style={s.histItem}>
                <span style={{ ...s.dot, background: h.success ? 'var(--emerald)' : 'var(--rose)' }} />
                <span style={s.histText}>{h.message}</span>
                <span style={s.histTime}>
                  {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

const s = {
  panel: { padding: '14px' },
  header: { display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '12px' },
  title: { fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  sub: { fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 500 },
  grid: { display: 'flex', flexDirection: 'column', gap: '6px' },

  histHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  histTitle: { fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  clearBtn: {
    fontSize: '0.62rem', fontWeight: 600, fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)', background: 'none', padding: '2px 8px',
    borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
  },
  histList: { maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' },
  histItem: { display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 8px', borderRadius: '4px', background: 'var(--bg-raised)' },
  dot: { width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0 },
  histText: { fontSize: '0.68rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' },
  histTime: { fontSize: '0.58rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 },
};

export default AnalyticsPanel;