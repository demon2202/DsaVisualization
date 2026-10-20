/**
 * palette.js — the semantic colour language of the stage.
 *
 * Five meanings, one muted hue each, used identically in every scene:
 *
 *   signal  → this is being examined right now   (probe / compare / cursor)
 *   steel   → this has been traversed            (visited / frontier / chain)
 *   sage    → this is settled or correct         (found / inserted / path)
 *   lavender→ this is being restructured         (swap / rotation / sift)
 *   clay    → this is removed or blocked         (delete / wall / reject)
 *
 * Everything else is graphite. Active states are solid; visited and settled
 * states are restrained tints with a tinted edge, so the eye can tell
 * "happening now" from "already happened" without reading a legend.
 */

export const HUE = {
  signal: '#ff5a36',
  probe: '#ff5a36',
  flow: '#8fa6b2',
  success: '#a9c3a3',
  bad: '#d97a67',
  special: '#b3a1c9',
  bone: '#f2efe9',
  ink: '#0a0a0a',
  steel: '#6d6860',
  steelDim: '#242320',
}

export const STAGE_BACKGROUND = '#060606'

/* line colours — links and edges read quieter than the objects they join */
export const LINK = {
  idle: { hex: '#3b3832', o: 1, w: 1.1, dashed: false },
  base: { hex: '#3b3832', o: 1, w: 1.1, dashed: false },
  tree: { hex: '#5a554c', o: 1, w: 1.3, dashed: false },
  probe: { hex: HUE.probe, o: 1, w: 2, dashed: false },
  active: { hex: HUE.success, o: 1, w: 2.2, dashed: false },
  flow: { hex: HUE.flow, o: 1, w: 1.9, dashed: false },
  visited: { hex: HUE.flow, o: 0.65, w: 1.4, dashed: false },
  path: { hex: HUE.success, o: 1, w: 2.4, dashed: false },
  reject: { hex: HUE.bad, o: 1, w: 1.8, dashed: true },
  swap: { hex: HUE.special, o: 1, w: 2, dashed: false },
}

export const linkOf = (key) => LINK[key] || LINK.idle

/**
 * state → visual definition.
 * `fill` paints the body, `ink` paints the value, `stroke` the hairline rim.
 * `solid` means the value sits on a lit surface (dark ink); otherwise the
 * value is bone on graphite. `tint` states are translucent.
 */
const state = (fill, ink, stroke, extra = {}) => ({ fill, ink, stroke, ...extra })

export const STATE = {
  idle: state('#141412', '#8f8a80', 'rgba(242,239,233,0.16)'),
  base: state('#1b1a17', '#f2efe9', 'rgba(242,239,233,0.24)'),
  dim: state('#100f0e', '#6f6a61', 'rgba(242,239,233,0.10)'),
  aux: state('#171613', '#b9b3a8', 'rgba(242,239,233,0.16)'),
  root: state('#1b1a17', '#f2efe9', 'rgba(255,90,54,0.6)'),

  probe: state(HUE.probe, '#120b08', HUE.probe, { solid: true, ring: true }),
  active: state(HUE.bone, '#0a0908', HUE.bone, { solid: true, ring: true }),
  found: state(HUE.success, '#0b110b', HUE.success, { solid: true, ring: true }),
  insert: state(HUE.success, '#0b110b', HUE.success, { solid: true, ring: true }),
  target: state(HUE.success, '#0b110b', HUE.success, { solid: true, ring: true }),
  sorted: state('rgba(169,195,163,0.22)', '#d7e5d3', 'rgba(169,195,163,0.75)'),
  path: state('rgba(169,195,163,0.26)', '#dbe8d7', 'rgba(169,195,163,0.8)'),
  open: state('#141412', '#8f8a80', 'rgba(242,239,233,0.14)'),

  swap: state(HUE.special, '#100d15', HUE.special, { solid: true, ring: true }),
  pivot: state(HUE.special, '#100d15', HUE.special, { solid: true, ring: true }),
  restructure: state(HUE.special, '#100d15', HUE.special, { solid: true, ring: true }),

  visit: state(HUE.flow, '#0b1012', HUE.flow, { solid: true, ring: true }),
  visited: state('rgba(143,166,178,0.2)', '#c9d5da', 'rgba(143,166,178,0.7)'),
  frontier: state('rgba(143,166,178,0.14)', '#d6e1e5', 'rgba(143,166,178,0.55)'),

  reject: state(HUE.bad, '#140b09', HUE.bad, { solid: true, ring: true }),
  remove: state(HUE.bad, '#140b09', HUE.bad, { solid: true, ring: true }),
  bad: state(HUE.bad, '#140b09', HUE.bad, { solid: true, ring: true }),
  blocked: state('rgba(217,122,103,0.22)', '#e9bab0', 'rgba(217,122,103,0.65)'),

  wall: state('#23211d', '#6b665d', 'rgba(242,239,233,0.16)'),
  mud: state('#2a2720', '#9b9182', 'rgba(242,239,233,0.12)'),
  water: state('#1b2428', '#7f949b', 'rgba(242,239,233,0.12)'),

  start: state(HUE.bone, '#0a0908', HUE.bone, { solid: true, ring: true }),
  goal: state(HUE.probe, '#120b08', HUE.probe, { solid: true, ring: true }),

  pointer: state(HUE.probe, '#120b08', HUE.probe, { solid: true }),
}

export const stateOf = (key) => STATE[key] || STATE.idle

/* Legacy helpers still used by any non-stage surface. */
export function ramp(t, from = '#1a2027', to = HUE.success) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const k = Math.max(0, Math.min(1, t))
  return rgbToHex(a.map((v, i) => Math.round(v + (b[i] - v) * k)))
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
