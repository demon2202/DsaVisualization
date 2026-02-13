import React, { memo } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import LinkedListNode from './LinkedListNode';

const LinkedListVisualizer = memo(function LinkedListVisualizer() {
  const { linkedList } = useAppContext();
  const { nodes, nodeStates } = linkedList;

  if (nodes.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">🔗</div>
        <div className="empty-state-title">Empty Linked List</div>
        <div className="empty-state-hint">
          Append or prepend values to build your linked list and visualize pointer connections!
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.list}>
        {nodes.map((node, i) => (
          <LinkedListNode
            key={node.id}
            value={node.value}
            isHead={i === 0}
            isTail={i === nodes.length - 1}
            state={nodeStates[node.id]}
            index={i}
          />
        ))}

        {/* NULL terminator */}
        <div style={styles.nullBox} className="anim-fade">
          <span style={styles.nullText}>NULL</span>
        </div>
      </div>
    </div>
  );
});

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    overflow: 'auto',
    padding: '35px 20px 28px',
  },
  list: {
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    flexWrap: 'wrap',
    rowGap: '40px',
  },
  nullBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(244,63,94,0.08)',
    border: '2px dashed rgba(244,63,94,0.25)',
    marginLeft: '4px',
  },
  nullText: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--accent-rose)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '1px',
    opacity: 0.6,
  },
};

export default LinkedListVisualizer;