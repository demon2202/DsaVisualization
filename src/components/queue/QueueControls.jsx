import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import { OperationButton, InputField, BtnRow, SectionLabel, Divider } from '../Shared';

const QueueControls = memo(function QueueControls() {
  const { app, queue, animator } = useAppContext();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const busy = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success:result.ok, message:result.msg });
    if (!result.steps.length) return;
    app.setAnimating(true);
    queue.clearStates();
    await animator.animate(result.steps, async (step) => {
      if (step.id) queue.setItemStates(p => ({ ...p, [step.id]: step.action }));
      if (step.msg) queue.setCurrentMessage(step.msg);
    });
    await new Promise(r => setTimeout(r, 800));
    queue.clearStates();
    app.setAnimating(false);
  }, [app, queue, animator]);

  const getNum = () => { const n = parseInt(value); return isNaN(n) ? null : n; };
  const handleEnqueue = useCallback(async () => { const n = getNum(); if (n===null) return; await runSteps(queue.enqueue(n)); setValue(''); inputRef.current?.focus(); }, [value, queue, runSteps]);
  const handleDequeue = useCallback(async () => { await runSteps(queue.dequeue()); }, [queue, runSteps]);
  const handlePeek    = useCallback(async () => { await runSteps(queue.peekQueue()); }, [queue, runSteps]);
  const handleSearch  = useCallback(async () => { const n = getNum(); if (n===null) return; await runSteps(queue.searchQueue(n)); setValue(''); }, [value, queue, runSteps]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <InputField ref={inputRef} value={value} onChange={setValue} onKeyDown={e => e.key==='Enter' && handleEnqueue()} placeholder="number…" disabled={busy} icon="#" label="Value" />
      <SectionLabel>Operations</SectionLabel>
      <OperationButton label="Enqueue" icon="→" onClick={handleEnqueue} disabled={busy} variant="success" />
      <BtnRow>
        <OperationButton label="Dequeue" icon="←" onClick={handleDequeue} disabled={busy} variant="danger"  />
        <OperationButton label="Peek"    icon="👁" onClick={handlePeek}    disabled={busy} variant="warning" />
      </BtnRow>
      <OperationButton label="Search" icon="?" onClick={handleSearch} disabled={busy} variant="primary" />
      <Divider />
      <SectionLabel>Actions</SectionLabel>
      <OperationButton label="Clear Queue" onClick={() => { queue.clear(); app.addHistory({ success:true, message:'Queue cleared' }); }} disabled={busy} variant="secondary" />
    </div>
  );
});

export default QueueControls;
