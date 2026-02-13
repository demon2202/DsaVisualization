import { useState, useCallback } from 'react';

export default function useStack() {
  const [items, setItems] = useState([]);
  const [itemStates, setItemStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');

  const clearStates = useCallback(() => {
    setItemStates({});
    setCurrentMessage('');
  }, []);

  const push = useCallback((value) => {
    const id = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const steps = [{ id, action: 'push', msg: `Pushing ${value} onto stack` }];
    setItems(prev => [...prev, { id, value }]);
    return { ok: true, msg: `Pushed ${value}`, steps };
  }, []);

  const pop = useCallback(() => {
    if (items.length === 0) return { ok: false, msg: 'Stack is empty', steps: [] };
    const top = items[items.length - 1];
    const steps = [{ id: top.id, action: 'pop', msg: `Popping ${top.value}` }];
    setItems(prev => prev.slice(0, -1));
    return { ok: true, msg: `Popped ${top.value}`, steps, value: top.value };
  }, [items]);

  const peek = useCallback(() => {
    if (items.length === 0) return { ok: false, msg: 'Stack is empty', steps: [] };
    const top = items[items.length - 1];
    const steps = [{ id: top.id, action: 'peek', msg: `Top is ${top.value}` }];
    return { ok: true, msg: `Top: ${top.value}`, steps, value: top.value };
  }, [items]);

  const searchStack = useCallback((value) => {
    const steps = [];
    for (let i = items.length - 1; i >= 0; i--) {
      steps.push({ id: items[i].id, action: 'compare', msg: `Checking ${items[i].value}` });
      if (items[i].value === value) {
        steps.push({ id: items[i].id, action: 'found', msg: `Found ${value} at depth ${items.length - 1 - i}` });
        return { ok: true, msg: `Found ${value}`, steps };
      }
    }
    return { ok: false, msg: `${value} not in stack`, steps };
  }, [items]);

  const clear = useCallback(() => {
    setItems([]);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => ({
    size: items.length,
    top: items.length > 0 ? items[items.length - 1].value : null,
    isEmpty: items.length === 0,
  }), [items]);

  return {
    items, push, pop, peek, searchStack, clear, getMetrics,
    itemStates, setItemStates, currentMessage, setCurrentMessage, clearStates,
  };
}