import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import { OperationButton, BtnRow, SectionLabel, Divider } from '../Shared';

const HashSetControls = memo(function HashSetControls() {
  const { app, hashSet, animator } = useAppContext();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const busy = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success:result.ok, message:result.msg });
    if (!result.steps.length) return;
    app.setAnimating(true);
    hashSet.clearStates();
    await animator.animate(result.steps, async (step) => {
      if (step.id) hashSet.setItemStates(p => ({ ...p, [step.id]: step.action }));
      if (step.bucket !== undefined) hashSet.setItemStates(p => ({ ...p, [`bucket_${step.bucket}`]: step.action }));
      if (step.msg) hashSet.setCurrentMessage(step.msg);
    });
    await new Promise(r => setTimeout(r, 900));
    hashSet.clearStates();
    app.setAnimating(false);
  }, [app, hashSet, animator]);

  const parseVal = v => { const n = parseInt(v); return isNaN(n) ? v.trim() : n; };
  const handleAdd    = useCallback(async () => { if (!value.trim()) return; await runSteps(hashSet.add(parseVal(value))); setValue(''); inputRef.current?.focus(); }, [value, hashSet, runSteps]);
  const handleRemove = useCallback(async () => { if (!value.trim()) return; await runSteps(hashSet.remove(parseVal(value))); setValue(''); inputRef.current?.focus(); }, [value, hashSet, runSteps]);
  const handleHas    = useCallback(async () => { if (!value.trim()) return; await runSteps(hashSet.has(parseVal(value))); setValue(''); }, [value, hashSet, runSteps]);

  const handleRandom = useCallback(async () => {
    const vals = [], used = new Set();
    while (vals.length < 12) { const v = Math.floor(Math.random()*50)+1; if (!used.has(v)) { vals.push(v); used.add(v); } }
    for (const v of vals) { hashSet.add(v); await new Promise(r => setTimeout(r, 80)); }
    app.addHistory({ success:true, message:`Random fill: ${vals.join(', ')}` });
  }, [hashSet, app]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <div className="f-wrap">
        <label className="f-lbl">Value</label>
        <div className="f-box">
          <span className="f-icon">#</span>
          <input ref={inputRef} className="f-input" type="text" value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleAdd()}
            placeholder="value…" disabled={busy}
          />
        </div>
      </div>
      <SectionLabel>Operations</SectionLabel>
      <OperationButton label="Add" icon="+" onClick={handleAdd} disabled={busy} variant="success" />
      <BtnRow>
        <OperationButton label="Remove"   icon="−" onClick={handleRemove} disabled={busy} variant="danger"  />
        <OperationButton label="Contains" icon="?" onClick={handleHas}    disabled={busy} variant="primary" />
      </BtnRow>
      <Divider />
      <SectionLabel>Actions</SectionLabel>
      <OperationButton label="Random Fill (12)" icon="⊕" onClick={handleRandom} disabled={busy} variant="warning" />
      <OperationButton label="Clear" onClick={() => { hashSet.clear(); app.addHistory({ success:true, message:'Hash set cleared' }); }} disabled={busy} variant="secondary" />
    </div>
  );
});

export default HashSetControls;
