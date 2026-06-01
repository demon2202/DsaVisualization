import React, { memo, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppState';
import BSTVisualizer from './bst/BSTVisualizer';
import LinkedListVisualizer from './linkedlist/LinkedListVisualizer';
import GraphVisualizer from './graph/GraphVisualizer';
import StackVisualizer from './stack/StackVisualizer';
import QueueVisualizer from './queue/QueueVisualizer';
import HashSetVisualizer from './hashset/HashSetVisualizer';
import AnimationControls from './AnimationControls';

const INFO = {
  bst:        { label: 'Binary Search Tree',  hint: 'O(log n) ops on balanced trees'             },
  linkedlist: { label: 'Singly Linked List',  hint: 'Sequential nodes + pointer traversal'       },
  graph:      { label: 'Graph',               hint: 'BFS / DFS — drag nodes freely'              },
  stack:      { label: 'Stack',               hint: 'LIFO — push / pop from top'                 },
  queue:      { label: 'Queue',               hint: 'FIFO — enqueue rear, dequeue front'         },
  hashset:    { label: 'Hash Set',            hint: 'O(1) avg — hash(key) mod 8 buckets'         },
};

const VisualizationContainer = memo(function VisualizationContainer() {
  const { app, getActiveDS } = useAppContext();
  const active = app.state.activeStructure;
  const info   = INFO[active] || { label: '', hint: '' };
  const ds     = getActiveDS();

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
      {/* Header bar */}
      <div className="viz-hd">
        <div>
          <div className="viz-title">{info.label}</div>
          <div className="viz-sub">{info.hint}</div>
        </div>
        {app.state.isAnimating && (
          <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'999px', background:'rgba(108,99,255,0.08)', border:'1px solid rgba(108,99,255,0.18)', fontSize:'0.62rem', fontFamily:'var(--mono)', fontWeight:700, color:'var(--a)' }}>
            <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'var(--a)', animation:'pulse 1s ease-in-out infinite' }} />
            running
          </div>
        )}
      </div>

      {/* Step message */}
      {ds?.currentMessage && (
        <div className="viz-msg-wrap">
          <div className="msg-bar">
            <span className="msg-p">›</span>
            <span className="msg-t">{ds.currentMessage}</span>
          </div>
        </div>
      )}

      {/* Visualization */}
      <div className="viz-area">{renderViz()}</div>

      {/* Animation controls */}
      {app.state.isAnimating && <AnimationControls />}
    </>
  );
});

export default VisualizationContainer;
