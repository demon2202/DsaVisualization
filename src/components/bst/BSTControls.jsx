import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import SelectField from '../SelectField';
import OperationButton from '../OperationButton';

const BSTControls = memo(function BSTControls() {
  const { app, bst, animator } = useAppContext();
  const [value, setValue]       = useState('');
  const [traversal, setTraversal] = useState('inorder');
  const inputRef = useRef(null);
  const busy = app.state.isAnimating;

  /**
   * Core runner — plays steps one by one.
   * Each step can update: node state, pointer position, visited path, message.
   */
  const run = useCallback(async (steps, finalStatus) => {
    if (!steps.length) return;
    app.setAnimating(true);
    bst.clearStates();

    const visitedIds = [];

    await animator.animate(steps, async (step) => {
      // Update the highlighted node
      if (step.id) {
        bst.setNodeStates(prev => ({ ...prev, [step.id]: step.action }));
      }
      // Move the animated pointer ball
      if (step.pointerX !== undefined && step.pointerY !== undefined) {
        bst.setPointer({ x: step.pointerX, y: step.pointerY, state: step.action });
      }
      // Accumulate visited nodes (for traversal highlight trail)
      if (step.accumulateVisited && step.id) {
        visitedIds.push(step.id);
        bst.setVisitedPath([...visitedIds]);
      }
      if (step.msg) bst.setCurrentMessage(step.msg);
    });

    // Hold final state briefly so user sees the result
    await new Promise(r => setTimeout(r, 600));
    bst.clearStates();
    app.setAnimating(false);
    if (finalStatus) app.setStatus(finalStatus);
  }, [app, bst, animator]);

  const handleInsert = useCallback(async () => {
    const n = parseInt(value);
    if (isNaN(n)) { app.setStatus({ type: 'error', message: 'Enter a valid integer' }); return; }
    const r = bst.insert(n);
    app.addHistory({ success: r.ok, message: r.msg });
    if (r.ok) await run(r.steps, { type: 'success', message: r.msg });
    else app.setStatus({ type: 'error', message: r.msg });
    setValue('');
    inputRef.current?.focus();
  }, [value, bst, app, run]);

  const handleDelete = useCallback(async () => {
    const n = parseInt(value);
    if (isNaN(n)) { app.setStatus({ type: 'error', message: 'Enter a valid integer' }); return; }
    const r = bst.remove(n);
    app.addHistory({ success: r.ok, message: r.msg });
    if (r.ok) await run(r.steps, { type: 'success', message: r.msg });
    else app.setStatus({ type: 'error', message: r.msg });
    setValue('');
    inputRef.current?.focus();
  }, [value, bst, app, run]);

  const handleSearch = useCallback(async () => {
    const n = parseInt(value);
    if (isNaN(n)) { app.setStatus({ type: 'error', message: 'Enter a valid integer' }); return; }
    const r = bst.search(n);
    app.addHistory({ success: r.ok, message: r.msg });
    await run(r.steps, { type: r.ok ? 'success' : 'error', message: r.msg });
    setValue('');
  }, [value, bst, app, run]);

  const handleTraversal = useCallback(async () => {
    const m = bst.getMetrics();
    if (m.isEmpty) { app.setStatus({ type: 'error', message: 'Tree is empty' }); return; }
    const { steps, result } = bst.traverse(traversal);
    bst.setTraversalResult([]);
    app.setStatus({ type: 'running', message: `Running ${traversal} traversal…` });
    await run(steps, null);
    bst.setTraversalResult(result);
    const str = `[${result.join(', ')}]`;
    app.setStatus({ type: 'success', message: `${traversal} complete`, detail: str });
    app.addHistory({ success: true, message: `${traversal}: ${str}` });
  }, [traversal, bst, app, run]);

  const handleRandom = useCallback(async () => {
    const vals = [], seen = new Set();
    while (vals.length < 7) {
      const v = Math.floor(Math.random() * 99) + 1;
      if (!seen.has(v) && !bst.has(v)) { vals.push(v); seen.add(v); }
      if (seen.size > 95) break;
    }
    app.setAnimating(true);
    for (const v of vals) {
      const r = bst.insert(v);
      if (r.ok && r.steps.length) {
        await animator.animate(r.steps, async (step) => {
          if (step.id) bst.setNodeStates(prev => ({ ...prev, [step.id]: step.action }));
          if (step.pointerX !== undefined) bst.setPointer({ x: step.pointerX, y: step.pointerY, state: step.action });
          if (step.msg) bst.setCurrentMessage(step.msg);
        });
        await new Promise(r2 => setTimeout(r2, 120));
        bst.clearStates();
      }
    }
    app.setAnimating(false);
    app.setStatus({ type: 'success', message: `Inserted: [${vals.join(', ')}]` });
    app.addHistory({ success: true, message: `Random fill: [${vals.join(', ')}]` });
  }, [bst, app, animator]);

  const keyDown = useCallback((e) => { if (e.key === 'Enter') handleInsert(); }, [handleInsert]);

  return (
    <div style={s.wrap}>
      <InputField ref={inputRef} value={value} onChange={setValue} onKeyDown={keyDown}
        placeholder="integer value…" disabled={busy} icon="#" label="Value" />

      <div style={s.section}>
        <span className="section-label">Operations</span>
        <OperationButton label="Insert" icon="+" onClick={handleInsert} disabled={busy} variant="success" />
        <OperationButton label="Delete" icon="−" onClick={handleDelete} disabled={busy} variant="danger" />
        <OperationButton label="Search" icon="?" onClick={handleSearch} disabled={busy} variant="primary" />
      </div>

      <div className="divider" />

      <div style={s.section}>
        <span className="section-label">Traversal</span>
        <SelectField value={traversal} onChange={setTraversal} options={[
          { value: 'inorder',    label: 'In-order   (L → N → R)' },
          { value: 'preorder',   label: 'Pre-order  (N → L → R)' },
          { value: 'postorder',  label: 'Post-order (L → R → N)' },
          { value: 'levelorder', label: 'Level-order (BFS)' },
        ]} />
        <OperationButton label="Run traversal" onClick={handleTraversal} disabled={busy} variant="warning" />
      </div>

      {bst.traversalResult.length > 0 && (
        <div style={s.result} className="anim-fade">
          <span style={s.resultLabel}>traversal result</span>
          <code style={s.resultCode}>[{bst.traversalResult.join(', ')}]</code>
        </div>
      )}

      <div className="divider" />

      <div style={s.section}>
        <span className="section-label">Actions</span>
        <OperationButton label="Random fill (7)" onClick={handleRandom} disabled={busy} variant="secondary" />
        <OperationButton label="Clear tree" onClick={() => {
          bst.clear();
          app.setStatus({ type: 'info', message: 'Tree cleared' });
          app.addHistory({ success: true, message: 'Tree cleared' });
        }} disabled={busy} variant="secondary" />
      </div>
    </div>
  );
});

const s = {
  wrap:    { display: 'flex', flexDirection: 'column', gap: '10px' },
  section: { display: 'flex', flexDirection: 'column', gap: '6px' },
  result: {
    padding: '10px 12px', borderRadius: '6px',
    background: 'rgba(52,211,153,0.07)',
    border: '1px solid rgba(52,211,153,0.18)',
  },
  resultLabel: {
    display: 'block', fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
    color: 'var(--emerald)', fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: '4px',
  },
  resultCode: {
    fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.5,
  },
};

export default BSTControls;