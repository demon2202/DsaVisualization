/** Glyph.jsx — 20×20 line icons, hand-drawn on a 1.4 stroke grid. */
export default function Glyph({ name, size = 18, stroke = 1.4 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const shapes = {
    trees: (
      <g {...p}>
        <circle cx="10" cy="4.2" r="2.1" />
        <circle cx="4.6" cy="11" r="2.1" />
        <circle cx="15.4" cy="11" r="2.1" />
        <circle cx="10" cy="16.6" r="1.7" />
        <path d="M8.6 5.9 6 9.2M11.4 5.9 14 9.2M6 13l3 2.2M14 13l-3 2.2" />
      </g>
    ),
    linear: (
      <g {...p}>
        <rect x="2" y="7" width="4.4" height="6" rx="1" />
        <rect x="7.8" y="7" width="4.4" height="6" rx="1" />
        <rect x="13.6" y="7" width="4.4" height="6" rx="1" />
      </g>
    ),
    hashing: (
      <g {...p}>
        <path d="M7 3 5.6 17M14.4 3 13 17M3.4 7.6h13.2M3 12.4h13.6" />
      </g>
    ),
    heaps: (
      <g {...p}>
        <path d="M3.4 16.4 10 4l6.6 12.4z" />
        <path d="M6.7 10.2h6.6" />
      </g>
    ),
    graphs: (
      <g {...p}>
        <circle cx="4.4" cy="5" r="1.9" />
        <circle cx="15.6" cy="4.4" r="1.9" />
        <circle cx="6" cy="15.4" r="1.9" />
        <circle cx="15.2" cy="13.6" r="1.9" />
        <path d="M6.2 5.6 13.8 4.7M5 6.8l.7 6.8M7.8 14.6l5.6-.9M15.2 6.3l-.2 5.4M6.1 6.3l8 6.2" />
      </g>
    ),
    arrays: (
      <g {...p}>
        <path d="M3 16.6V9.4M6.4 16.6V5.2M9.8 16.6v-6M13.2 16.6V3.6M16.6 16.6v-8.4" strokeWidth="2.1" />
      </g>
    ),
    grids: (
      <g {...p}>
        <path d="M3 3h14v14H3zM3 7.7h14M3 12.3h14M7.7 3v14M12.3 3v14" />
        <circle cx="5.3" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="14.7" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
      </g>
    ),
    play: (
      <g {...p}>
        <path d="M7 4.6 15 10l-8 5.4z" fill="currentColor" stroke="none" />
      </g>
    ),
    pause: (
      <g {...p}>
        <path d="M7.2 4.8v10.4M12.8 4.8v10.4" strokeWidth="2.2" />
      </g>
    ),
    stepBack: (
      <g {...p}>
        <path d="M12.6 4.8 6.4 10l6.2 5.2zM5 4.8v10.4" />
      </g>
    ),
    stepFwd: (
      <g {...p}>
        <path d="M7.4 4.8 13.6 10l-6.2 5.2zM15 4.8v10.4" />
      </g>
    ),
    restart: (
      <g {...p}>
        <path d="M4.6 10a5.4 5.4 0 1 0 1.7-3.9M4.6 3.6v3.2h3.2" />
      </g>
    ),
    end: (
      <g {...p}>
        <path d="M5 4.8 11 10l-6 5.2zM12.4 4.8 18 10l-5.6 5.2" />
      </g>
    ),
    code: (
      <g {...p}>
        <path d="m7 6-4 4 4 4M13 6l4 4-4 4M11.4 4 8.6 16" />
      </g>
    ),
    info: (
      <g {...p}>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 9v4.6M10 6.4v.2" strokeWidth="1.8" />
      </g>
    ),
    camera: (
      <g {...p}>
        <path d="M10 3.6 15 6.4v3.4c0 3.3-2.2 5.6-5 6.6-2.8-1-5-3.3-5-6.6V6.4z" />
        <path d="M10 3.6v12.8M5 6.4l10 5.4M15 6.4 5 11.8" opacity="0.6" />
      </g>
    ),
    orbit: (
      <g {...p}>
        <circle cx="10" cy="10" r="3" />
        <path d="M16.6 6.2c1.6 2 1.9 4 .7 5.2-1.6 1.6-5.4.6-8.5-2.4S4.4 2.9 6 1.3" transform="translate(0 2)" opacity="0.9" />
      </g>
    ),
    spark: (
      <g {...p}>
        <path d="M10 2.6 11.8 8l5.4 1.8-5.4 1.8L10 17l-1.8-5.4L2.8 9.8 8.2 8z" />
      </g>
    ),
    quiz: (
      <g {...p}>
        <path d="M7.3 7.1a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.2-2.7 4.1" />
        <path d="M10 15.6v.1" strokeWidth="1.9" />
      </g>
    ),
    brush: (
      <g {...p}>
        <path d="M13.8 3.2 16.8 6.2 8.4 14.6l-3.6.6.6-3.6z" />
        <path d="M4.4 16.8h6" opacity="0.7" />
      </g>
    ),
    github: (
      <g {...p}>
        <path d="M10 2.4a7.6 7.6 0 0 0-2.4 14.8c.4.1.5-.2.5-.4v-1.4c-2 .4-2.5-.9-2.5-.9-.3-.9-.8-1.1-.8-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.9 2.3.7 0-.5.3-.9.5-1.1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2 0-.2-.3-1 .1-2 0 0 .6-.2 2 .8a7 7 0 0 1 3.7 0c1.4-1 2-.8 2-.8.4 1 .1 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.7 3.5-3.4 3.7.3.2.5.7.5 1.4v2c0 .2.1.5.5.4A7.6 7.6 0 0 0 10 2.4z" fill="currentColor" stroke="none" />
      </g>
    ),
    home: (
      <g {...p}>
        <path d="M3.6 9.4 10 3.6l6.4 5.8M5.4 8.4v8h9.2v-8" />
      </g>
    ),
    compare: (
      <g {...p}>
        <path d="M3.5 5.5h10M11 3l2.5 2.5L11 8M16.5 14.5h-10M9 12l-2.5 2.5L9 17" />
      </g>
    ),
    link: (
      <g {...p}>
        <path d="M8.2 11.8 11.8 8.2M7.2 13.8l-1.3 1.3a3 3 0 0 1-4.2-4.2l3.5-3.5a3 3 0 0 1 4.2 0M12.8 6.2l1.3-1.3a3 3 0 0 1 4.2 4.2l-3.5 3.5a3 3 0 0 1-4.2 0" transform="translate(1 0)" />
      </g>
    ),
    pin: (
      <g {...p}>
        <path d="M7 3.5h6l-.8 4 2.3 2.2v1.5H5.5V9.7L7.8 7.5zM10 11.2v5.3" />
      </g>
    ),
    search: (
      <g {...p}>
        <circle cx="8.5" cy="8.5" r="4.8" />
        <path d="m12.1 12.1 4.2 4.2" />
      </g>
    ),
    menu: (
      <g {...p}>
        <path d="M4 6h12M4 10h12M4 14h8" />
      </g>
    ),
    close: (
      <g {...p}>
        <path d="m5.4 5.4 9.2 9.2M14.6 5.4l-9.2 9.2" />
      </g>
    ),
    chevron: (
      <g {...p}>
        <path d="m7.4 4.8 5.2 5.2-5.2 5.2" />
      </g>
    ),
    panel: (
      <g {...p}>
        <rect x="3" y="4" width="14" height="12" rx="1.4" />
        <path d="M12.6 4v12" />
      </g>
    ),
    book: (
      <g {...p}>
        <path d="M4 4.2h5.2A2.8 2.8 0 0 1 12 7v9.2a2.4 2.4 0 0 0-2.4-2.4H4z" />
        <path d="M16 4.2h-1.6A2.4 2.4 0 0 0 12 6.6v9.6a2.4 2.4 0 0 1 2.4-2.4H16z" opacity="0.55" />
      </g>
    ),
    gauge: (
      <g {...p}>
        <path d="M3.4 14a7.2 7.2 0 1 1 13.2 0" />
        <path d="m10 10 3-2.6" />
        <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
      </g>
    ),
    terminal: (
      <g {...p}>
        <rect x="3" y="4" width="14" height="12" rx="1.4" />
        <path d="m6.4 8 2.2 2.2-2.2 2.2M10.6 12.6h3.2" />
      </g>
    ),
    plus: (
      <g {...p}>
        <path d="M10 4.6v10.8M4.6 10h10.8" />
      </g>
    ),
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
      {shapes[name] || shapes.trees}
    </svg>
  )
}
