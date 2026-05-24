import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import OperationButton from '../OperationButton';

const HashSetControls = memo(function HashSetControls() {
  const { app, hashSet, animator } = useAppContext();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const isAnimating = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success: result.ok, message: result.msg });
    if (result.steps.length > 0) {
      app.setAnimating(true);
      hashSet.clearStates();
      try {
        await animator.animate(result.steps, async (step) => {
          if (step.id) hashSet.setItemStates(prev => ({ ...prev, [step.id]: step.action }));
          if (step.bucket !== undefined) {
            hashSet.setItemStates(prev => ({ ...prev, [`bucket_${step.bucket}`]: step.action }));
          }
          if (step.msg) hashSet.setCurrentMessage(step.msg);
        });
      } catch (e) { /* cancelled */ }
      setTimeout(() => hashSet.clearStates(), 900);
      app.setAnimating(false);
    }
    app.setStatus({ type: result.ok ? 'success' : 'error', message: result.msg });
  }, [app, hashSet, animator]);

  const parseVal = (v) => {
    const num = parseInt(v);
    return isNaN(num) ? v.trim() : num;
  };

  const handleAdd = useCallback(async () => {
    if (!value.trim()) { app.setStatus({ type: 'error', message: 'Enter a value' }); return; }
    await runSteps(hashSet.add(parseVal(value)));
    setValue('');
    inputRef.current?.focus();
  }, [value, hashSet, runSteps, app]);

  const handleRemove = useCallback(async () => {
    if (!value.trim()) { app.setStatus({ type: 'error', message: 'Enter a value' }); return; }
    await runSteps(hashSet.remove(parseVal(value)));
    setValue('');
    inputRef.current?.focus();
  }, [value, hashSet, runSteps, app]);

  const handleHas = useCallback(async () => {
    if (!value.trim()) { app.setStatus({ type: 'error', message: 'Enter a value' }); return; }
    await runSteps(hashSet.has(parseVal(value)));
    setValue('');
  }, [value, hashSet, runSteps, app]);

  const handleRandomFill = useCallback(async () => {
    const vals = [];
    const used = new Set();
    while (vals.length < 12) {
      const v = Math.floor(Math.random() * 50) + 1;
      if (!used.has(v)) { vals.push(v); used.add(v); }
    }
    for (const v of vals) {
      hashSet.add(v);
      await new Promise(r => setTimeout(r, 80));
    }
    app.setStatus({ type: 'success', message: `Added ${vals.length} random values` });
    app.addHistory({ success: true, message: `Random fill: ${vals.join(', ')}` });
  }, [hashSet, app]);

  return (
    <div style={styles.container}>
      <InputField
        ref={inputRef}
        value={value}
        onChange={setValue}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder="Enter value..."
        disabled={isAnimating}
        icon="🔑"
        label="Value"
        type="text"
      />

      <div style={styles.section}>
        <span className="section-label">Operations</span>
        <OperationButton label="Add" icon="➕" onClick={handleAdd} disabled={isAnimating} variant="success" />
        <div style={styles.row}>
          <OperationButton label="Remove" icon="🗑️" onClick={handleRemove} disabled={isAnimating} variant="danger" />
          <OperationButton label="Contains" icon="🔍" onClick={handleHas} disabled={isAnimating} variant="primary" />
        </div>
      </div>

      <div className="divider" />

      <div style={styles.section}>
        <span className="section-label">Actions</span>
        <OperationButton label="Random Fill (12)" icon="🎲" onClick={handleRandomFill} disabled={isAnimating} variant="warning" />
        <OperationButton
          label="Clear Set"
          icon="💥"
          onClick={() => { hashSet.clear(); app.setStatus({ type: 'info', message: 'Hash set cleared' }); app.addHistory({ success: true, message: 'Hash set cleared' }); }}
          disabled={isAnimating}
          variant="secondary"
        />
      </div>
    </div>
  );
});

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '12px' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', gap: '6px' },
};

export default HashSetControls;