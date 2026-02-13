import React, { memo } from 'react';

const UseCaseList = memo(function UseCaseList({ useCases }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>
        <span style={styles.labelIcon}>🎯</span>
        <span>Use Cases</span>
      </div>
      <div style={styles.list}>
        {useCases.map((uc, i) => (
          <div key={i} style={styles.item} className={`delay-${Math.min(i + 1, 6)}`}>
            <span style={styles.dot} />
            <span style={styles.text}>{uc}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const styles = {
  wrapper: {
    marginBottom: '8px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  labelIcon: {
    fontSize: '0.9rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0,0,0,0.06)',
    transition: 'background 0.2s ease',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'var(--accent-1)',
    flexShrink: 0,
  },
  text: {
    fontSize: '0.74rem',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    fontWeight: 500,
  },
};

export default UseCaseList;