import { useState, useCallback } from 'react';

export default function useQueue() {
  const [items, setItems] = useState([]);
  const [itemStates, setItemStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');

  const clearStates = useCallback(() => {
    setItemStates({});
    setCurrentMessage('');
  }, []);

  const enqueue = useCallback((value) => {
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const steps = [{ id, action: 'enqueue', msg: `Enqueueing ${value}` }];
    setItems(prev => [...prev, { id, value }]);
    return { ok: true, msg: `Enqueued ${value}`, steps };
  }, []);

  const dequeue = useCallback(() => {
    if (items.length === 0) return { ok: false, msg: 'Queue is empty', steps: [] };
    const front = items[0];
    const steps = [{ id: front.id, action: 'dequeue', msg: `Dequeueing ${front.value}` }];
    setItems(prev => prev.slice(1));
    return { ok: true, msg: `Dequeued ${front.value}`, steps, value: front.value };
  }, [items]);

  const peekQueue = useCallback(() => {
    if (items.length === 0) return { ok: false, msg: 'Queue is empty', steps: [] };
    const front = items[0];
    return { ok: true, msg: `Front: ${front.value}`, steps: [{ id: front.id, action: 'peek', msg: `Front is ${front.value}` }] };
  }, [items]);

  const searchQueue = useCallback((value) => {
    const steps = [];
    for (let i = 0; i < items.length; i++) {
      steps.push({ id: items[i].id, action: 'compare', msg: `Position ${i}: checking ${items[i].value}` });
      if (items[i].value === value) {
        steps.push({ id: items[i].id, action: 'found', msg: `Found ${value} at position ${i}` });
        return { ok: true, msg: `Found ${value} at position ${i}`, steps };
      }
    }
    return { ok: false, msg: `${value} not in queue`, steps };
  }, [items]);

  const clear = useCallback(() => {
    setItems([]);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => ({
    size: items.length,
    front: items.length > 0 ? items[0].value : null,
    rear: items.length > 0 ? items[items.length - 1].value : null,
    isEmpty: items.length === 0,
  }), [items]);

  return {
    items, enqueue, dequeue, peekQueue, searchQueue, clear, getMetrics,
    itemStates, setItemStates, currentMessage, setCurrentMessage, clearStates,
  };
}