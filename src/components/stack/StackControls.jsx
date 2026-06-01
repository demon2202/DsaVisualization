import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import { OperationButton, InputField, BtnRow, SectionLabel, Divider } from '../Shared';

const StackControls = memo(function StackControls() {
  const { app, stack, animator } = useAppContext();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const busy = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success:result.ok, message:result.msg });
    if (!result.steps.length) return;
    app.setAnimating(true);
    stack.clearStates();
    await animator.animate(result.steps, async (step) => {
      if (step.id) stack.setItemStates(p => ({ ...p, [step.id]: step.action }));
      if (step.msg) stack.setCurrentMessage(step.msg);
    });
    await new Promise(r => setTimeout(r, 800));
    stack.clearStates();
    app.setAnimating(false);
  }, [app, stack, animator]);

  const getNum = () => { const n = parseInt(value); return isNaN(n) ? null : n; };

  const handlePush   = useCallback(async () => { const n = getNum(); if (n === null) return; const r = stack.push(n); await runSteps(r); setValue(''); inputRef.current?.focus(); }, [value, stack, runSteps]);
  const handlePop    = useCallback(async () => { await runSteps(stack.pop()); }, [stack, runSteps]);
  const handlePeek   = useCallback(async () => { await runSteps(stack.peek()); }, [stack, runSteps]);
  const handleSearch = useCallback(async () => { const n = getNum(); if (n === null) return; await runSteps(stack.searchStack(n)); setValue(''); }, [value, stack, runSteps]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <InputField ref={inputRef} value={value} onChange={setValue} onKeyDown={e => e.key==='Enter' && handlePush()} placeholder="number…" disabled={busy} icon="#" label="Value" />
      <SectionLabel>Operations</SectionLabel>
      <OperationButton label="Push" icon="⬆" onClick={handlePush} disabled={busy} variant="success" />
      <BtnRow>
        <OperationButton label="Pop"  icon="⬇" onClick={handlePop}    disabled={busy} variant="danger"  />
        <OperationButton label="Peek" icon="👁" onClick={handlePeek}   disabled={busy} variant="warning" />
      </BtnRow>
      <OperationButton label="Search" icon="?" onClick={handleSearch} disabled={busy} variant="primary" />
      <Divider />
      <SectionLabel>Actions</SectionLabel>
      <OperationButton label="Clear Stack" onClick={() => { stack.clear(); app.addHistory({ success:true, message:'Stack cleared' }); }} disabled={busy} variant="secondary" />
    </div>
  );
});

export default StackControls;
