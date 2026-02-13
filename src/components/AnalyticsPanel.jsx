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
            <MetricCard icon="📏" label="Height" value={metrics.height} color="var(--accent-1)" />
            <MetricCard icon="🔢" label="Total Nodes" value={metrics.nodeCount} color="var(--accent-2)" />
            <MetricCard icon="⚖️" label="Balanced" value={metrics.isBalanced} color={metrics.isBalanced ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
            <MetricCard icon="📐" label="Balance Factor" value={metrics.balanceFactor} color="var(--accent-cyan)" />
            {metrics.min !== null && <MetricCard icon="⬇️" label="Min Value" value={metrics.min} color="var(--accent-teal)" />}
            {metrics.max !== null && <MetricCard icon="⬆️" label="Max Value" value={metrics.max} color="var(--accent-orange)" />}
          </>
        );
      case 'linkedlist':
        return (
          <>
            <MetricCard icon="📏" label="Length" value={metrics.length} color="var(--accent-1)" />
            <MetricCard icon="🔼" label="Head" value={metrics.head ?? 'null'} color="var(--accent-emerald)" />
            <MetricCard icon="🔽" label="Tail" value={metrics.tail ?? 'null'} color="var(--accent-2)" />
          </>
        );
      case 'graph':
        return (
          <>
            <MetricCard icon="⬡" label="Nodes" value={metrics.nodeCount} color="var(--accent-1)" />
            <MetricCard icon="🔗" label="Edges" value={metrics.edgeCount} color="var(--accent-2)" />
            <MetricCard icon="📊" label="Density" value={metrics.density} color="var(--accent-cyan)" />
            <MetricCard icon="🏝️" label="Components" value={metrics.components} color="var(--accent-teal)" />
          </>
        );
      case 'stack':
        return (
          <>
            <MetricCard icon="📚" label="Size" value={metrics.size} color="var(--accent-1)" />
            <MetricCard icon="🔝" label="Top" value={metrics.top ?? 'empty'} color="var(--accent-emerald)" />
            <MetricCard icon="📭" label="Is Empty" value={metrics.isEmpty} color={metrics.isEmpty ? 'var(--accent-amber)' : 'var(--accent-teal)'} />
          </>
        );
      case 'queue':
        return (
          <>
            <MetricCard icon="🚶" label="Size" value={metrics.size} color="var(--accent-1)" />
            <MetricCard icon="🏁" label="Front" value={metrics.front ?? 'empty'} color="var(--accent-emerald)" />
            <MetricCard icon="🔚" label="Rear" value={metrics.rear ?? 'empty'} color="var(--accent-2)" />
          </>
        );
      case 'hashset':
        return (
          <>
            <MetricCard icon="🗂️" label="Size" value={metrics.size} color="var(--accent-1)" />
            <MetricCard icon="🪣" label="Buckets" value={metrics.bucketCount} color="var(--accent-2)" />
            <MetricCard icon="📊" label="Load Factor" value={metrics.loadFactor} color="var(--accent-cyan)" />
            <MetricCard icon="📏" label="Max Depth" value={metrics.maxBucketDepth} color="var(--accent-amber)" />
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
              <div key={i} style={styles.historyItem} className={i === 0 ? 'anim-fade' : ''}>
                <span style={{
                  ...styles.historyDot,
                  background: h.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                }} />
                <span style={styles.historyText}>{h.message}</span>
                <span style={styles.historyTime}>
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

const styles = {
  panel: {
    padding: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  titleIcon: {
    fontSize: '1.3rem',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  titleSub: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    fontWeight: 500,
    marginTop: '2px',
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  historyTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  clearBtn: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'none',
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--glass-border)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  historyList: {
    maxHeight: '200px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(99,102,241,0.15) transparent',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0,0,0,0.08)',
    transition: 'background 0.2s ease',
  },
  historyDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  historyText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  historyTime: {
    fontSize: '0.6rem',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
};

export default AnalyticsPanel;