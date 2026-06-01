import React, { memo, forwardRef, useState } from 'react';

/* ── OperationButton ── */
export const OperationButton = memo(function OperationButton({
  label, onClick, disabled, variant = 'primary', icon, fullWidth = true,
}) {
  const MAP = {
    primary: 'btn-pri', success: 'btn-ok', danger: 'btn-del',
    warning: 'btn-wrn', cyan: 'btn-cy', secondary: 'btn-gst',
  };
  const cls = `btn ${MAP[variant] || 'btn-pri'}`;
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
});

/* ── InputField ── */
export const InputField = memo(forwardRef(function InputField({
  value, onChange, onKeyDown, placeholder, disabled,
  type = 'number', icon = '#', label,
}, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="f-wrap">
      {label && <label className="f-lbl">{label}</label>}
      <div className="f-box" style={focused ? { borderColor:'var(--a)', background:'var(--bg4)', boxShadow:'0 0 0 2.5px rgba(108,99,255,0.13)' } : {}}>
        <span className="f-icon" style={focused ? { color:'var(--a)' } : {}}>{icon}</span>
        <input
          ref={ref}
          className="f-input"
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
}));

/* ── SelectField ── */
export const SelectField = memo(function SelectField({
  value, onChange, options, disabled, label,
}) {
  return (
    <div className="f-wrap">
      {label && <label className="f-lbl">{label}</label>}
      <div className="s-wrap" style={{ marginBottom: 0 }}>
        <select
          className="s-field"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="s-arrow">▾</span>
      </div>
    </div>
  );
});

/* ── BtnRow ── */
export function BtnRow({ children }) {
  return <div className="btn-row">{children}</div>;
}

/* ── SectionLabel ── */
export function SectionLabel({ children }) {
  return <div className="sec-lbl">{children}</div>;
}

/* ── Divider ── */
export function Divider() {
  return <div className="divider" />;
}
