import React, { memo, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const structures = [
  { id: 'bst', icon: '🌳', label: 'BST', full: 'Binary Search Tree' },
  { id: 'linkedlist', icon: '🔗', label: 'Linked List', full: 'Singly Linked List' },
  { id: 'graph', icon: '🕸️', label: 'Graph', full: 'Graph Traversals' },
  { id: 'stack', icon: '📚', label: 'Stack', full: 'Stack (LIFO)' },
  { id: 'queue', icon: '🚶‍♂️', label: 'Queue', full: 'Queue (FIFO)' },
  { id: 'hashset', icon: '🗂️', label: 'Hash Set', full: 'Hash Set' },
];

const Header = memo(function Header() {
  const { app, animator } = useAppContext();
  const { state } = app;
  const [hoveredTab, setHoveredTab] = useState(null);

  const handleSwitch = (id) => {
    if (state.isAnimating) {
      animator.cancel();
      setTimeout(() => app.setStructure(id), 100);
    } else {
      app.setStructure(id);
    }
  };

  return (
    <header style={styles.header}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <div style={styles.logoIcon}>
          <span style={styles.logoEmoji}>⚡</span>
        </div>
        <div style={styles.logoText}>
          <h1 style={styles.title}>DSA Visualizer</h1>
          <span style={styles.subtitle}>Interactive Learning</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={styles.nav}>
        {structures.map((s) => {
          const isActive = state.activeStructure === s.id;
          const isHovered = hoveredTab === s.id;

          return (
            <button
              key={s.id}
              onClick={() => handleSwitch(s.id)}
              onMouseEnter={() => setHoveredTab(s.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
                ...(isHovered && !isActive ? styles.tabHover : {}),
              }}
              title={s.full}
              disabled={state.isAnimating}
            >
              <span style={styles.tabIcon}>{s.icon}</span>
              <span style={styles.tabLabel}>{s.label}</span>
              {isActive && <div style={styles.tabIndicator} />}
            </button>
          );
        })}
      </nav>

      {/* Right actions */}
      <div style={styles.actions}>
        {state.isAnimating && (
          <div style={styles.animBadge} className="anim-fade">
            <div style={styles.animDot} />
            <span>Animating</span>
          </div>
        )}

        <button
          onClick={app.toggleTheme}
          style={styles.themeBtn}
          title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span style={styles.themeBtnIcon}>
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </span>
        </button>
      </div>
    </header>
  );
});

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--b-1)',
    zIndex: 100,
    gap: '14px',
    flexWrap: 'wrap',
    position: 'sticky',
    top: 0,
    minHeight: '60px',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--g-brand)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--brand-glow)',
  },
  logoEmoji: { fontSize: '1.1rem' },
  logoText: { display: 'flex', flexDirection: 'column' },
  title: {
    fontSize: '1rem',
    fontWeight: 800,
    background: 'var(--g-brand)',
    backgroundSize: '200% 200%',
    animation: 'gradientFlow 4s ease infinite',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1.2,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '0.6rem',
    color: 'var(--t-4)',
    fontWeight: 500,
    letterSpacing: '0.4px',
  },
  nav: {
    display: 'flex',
    gap: '2px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '3px',
    borderRadius: 'var(--r-lg)',
    background: 'var(--bg-3)',
    border: '1px solid var(--b-1)',
  },
  tab: {
    position: 'relative',
    padding: '7px 12px',
    borderRadius: 'var(--r-md)',
    background: 'transparent',
    color: 'var(--t-4)',
    fontSize: '0.78rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'var(--brand)',
    color: '#ffffff',
    boxShadow: '0 2px 10px rgba(124,124,247,0.2)',
  },
  tabHover: {
    background: 'var(--bg-4)',
    color: 'var(--t-2)',
  },
  tabIcon: { fontSize: '0.9rem' },
  tabLabel: { display: 'inline' },
  tabIndicator: {
    position: 'absolute',
    bottom: '2px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '14px',
    height: '2px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.45)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  animBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: 'var(--r-full)',
    background: 'var(--brand-8)',
    border: '1px solid var(--brand-12)',
    fontSize: '0.66rem',
    fontWeight: 600,
    color: 'var(--brand)',
  },
  animDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'var(--brand)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  themeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--bg-3)',
    border: '1px solid var(--b-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  themeBtnIcon: { fontSize: '1.05rem' },
};

export default Header;