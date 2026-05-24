import React, { memo, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const structures = [
  { id: 'bst',        icon: '⬡', label: 'BST',         full: 'Binary Search Tree' },
  { id: 'linkedlist', icon: '○', label: 'Linked List',  full: 'Singly Linked List' },
  { id: 'graph',      icon: '◎', label: 'Graph',        full: 'Graph Traversals' },
  { id: 'stack',      icon: '▤', label: 'Stack',        full: 'Stack — LIFO' },
  { id: 'queue',      icon: '▶', label: 'Queue',        full: 'Queue — FIFO' },
  { id: 'hashset',    icon: '#', label: 'Hash Set',     full: 'Hash Set' },
];

const Header = memo(function Header() {
  const { app, animator } = useAppContext();
  const { state } = app;
  const [hoveredTab, setHoveredTab] = useState(null);

  const handleSwitch = (id) => {
    if (state.isAnimating) {
      animator.cancel();
      setTimeout(() => app.setStructure(id), 80);
    } else {
      app.setStructure(id);
    }
  };

  return (
    <header style={s.header}>
      {/* Wordmark */}
      <div style={s.wordmark}>
        <span style={s.wordmarkIcon}>{'<'}</span>
        <span style={s.wordmarkName}>dsa.viz</span>
        <span style={s.wordmarkSlash}>/</span>
        <span style={s.wordmarkSub}>v2.0</span>
      </div>

      {/* Separator */}
      <div style={s.sep} />

      {/* Nav tabs */}
      <nav style={s.nav} role="tablist">
        {structures.map((str) => {
          const isActive = state.activeStructure === str.id;
          const isHovered = hoveredTab === str.id;
          return (
            <button
              key={str.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSwitch(str.id)}
              onMouseEnter={() => setHoveredTab(str.id)}
              onMouseLeave={() => setHoveredTab(null)}
              disabled={state.isAnimating}
              title={str.full}
              style={{
                ...s.tab,
                ...(isActive ? s.tabActive : isHovered ? s.tabHover : {}),
              }}
            >
              <span style={{ ...s.tabIcon, ...(isActive ? s.tabIconActive : {}) }}>
                {str.icon}
              </span>
              <span style={s.tabLabel}>{str.label}</span>
              {isActive && <div style={s.tabDot} />}
            </button>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={s.right}>
        {state.isAnimating && (
          <div style={s.animPill}>
            <span style={s.animDot} />
            <span>running</span>
          </div>
        )}

        <button
          onClick={app.toggleTheme}
          style={s.themeBtn}
          title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {state.theme === 'dark' ? '○' : '●'}
        </button>
      </div>
    </header>
  );
});

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    background: 'var(--bg-subtle)',
    borderBottom: '1px solid var(--border)',
    height: '48px',
    gap: '12px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  wordmark: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    flexShrink: 0,
    fontFamily: 'var(--font-mono)',
  },
  wordmarkIcon: {
    fontSize: '0.95rem',
    color: 'var(--accent)',
    fontWeight: 600,
    lineHeight: 1,
  },
  wordmarkName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  wordmarkSlash: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    margin: '0 2px',
  },
  wordmarkSub: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  sep: {
    width: '1px',
    height: '20px',
    background: 'var(--border)',
    flexShrink: 0,
  },
  nav: {
    display: 'flex',
    gap: '2px',
    flex: 1,
    overflow: 'hidden',
  },
  tab: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 11px',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.01em',
    transition: 'background 0.14s, color 0.14s',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },
  tabActive: {
    background: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  tabHover: {
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
  },
  tabIcon: {
    fontSize: '0.8rem',
    color: 'var(--text-dim)',
    fontFamily: 'monospace',
    lineHeight: 1,
    transition: 'color 0.14s',
  },
  tabIconActive: {
    color: 'var(--accent)',
  },
  tabLabel: {},
  tabDot: {
    position: 'absolute',
    bottom: '3px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: 'var(--accent)',
    opacity: 0.8,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  animPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: '9999px',
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.18)',
    fontSize: '0.68rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent)',
    letterSpacing: '0.03em',
  },
  animDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1.1s ease-in-out infinite',
  },
  themeBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    transition: 'background 0.14s, border-color 0.14s, color 0.14s',
  },
};

export default Header;