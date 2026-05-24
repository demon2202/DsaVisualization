import { useState, useCallback, useRef } from 'react';

const TABLE_SIZE = 8;

export default function useHashTable() {
  const [buckets, setBuckets] = useState(() => Array.from({ length: TABLE_SIZE }, () => []));
  const [nodeStates, setNodeStates] = useState({});
  const bucketRef = useRef(Array.from({ length: TABLE_SIZE }, () => []));

  const hash = useCallback((key) => {
    let h = 0;
    const s = String(key);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % TABLE_SIZE;
    return h;
  }, []);

  const sync = useCallback(() => setBuckets(bucketRef.current.map(b => [...b])), []);

  const insert = useCallback((key, value) => {
    const idx = hash(key);
    const id = `ht_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const steps = [{ bucketIdx: idx, type: 'hash', detail: `hash("${key}") = ${idx}` }];
    const bucket = bucketRef.current[idx];
    const existing = bucket.findIndex(e => e.key === key);
    if (existing !== -1) {
      bucket[existing] = { ...bucket[existing], value, id: bucket[existing].id };
      steps.push({ nodeId: bucket[existing].id, type: 'update' });
      sync();
      return { success: true, message: `Updated key "${key}" = ${value} in bucket ${idx}`, steps };
    }
    bucket.push({ id, key, value });
    steps.push({ nodeId: id, type: 'insert' });
    sync();
    return { success: true, message: `Inserted "${key}" = ${value} → bucket ${idx}`, steps };
  }, [hash, sync]);

  const remove = useCallback((key) => {
    const idx = hash(key);
    const steps = [{ bucketIdx: idx, type: 'hash' }];
    const bucket = bucketRef.current[idx];
    const i = bucket.findIndex(e => e.key === key);
    if (i === -1) return { success: false, message: `Key "${key}" not found`, steps };
    steps.push({ nodeId: bucket[i].id, type: 'delete' });
    bucket.splice(i, 1);
    sync();
    return { success: true, message: `Removed "${key}" from bucket ${idx}`, steps };
  }, [hash, sync]);

  const search = useCallback((key) => {
    const idx = hash(key);
    const steps = [{ bucketIdx: idx, type: 'hash', detail: `hash("${key}") = ${idx}` }];
    const bucket = bucketRef.current[idx];
    for (let i = 0; i < bucket.length; i++) {
      steps.push({ nodeId: bucket[i].id, type: 'comparing' });
      if (bucket[i].key === key) {
        steps.push({ nodeId: bucket[i].id, type: 'found' });
        return { success: true, message: `Found "${key}" = ${bucket[i].value} in bucket ${idx}`, steps };
      }
    }
    return { success: false, message: `Key "${key}" not found`, steps };
  }, [hash]);

  const clear = useCallback(() => {
    bucketRef.current = Array.from({ length: TABLE_SIZE }, () => []);
    setBuckets(Array.from({ length: TABLE_SIZE }, () => []));
    setNodeStates({});
  }, []);

  const getMetrics = useCallback(() => {
    let totalItems = 0, maxChain = 0, usedBuckets = 0;
    bucketRef.current.forEach(b => {
      totalItems += b.length;
      if (b.length > maxChain) maxChain = b.length;
      if (b.length > 0) usedBuckets++;
    });
    return {
      totalItems, tableSize: TABLE_SIZE, loadFactor: +(totalItems / TABLE_SIZE).toFixed(2),
      maxChainLength: maxChain, usedBuckets,
    };
  }, []);

  return { buckets, insert, remove, search, clear, getMetrics, hash, nodeStates, setNodeStates };
}