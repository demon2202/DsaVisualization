import { useState, useCallback } from 'react';

const MAX_STACK_SIZE = 20;

export default function useStack() {
  const [items, setItems] = useState([]);
  const [itemStates, setItemStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');

  const clearStates = useCallback(() => {
    setItemStates({});
    setCurrentMessage('');
  }, []);

  const push = useCallback((value) => {
    if (items.length >= MAX_STACK_SIZE) {
      return { ok: false, msg: `Stack overflow — maximum size is ${MAX_STACK_SIZE}`, steps: [] };
    }
    const id = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const steps = [{ id, action: 'push', msg: `Pushing ${value} onto top of stack (new size: ${items.length + 1})` }];
    setItems(prev => [...prev, { id, value }]);
    return { ok: true, msg: `Pushed ${value}`, steps };
  }, [items]);

  const pop = useCallback(() => {
    if (items.length === 0) {
      return { ok: false, msg: 'Stack underflow — stack is empty', steps: [] };
    }
    const top = items[items.length - 1];
    const steps = [{ id: top.id, action: 'pop', msg: `Popping ${top.value} from top (remaining: ${items.length - 1})` }];
    setItems(prev => prev.slice(0, -1));
    return { ok: true, msg: `Popped ${top.value}`, steps, value: top.value };
  }, [items]);

  const peek = useCallback(() => {
    if (items.length === 0) {
      return { ok: false, msg: 'Stack is empty — nothing to peek', steps: [] };
    }
    const top = items[items.length - 1];
    const steps = [{ id: top.id, action: 'peek', msg: `Top element is ${top.value} (stack size: ${items.length})` }];
    return { ok: true, msg: `Top: ${top.value}`, steps, value: top.value };
  }, [items]);

  const searchStack = useCallback((value) => {
    if (items.length === 0) {
      return { ok: false, msg: 'Stack is empty', steps: [] };
    }
    const steps = [];
    // Search from top (LIFO order)
    for (let i = items.length - 1; i >= 0; i--) {
      const depth = items.length - 1 - i;
      steps.push({ id: items[i].id, action: 'compare', msg: `Depth ${depth}: checking ${items[i].value}` });
      if (items[i].value === value) {
        steps.push({ id: items[i].id, action: 'found', msg: `Found ${value} at depth ${depth} (index ${i})` });
        return { ok: true, msg: `Found ${value} at depth ${depth}`, steps };
      }
    }
    return { ok: false, msg: `${value} not in stack (searched all ${items.length} elements)`, steps };
  }, [items]);

  const clear = useCallback(() => {
    setItems([]);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => ({
    size: items.length,
    top: items.length > 0 ? items[items.length - 1].value : null,
    isEmpty: items.length === 0,
    capacity: MAX_STACK_SIZE,
    utilization: +((items.length / MAX_STACK_SIZE) * 100).toFixed(0),
  }), [items]);

  return {
    items, push, pop, peek, searchStack, clear, getMetrics,
    itemStates, setItemStates, currentMessage, setCurrentMessage, clearStates,
  };
}