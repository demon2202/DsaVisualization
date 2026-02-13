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
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid var(--glass-border)',
    zIndex: 100,
    gap: '16px',
    flexWrap: 'wrap',
    position: 'sticky',
    top: 0,
    minHeight: '64px',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(124,124,247,0.15)',
  },
  logoEmoji: {
    fontSize: '1.2rem',
    filter: 'brightness(1.5)',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: 800,
    background: 'var(--gradient-primary)',
    backgroundSize: '200% 200%',
    animation: 'gradientFlow 4s ease infinite',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1.2,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
    letterSpacing: '0.5px',
  },
  nav: {
    display: 'flex',
    gap: '3px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
  },
  tab: {
    position: 'relative',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.25s ease',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'var(--accent-1)',
    color: '#ffffff',
    boxShadow: '0 2px 12px rgba(124,124,247,0.25)',
  },
  tabHover: {
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-secondary)',
  },
  tabIcon: {
    fontSize: '0.95rem',
  },
  tabLabel: {
    display: 'inline',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: '2px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '16px',
    height: '2px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.5)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  animBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(124,124,247,0.08)',
    border: '1px solid rgba(124,124,247,0.15)',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--accent-1)',
  },
  animDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-1)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  themeBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
  },
  themeBtnIcon: {
    fontSize: '1.15rem',
  },
};

export default Header;