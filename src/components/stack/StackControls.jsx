import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import OperationButton from '../OperationButton';

const StackControls = memo(function StackControls() {
  const { app, stack, animator } = useAppContext();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const isAnimating = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success: result.ok, message: result.msg });
    if (result.steps.length > 0) {
      app.setAnimating(true);
      stack.clearStates();
      try {
        await animator.animate(result.steps, async (step) => {
          if (step.id) stack.setItemStates(prev => ({ ...prev, [step.id]: step.action }));
          if (step.msg) stack.setCurrentMessage(step.msg);
        });
      } catch (e) { /* cancelled */ }
      setTimeout(() => stack.clearStates(), 800);
      app.setAnimating(false);
    }
    app.setStatus({ type: result.ok ? 'success' : 'error', message: result.msg });
  }, [app, stack, animator]);

  const handlePush = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) { app.setStatus({ type: 'error', message: 'Enter a valid number' }); return; }
    await runSteps(stack.push(num));
    setValue('');
    inputRef.current?.focus();
  }, [value, stack, runSteps, app]);

  const handlePop = useCallback(async () => {
    await runSteps(stack.pop());
  }, [stack, runSteps]);

  const handlePeek = useCallback(async () => {
    await runSteps(stack.peek());
  }, [stack, runSteps]);

  const handleSearch = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) { app.setStatus({ type: 'error', message: 'Enter a valid number' }); return; }
    await runSteps(stack.searchStack(num));
    setValue('');
  }, [value, stack, runSteps, app]);

  return (
    <div style={styles.container}>
      <InputField
        ref={inputRef}
        value={value}
        onChange={setValue}
        onKeyDown={e => e.key === 'Enter' && handlePush()}
        placeholder="Enter value..."
        disabled={isAnimating}
        icon="🔢"
        label="Value"
      />

      <div style={styles.section}>
        <span className="section-label">Operations</span>
        <OperationButton label="Push" icon="⬆️" onClick={handlePush} disabled={isAnimating} variant="success" />
        <div style={styles.row}>
          <OperationButton label="Pop" icon="⬇️" onClick={handlePop} disabled={isAnimating} variant="danger" />
          <OperationButton label="Peek" icon="👁️" onClick={handlePeek} disabled={isAnimating} variant="warning" />
        </div>
        <OperationButton label="Search" icon="🔍" onClick={handleSearch} disabled={isAnimating} variant="primary" />
      </div>

      <div className="divider" />

      <OperationButton
        label="Clear Stack"
        icon="💥"
        onClick={() => { stack.clear(); app.setStatus({ type: 'info', message: 'Stack cleared' }); app.addHistory({ success: true, message: 'Stack cleared' }); }}
        disabled={isAnimating}
        variant="secondary"
      />
    </div>
  );
});

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '12px' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', gap: '6px' },
};

export default StackControls;