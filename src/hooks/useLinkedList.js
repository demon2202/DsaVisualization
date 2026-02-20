import { useState, useCallback, useRef } from 'react';

class LLNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.id = `ll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    let safety = 0;
    while (curr && safety < 1000) {
      arr.push({ id: curr.id, value: curr.value });
      curr = curr.next;
      safety++;
    }
    setNodes(arr);
  }, []);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setCurrentMessage('');
  }, []);

  const getLength = useCallback(() => {
    let count = 0;
    let curr = headRef.current;
    while (curr) { count++; curr = curr.next; }
    return count;
  }, []);

  const append = useCallback((value) => {
    const node = new LLNode(value);
    const steps = [];

    if (!headRef.current) {
      headRef.current = node;
      steps.push({ id: node.id, action: 'insert', msg: `${value} added as head (list was empty)` });
      sync();
      return { ok: true, msg: `Appended ${value} as head`, steps };
    }

    let curr = headRef.current;
    let idx = 0;
    while (curr.next) {
      steps.push({ id: curr.id, action: 'traverse', msg: `Index ${idx}: traversing past ${curr.value}` });
      curr = curr.next;
      idx++;
    }
    steps.push({ id: curr.id, action: 'traverse', msg: `Index ${idx}: reached tail node ${curr.value}` });
    curr.next = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} appended after ${curr.value} at index ${idx + 1}` });
    sync();
    return { ok: true, msg: `Appended ${value} at index ${idx + 1}`, steps };
  }, [sync]);

  const prepend = useCallback((value) => {
    const node = new LLNode(value);
    const steps = [];

    node.next = headRef.current;
    headRef.current = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} is the new head` });
    sync();
    return { ok: true, msg: `Prepended ${value} as new head`, steps };
  }, [sync]);

  const insertAt = useCallback((value, index) => {
    if (index < 0) return { ok: false, msg: 'Index must be ≥ 0', steps: [] };
    if (index === 0) return prepend(value);

    const len = getLength();
    if (index > len) return { ok: false, msg: `Index ${index} out of bounds (list length: ${len})`, steps: [] };

    const node = new LLNode(value);
    const steps = [];
    let curr = headRef.current;
    let i = 0;

    while (curr && i < index - 1) {
      steps.push({ id: curr.id, action: 'traverse', msg: `Index ${i}: passing ${curr.value}` });
      curr = curr.next;
      i++;
    }

    if (!curr) return { ok: false, msg: `Index ${index} out of bounds`, steps };

    steps.push({ id: curr.id, action: 'traverse', msg: `Index ${i}: will insert after ${curr.value}` });
    node.next = curr.next;
    curr.next = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} inserted at index ${index}` });
    sync();
    return { ok: true, msg: `Inserted ${value} at index ${index}`, steps };
  }, [sync, prepend, getLength]);

  const deleteNode = useCallback((value) => {
    if (!headRef.current) return { ok: false, msg: 'List is empty — nothing to delete', steps: [] };
    const steps = [];

    if (headRef.current.value === value) {
      steps.push({ id: headRef.current.id, action: 'found', msg: `Found ${value} at head` });
      steps.push({ id: headRef.current.id, action: 'delete', msg: `Deleting head node ${value}` });
      headRef.current = headRef.current.next;
      sync();
      return { ok: true, msg: `Deleted ${value} (was head)`, steps };
    }

    let curr = headRef.current;
    let idx = 0;
    while (curr.next) {
      steps.push({ id: curr.id, action: 'traverse', msg: `Index ${idx}: checking next node...` });
      if (curr.next.value === value) {
        steps.push({ id: curr.next.id, action: 'found', msg: `Found ${value} at index ${idx + 1}` });
        steps.push({ id: curr.next.id, action: 'delete', msg: `Deleting ${value} — updating ${curr.value}.next` });
        curr.next = curr.next.next;
        sync();
        return { ok: true, msg: `Deleted ${value} from index ${idx + 1}`, steps };
      }
      curr = curr.next;
      idx++;
    }
    steps.push({ id: curr.id, action: 'not-found', msg: `Reached end — ${value} not in list` });
    return { ok: false, msg: `${value} not found in list`, steps };
  }, [sync]);

  const searchNode = useCallback((value) => {
    if (!headRef.current) return { ok: false, msg: 'List is empty', steps: [] };
    const steps = [];
    let curr = headRef.current;
    let idx = 0;

    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `Index ${idx}: comparing ${curr.value} with ${value}` });
      if (curr.value === value) {
        steps.push({ id: curr.id, action: 'found', msg: `Found ${value} at index ${idx}!` });
        return { ok: true, msg: `Found ${value} at index ${idx}`, steps };
      }
      curr = curr.next;
      idx++;
    }
    return { ok: false, msg: `${value} not found (searched ${idx} nodes)`, steps };
  }, []);

  const reverse = useCallback(() => {
    if (!headRef.current) return { ok: false, msg: 'List is empty — nothing to reverse', steps: [] };
    if (!headRef.current.next) return { ok: false, msg: 'List has only one node — nothing to reverse', steps: [] };

    const steps = [];
    let prev = null;
    let curr = headRef.current;
    let idx = 0;

    steps.push({ id: curr.id, action: 'traverse', msg: 'Starting reversal from head' });

    while (curr) {
      const next = curr.next;
      steps.push({ id: curr.id, action: 'compare', msg: `Step ${idx + 1}: reversing pointer of ${curr.value}` });
      curr.next = prev;
      steps.push({ id: curr.id, action: 'found', msg: `${curr.value}.next now points ${prev ? `to ${prev.value}` : 'to null'}` });
      prev = curr;
      curr = next;
      idx++;
    }

    headRef.current = prev;
    steps.push({ id: prev.id, action: 'insert', msg: `Reversal complete — new head is ${prev.value}` });
    sync();
    return { ok: true, msg: `List reversed (${idx} nodes)`, steps };
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
  }, [nodes]); // nodes dependency ensures metrics update

  return {
    nodes, append, prepend, insertAt, deleteNode, searchNode, reverse, clear,
    getMetrics, nodeStates, setNodeStates, currentMessage, setCurrentMessage, clearStates,
  };
}