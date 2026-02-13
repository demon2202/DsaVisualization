import React, { memo, useState, useRef } from 'react';

const variantConfig = {
  primary: {
    bg: 'var(--gradient-primary)',
    color: '#ffffff',
    hoverBg: 'linear-gradient(135deg, #8b8bf8 0%, #ab8bfb 100%)',
    glowColor: '124,124,247',
  },
  success: {
    bg: 'var(--gradient-success)',
    color: '#ffffff',
    hoverBg: 'linear-gradient(135deg, #20e0a0 0%, #3ef0e0 100%)',
    glowColor: '18,212,146',
  },
  danger: {
    bg: 'var(--gradient-warm)',
    color: '#ffffff',
    hoverBg: 'linear-gradient(135deg, #f85a72 0%, #fc9e4e 100%)',
    glowColor: '247,71,94',
  },
  warning: {
    bg: 'linear-gradient(135deg, #f7a30b 0%, #fb7e1a 100%)',
    color: '#111111',
    hoverBg: 'linear-gradient(135deg, #f8b030 0%, #fc9040 100%)',
    glowColor: '247,163,11',
  },
  secondary: {
    bg: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    hoverBg: 'var(--bg-elevated)',
    glowColor: '255,255,255',
    border: '1px solid var(--glass-border)',
  },
  cyan: {
    bg: 'var(--gradient-cool)',
    color: '#ffffff',
    hoverBg: 'linear-gradient(135deg, #40f0e0 0%, #8c8cf8 100%)',
    glowColor: '46,232,214',
  },
};

const OperationButton = memo(function OperationButton({
  label, onClick, disabled, variant = 'primary', icon, size = 'md', fullWidth = true, tooltip
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);
  const config = variantConfig[variant] || variantConfig.primary;

  const sizeMap = {
    sm: { padding: '7px 12px', fontSize: '0.74rem', radius: 'var(--radius-sm)', gap: '5px', iconSize: '0.82rem' },
    md: { padding: '10px 16px', fontSize: '0.82rem', radius: 'var(--radius-md)', gap: '7px', iconSize: '0.92rem' },
    lg: { padding: '13px 22px', fontSize: '0.9rem', radius: 'var(--radius-lg)', gap: '8px', iconSize: '1rem' },
  };
  const s = sizeMap[size];

  const handleClick = (e) => {
    if (disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    onClick?.(e);
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled}
      title={tooltip}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.radius,
        gap: s.gap,
        background: hovered && !disabled ? config.hoverBg : config.bg,
        color: config.color,
        border: config.border || 'none',
        width: fullWidth ? '100%' : 'auto',
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.2px',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transform: pressed ? 'scale(0.96) translateY(1px)' : hovered && !disabled ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !disabled
          ? `0 4px 16px rgba(${config.glowColor},0.2), 0 0 30px rgba(${config.glowColor},0.06)`
          : variant === 'secondary' ? 'none' : `0 2px 8px rgba(${config.glowColor},0.08)`,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        lineHeight: 1,
        WebkitFontSmoothing: 'antialiased',
        filter: disabled ? 'saturate(0.15) brightness(0.7)' : 'none',
      }}
    >
      {/* Shine on hover */}
      {hovered && !disabled && (
        <span style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          animation: 'shineSlide 0.7s ease forwards',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      {icon && <span style={{ fontSize: s.iconSize, lineHeight: 1, flexShrink: 0, position: 'relative', zIndex: 2 }}>{icon}</span>}
      <span style={{ position: 'relative', zIndex: 2, lineHeight: 1 }}>{label}</span>

      {/* Ripples */}
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.35)',
          transform: 'translate(-50%, -50%)',
          animation: 'rippleExpand 0.6s ease-out forwards',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      ))}
    </button>
  );
});

export default OperationButton;