import React, { memo } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const stateMap = {
  hash: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b' },
  insert: { bg: 'rgba(16,185,129,0.2)', border: '#10b981' },
  delete: { bg: 'rgba(244,63,94,0.2)', border: '#f43f5e' },
  compare: { bg: 'rgba(99,102,241,0.18)', border: '#818cf8' },
  found: { bg: 'rgba(16,185,129,0.25)', border: '#10b981' },
  duplicate: { bg: 'rgba(244,63,94,0.15)', border: '#f43f5e' },
  'not-found': { bg: 'rgba(244,63,94,0.1)', border: '#f43f5e' },
};

const bucketColors = [
  'var(--accent-1)', 'var(--accent-2)', 'var(--accent-cyan)', 'var(--accent-teal)',
  'var(--accent-emerald)', 'var(--accent-amber)', 'var(--accent-orange)', 'var(--accent-rose)',
];

const HashSetVisualizer = memo(function HashSetVisualizer() {
  const { hashSet } = useAppContext();
  const { buckets, itemStates } = hashSet;

  const isEmpty = buckets.every(b => b.length === 0);

  if (isEmpty) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">🗂️</div>
        <div className="empty-state-title">Empty Hash Set</div>
        <div className="empty-state-hint">
          Add values to see how they get distributed across buckets using a hash function!
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {buckets.map((bucket, idx) => {
          const bucketHighlighted = itemStates[`bucket_${idx}`];
          const color = bucketColors[idx % bucketColors.length];

          return (
            <div
              key={idx}
              style={{
                ...styles.bucket,
                borderColor: bucketHighlighted ? color : 'var(--glass-border)',
                boxShadow: bucketHighlighted ? `0 0 16px ${color}33` : 'var(--shadow-xs)',
              }}
              className="glass-card"
            >
              {/* Bucket header */}
              <div style={styles.bucketHeader}>
                <span style={{ ...styles.bucketIdx, color }}>{idx}</span>
                <span style={styles.bucketLabel}>bucket</span>
                <span style={styles.bucketCount}>({bucket.length})</span>
              </div>

              {/* Items */}
              <div style={styles.bucketItems}>
                {bucket.length === 0 ? (
                  <div style={styles.emptyBucket}>
                    <span style={styles.emptyText}>empty</span>
                  </div>
                ) : (
                  bucket.map((item, itemIdx) => {
                    const s = stateMap[itemStates[item.id]] || {};
                    const isActive = !!itemStates[item.id];

                    return (
                      <div
                        key={item.id}
                        className="anim-fade-scale"
                        style={{
                          ...styles.item,
                          background: s.bg || 'rgba(99,102,241,0.08)',
                          borderColor: s.border || color + '40',
                          boxShadow: isActive ? `0 0 12px ${s.border}33` : 'none',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        <span style={{
                          ...styles.itemValue,
                          color: isActive ? s.border : 'var(--text-primary)',
                        }}>
                          {item.value}
                        </span>
                        {itemIdx < bucket.length - 1 && (
                          <span style={styles.chain}>→</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hash function display */}
      <div style={styles.hashInfo} className="glass-card">
        <span style={styles.hashLabel}>Hash Function</span>
        <code style={styles.hashCode}>h(key) = |hash(key)| mod {buckets.length}</code>
      </div>
    </div>
  );
});

const styles = {
  container: {
    height: '100%',
    overflow: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  bucket: {
    padding: '10px 12px',
    transition: 'all 0.3s ease',
    border: '1px solid',
  },
  bucketHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--glass-border)',
  },
  bucketIdx: {
    fontSize: '1rem',
    fontWeight: 900,
    fontFamily: 'var(--font-mono)',
  },
  bucketLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  bucketCount: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    marginLeft: 'auto',
  },
  bucketItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
    minHeight: '32px',
  },
  emptyBucket: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0,0,0,0.06)',
  },
  emptyText: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    fontStyle: 'italic',
    fontWeight: 500,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    transition: 'all 0.3s ease',
  },
  itemValue: {
    fontSize: '0.85rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.3s ease',
  },
  chain: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    fontWeight: 700,
  },
  hashInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  hashLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  hashCode: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--accent-1)',
    fontFamily: 'var(--font-mono)',
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.2)',
  },
};

export default HashSetVisualizer;