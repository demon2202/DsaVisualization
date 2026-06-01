import React, { memo, useState } from 'react';
import { useAppContext } from '../hooks/useAppState';

const STRUCTURES = [
  { id: 'bst',        icon: '⬡', label: 'BST',        full: 'Binary Search Tree' },
  { id: 'linkedlist', icon: '○', label: 'Linked List', full: 'Singly Linked List' },
  { id: 'graph',      icon: '◎', label: 'Graph',       full: 'Graph Traversals'   },
  { id: 'stack',      icon: '▤', label: 'Stack',       full: 'Stack — LIFO'       },
  { id: 'queue',      icon: '▶', label: 'Queue',       full: 'Queue — FIFO'       },
  { id: 'hashset',    icon: '#', label: 'Hash Set',    full: 'Hash Set'           },
];

const Header = memo(function Header() {
  const { app, animator } = useAppContext();
  const { state } = app;
  const [hovered, setHovered] = useState(null);

  const handleSwitch = (id) => {
    if (state.isAnimating) { animator.cancel(); setTimeout(() => app.setStructure(id), 80); }
    else app.setStructure(id);
  };

  return (
    <header className="topbar">
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:'9px', flexShrink:0 }}>
        <div className="logo-sq">dsa</div>
        <span style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>
          viz<span style={{ color:'var(--text3)', fontWeight:400, marginLeft:'3px' }}>/v3</span>
        </span>
      </div>

      <div className="topbar-sep" />

      {/* Tabs */}
      <nav className="nav-tabs" role="tablist">
        {STRUCTURES.map(str => {
          const active = state.activeStructure === str.id;
          return (
            <button
              key={str.id}
              role="tab"
              aria-selected={active}
              title={str.full}
              disabled={state.isAnimating}
              className={`nav-tab${active ? ' active' : ''}`}
              onClick={() => handleSwitch(str.id)}
              onMouseEnter={() => setHovered(str.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="tab-icon">{str.icon}</span>
              {str.label}
            </button>
          );
        })}
      </nav>

      {/* Right */}
      <div className="topbar-right">
        {state.isAnimating && (
          <div className="run-pill visible">
            <div className="run-dot" />
            running
          </div>
        )}
        <button className="icon-btn" onClick={app.toggleTheme} title="Toggle theme">
          {state.theme === 'dark' ? '○' : '●'}
        </button>
      </div>
    </header>
  );
});

export default Header;
