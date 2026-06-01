import React, { memo } from 'react';
import { useAppContext } from '../hooks/useAppState';

const PRESETS = [
  { value: 100,  label: 'fast'   },
  { value: 800,  label: 'norm'   },
  { value: 1500, label: 'slow'   },
];

const SpeedSlider = memo(function SpeedSlider() {
  const { app } = useAppContext();
  const speed = app.state.animationSpeed;
  const pct = ((speed - 50) / (1500 - 50)) * 100;

  return (
    <div className="spd-box">
      <div className="spd-row">
        <span className="spd-lbl">step delay</span>
        <span className="spd-val">{speed}ms</span>
      </div>
      <div className="spd-track">
        <div className="spd-bg-line" />
        <div className="spd-fill-line" style={{ width: `${pct}%` }} />
        <input
          className="spd-range"
          type="range"
          min="50" max="1500" step="25"
          value={speed}
          onChange={e => app.setSpeed(Number(e.target.value))}
          aria-label="Animation step delay"
        />
      </div>
      <div className="spd-presets">
        {PRESETS.map(p => (
          <button
            key={p.value}
            className={`spd-preset${Math.abs(p.value - speed) < 150 ? ' active' : ''}`}
            onClick={() => app.setSpeed(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default SpeedSlider;
