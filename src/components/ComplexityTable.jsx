import React, { memo } from 'react';

const ComplexityTable = memo(function ComplexityTable({ complexities, space }) {
  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Operation</th>
            <th style={{ ...styles.th, color: 'var(--accent-emerald)' }}>Average</th>
            <th style={{ ...styles.th, color: 'var(--accent-amber)' }}>Worst</th>
          </tr>
        </thead>
        <tbody>
          {complexities.map((c, i) => (
            <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={styles.tdOp}>{c.op}</td>
              <td style={styles.tdVal}>
                <span className="badge badge-emerald">{c.avg}</span>
              </td>
              <td style={styles.tdVal}>
                <span className="badge badge-amber">{c.worst}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.spaceRow}>
        <span style={styles.spaceLabel}>Space Complexity</span>
        <span className="badge badge-cyan">{space}</span>
      </div>
    </div>
  );
});

const styles = {
  wrapper: {
    marginBottom: '14px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--glass-border)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.75rem',
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    color: 'var(--text-muted)',
    fontWeight: 700,
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    background: 'rgba(0,0,0,0.12)',
    borderBottom: '1px solid var(--glass-border)',
  },
  rowEven: {
    background: 'transparent',
  },
  rowOdd: {
    background: 'rgba(0,0,0,0.05)',
  },
  tdOp: {
    padding: '7px 10px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.76rem',
  },
  tdVal: {
    padding: '7px 10px',
  },
  spaceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderTop: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.06)',
  },
  spaceLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
};

export default ComplexityTable;