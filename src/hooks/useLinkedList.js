import { useState, useCallback, useRef } from 'react';

class LLNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.id = `ll_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
}

export default function useLinkedList() {
  const [nodes, setNodes] = useState([]);
  const [nodeStates, setNodeStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const headRef = useRef(null);

  const sync = useCallback(() => {
    const arr = [];
    let curr = headRef.current;
    while (curr) {
      arr.push({ id: curr.id, value: curr.value });
      curr = curr.next;
    }
    setNodes(arr);
  }, []);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setCurrentMessage('');
  }, []);

  const append = useCallback((value) => {
    const node = new LLNode(value);
    const steps = [];

    if (!headRef.current) {
      headRef.current = node;
      steps.push({ id: node.id, action: 'insert', msg: `${value} added as head` });
      sync();
      return { ok: true, msg: `Appended ${value} as head`, steps };
    }

    let curr = headRef.current;
    while (curr.next) {
      steps.push({ id: curr.id, action: 'traverse', msg: `Traversing past ${curr.value}` });
      curr = curr.next;
    }
    steps.push({ id: curr.id, action: 'traverse', msg: `Reached tail: ${curr.value}` });
    curr.next = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} appended after ${curr.value}` });
    sync();
    return { ok: true, msg: `Appended ${value}`, steps };
  }, [sync]);

  const prepend = useCallback((value) => {
    const node = new LLNode(value);
    node.next = headRef.current;
    headRef.current = node;
    sync();
    return { ok: true, msg: `Prepended ${value} as new head`, steps: [{ id: node.id, action: 'insert', msg: `${value} is the new head` }] };
  }, [sync]);

  const insertAt = useCallback((value, index) => {
    if (index < 0) return { ok: false, msg: 'Index must be ≥ 0', steps: [] };
    if (index === 0) return prepend(value);

    const node = new LLNode(value);
    const steps = [];
    let curr = headRef.current;
    let i = 0;

    while (curr && i < index - 1) {
      steps.push({ id: curr.id, action: 'traverse', msg: `At index ${i}: ${curr.value}` });
      curr = curr.next;
      i++;
    }

    if (!curr) return { ok: false, msg: `Index ${index} out of bounds`, steps };

    steps.push({ id: curr.id, action: 'traverse', msg: `Inserting after index ${i}` });
    node.next = curr.next;
    curr.next = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} inserted at index ${index}` });
    sync();
    return { ok: true, msg: `Inserted ${value} at index ${index}`, steps };
  }, [sync, prepend]);

  const deleteNode = useCallback((value) => {
    if (!headRef.current) return { ok: false, msg: 'List is empty', steps: [] };
    const steps = [];

    if (headRef.current.value === value) {
      steps.push({ id: headRef.current.id, action: 'delete', msg: `Deleting head: ${value}` });
      headRef.current = headRef.current.next;
      sync();
      return { ok: true, msg: `Deleted ${value} (was head)`, steps };
    }

    let curr = headRef.current;
    while (curr.next) {
      steps.push({ id: curr.id, action: 'traverse', msg: `Checking next of ${curr.value}` });
      if (curr.next.value === value) {
        steps.push({ id: curr.next.id, action: 'delete', msg: `Found & deleting ${value}` });
        curr.next = curr.next.next;
        sync();
        return { ok: true, msg: `Deleted ${value}`, steps };
      }
      curr = curr.next;
    }
    steps.push({ id: curr.id, action: 'not-found', msg: `${value} not in list` });
    return { ok: false, msg: `${value} not found`, steps };
  }, [sync]);

  const searchNode = useCallback((value) => {
    const steps = [];
    let curr = headRef.current;
    let idx = 0;

    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Index ${idx}: comparing with ${curr.value}` });
      if (curr.value === value) {
        steps.push({ id: curr.id, action: 'found', msg: `Found ${value} at index ${idx}!` });
        return { ok: true, msg: `Found ${value} at index ${idx}`, steps };
      }
      curr = curr.next;
      idx++;
    }
    return { ok: false, msg: `${value} not found in list`, steps };
  }, []);

  const reverse = useCallback(() => {
    const steps = [];
    let prev = null;
    let curr = headRef.current;

    while (curr) {
      steps.push({ id: curr.id, action: 'traverse', msg: `Reversing pointer at ${curr.value}` });
      const next = curr.next;
      curr.next = prev;
      prev = curr;
      curr = next;
    }
    headRef.current = prev;
    sync();
    return { ok: true, msg: 'List reversed', steps };
  }, [sync]);

  const clear = useCallback(() => {
    headRef.current = null;
    setNodes([]);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => {
    let count = 0;
    let curr = headRef.current;
    while (curr) { count++; curr = curr.next; }

    let tail = headRef.current;
    if (tail) while (tail.next) tail = tail.next;

    return {
      length: count,
      head: headRef.current ? headRef.current.value : null,
      tail: tail ? tail.value : null,
      isEmpty: !headRef.current,
    };
  }, [nodes]);

  return {
    nodes, append, prepend, insertAt, deleteNode, searchNode, reverse, clear,
    getMetrics, nodeStates, setNodeStates, currentMessage, setCurrentMessage, clearStates,
  };
}