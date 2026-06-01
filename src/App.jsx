import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import useAppState, { AppContext } from './hooks/useAppState';
import useBST from './hooks/useBST';
import useLinkedList from './hooks/useLinkedList';
import useGraph from './hooks/useGraph';
import useStack from './hooks/useStack';
import useQueue from './hooks/useQueue';
import useHashSet from './hooks/useHashSet';
import useAnimator from './hooks/useAnimator';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import VisualizationContainer from './components/VisualizationContainer';
import AnalyticsPanel from './components/AnalyticsPanel';

export default function App() {
  const app        = useAppState();
  const bst        = useBST();
  const linkedList = useLinkedList();
  const graph      = useGraph();
  const stack      = useStack();
  const queue      = useQueue();
  const hashSet    = useHashSet();
  const animator   = useAnimator(app.state.animationSpeed);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', app.state.theme);
  }, [app.state.theme]);

  const prevDS = useRef(app.state.activeStructure);
  useEffect(() => {
    if (prevDS.current !== app.state.activeStructure) {
      animator.cancel();
      app.setAnimating(false);
      prevDS.current = app.state.activeStructure;
    }
  }, [app.state.activeStructure]);

  const getActiveDS = useCallback(() => {
    switch (app.state.activeStructure) {
      case 'bst':        return bst;
      case 'linkedlist': return linkedList;
      case 'graph':      return graph;
      case 'stack':      return stack;
      case 'queue':      return queue;
      case 'hashset':    return hashSet;
      default:           return bst;
    }
  }, [app.state.activeStructure, bst, linkedList, graph, stack, queue, hashSet]);

  const ctx = useMemo(() => ({
    app, bst, linkedList, graph, stack, queue, hashSet, animator, getActiveDS,
  }), [app, bst, linkedList, graph, stack, queue, hashSet, animator, getActiveDS]);

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-layout no-select">
        <Header />
        <div className="main-content">
          <aside className="left-panel">
            <div className="scroll">
              <ControlPanel />
            </div>
          </aside>
          <main className="center-panel">
            <VisualizationContainer />
          </main>
          <aside className="right-panel">
            <AnalyticsPanel />
          </aside>
        </div>
      </div>
    </AppContext.Provider>
  );
}
