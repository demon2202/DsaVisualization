import React, { memo, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import LinkedListNode from './LinkedListNode';

const LinkedListVisualizer = memo(function LinkedListVisualizer() {
  const { linkedList } = useAppContext();
  const { nodes, nodeStates } = linkedList;

  // Track which node ids are new (just added this render)
  const prevIds = useRef(new Set());
  const newIds  = useRef(new Set());

  useEffect(() => {
    const currentIds = new Set(nodes.map(n => n.id));
    newIds.current = new Set([...currentIds].filter(id => !prevIds.current.has(id)));
    prevIds.current = currentIds;
  });

  if (nodes.length === 0) {
    return (
      <div className="empty-state anim-fade">
        <div className="empty-state-icon">○</div>
        <div className="empty-state-title">empty list</div>
        <div className="empty-state-hint">Append or prepend values — watch pointer connections form in real time</div>
      </div>
    );
  }

  return (
    <div style={s.outer}>
      <div style={s.list}>
        {nodes.map((node, i) => (
          <LinkedListNode
            key={node.id}
            value={node.value}
            isHead={i === 0}
            isTail={i === nodes.length - 1}
            state={nodeStates[node.id]}
            index={i}
            isNew={newIds.current.has(node.id)}
          />
        ))}

        {/* NULL sentinel */}
        <div style={s.nullBox}>
          <span style={s.null}>NULL</span>
        </div>
      </div>
    </div>
  );
});

const s = {
  outer: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    overflow: 'auto',
    padding: '32px 18px 24px',
  },
  list: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: '40px',
  },
  nullBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    border: '1.5px dashed rgba(248,113,113,0.22)',
    borderRadius: '5px',
    marginLeft: '4px',
  },
  null: {
    fontSize: '0.7rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--rose)',
    opacity: 0.5,
    letterSpacing: '0.06em',
  },
};

export default LinkedListVisualizer;