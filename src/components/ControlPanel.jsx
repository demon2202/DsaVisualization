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

const ControlPanel = memo(function ControlPanel() {
  const { app } = useAppContext();
  const active = app.state.activeStructure;

  const renderControls = () => {
    switch (active) {
      case 'bst': return <BSTControls />;
      case 'linkedlist': return <LinkedListControls />;
      case 'graph': return <GraphControls />;
      case 'stack': return <StackControls />;
      case 'queue': return <QueueControls />;
      case 'hashset': return <HashSetControls />;
      default: return null;
    }
  };

  return (
    <>
      <div className="glass-panel anim-slide-left" style={styles.panel}>
        <div style={styles.titleRow}>
          <div style={styles.titleIcon}>⚙️</div>
          <div>
            <h3 style={styles.title}>Controls</h3>
            <p style={styles.titleSub}>Configure and execute operations</p>
          </div>
        </div>

        <SpeedSlider />

        <div className="divider" />

        <div style={styles.controlsArea}>
          {renderControls()}
        </div>
      </div>

      <StatusIndicator />
    </>
  );
});

const styles = {
  panel: {
    padding: '16px',
    /* This makes the panel itself not grow beyond the sidebar,
       but the sidebar handles the scroll */
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  titleIcon: {
    fontSize: '1.3rem',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  titleSub: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    fontWeight: 500,
    marginTop: '2px',
  },
  controlsArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
};

export default ControlPanel;