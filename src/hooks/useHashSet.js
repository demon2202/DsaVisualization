import { useState, useCallback } from 'react';

const BUCKET_COUNT = 8;

function hashFn(value, size) {
  let hash = 0;
  const str = String(value);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % size;
}

export default function useHashSet() {
  const [buckets, setBuckets] = useState(() => Array.from({ length: BUCKET_COUNT }, () => []));
  const [itemStates, setItemStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [totalItems, setTotalItems] = useState(0);

  const clearStates = useCallback(() => {
    setItemStates({});
    setCurrentMessage('');
  }, []);

  const add = useCallback((value) => {
    const idx = hashFn(value, BUCKET_COUNT);
    const steps = [];

    steps.push({ bucket: idx, action: 'hash', msg: `hash(${value}) = ${idx}` });

    const existing = buckets[idx].find(item => item.value === value);
    if (existing) {
      steps.push({ id: existing.id, bucket: idx, action: 'duplicate', msg: `${value} already exists in bucket ${idx}` });
      return { ok: false, msg: `${value} already in set`, steps };
    }

    const id = `hs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    steps.push({ id, bucket: idx, action: 'insert', msg: `Adding ${value} to bucket ${idx}` });

    setBuckets(prev => {
      const copy = prev.map(b => [...b]);
      copy[idx].push({ id, value });
      return copy;
    });
    setTotalItems(prev => prev + 1);
    return { ok: true, msg: `Added ${value} (bucket ${idx})`, steps };
  }, [buckets]);

  const remove = useCallback((value) => {
    const idx = hashFn(value, BUCKET_COUNT);
    const steps = [{ bucket: idx, action: 'hash', msg: `hash(${value}) = ${idx}` }];

    const bucket = buckets[idx];
    const itemIdx = bucket.findIndex(item => item.value === value);

    if (itemIdx === -1) {
      steps.push({ bucket: idx, action: 'not-found', msg: `${value} not in bucket ${idx}` });
      return { ok: false, msg: `${value} not found`, steps };
    }

    steps.push({ id: bucket[itemIdx].id, bucket: idx, action: 'delete', msg: `Removing ${value}` });

    setBuckets(prev => {
      const copy = prev.map(b => [...b]);
      copy[idx].splice(itemIdx, 1);
      return copy;
    });
    setTotalItems(prev => prev - 1);
    return { ok: true, msg: `Removed ${value}`, steps };
  }, [buckets]);

  const has = useCallback((value) => {
    const idx = hashFn(value, BUCKET_COUNT);
    const steps = [{ bucket: idx, action: 'hash', msg: `hash(${value}) = ${idx}` }];

    const bucket = buckets[idx];
    for (const item of bucket) {
      steps.push({ id: item.id, bucket: idx, action: 'compare', msg: `Comparing with ${item.value}` });
      if (item.value === value) {
        steps.push({ id: item.id, bucket: idx, action: 'found', msg: `Found ${value}!` });
        return { ok: true, msg: `${value} exists in set`, steps };
      }
    }
    return { ok: false, msg: `${value} not in set`, steps };
  }, [buckets]);

  const clear = useCallback(() => {
    setBuckets(Array.from({ length: BUCKET_COUNT }, () => []));
    setTotalItems(0);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => {
    const counts = buckets.map(b => b.length);
    const maxBucket = Math.max(...counts, 0);
    const loadFactor = totalItems / BUCKET_COUNT;
    return {
      size: totalItems,
      bucketCount: BUCKET_COUNT,
      loadFactor: +loadFactor.toFixed(2),
      maxBucketDepth: maxBucket,
      isEmpty: totalItems === 0,
    };
  }, [buckets, totalItems]);

  return {
    buckets, add, remove, has, clear, getMetrics,
    itemStates, setItemStates, currentMessage, setCurrentMessage, clearStates,
  };
}