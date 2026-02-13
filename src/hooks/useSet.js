import { useState, useCallback } from 'react';

export default function useSet() {
  const [items, setItems] = useState([]);
  const [itemStates, setItemStates] = useState({});

  const add = useCallback((val) => {
    if (items.some(i => i.val === val)) return { ok: false, msg: `${val} already exists in set`, steps: [] };
    const id = `set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setItems(p => [...p, { id, val }]);
    return { ok: true, msg: `Added ${val} to set`, steps: [{ id, type: 'insert' }] };
  }, [items]);

  const remove = useCallback((val) => {
    const item = items.find(i => i.val === val);
    if (!item) return { ok: false, msg: `${val} not in set`, steps: [] };
    const steps = [{ id: item.id, type: 'delete' }];
    setTimeout(() => setItems(p => p.filter(i => i.val !== val)), 400);
    return { ok: true, msg: `Removed ${val}`, steps };
  }, [items]);

  const has = useCallback((val) => {
    const item = items.find(i => i.val === val);
    if (item) return { ok: true, msg: `${val} exists in set`, steps: [{ id: item.id, type: 'found' }] };
    return { ok: false, msg: `${val} not in set`, steps: items.map(i => ({ id: i.id, type: 'highlight' })) };
  }, [items]);

  const clear = useCallback(() => { setItems([]); setItemStates({}); }, []);

  const getMetrics = useCallback(() => ({
    size: items.length,
    isEmpty: items.length === 0,
    elements: items.map(i => i.val).join(', '),
  }), [items]);

  return { items, add, remove, has, clear, getMetrics, itemStates, setItemStates };
}