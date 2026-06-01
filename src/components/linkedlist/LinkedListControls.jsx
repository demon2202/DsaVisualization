import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import { OperationButton, InputField, BtnRow, SectionLabel, Divider } from '../Shared';

const LinkedListControls = memo(function LinkedListControls() {
  const { app, linkedList, animator } = useAppContext();
  const [value, setValue]   = useState('');
  const [index, setIndex]   = useState('');
  const inputRef = useRef(null);
  const busy = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success: result.ok, message: result.msg });
    if (!result.steps.length) return;
    app.setAnimating(true);
    linkedList.clearStates();
    await animator.animate(result.steps, async (step) => {
      if (step.id) linkedList.setNodeStates(p => ({ ...p, [step.id]: step.action }));
      if (step.msg) linkedList.setCurrentMessage(step.msg);
    });
    await new Promise(r => setTimeout(r, 900));
    linkedList.clearStates();
    app.setAnimating(false);
  }, [app, linkedList, animator]);

  const handleOp = useCallback(async (op) => {
    const n = parseInt(value); if (isNaN(n)) return;
    let r;
    switch (op) {
      case 'append':  r = linkedList.append(n);      break;
      case 'prepend': r = linkedList.prepend(n);     break;
      case 'delete':  r = linkedList.deleteNode(n);  break;
      case 'search':  r = linkedList.searchNode(n);  break;
      default: return;
    }
    await runSteps(r);
    setValue(''); inputRef.current?.focus();
  }, [value, linkedList, runSteps]);

  const handleInsertAt = useCallback(async () => {
    const n = parseInt(value), idx = parseInt(index);
    if (isNaN(n) || isNaN(idx) || idx < 0) return;
    const r = linkedList.insertAt(n, idx);
    await runSteps(r);
    setValue(''); setIndex('');
  }, [value, index, linkedList, runSteps]);

  const handleReverse = useCallback(async () => {
    const r = linkedList.reverse();
    await runSteps(r);
  }, [linkedList, runSteps]);

  const keyDown = useCallback((e) => { if (e.key === 'Enter') handleOp('append'); }, [handleOp]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <InputField ref={inputRef} value={value} onChange={setValue} onKeyDown={keyDown} placeholder="number…" disabled={busy} icon="#" label="Value" />
      <SectionLabel>Operations</SectionLabel>
      <BtnRow>
        <OperationButton label="Append"  icon="→" onClick={() => handleOp('append')}  disabled={busy} variant="success" />
        <OperationButton label="Prepend" icon="←" onClick={() => handleOp('prepend')} disabled={busy} variant="primary" />
      </BtnRow>
      <BtnRow>
        <OperationButton label="Delete" icon="−" onClick={() => handleOp('delete')} disabled={busy} variant="danger" />
        <OperationButton label="Search" icon="?" onClick={() => handleOp('search')} disabled={busy} variant="warning" />
      </BtnRow>
      <Divider />
      <SectionLabel>Insert at Index</SectionLabel>
      <InputField value={index} onChange={setIndex} placeholder="index…" disabled={busy} icon="📍" />
      <OperationButton label="Insert at index" icon="↓" onClick={handleInsertAt} disabled={busy} variant="cyan" />
      <Divider />
      <SectionLabel>Actions</SectionLabel>
      <OperationButton label="Reverse list" icon="⟲" onClick={handleReverse} disabled={busy} variant="warning" />
      <OperationButton label="Clear list" onClick={() => { linkedList.clear(); app.addHistory({ success:true, message:'List cleared' }); }} disabled={busy} variant="secondary" />
    </div>
  );
});

export default LinkedListControls;
