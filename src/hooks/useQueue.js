import { useState, useCallback } from 'react';

const MAX_QUEUE_SIZE = 15;

export default function useQueue() {
  const [items, setItems] = useState([]);
  const [itemStates, setItemStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');

  const clearStates = useCallback(() => {
    setItemStates({});
    setCurrentMessage('');
  }, []);

  const enqueue = useCallback((value) => {
    if (items.length >= MAX_QUEUE_SIZE) {
      return { ok: false, msg: `Queue is full — maximum size is ${MAX_QUEUE_SIZE}`, steps: [] };
    }
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const steps = [{ id, action: 'enqueue', msg: `Enqueueing ${value} at rear (new size: ${items.length + 1})` }];
    setItems(prev => [...prev, { id, value }]);
    return { ok: true, msg: `Enqueued ${value}`, steps };
  }, [items]);

  const dequeue = useCallback(() => {
    if (items.length === 0) {
      return { ok: false, msg: 'Queue is empty — nothing to dequeue', steps: [] };
    }
    const front = items[0];
    const steps = [{ id: front.id, action: 'dequeue', msg: `Dequeueing ${front.value} from front (remaining: ${items.length - 1})` }];
    setItems(prev => prev.slice(1));
    return { ok: true, msg: `Dequeued ${front.value}`, steps, value: front.value };
  }, [items]);

  const peekQueue = useCallback(() => {
    if (items.length === 0) {
      return { ok: false, msg: 'Queue is empty — nothing to peek', steps: [] };
    }
    const front = items[0];
    const steps = [{ id: front.id, action: 'peek', msg: `Front element is ${front.value} (queue size: ${items.length})` }];
    return { ok: true, msg: `Front: ${front.value}`, steps };
  }, [items]);

  const searchQueue = useCallback((value) => {
    if (items.length === 0) {
      return { ok: false, msg: 'Queue is empty', steps: [] };
    }
    const steps = [];
    for (let i = 0; i < items.length; i++) {
      steps.push({ id: items[i].id, action: 'compare', msg: `Position ${i}: checking ${items[i].value}` });
      if (items[i].value === value) {
        steps.push({ id: items[i].id, action: 'found', msg: `Found ${value} at position ${i}!` });
        return { ok: true, msg: `Found ${value} at position ${i}`, steps };
      }
    }
    return { ok: false, msg: `${value} not in queue (searched all ${items.length} elements)`, steps };
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
    capacity: MAX_QUEUE_SIZE,
    utilization: +((items.length / MAX_QUEUE_SIZE) * 100).toFixed(0),
  }), [items]);

  return {
    items, enqueue, dequeue, peekQueue, searchQueue, clear, getMetrics,
    itemStates, setItemStates, currentMessage, setCurrentMessage, clearStates,
  };
}