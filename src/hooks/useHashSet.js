import { useState, useCallback } from 'react';

const BUCKET_COUNT = 8;

// Improved hash function — better distribution
function hashFn(value, size) {
  const str = String(value);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % size;
}

export default function useHashSet() {
  const [buckets, setBuckets] = useState(() =>
    Array.from({ length: BUCKET_COUNT }, () => [])
  );
  const [itemStates, setItemStates] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [collisionCount, setCollisionCount] = useState(0);

  const clearStates = useCallback(() => {
    setItemStates({});
    setCurrentMessage('');
  }, []);

  const add = useCallback((value) => {
    if (value === '' || value === null || value === undefined) {
      return { ok: false, msg: 'Value cannot be empty', steps: [] };
    }

    const idx = hashFn(value, BUCKET_COUNT);
    const steps = [];

    steps.push({ bucket: idx, action: 'hash', msg: `hash("${value}") → bucket ${idx}` });

    // Check for duplicates
    const bucket = buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      steps.push({ id: bucket[i].id, bucket: idx, action: 'compare', msg: `Comparing with "${bucket[i].value}" in bucket ${idx}` });
      if (bucket[i].value === value) {
        steps.push({ id: bucket[i].id, bucket: idx, action: 'duplicate', msg: `"${value}" already exists — sets contain unique values only` });
        return { ok: false, msg: `"${value}" already in set`, steps };
      }
    }

    const id = `hs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hadCollision = bucket.length > 0;

    if (hadCollision) {
      steps.push({ bucket: idx, action: 'hash', msg: `Collision in bucket ${idx}! Chaining "${value}" after ${bucket.length} existing item(s)` });
      setCollisionCount(prev => prev + 1);
    }

    steps.push({ id, bucket: idx, action: 'insert', msg: `Added "${value}" to bucket ${idx}${hadCollision ? ' (collision resolved by chaining)' : ''}` });

    setBuckets(prev => {
      const copy = prev.map(b => [...b]);
      copy[idx].push({ id, value });
      return copy;
    });
    setTotalItems(prev => prev + 1);
    return { ok: true, msg: `Added "${value}" → bucket ${idx}`, steps };
  }, [buckets]);

  const remove = useCallback((value) => {
    if (value === '' || value === null || value === undefined) {
      return { ok: false, msg: 'Value cannot be empty', steps: [] };
    }

    const idx = hashFn(value, BUCKET_COUNT);
    const steps = [{ bucket: idx, action: 'hash', msg: `hash("${value}") → bucket ${idx}` }];

    const bucket = buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      steps.push({ id: bucket[i].id, bucket: idx, action: 'compare', msg: `Checking "${bucket[i].value}"...` });
      if (bucket[i].value === value) {
        steps.push({ id: bucket[i].id, bucket: idx, action: 'delete', msg: `Found and removing "${value}" from bucket ${idx}` });
        setBuckets(prev => {
          const copy = prev.map(b => [...b]);
          copy[idx].splice(i, 1);
          return copy;
        });
        setTotalItems(prev => prev - 1);
        return { ok: true, msg: `Removed "${value}"`, steps };
      }
    }

    steps.push({ bucket: idx, action: 'not-found', msg: `"${value}" not found in bucket ${idx}` });
    return { ok: false, msg: `"${value}" not found in set`, steps };
  }, [buckets]);

  const has = useCallback((value) => {
    if (value === '' || value === null || value === undefined) {
      return { ok: false, msg: 'Value cannot be empty', steps: [] };
    }

    const idx = hashFn(value, BUCKET_COUNT);
    const steps = [{ bucket: idx, action: 'hash', msg: `hash("${value}") → bucket ${idx}` }];

    const bucket = buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      steps.push({ id: bucket[i].id, bucket: idx, action: 'compare', msg: `Comparing with "${bucket[i].value}"` });
      if (bucket[i].value === value) {
        steps.push({ id: bucket[i].id, bucket: idx, action: 'found', msg: `"${value}" exists in the set (bucket ${idx}, position ${i})` });
        return { ok: true, msg: `"${value}" found in set`, steps };
      }
    }

    steps.push({ bucket: idx, action: 'not-found', msg: `"${value}" is not in the set` });
    return { ok: false, msg: `"${value}" not in set`, steps };
  }, [buckets]);

  const clear = useCallback(() => {
    setBuckets(Array.from({ length: BUCKET_COUNT }, () => []));
    setTotalItems(0);
    setCollisionCount(0);
    clearStates();
  }, [clearStates]);

  const getMetrics = useCallback(() => {
    const counts = buckets.map(b => b.length);
    const maxBucket = Math.max(...counts, 0);
    const nonEmpty = counts.filter(c => c > 0).length;
    const loadFactor = totalItems / BUCKET_COUNT;

    return {
      size: totalItems,
      bucketCount: BUCKET_COUNT,
      loadFactor: +loadFactor.toFixed(2),
      maxBucketDepth: maxBucket,
      usedBuckets: nonEmpty,
      collisions: collisionCount,
      isEmpty: totalItems === 0,
    };
  }, [buckets, totalItems, collisionCount]);

  return {
    buckets, add, remove, has, clear, getMetrics,
    itemStates, setItemStates, currentMessage, setCurrentMessage, clearStates,
  };
}