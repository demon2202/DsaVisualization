import React, { useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import VisualizationContainer from './components/VisualizationContainer';
import AnalyticsPanel from './components/AnalyticsPanel';
import ReferencePanel from './components/ReferencePanel';
import useAppState, { AppContext } from './hooks/useAppState';
import useBST from './hooks/useBST';
import useLinkedList from './hooks/useLinkedList';
import useGraph from './hooks/useGraph';
import useStack from './hooks/useStack';
import useQueue from './hooks/useQueue';
import useHashSet from './hooks/useHashSet';
import useAnimator from './hooks/useAnimator';

export default function App() {
  const app = useAppState();
  const bst = useBST();
  const linkedList = useLinkedList();
  const graph = useGraph();
  const stack = useStack();
  const queue = useQueue();
  const hashSet = useHashSet();
  const animator = useAnimator(app.state.animationSpeed);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', app.state.theme);
  }, [app.state.theme]);

  const getActiveDS = useCallback(() => {
    switch (app.state.activeStructure) {
      case 'bst': return bst;
      case 'linkedlist': return linkedList;
      case 'graph': return graph;
      case 'stack': return stack;
      case 'queue': return queue;
      case 'hashset': return hashSet;
      default: return bst;
    }
  }, [app.state.activeStructure, bst, linkedList, graph, stack, queue, hashSet]);

  const ctx = useMemo(() => ({
    app,
    bst,
    linkedList,
    graph,
    stack,
    queue,
    hashSet,
    animator,
    getActiveDS,
  }), [app, bst, linkedList, graph, stack, queue, hashSet, animator, getActiveDS]);

  return (
    <AppContext.Provider value={ctx}>
      <Layout>
        <Header />
        <div className="main-content">
          <div className="left-panel">
            <ControlPanel />
          </div>
          <div className="center-panel">
            <VisualizationContainer />
          </div>
          <div className="right-panel">
            <AnalyticsPanel />
            <ReferencePanel />
          </div>
        </div>
      </Layout>
    </AppContext.Provider>
  );
}
