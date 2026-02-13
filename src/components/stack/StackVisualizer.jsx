import React, { memo } from 'react';
import { useAppContext } from '../../hooks/useAppState';

const stateMap = {
  push: { bg: 'rgba(16,185,129,0.2)', border: '#10b981', glow: '0 0 16px rgba(16,185,129,0.4)' },
  pop: { bg: 'rgba(244,63,94,0.2)', border: '#f43f5e', glow: '0 0 16px rgba(244,63,94,0.4)' },
  peek: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', glow: '0 0 14px rgba(245,158,11,0.35)' },
  compare: { bg: 'rgba(99,102,241,0.18)', border: '#818cf8', glow: '0 0 12px rgba(99,102,241,0.3)' },
  found: { bg: 'rgba(16,185,129,0.25)', border: '#10b981', glow: '0 0 18px rgba(16,185,129,0.5)' },
};

const defaultStyle = { bg: 'var(--node-bg)', border: 'var(--node-border)', glow: 'none' };

const StackVisualizer = memo(function StackVisualizer() {
  const { stack } = useAppContext();
  const { items, itemStates } = stack;

  if (items.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-title">Empty Stack</div>
        <div className="empty-state-hint">
          Push values onto the stack. The last item pushed is the first to be popped (LIFO)!
        </div>
      </div>
    );
  }

  const reversed = [...items].reverse();

  return (
    <div style={styles.container}>
      <div style={styles.stack}>
        {/* Top label */}
        <div style={styles.topLabel}>
          <span style={styles.topArrow}>▼</span>
          <span>TOP</span>
        </div>

        {reversed.map((item, visualIdx) => {
          const actualIdx = items.length - 1 - visualIdx;
          const isTop = actualIdx === items.length - 1;
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
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                borderWidth: isTop ? '2.5px' : '1.5px',
              }}
            >
              <div style={styles.indexCol}>
                <span style={styles.indexNum}>{actualIdx}</span>
              </div>
              <div style={styles.valueCol}>
                <span style={{
                  ...styles.value,
                  color: isActive ? s.border : 'var(--text-primary)',
                }}>
                  {item.value}
                </span>
              </div>
              {isTop && (
                <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>TOP</span>
              )}
            </div>
          );
        })}

        {/* Bottom plate */}
        <div style={styles.bottom}>
          <div style={styles.bottomLine} />
          <span style={styles.bottomLabel}>BOTTOM</span>
        </div>
      </div>
    </div>
  );
});

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'auto',
    padding: '20px',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    minWidth: '220px',
    maxWidth: '320px',
    width: '100%',
  },
  topLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.68rem',
    fontWeight: 800,
    color: 'var(--accent-emerald)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  topArrow: {
    animation: 'float 1.5s ease-in-out infinite',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid',
    transition: 'all 0.3s ease',
  },
  indexCol: {
    width: '24px',
    textAlign: 'center',
  },
  indexNum: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  valueCol: {
    flex: 1,
  },
  value: {
    fontSize: '1.05rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    transition: 'color 0.3s ease',
  },
  bottom: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    marginTop: '4px',
  },
  bottomLine: {
    width: '100%',
    height: '3px',
    borderRadius: '2px',
    background: 'linear-gradient(90deg, transparent, var(--accent-1), var(--accent-2), transparent)',
    opacity: 0.4,
  },
  bottomLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '1.5px',
  },
};

export default StackVisualizer;