import React, { memo, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';
import ComplexityTable from './ComplexityTable';
import UseCaseList from './UseCaseList';

const references = {
  bst: {
    name: 'Binary Search Tree',
    complexities: [
      { op: 'Search', avg: 'O(log n)', worst: 'O(n)' },
      { op: 'Insert', avg: 'O(log n)', worst: 'O(n)' },
      { op: 'Delete', avg: 'O(log n)', worst: 'O(n)' },
      { op: 'Traversal', avg: 'O(n)', worst: 'O(n)' },
    ],
    space: 'O(n)',
    useCases: [
      'Database indexing & range queries',
      'Auto-complete & dictionary lookup',
      'Priority scheduling systems',
      'Sorted data maintenance',
      'Expression parsing in compilers',
    ],
    tips: [
      { emoji: '💡', text: 'A balanced BST guarantees O(log n) operations — consider AVL or Red-Black trees.' },
      { emoji: '📊', text: 'In-order traversal always produces sorted output in ascending order.' },
      { emoji: '⚠️', text: 'Inserting sorted data creates a degenerate tree (linked list) — O(n) performance.' },
      { emoji: '🔑', text: 'BST property: left subtree < root < right subtree for every node.' },
    ],
  },
  linkedlist: {
    name: 'Singly Linked List',
    complexities: [
      { op: 'Prepend', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Append', avg: 'O(n)', worst: 'O(n)' },
      { op: 'Search', avg: 'O(n)', worst: 'O(n)' },
      { op: 'Delete', avg: 'O(n)', worst: 'O(n)' },
      { op: 'Reverse', avg: 'O(n)', worst: 'O(n)' },
    ],
    space: 'O(n)',
    useCases: [
      'Implementing stacks & queues',
      'Undo/Redo functionality',
      'Hash table collision chaining',
      'Dynamic memory allocation',
      'Music/video playlist management',
    ],
    tips: [
      { emoji: '💡', text: 'Keep a tail pointer for O(1) append.' },
      { emoji: '🚫', text: 'No random access — must traverse from head.' },
      { emoji: '✅', text: 'Great for frequent insertions/deletions at the beginning.' },
      { emoji: '🔄', text: 'Reversing is a classic interview question.' },
    ],
  },
  graph: {
    name: 'Graph (Adjacency List)',
    complexities: [
      { op: 'Add Node', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Add Edge', avg: 'O(1)', worst: 'O(1)' },
      { op: 'BFS', avg: 'O(V+E)', worst: 'O(V+E)' },
      { op: 'DFS', avg: 'O(V+E)', worst: 'O(V+E)' },
    ],
    space: 'O(V + E)',
    useCases: [
      'Social network connections',
      'GPS & route navigation',
      'Web crawler link analysis',
      'Package dependency resolution',
      'Network topology & routing',
    ],
    tips: [
      { emoji: '🌊', text: 'BFS finds shortest path in unweighted graphs.' },
      { emoji: '🔍', text: 'DFS is great for topological sorting and cycle detection.' },
      { emoji: '💾', text: 'Adjacency list is space-efficient for sparse graphs.' },
      { emoji: '🔗', text: 'This uses undirected graph — edges go both ways.' },
    ],
  },
  stack: {
    name: 'Stack (LIFO)',
    complexities: [
      { op: 'Push', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Pop', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Peek', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Search', avg: 'O(n)', worst: 'O(n)' },
    ],
    space: 'O(n)',
    useCases: [
      'Function call stack',
      'Undo operations in editors',
      'Expression evaluation & parsing',
      'Browser navigation',
      'DFS implementation',
    ],
    tips: [
      { emoji: '📚', text: 'LIFO = Last In, First Out. Like a stack of plates.' },
      { emoji: '⚡', text: 'Push and Pop are always O(1).' },
      { emoji: '🔄', text: 'Recursion uses the call stack internally.' },
      { emoji: '🧮', text: 'Stacks evaluate postfix expressions.' },
    ],
  },
  queue: {
    name: 'Queue (FIFO)',
    complexities: [
      { op: 'Enqueue', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Dequeue', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Peek', avg: 'O(1)', worst: 'O(1)' },
      { op: 'Search', avg: 'O(n)', worst: 'O(n)' },
    ],
    space: 'O(n)',
    useCases: [
      'Task scheduling & job queues',
      'BFS implementation',
      'Print queue management',
      'Request handling in web servers',
      'Message buffering',
    ],
    tips: [
      { emoji: '🚶', text: 'FIFO = First In, First Out.' },
      { emoji: '⚡', text: 'Enqueue and Dequeue are O(1).' },
      { emoji: '🌊', text: 'BFS uses a queue internally.' },
      { emoji: '🔄', text: 'Circular queue optimizes space.' },
    ],
  },
  hashset: {
    name: 'Hash Set',
    complexities: [
      { op: 'Add', avg: 'O(1)', worst: 'O(n)' },
      { op: 'Remove', avg: 'O(1)', worst: 'O(n)' },
      { op: 'Contains', avg: 'O(1)', worst: 'O(n)' },
    ],
    space: 'O(n)',
    useCases: [
      'Duplicate detection',
      'Membership testing',
      'Caching unique values',
      'Set operations (union, intersection)',
      'Tracking visited nodes',
    ],
    tips: [
      { emoji: '🗂️', text: 'Hash function maps values to buckets for O(1) access.' },
      { emoji: '⚠️', text: 'Worst case O(n) when all elements collide.' },
      { emoji: '📊', text: 'Load factor = items / buckets.' },
      { emoji: '🔑', text: 'Good hash function distributes uniformly.' },
    ],
  },
};

const ReferencePanel = memo(function ReferencePanel() {
  const { app } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const active = app.state.activeStructure;
  const ref = references[active];

  if (!ref) return null;

  return (
    <div className="glass-panel anim-slide-right" style={styles.panel}>
      <div style={styles.headerRow} onClick={() => setCollapsed(!collapsed)}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>📘</span>
          <div>
            <h3 style={styles.title}>Quick Reference</h3>
            <p style={styles.titleSub}>{ref.name}</p>
          </div>
        </div>
        <button style={styles.toggleBtn} aria-label="Toggle reference">
          <span style={{
            ...styles.chevron,
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>▼</span>
        </button>
      </div>

      {!collapsed && (
        <div className="anim-fade" style={styles.content}>
          <div className="divider" />

          <div style={styles.nameRow}>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '4px 12px' }}>
              {ref.name}
            </span>
          </div>

          <ComplexityTable complexities={ref.complexities} space={ref.space} />
          <UseCaseList useCases={ref.useCases} />

          <div className="divider" />
          <div style={styles.tipsSection}>
            <div style={styles.tipsLabel}>
              <span>💡</span>
              <span>Key Insights</span>
            </div>
            <div style={styles.tipsList}>
              {ref.tips.map((tip, i) => (
                <div key={i} style={styles.tipCard} className="glass-card">
                  <span style={styles.tipEmoji}>{tip.emoji}</span>
                  <p style={styles.tipText}>{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const styles = {
  panel: {
    padding: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: { fontSize: '1.3rem' },
  title: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  titleSub: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    fontWeight: 500,
    marginTop: '2px',
  },
  toggleBtn: {
    width: '30px',
    height: '30px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0,0,0,0.12)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  chevron: {
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    transition: 'transform 0.3s ease',
    display: 'block',
    lineHeight: 1,
  },
  content: { marginTop: '4px' },
  nameRow: { marginBottom: '12px' },
  tipsSection: { marginTop: '4px' },
  tipsLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '10px',
  },
  tipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tipCard: {
    display: 'flex',
    gap: '10px',
    padding: '10px 12px',
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: '1rem',
    flexShrink: 0,
    marginTop: '1px',
  },
  tipText: {
    fontSize: '0.73rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    fontWeight: 500,
    margin: 0,
  },
};

export default ReferencePanel;