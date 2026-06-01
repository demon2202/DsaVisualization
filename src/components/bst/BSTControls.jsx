import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import { OperationButton, InputField, SelectField, BtnRow, SectionLabel, Divider } from '../Shared';

const BSTControls = memo(function BSTControls() {
  const { app, bst, animator } = useAppContext();
  const [value, setValue]         = useState('');
  const [traversal, setTraversal] = useState('inorder');
  const inputRef = useRef(null);
  const busy = app.state.isAnimating;

  const run = useCallback(async (steps) => {
    if (!steps.length) return;
    app.setAnimating(true);
    bst.clearStates();
    const vis = [];
    await animator.animate(steps, async (step) => {
      if (step.id) bst.setNodeStates(p => ({ ...p, [step.id]: step.action }));
      if (step.pointerX !== undefined) bst.setPointer({ x: step.pointerX, y: step.pointerY, state: step.action });
      if (step.accumulateVisited && step.id) { vis.push(step.id); bst.setVisitedPath([...vis]); }
      if (step.msg) bst.setCurrentMessage(step.msg);
    });
    await new Promise(r => setTimeout(r, 600));
    bst.clearStates();
    app.setAnimating(false);
  }, [app, bst, animator]);

  const handleInsert = useCallback(async () => {
    const n = parseInt(value); if (isNaN(n)) return;
    const r = bst.insert(n);
    app.addHistory({ success: r.ok, message: r.msg });
    if (r.ok) await run(r.steps);
    setValue(''); inputRef.current?.focus();
  }, [value, bst, app, run]);

  const handleDelete = useCallback(async () => {
    const n = parseInt(value); if (isNaN(n)) return;
    const r = bst.remove(n);
    app.addHistory({ success: r.ok, message: r.msg });
    if (r.ok) await run(r.steps);
    setValue(''); inputRef.current?.focus();
  }, [value, bst, app, run]);

  const handleSearch = useCallback(async () => {
    const n = parseInt(value); if (isNaN(n)) return;
    const r = bst.search(n);
    app.addHistory({ success: r.ok, message: r.msg });
    await run(r.steps);
    setValue('');
  }, [value, bst, app, run]);

  const handleTraversal = useCallback(async () => {
    if (bst.getMetrics().isEmpty) return;
    const { steps, result } = bst.traverse(traversal);
    bst.setTraversalResult([]);
    await run(steps);
    bst.setTraversalResult(result);
    app.addHistory({ success: true, message: `${traversal}: [${result.join(', ')}]` });
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
          if (step.id) bst.setNodeStates(p => ({ ...p, [step.id]: step.action }));
          if (step.pointerX !== undefined) bst.setPointer({ x: step.pointerX, y: step.pointerY, state: step.action });
          if (step.msg) bst.setCurrentMessage(step.msg);
        });
        await new Promise(r2 => setTimeout(r2, 100));
        bst.clearStates();
      }
    }
    app.setAnimating(false);
    app.addHistory({ success: true, message: `Random: [${vals.join(', ')}]` });
  }, [bst, app, animator]);

  const keyDown = useCallback((e) => { if (e.key === 'Enter') handleInsert(); }, [handleInsert]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <InputField ref={inputRef} value={value} onChange={setValue} onKeyDown={keyDown} placeholder="integer…" disabled={busy} icon="#" label="Value" />
      <SectionLabel>Operations</SectionLabel>
      <OperationButton label="Insert" icon="+" onClick={handleInsert} disabled={busy} variant="success" />
      <BtnRow>
        <OperationButton label="Delete" icon="−" onClick={handleDelete} disabled={busy} variant="danger" />
        <OperationButton label="Search" icon="?" onClick={handleSearch} disabled={busy} variant="primary" />
      </BtnRow>
      <Divider />
      <SectionLabel>Traversal</SectionLabel>
      <SelectField value={traversal} onChange={setTraversal} options={[
        { value:'inorder',    label:'In-order   (L→N→R)' },
        { value:'preorder',   label:'Pre-order  (N→L→R)' },
        { value:'postorder',  label:'Post-order (L→R→N)' },
        { value:'levelorder', label:'Level-order (BFS)'  },
      ]} />
      <OperationButton label="Run traversal" onClick={handleTraversal} disabled={busy} variant="warning" />
      {bst.traversalResult.length > 0 && (
        <div className="trav-res">
          <span className="trav-lbl">result</span>
          <code className="trav-code">[{bst.traversalResult.join(', ')}]</code>
        </div>
      )}
      <Divider />
      <SectionLabel>Actions</SectionLabel>
      <OperationButton label="Random fill (7)" onClick={handleRandom} disabled={busy} variant="secondary" />
      <OperationButton label="Clear tree" onClick={() => { bst.clear(); app.addHistory({ success:true, message:'Tree cleared' }); }} disabled={busy} variant="secondary" />
    </div>
  );
});

export default BSTControls;
