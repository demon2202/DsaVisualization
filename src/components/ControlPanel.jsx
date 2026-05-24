import React, { memo } from 'react';
import { useAppContext } from '../hooks/useAppState';
import SpeedSlider from './SpeedSlider';
import StatusIndicator from './StatusIndicator';

import BSTControls from './bst/BSTControls';
import LinkedListControls from './linkedlist/LinkedListControls';
import GraphControls from './graph/GraphControls';
import StackControls from './stack/StackControls';
import QueueControls from './queue/QueueControls';
import HashSetControls from './hashset/HashSetControls';

const dsLabels = {
  bst: 'Binary Search Tree',
  linkedlist: 'Linked List',
  graph: 'Graph',
  stack: 'Stack',
  queue: 'Queue',
  hashset: 'Hash Set',
};

const ControlPanel = memo(function ControlPanel() {
  const { app } = useAppContext();
  const active = app.state.activeStructure;

  const renderControls = () => {
    switch (active) {
      case 'bst':        return <BSTControls />;
      case 'linkedlist': return <LinkedListControls />;
      case 'graph':      return <GraphControls />;
      case 'stack':      return <StackControls />;
      case 'queue':      return <QueueControls />;
      case 'hashset':    return <HashSetControls />;
      default:           return null;
    }
  };

  return (
    <>
      <div className="glass-panel anim-slide-left" style={s.panel}>
        {/* Panel header */}
        <div style={s.panelHeader}>
          <div style={s.panelTitle}>
            <span style={s.panelTitleLabel}>ops</span>
            <span style={s.panelTitleDs}>{dsLabels[active]}</span>
          </div>
          <div style={s.panelIndicator} />
        </div>

        <SpeedSlider />

        <div className="divider" style={{ margin: '10px 0 8px' }} />

        <div style={s.controlsArea}>
          {renderControls()}
        </div>
      </div>

      <StatusIndicator />
    </>
  );
});

const s = {
  panel: {
    padding: '14px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  panelTitle: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  panelTitleLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  panelTitleDs: {
    fontSize: '0.825rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  panelIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--emerald)',
    opacity: 0.7,
  },
  controlsArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
};

export default ControlPanel;