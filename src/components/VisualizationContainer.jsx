import React, { memo, Suspense, lazy } from 'react';
import { useAppContext } from '../hooks/useAppState';
import AnimationControls from './AnimationControls';
import MessageBar from './MessageBar';

import BSTVisualizer from './bst/BSTVisualizer';
import LinkedListVisualizer from './linkedlist/LinkedListVisualizer';
import GraphVisualizer from './graph/GraphVisualizer';
import StackVisualizer from './stack/StackVisualizer';
import QueueVisualizer from './queue/QueueVisualizer';
import HashSetVisualizer from './hashset/HashSetVisualizer';

const structureInfo = {
  bst: { icon: '🌳', label: 'Binary Search Tree', desc: 'Ordered tree with O(log n) operations' },
  linkedlist: { icon: '🔗', label: 'Singly Linked List', desc: 'Sequential nodes with pointer connections' },
  graph: { icon: '🕸️', label: 'Graph Visualization', desc: 'Nodes & edges with BFS / DFS traversal' },
  stack: { icon: '📚', label: 'Stack (LIFO)', desc: 'Last In, First Out data structure' },
  queue: { icon: '🚶‍♂️', label: 'Queue (FIFO)', desc: 'First In, First Out data structure' },
  hashset: { icon: '🗂️', label: 'Hash Set', desc: 'Unique elements with hash-based buckets' },
};

const VisualizationContainer = memo(function VisualizationContainer() {
  const ctx = useAppContext();
  const active = ctx.app.state.activeStructure;
  const info = structureInfo[active];
  const ds = ctx.getActiveDS();

  const renderVisualizer = () => {
    switch (active) {
      case 'bst': return <BSTVisualizer />;
      case 'linkedlist': return <LinkedListVisualizer />;
      case 'graph': return <GraphVisualizer />;
      case 'stack': return <StackVisualizer />;
      case 'queue': return <QueueVisualizer />;
      case 'hashset': return <HashSetVisualizer />;
      default: return null;
    }
  };

  return (
    <>
      <div className="glass-panel" style={styles.container}>
        {/* Header bar */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>{info.icon}</span>
            <div>
              <div style={styles.headerTitle}>{info.label}</div>
              <div style={styles.headerDesc}>{info.desc}</div>
            </div>
          </div>
          <div style={styles.headerBadges}>
            {ctx.app.state.isAnimating && (
              <span className="badge badge-purple anim-pulse">
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '0.65rem' }}>⟳</span>
                Running
              </span>
            )}
          </div>
        </div>

        {/* Message bar */}
        {ds.currentMessage && (
          <div style={styles.messageWrap}>
            <MessageBar message={ds.currentMessage} />
          </div>
        )}

        {/* Visualization area */}
        <div style={styles.vizArea}>
          {renderVisualizer()}
        </div>
      </div>

      <AnimationControls />
    </>
  );
});

const styles = {
  container: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '350px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px 10px',
    borderBottom: '1px solid var(--glass-border)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    fontSize: '1.5rem',
  },
  headerTitle: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  headerDesc: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
    marginTop: '1px',
  },
  headerBadges: {
    display: 'flex',
    gap: '6px',
  },
  messageWrap: {
    padding: '8px 14px 0',
  },
  vizArea: {
    flex: 1,
    position: 'relative',
    overflow: 'auto',
    padding: '8px',
    minHeight: 0,
  },
};

export default VisualizationContainer;