import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import OperationButton from '../OperationButton';

const LinkedListControls = memo(function LinkedListControls() {
  const { app, linkedList, animator } = useAppContext();
  const [value, setValue] = useState('');
  const [indexVal, setIndexVal] = useState('');
  const inputRef = useRef(null);
  const isAnimating = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success: result.ok, message: result.msg });

    if (result.steps.length > 0) {
      app.setAnimating(true);
      linkedList.clearStates();

      try {
        await animator.animate(result.steps, async (step) => {
          if (step.id) linkedList.setNodeStates(prev => ({ ...prev, [step.id]: step.action }));
          if (step.msg) linkedList.setCurrentMessage(step.msg);
        });
      } catch (e) { /* cancelled */ }

      setTimeout(() => linkedList.clearStates(), 900);
      app.setAnimating(false);
    }

    app.setStatus({ type: result.ok ? 'success' : 'error', message: result.msg });
  }, [app, linkedList, animator]);

  const handleOp = useCallback(async (op) => {
    const num = parseInt(value);
    if (isNaN(num)) {
      app.setStatus({ type: 'error', message: 'Enter a valid number' });
      return;
    }

    let result;
    switch (op) {
      case 'append': result = linkedList.append(num); break;
      case 'prepend': result = linkedList.prepend(num); break;
      case 'delete': result = linkedList.deleteNode(num); break;
      case 'search': result = linkedList.searchNode(num); break;
      default: return;
    }

    await runSteps(result);
    setValue('');
    inputRef.current?.focus();
  }, [value, linkedList, runSteps, app]);

  const handleInsertAt = useCallback(async () => {
    const num = parseInt(value);
    const idx = parseInt(indexVal);
    if (isNaN(num)) { app.setStatus({ type: 'error', message: 'Enter a valid value' }); return; }
    if (isNaN(idx) || idx < 0) { app.setStatus({ type: 'error', message: 'Enter a valid index ≥ 0' }); return; }

    const result = linkedList.insertAt(num, idx);
    await runSteps(result);
    setValue('');
    setIndexVal('');
  }, [value, indexVal, linkedList, runSteps, app]);

  const handleReverse = useCallback(async () => {
    const result = linkedList.reverse();
    await runSteps(result);
  }, [linkedList, runSteps]);

  return (
    <div style={styles.container}>
      <InputField
        ref={inputRef}
        value={value}
        onChange={setValue}
        onKeyDown={e => e.key === 'Enter' && handleOp('append')}
        placeholder="Enter value..."
        disabled={isAnimating}
        icon="🔢"
        label="Value"
      />

      <div style={styles.section}>
        <span className="section-label">Operations</span>
        <div style={styles.row}>
          <OperationButton label="Append" icon="➡️" onClick={() => handleOp('append')} disabled={isAnimating} variant="success" />
          <OperationButton label="Prepend" icon="⬅️" onClick={() => handleOp('prepend')} disabled={isAnimating} variant="primary" />
        </div>
        <div style={styles.row}>
          <OperationButton label="Delete" icon="🗑️" onClick={() => handleOp('delete')} disabled={isAnimating} variant="danger" />
          <OperationButton label="Search" icon="🔍" onClick={() => handleOp('search')} disabled={isAnimating} variant="warning" />
        </div>
      </div>

      <div className="divider" />

      <div style={styles.section}>
        <span className="section-label">Insert at Index</span>
        <InputField
          value={indexVal}
          onChange={setIndexVal}
          placeholder="Index..."
          disabled={isAnimating}
          icon="📍"
        />
        <OperationButton label="Insert at Index" icon="📌" onClick={handleInsertAt} disabled={isAnimating} variant="cyan" />
      </div>

      <div className="divider" />

      <div style={styles.section}>
        <span className="section-label">Actions</span>
        <OperationButton label="Reverse List" icon="🔄" onClick={handleReverse} disabled={isAnimating} variant="warning" />
        <OperationButton
          label="Clear List"
          icon="💥"
          onClick={() => { linkedList.clear(); app.setStatus({ type: 'info', message: 'List cleared' }); app.addHistory({ success: true, message: 'List cleared' }); }}
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

export default LinkedListControls;