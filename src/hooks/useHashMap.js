import { useState, useCallback } from 'react';

const BUCKET_COUNT = 16;

function hash(key, size) {
  let h = 0;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % size;
  return h;
}

export default function useHashMap() {
  const [buckets, setBuckets] = useState(() => Array.from({ length: BUCKET_COUNT }, () => []));
  const [bucketStates, setBucketStates] = useState({});

  const put = useCallback((key, val) => {
    const idx = hash(key, BUCKET_COUNT);
    const steps = [{ bucket: idx, type: 'hash' }];

    setBuckets(prev => {
      const next = prev.map(b => [...b]);
      const existing = next[idx].findIndex(e => e.key === key);
      if (existing >= 0) {
        next[idx][existing] = { key, val, id: next[idx][existing].id };
        steps.push({ bucket: idx, type: 'update' });
      } else {
        const isCollision = next[idx].length > 0;
        next[idx].push({ key, val, id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` });
        steps.push({ bucket: idx, type: isCollision ? 'collision' : 'insert' });
      }
      return next;
    });

    return { ok: true, msg: `Set "${key}" = ${val} (bucket ${idx})`, steps };
  }, []);

  const get = useCallback((key) => {
    const idx = hash(key, BUCKET_COUNT);
    const steps = [{ bucket: idx, type: 'hash' }];
    const entry = buckets[idx].find(e => e.key === key);
    if (entry) {
      steps.push({ bucket: idx, type: 'found' });
      return { ok: true, msg: `"${key}" = ${entry.val}`, steps, value: entry.val };
    }
    steps.push({ bucket: idx, type: 'notfound' });
    return { ok: false, msg: `Key "${key}" not found`, steps };
  }, [buckets]);

  const remove = useCallback((key) => {
    const idx = hash(key, BUCKET_COUNT);
    const steps = [{ bucket: idx, type: 'hash' }];

    setBuckets(prev => {
      const next = prev.map(b => [...b]);
      const i = next[idx].findIndex(e => e.key === key);
      if (i >= 0) {
        steps.push({ bucket: idx, type: 'delete' });
        next[idx].splice(i, 1);
      }
      return next;
    });

    return { ok: true, msg: `Removed "${key}"`, steps };
  }, []);

  const clear = useCallback(() => {
    setBuckets(Array.from({ length: BUCKET_COUNT }, () => []));
    setBucketStates({});
  }, []);

  const getMetrics = useCallback(() => {
    let total = 0, occupied = 0, maxChain = 0;
    buckets.forEach(b => {
      total += b.length;
      if (b.length > 0) occupied++;
      if (b.length > maxChain) maxChain = b.length;
    });
    return { totalEntries: total, occupiedBuckets: occupied, totalBuckets: BUCKET_COUNT, maxChainLength: maxChain, loadFactor: +(total / BUCKET_COUNT).toFixed(2) };
  }, [buckets]);

  return { buckets, put, get, remove, clear, getMetrics, bucketStates, setBucketStates, BUCKET_COUNT };
}