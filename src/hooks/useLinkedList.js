import { useState, useCallback, useRef } from 'react';

class LLNode {
  constructor(value) {
    this.value = value;
    this.next  = null;
    this.id    = `ll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }
}

export default function useLinkedList() {
  const [nodes,        setNodes]        = useState([]);
  const [nodeStates,   setNodeStates]   = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const headRef = useRef(null);

  // Sync the ref-based list into React state for rendering
  const sync = useCallback(() => {
    const arr = [];
    let curr = headRef.current, safety = 0;
    while (curr && safety++ < 2000) {
      arr.push({ id: curr.id, value: curr.value });
      curr = curr.next;
    }
    setNodes(arr);
  }, []);

  const clearStates = useCallback(() => {
    setNodeStates({});
    setCurrentMessage('');
  }, []);

  const length = useCallback(() => {
    let n = 0, curr = headRef.current;
    while (curr) { n++; curr = curr.next; }
    return n;
  }, []);

  // ── Operations ─────────────────────────────────────────────────────────────

  const append = useCallback((value) => {
    const node  = new LLNode(value);
    const steps = [];

    if (!headRef.current) {
      headRef.current = node;
      steps.push({ id: node.id, action: 'insert', msg: `${value} added as head` });
      sync();
      return { ok: true, msg: `Appended ${value} as head`, steps };
    }

    let curr = headRef.current, idx = 0;
    while (curr.next) {
      steps.push({ id: curr.id, action: 'traverse', msg: `[${idx}] traversing ${curr.value}` });
      curr = curr.next;
      idx++;
    }
    steps.push({ id: curr.id, action: 'traverse', msg: `[${idx}] tail — appending here` });
    curr.next = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} appended at [${idx + 1}]` });
    sync();
    return { ok: true, msg: `Appended ${value} at [${idx + 1}]`, steps };
  }, [sync]);

  const prepend = useCallback((value) => {
    const node = new LLNode(value);
    node.next  = headRef.current;
    headRef.current = node;
    sync();
    return { ok: true, msg: `Prepended ${value} as new head`, steps: [{ id: node.id, action: 'insert', msg: `${value} is new head` }] };
  }, [sync]);

  const insertAt = useCallback((value, index) => {
    if (index < 0)        return { ok: false, msg: 'Index must be ≥ 0', steps: [] };
    if (index === 0)      return prepend(value);
    const len = length();
    if (index > len)      return { ok: false, msg: `Index ${index} out of bounds (length: ${len})`, steps: [] };

    const node  = new LLNode(value);
    const steps = [];
    let curr = headRef.current, i = 0;

    while (curr && i < index - 1) {
      steps.push({ id: curr.id, action: 'traverse', msg: `[${i}] passing ${curr.value}` });
      curr = curr.next;
      i++;
    }
    if (!curr) return { ok: false, msg: `Index out of bounds`, steps };

    steps.push({ id: curr.id, action: 'traverse', msg: `[${i}] inserting after ${curr.value}` });
    node.next = curr.next;
    curr.next = node;
    steps.push({ id: node.id, action: 'insert', msg: `${value} inserted at [${index}]` });
    sync();
    return { ok: true, msg: `Inserted ${value} at [${index}]`, steps };
  }, [sync, prepend, length]);

  const deleteNode = useCallback((value) => {
    if (!headRef.current) return { ok: false, msg: 'List is empty', steps: [] };
    const steps = [];

    if (headRef.current.value === value) {
      steps.push({ id: headRef.current.id, action: 'found',  msg: `Found ${value} at head` });
      steps.push({ id: headRef.current.id, action: 'delete', msg: `Removed head ${value}` });
      headRef.current = headRef.current.next;
      sync();
      return { ok: true, msg: `Deleted ${value} (was head)`, steps };
    }

    let curr = headRef.current, idx = 0;
    while (curr.next) {
      steps.push({ id: curr.id, action: 'traverse', msg: `[${idx}] checking next…` });
      if (curr.next.value === value) {
        steps.push({ id: curr.next.id, action: 'found',  msg: `Found ${value} at [${idx + 1}]` });
        steps.push({ id: curr.next.id, action: 'delete', msg: `Removing ${value}` });
        curr.next = curr.next.next;
        sync();
        return { ok: true, msg: `Deleted ${value}`, steps };
      }
      curr = curr.next;
      idx++;
    }
    steps.push({ id: curr.id, action: 'not-found', msg: `${value} not found` });
    return { ok: false, msg: `${value} not found`, steps };
  }, [sync]);

  const searchNode = useCallback((value) => {
    if (!headRef.current) return { ok: false, msg: 'List is empty', steps: [] };
    const steps = [];
    let curr = headRef.current, idx = 0;
    while (curr) {
      steps.push({ id: curr.id, action: 'compare', msg: `[${idx}] compare ${curr.value} = ${value}?` });
      if (curr.value === value) {
        steps.push({ id: curr.id, action: 'found', msg: `Found ${value} at [${idx}]` });
        return { ok: true, msg: `Found ${value} at [${idx}]`, steps };
      }
      curr = curr.next;
      idx++;
    }
    return { ok: false, msg: `${value} not found`, steps };
  }, []);

  const reverse = useCallback(() => {
    if (!headRef.current?.next) return { ok: false, msg: 'Need at least 2 nodes to reverse', steps: [] };
    const steps = [];
    let prev = null, curr = headRef.current, idx = 0;
    steps.push({ id: curr.id, action: 'traverse', msg: 'Starting reversal from head' });

    while (curr) {
      const next = curr.next;
      steps.push({ id: curr.id, action: 'compare', msg: `Reverse pointer of ${curr.value}` });
      curr.next = prev;
      steps.push({ id: curr.id, action: 'found', msg: `${curr.value}.next → ${prev?.value ?? 'null'}` });
      prev = curr;
      curr = next;
      idx++;
    }

    headRef.current = prev;
    steps.push({ id: prev.id, action: 'insert', msg: `Reversed — new head: ${prev.value}` });
    sync();
    return { ok: true, msg: `Reversed (${idx} nodes)`, steps };
  }, [sync]);

  const clear = useCallback(() => {
    headRef.current = null;
    setNodes([]);
    clearStates();
  }, [clearStates]);

  // getMetrics reads the ref directly — no stale closure from nodes state
  const getMetrics = useCallback(() => {
    let n = 0, curr = headRef.current;
    while (curr) { n++; curr = curr.next; }
    let tail = headRef.current;
    if (tail) while (tail.next) tail = tail.next;
    return {
      length: n,
      head:   headRef.current?.value ?? null,
      tail:   tail?.value ?? null,
      isEmpty: !headRef.current,
    };
  }, []); // No deps — reads ref, always fresh

  return {
    nodes,
    append, prepend, insertAt, deleteNode, searchNode, reverse, clear,
    getMetrics,
    nodeStates, setNodeStates,
    currentMessage, setCurrentMessage,
    clearStates,
  };
}