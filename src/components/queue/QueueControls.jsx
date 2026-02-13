import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import OperationButton from '../OperationButton';

const QueueControls = memo(function QueueControls() {
  const { app, queue, animator } = useAppContext();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const isAnimating = app.state.isAnimating;

  const runSteps = useCallback(async (result) => {
    app.addHistory({ success: result.ok, message: result.msg });
    if (result.steps.length > 0) {
      app.setAnimating(true);
      queue.clearStates();
      try {
        await animator.animate(result.steps, async (step) => {
          if (step.id) queue.setItemStates(prev => ({ ...prev, [step.id]: step.action }));
          if (step.msg) queue.setCurrentMessage(step.msg);
        });
      } catch (e) { /* cancelled */ }
      setTimeout(() => queue.clearStates(), 800);
      app.setAnimating(false);
    }
    app.setStatus({ type: result.ok ? 'success' : 'error', message: result.msg });
  }, [app, queue, animator]);

  const handleEnqueue = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) { app.setStatus({ type: 'error', message: 'Enter a valid number' }); return; }
    await runSteps(queue.enqueue(num));
    setValue('');
    inputRef.current?.focus();
  }, [value, queue, runSteps, app]);

  const handleDequeue = useCallback(async () => {
    await runSteps(queue.dequeue());
  }, [queue, runSteps]);

  const handlePeek = useCallback(async () => {
    await runSteps(queue.peekQueue());
  }, [queue, runSteps]);

  const handleSearch = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) { app.setStatus({ type: 'error', message: 'Enter a valid number' }); return; }
    await runSteps(queue.searchQueue(num));
    setValue('');
  }, [value, queue, runSteps, app]);

  return (
    <div style={styles.container}>
      <InputField
        ref={inputRef}
        value={value}
        onChange={setValue}
        onKeyDown={e => e.key === 'Enter' && handleEnqueue()}
        placeholder="Enter value..."
        disabled={isAnimating}
        icon="🔢"
        label="Value"
      />

      <div style={styles.section}>
        <span className="section-label">Operations</span>
        <OperationButton label="Enqueue" icon="➡️" onClick={handleEnqueue} disabled={isAnimating} variant="success" />
        <div style={styles.row}>
          <OperationButton label="Dequeue" icon="⬅️" onClick={handleDequeue} disabled={isAnimating} variant="danger" />
          <OperationButton label="Peek" icon="👁️" onClick={handlePeek} disabled={isAnimating} variant="warning" />
        </div>
        <OperationButton label="Search" icon="🔍" onClick={handleSearch} disabled={isAnimating} variant="primary" />
      </div>

      <div className="divider" />

      <OperationButton
        label="Clear Queue"
        icon="💥"
        onClick={() => { queue.clear(); app.setStatus({ type: 'info', message: 'Queue cleared' }); app.addHistory({ success: true, message: 'Queue cleared' }); }}
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

export default QueueControls;