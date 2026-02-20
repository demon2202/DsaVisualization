import React, { memo, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppState';
import MetricCard from './MetricCard';

const AnalyticsPanel = memo(function AnalyticsPanel() {
  const { app, bst, linkedList, graph, stack, queue, hashSet } = useAppContext();
  const active = app.state.activeStructure;

  const metrics = useMemo(() => {
    switch (active) {
      case 'bst': return bst.getMetrics();
      case 'linkedlist': return linkedList.getMetrics();
      case 'graph': return graph.getMetrics();
      case 'stack': return stack.getMetrics();
      case 'queue': return queue.getMetrics();
      case 'hashset': return hashSet.getMetrics();
      default: return {};
    }
  }, [active, bst, linkedList, graph, stack, queue, hashSet]);

  const renderMetrics = () => {
    switch (active) {
      case 'bst':
        return (
          <>
            <MetricCard icon="📏" label="Height" value={metrics.height} color="var(--brand)" />
            <MetricCard icon="🔢" label="Total Nodes" value={metrics.nodeCount} color="var(--brand-muted)" />
            <MetricCard icon="⚖️" label="Balanced" value={metrics.isBalanced} color={metrics.isBalanced ? 'var(--green)' : 'var(--amber)'} />
            <MetricCard icon="📐" label="Balance Factor" value={metrics.balanceFactor} color="var(--cyan)" />
            {metrics.min !== null && <MetricCard icon="⬇️" label="Min Value" value={metrics.min} color="var(--teal)" />}
            {metrics.max !== null && <MetricCard icon="⬆️" label="Max Value" value={metrics.max} color="var(--orange)" />}
          </>
        );
      case 'linkedlist':
        return (
          <>
            <MetricCard icon="📏" label="Length" value={metrics.length} color="var(--brand)" />
            <MetricCard icon="🔼" label="Head" value={metrics.head ?? 'null'} color="var(--green)" />
            <MetricCard icon="🔽" label="Tail" value={metrics.tail ?? 'null'} color="var(--brand-muted)" />
          </>
        );
      case 'graph':
        return (
          <>
            <MetricCard icon="⬡" label="Nodes" value={metrics.nodeCount} color="var(--brand)" />
            <MetricCard icon="🔗" label="Edges" value={metrics.edgeCount} color="var(--brand-muted)" />
            <MetricCard icon="📊" label="Density" value={metrics.density} color="var(--cyan)" />
            <MetricCard icon="🏝️" label="Components" value={metrics.components} color="var(--teal)" />
            <MetricCard icon="📈" label="Avg Degree" value={metrics.avgDegree} color="var(--amber)" />
          </>
        );
      case 'stack':
        return (
          <>
            <MetricCard icon="📚" label="Size" value={`${metrics.size} / ${metrics.capacity}`} color="var(--brand)" />
            <MetricCard icon="🔝" label="Top" value={metrics.top ?? 'empty'} color="var(--green)" />
            <MetricCard icon="📊" label="Utilization" value={`${metrics.utilization}%`} color={metrics.utilization > 80 ? 'var(--red)' : 'var(--cyan)'} />
            <MetricCard icon="📭" label="Status" value={metrics.isEmpty ? 'Empty' : metrics.utilization >= 100 ? 'Full' : 'Active'} color={metrics.isEmpty ? 'var(--amber)' : metrics.utilization >= 100 ? 'var(--red)' : 'var(--green)'} />
          </>
        );
      case 'queue':
        return (
          <>
            <MetricCard icon="🚶" label="Size" value={`${metrics.size} / ${metrics.capacity}`} color="var(--brand)" />
            <MetricCard icon="🏁" label="Front" value={metrics.front ?? 'empty'} color="var(--green)" />
            <MetricCard icon="🔚" label="Rear" value={metrics.rear ?? 'empty'} color="var(--brand-muted)" />
            <MetricCard icon="📊" label="Utilization" value={`${metrics.utilization}%`} color={metrics.utilization > 80 ? 'var(--red)' : 'var(--cyan)'} />
          </>
        );
      case 'hashset':
        return (
          <>
            <MetricCard icon="🗂️" label="Size" value={metrics.size} color="var(--brand)" />
            <MetricCard icon="🪣" label="Used Buckets" value={`${metrics.usedBuckets} / ${metrics.bucketCount}`} color="var(--brand-muted)" />
            <MetricCard icon="📊" label="Load Factor" value={metrics.loadFactor} color={metrics.loadFactor > 1 ? 'var(--red)' : 'var(--cyan)'} />
            <MetricCard icon="📏" label="Max Depth" value={metrics.maxBucketDepth} color="var(--amber)" />
            <MetricCard icon="💥" label="Collisions" value={metrics.collisions} color={metrics.collisions > 0 ? 'var(--orange)' : 'var(--green)'} />
          </>
        );
      default: return null;
    }
  };

  const history = app.state.operationHistory;

  return (
    <div className="glass-panel anim-slide-right" style={styles.panel}>
      <div style={styles.titleRow}>
        <span style={styles.titleIcon}>📊</span>
        <div>
          <h3 style={styles.title}>Analytics</h3>
          <p style={styles.titleSub}>Live metrics & history</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        {renderMetrics()}
      </div>

      {history.length > 0 && (
        <>
          <div className="divider" />
          <div style={styles.historyHeader}>
            <span style={styles.historyTitle}>📝 Recent Operations</span>
            <button onClick={app.clearHistory} style={styles.clearBtn}>Clear</button>
          </div>
          <div style={styles.historyList}>
            {history.map((h, i) => (
              <div key={`${h.timestamp}_${i}`} style={styles.historyItem} className={i === 0 ? 'anim-fade' : ''}>
                <span style={{
                  ...styles.historyDot,
                  background: h.success ? 'var(--green)' : 'var(--red)',
                }} />
                <span style={styles.historyText}>{h.message}</span>
                <span style={styles.historyTime}>
                  {new Date(h.timestamp).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

const styles = {
  panel: { padding: '16px' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  titleIcon: { fontSize: '1.3rem' },
  title: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--t-1)', lineHeight: 1.2 },
  titleSub: { fontSize: '0.65rem', color: 'var(--t-4)', fontWeight: 500, marginTop: '2px' },
  metricsGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  historyTitle: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--t-2)' },
  clearBtn: {
    fontSize: '0.68rem', fontWeight: 600, color: 'var(--t-4)',
    background: 'none', padding: '3px 10px', borderRadius: 'var(--r-sm)',
    border: '1px solid var(--b-1)', cursor: 'pointer', transition: 'all 0.2s ease',
  },
  historyList: {
    maxHeight: '200px', overflowY: 'auto', display: 'flex',
    flexDirection: 'column', gap: '3px',
    scrollbarWidth: 'thin', scrollbarColor: 'var(--b-1) transparent',
  },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 8px', borderRadius: 'var(--r-sm)',
    background: 'var(--bg-3)', transition: 'background 0.2s ease',
  },
  historyDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  historyText: {
    fontSize: '0.7rem', color: 'var(--t-3)', flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500,
  },
  historyTime: { fontSize: '0.6rem', color: 'var(--t-4)', fontFamily: 'var(--mono)', flexShrink: 0 },
};

export default AnalyticsPanel;