import React, { memo } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const stateMap = {
  enqueue: { bg: 'rgba(16,185,129,0.2)', border: '#10b981', glow: '0 0 16px rgba(16,185,129,0.4)' },
  dequeue: { bg: 'rgba(244,63,94,0.2)', border: '#f43f5e', glow: '0 0 16px rgba(244,63,94,0.4)' },
  peek: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', glow: '0 0 14px rgba(245,158,11,0.35)' },
  compare: { bg: 'rgba(99,102,241,0.18)', border: '#818cf8', glow: '0 0 12px rgba(99,102,241,0.3)' },
  found: { bg: 'rgba(16,185,129,0.25)', border: '#10b981', glow: '0 0 18px rgba(16,185,129,0.5)' },
};

const defaultStyle = { bg: 'var(--node-bg)', border: 'var(--node-border)', glow: 'none' };

const QueueVisualizer = memo(function QueueVisualizer() {
  const { queue } = useAppContext();
  const { items, itemStates } = queue;

  if (items.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">🚶‍♂️</div>
        <div className="empty-state-title">Empty Queue</div>
        <div className="empty-state-hint">
          Enqueue values into the queue. The first item added is the first to be removed (FIFO)!
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Direction indicator */}
      <div style={styles.directionBar}>
        <div style={styles.dirLabel}>
          <span style={{ color: 'var(--accent-rose)' }}>← DEQUEUE</span>
        </div>
        <div style={styles.dirLabel}>
          <span style={{ color: 'var(--accent-emerald)' }}>ENQUEUE →</span>
        </div>
      </div>

      <div style={styles.queueRow}>
        {/* Front indicator */}
        <div style={styles.endMarker}>
          <span style={styles.endArrow}>◄</span>
          <span style={styles.endText}>FRONT</span>
        </div>

        {/* Items */}
        <div style={styles.itemsRow}>
          {items.map((item, i) => {
            const isFront = i === 0;
            const isRear = i === items.length - 1;
            const s = stateMap[itemStates[item.id]] || defaultStyle;
            const isActive = !!itemStates[item.id];

            return (
              <div
                key={item.id}
                className="anim-fade-scale"
                style={{
                  ...styles.item,
                  background: s.bg,
                  borderColor: s.border,
                  boxShadow: isActive ? s.glow : 'var(--shadow-xs)',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                }}
              >
                {/* Position labels */}
                {isFront && (
                  <div style={styles.posLabel}>
                    <span className="badge badge-rose" style={{ fontSize: '0.55rem' }}>FRONT</span>
                  </div>
                )}
                {isRear && (
                  <div style={styles.posLabel}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.55rem' }}>REAR</span>
                  </div>
                )}

                <span style={styles.idx}>{i}</span>
                <span style={{
                  ...styles.value,
                  color: isActive ? s.border : 'var(--text-primary)',
                }}>
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rear indicator */}
        <div style={styles.endMarker}>
          <span style={styles.endText}>REAR</span>
          <span style={styles.endArrow}>►</span>
        </div>
      </div>
    </div>
  );
});

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto',
    padding: '20px',
    gap: '16px',
  },
  directionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '600px',
    padding: '0 10px',
  },
  dirLabel: {
    fontSize: '0.65rem',
    fontWeight: 800,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  endMarker: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  endArrow: {
    fontSize: '1rem',
    color: 'var(--accent-1)',
    opacity: 0.5,
  },
  endText: {
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'var(--text-dim)',
    letterSpacing: '1px',
  },
  itemsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  item: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '14px 18px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid',
    transition: 'all 0.3s ease',
    minWidth: '60px',
    paddingTop: '20px',
  },
  posLabel: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  idx: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  value: {
    fontSize: '1.1rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.3s ease',
  },
};

export default QueueVisualizer;