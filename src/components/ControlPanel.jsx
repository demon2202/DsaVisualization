import React, { memo } from 'react';
import { useAppContext } from '../hooks/useAppState';
import SpeedSlider from './SpeedSlider';
import BSTControls from './bst/BSTControls';
import LinkedListControls from './linkedlist/LinkedListControls';
import GraphControls from './graph/GraphControls';
import StackControls from './stack/StackControls';
import QueueControls from './queue/QueueControls';
import HashSetControls from './hashset/HashSetControls';

const DS_LABELS = {
  bst: 'BST', linkedlist: 'List', graph: 'Graph',
  stack: 'Stack', queue: 'Queue', hashset: 'HashSet',
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
    <div className="ctrl-panel">
      <div className="ctrl-hd">
        <span className="ctrl-title">ops</span>
        <span className="ctrl-badge">{DS_LABELS[active]}</span>
      </div>
      <SpeedSlider />
      <div className="divider" />
      {renderControls()}
    </div>
  );
});

export default ControlPanel;
