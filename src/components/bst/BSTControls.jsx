import React, { memo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppState';
import InputField from '../InputField';
import SelectField from '../SelectField';
import OperationButton from '../OperationButton';

const BSTControls = memo(function BSTControls() {
  const { app, bst, animator } = useAppContext();
  const [value, setValue] = useState('');
  const [traversal, setTraversal] = useState('inorder');
  const inputRef = useRef(null);
  const isAnimating = app.state.isAnimating;

  const runAnimatedSteps = useCallback(async (steps, finalStatus) => {
    if (steps.length === 0) return;

    app.setAnimating(true);
    bst.clearStates();

    try {
      await animator.animate(steps, async (step) => {
        if (step.id) {
          bst.setNodeStates(prev => ({ ...prev, [step.id]: step.action }));
        }
        if (step.msg) {
          bst.setCurrentMessage(step.msg);
        }
      });
    } catch (e) { /* cancelled */ }

    setTimeout(() => {
      bst.clearStates();
    }, 900);

    app.setAnimating(false);
    if (finalStatus) {
      app.setStatus(finalStatus);
    }
  }, [app, bst, animator]);

  const handleInsert = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) {
      app.setStatus({ type: 'error', message: 'Enter a valid integer', detail: '' });
      return;
    }

    const result = bst.insert(num);
    app.addHistory({ success: result.ok, message: result.msg });

    if (result.ok) {
      await runAnimatedSteps(result.steps, { type: 'success', message: result.msg });
    } else {
      app.setStatus({ type: 'error', message: result.msg });
    }
    setValue('');
    inputRef.current?.focus();
  }, [value, bst, app, runAnimatedSteps]);

  const handleDelete = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) {
      app.setStatus({ type: 'error', message: 'Enter a valid integer' });
      return;
    }

    const result = bst.remove(num);
    app.addHistory({ success: result.ok, message: result.msg });
    await runAnimatedSteps(result.steps, {
      type: result.ok ? 'success' : 'error',
      message: result.msg,
    });
    setValue('');
    inputRef.current?.focus();
  }, [value, bst, app, runAnimatedSteps]);

  const handleSearch = useCallback(async () => {
    const num = parseInt(value);
    if (isNaN(num)) {
      app.setStatus({ type: 'error', message: 'Enter a valid integer' });
      return;
    }

    const result = bst.search(num);
    app.addHistory({ success: result.ok, message: result.msg });
    await runAnimatedSteps(result.steps, {
      type: result.ok ? 'success' : 'error',
      message: result.msg,
    });
    setValue('');
  }, [value, bst, app, runAnimatedSteps]);

  const handleTraversal = useCallback(async () => {
    const metrics = bst.getMetrics();
    if (metrics.isEmpty) {
      app.setStatus({ type: 'error', message: 'Tree is empty — nothing to traverse' });
      return;
    }

    const { steps, result } = bst.traverse(traversal);
    bst.setTraversalResult([]);

    app.setAnimating(true);
    app.setStatus({ type: 'running', message: `Running ${traversal} traversal...` });
    bst.clearStates();

    try {
      const collected = [];
      await animator.animate(steps, async (step) => {
        bst.setNodeStates(prev => ({ ...prev, [step.id]: step.action }));
        bst.setCurrentMessage(step.msg);
        collected.push(step.id);
      });
      bst.setTraversalResult(result);
    } catch (e) { /* cancelled */ }

    setTimeout(() => bst.clearStates(), 1200);
    app.setAnimating(false);

    const resultStr = `[${result.join(', ')}]`;
    app.setStatus({ type: 'success', message: `${traversal} traversal complete`, detail: resultStr });
    app.addHistory({ success: true, message: `${traversal}: ${resultStr}` });
  }, [traversal, bst, app, animator]);

  const handleRandomInsert = useCallback(async () => {
    const count = 7;
    const values = [];
    const used = new Set();
    while (values.length < count) {
      const v = Math.floor(Math.random() * 99) + 1;
      if (!used.has(v) && !bst.has(v)) {
        values.push(v);
        used.add(v);
      }
      if (used.size > 90) break;
    }

    app.setStatus({ type: 'running', message: `Inserting ${values.length} random values...` });
    for (const v of values) {
      bst.insert(v);
      await new Promise(r => setTimeout(r, 120));
    }
    app.setStatus({ type: 'success', message: `Inserted: [${values.join(', ')}]` });
    app.addHistory({ success: true, message: `Random insert: [${values.join(', ')}]` });
  }, [bst, app]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleInsert();
  }, [handleInsert]);

  return (
    <div style={styles.container}>
      {/* Input */}
      <InputField
        ref={inputRef}
        value={value}
        onChange={setValue}
        onKeyDown={handleKeyDown}
        placeholder="Enter a number..."
        disabled={isAnimating}
        icon="🔢"
        label="Value"
      />

      {/* Primary operations */}
      <div style={styles.section}>
        <span className="section-label">Operations</span>
        <div style={styles.btnCol}>
          <OperationButton label="Insert" icon="➕" onClick={handleInsert} disabled={isAnimating} variant="success" tooltip="Add value to BST" />
          <OperationButton label="Delete" icon="🗑️" onClick={handleDelete} disabled={isAnimating} variant="danger" tooltip="Remove value from BST" />
          <OperationButton label="Search" icon="🔍" onClick={handleSearch} disabled={isAnimating} variant="primary" tooltip="Find value in BST" />
        </div>
      </div>

      <div className="divider" />

      {/* Traversals */}
      <div style={styles.section}>
        <span className="section-label">Traversal</span>
        <SelectField
          value={traversal}
          onChange={setTraversal}
          icon="🔄"
          options={[
            { value: 'inorder', label: '↙ In-order (LNR)' },
            { value: 'preorder', label: '↓ Pre-order (NLR)' },
            { value: 'postorder', label: '↗ Post-order (LRN)' },
            { value: 'levelorder', label: '→ Level-order (BFS)' },
          ]}
        />
        <OperationButton label="Run Traversal" icon="▶️" onClick={handleTraversal} disabled={isAnimating} variant="warning" />
      </div>

      {/* Traversal result */}
      {bst.traversalResult.length > 0 && (
        <div style={styles.resultBox} className="anim-fade">
          <div style={styles.resultLabel}>📋 Traversal Result</div>
          <div style={styles.resultValue}>[{bst.traversalResult.join(', ')}]</div>
        </div>
      )}

      <div className="divider" />

      {/* Utility actions */}
      <div style={styles.section}>
        <span className="section-label">Actions</span>
        <OperationButton label="Random Fill (7)" icon="🎲" onClick={handleRandomInsert} disabled={isAnimating} variant="cyan" />
        <OperationButton
          label="Clear Tree"
          icon="💥"
          onClick={() => {
            bst.clear();
            app.setStatus({ type: 'info', message: 'Tree cleared' });
            app.addHistory({ success: true, message: 'Tree cleared' });
          }}
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
  btnCol: { display: 'flex', flexDirection: 'column', gap: '6px' },
  resultBox: {
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.2)',
  },
  resultLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--accent-emerald)',
    marginBottom: '6px',
    letterSpacing: '0.3px',
  },
  resultValue: {
    fontSize: '0.82rem',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },
};

export default BSTControls;