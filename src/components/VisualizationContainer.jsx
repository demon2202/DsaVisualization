import React, { memo } from 'react';
import { useAppContext } from '../hooks/useAppState';
import AnimationControls from './AnimationControls';
import MessageBar from './MessageBar';

import BSTVisualizer from './bst/BSTVisualizer';
import LinkedListVisualizer from './linkedlist/LinkedListVisualizer';
import GraphVisualizer from './graph/GraphVisualizer';
import StackVisualizer from './stack/StackVisualizer';
import QueueVisualizer from './queue/QueueVisualizer';
import HashSetVisualizer from './hashset/HashSetVisualizer';

const INFO = {
  bst:        { label: 'Binary Search Tree',  hint: 'O(log n) ops on balanced trees' },
  linkedlist: { label: 'Singly Linked List',  hint: 'Sequential nodes + pointer traversal' },
  graph:      { label: 'Graph',               hint: 'BFS / DFS on adjacency list — drag nodes freely' },
  stack:      { label: 'Stack',               hint: 'LIFO — push / pop from top' },
  queue:      { label: 'Queue',               hint: 'FIFO — enqueue rear, dequeue front' },
  hashset:    { label: 'Hash Set',            hint: 'O(1) average — hash(key) mod buckets' },
};

const VisualizationContainer = memo(function VisualizationContainer() {
  const ctx    = useAppContext();
  const active = ctx.app.state.activeStructure;
  const info   = INFO[active];
  const ds     = ctx.getActiveDS();

  const renderViz = () => {
    switch (active) {
      case 'bst':        return <BSTVisualizer />;
      case 'linkedlist': return <LinkedListVisualizer />;
      case 'graph':      return <GraphVisualizer />;
      case 'stack':      return <StackVisualizer />;
      case 'queue':      return <QueueVisualizer />;
      case 'hashset':    return <HashSetVisualizer />;
      default:           return null;
    }
  };

  return (
    <>
      <div className="glass-panel" style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.dsLabel}>{info.label}</span>
            <span style={s.dsHint}>{info.hint}</span>
          </div>
          {ctx.app.state.isAnimating && (
            <span style={s.runBadge}>
              <span style={s.runDot} />
              running
            </span>
          )}
        </div>

        {/* Message bar — shows current algorithm step description */}
        {ds.currentMessage && (
          <div style={s.msgWrap}>
            <MessageBar message={ds.currentMessage} />
          </div>
        )}

        {/* Viz area */}
        <div style={s.vizArea}>
          {renderViz()}
        </div>
      </div>

      <AnimationControls />
    </>
  );
});

const s = {
  container: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '320px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px 8px',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '6px',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    flexWrap: 'wrap',
  },
  dsLabel: {
    fontSize: '0.825rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '-0.01em',
  },
  dsHint: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  runBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: '9999px',
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.18)',
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: 'var(--accent)',
    letterSpacing: '0.03em',
  },
  runDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  msgWrap: {
    padding: '6px 12px 0',
    flexShrink: 0,
  },
  vizArea: {
    flex: 1,
    position: 'relative',
    overflow: 'auto',
    padding: '6px',
    minHeight: 0,
  },
};

export default VisualizationContainer;