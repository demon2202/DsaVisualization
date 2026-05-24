import React, { memo, useRef, useState, useCallback } from 'react';

const VARIANTS = {
  primary:   { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',     glow: '99,102,241' },
  success:   { bg: 'linear-gradient(135deg,#34d399,#2dd4bf)', color: '#052e1c',  glow: '52,211,153' },
  danger:    { bg: 'linear-gradient(135deg,#f87171,#fb923c)', color: '#fff',     glow: '248,113,113'},
  warning:   { bg: 'linear-gradient(135deg,#fbbf24,#fb923c)', color: '#1a0e00',  glow: '251,191,36' },
  secondary: { bg: 'var(--bg-raised)',                        color: 'var(--text-secondary)', glow: '255,255,255', border: '1px solid var(--border)' },
  cyan:      { bg: 'linear-gradient(135deg,#22d3ee,#6366f1)', color: '#fff',     glow: '34,211,238' },
};

// Defined outside component — never recreated
const SIZES = {
  sm: { padding: '5px 11px',  fontSize: '0.72rem', radius: '5px', gap: '4px' },
  md: { padding: '8px 14px',  fontSize: '0.8rem',  radius: '7px', gap: '6px' },
  lg: { padding: '11px 20px', fontSize: '0.88rem', radius: '8px', gap: '7px' },
};

const OperationButton = memo(function OperationButton({
  label, onClick, disabled, variant = 'primary', icon, size = 'md', fullWidth = true, tooltip,
}) {
  const [ripples, setRipples] = useState([]);
  const btnRef  = useRef(null);
  const timerRef = useRef([]);
  const cfg = VARIANTS[variant] ?? VARIANTS.primary;
  const sz  = SIZES[size];

  const handleClick = useCallback((e) => {
    if (disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const id   = Date.now();
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);

    // Track timer so we can clear on unmount
    const t = setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
    timerRef.current.push(t);

    onClick?.(e);
  }, [disabled, onClick]);

  // Clean up any pending timers on unmount
  React.useEffect(() => {
    return () => { timerRef.current.forEach(clearTimeout); };
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled}
      title={tooltip}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sz.gap,
        padding: sz.padding,
        fontSize: sz.fontSize,
        borderRadius: sz.radius,
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border ?? 'none',
        width: fullWidth ? '100%' : 'auto',
        fontWeight: 600,
        fontFamily: 'var(--font)',
        letterSpacing: '0.01em',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.32 : 1,
        transition: 'opacity 0.15s, transform 0.12s, box-shadow 0.15s',
        lineHeight: 1,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      // Use CSS pseudo-classes via inline handlers so memo still works
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 4px 14px rgba(${cfg.glow},0.28)`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
    >
      {icon && <span style={{ fontSize: `calc(${sz.fontSize} + 0.05rem)`, lineHeight: 1, flexShrink: 0 }}>{icon}</span>}
      <span style={{ lineHeight: 1 }}>{label}</span>

      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x, top: r.y,
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            transform: 'translate(-50%,-50%)',
            animation: 'rippleExpand 0.55s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
    </button>
  );
});

export default OperationButton;