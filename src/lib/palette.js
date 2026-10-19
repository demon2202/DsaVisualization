/**
 * palette.js — the semantic colour language shared by every scene.
 *
 * Six hues, each with exactly one meaning, used consistently across
 * trees, graphs, arrays, hash tables and grids:
 *
 *   amber  → "looking at this right now"   (compare / probe / active cursor)
 *   violet → "this is being moved or restructured" (swap / rotation)
 *   sky    → "already traversed / frontier" (visited, open set)
 *   acid   → "success / target / settled"  (found, inserted, sorted, path)
 *   rose   → "removed / blocked / conflict" (delete, wall, collision)
 *   steel  → "idle"
 */

export const HUE = {
  /* success reads as hot bone-white, like chalk on a board */
  acid: '#eae4d9',
  acidDeep: '#cfc8bc',
  probe: '#e3a83e',
  flow: '#7fb6d9',
  bad: '#e06a5e',
  special: '#a98bd9',
  steel: '#85786b',
  steelDim: '#51473d',
  bone: '#eae4d9',
}

export const STAGE_BACKGROUND = '#241116'

/**
 * state → visual definition.
 * `hex` is used for both base colour and emissive; `e` scales emissive strength,
 * `s` scales the node, `ring` adds an outline pulse in the renderer.
 */
export const STATE = {
  idle: { hex: HUE.steelDim, e: 0.05, s: 1 },
  base: { hex: HUE.steel, e: 0.09, s: 1 },
  dim: { hex: '#171410', e: 0.03, s: 0.94 },

  probe: { hex: HUE.probe, e: 0.8, s: 1.14, ring: true },
  active: { hex: HUE.acid, e: 0.9, s: 1.2, ring: true },
  found: { hex: HUE.acid, e: 1.0, s: 1.26, ring: true },
  insert: { hex: HUE.acid, e: 0.95, s: 1.3, ring: true },
  sorted: { hex: HUE.acidDeep, e: 0.55, s: 1.06 },
  target: { hex: HUE.acid, e: 1.1, s: 1.2, ring: true },

  swap: { hex: HUE.special, e: 1.15, s: 1.16, ring: true },
  pivot: { hex: HUE.special, e: 0.9, s: 1.12 },
  restructure: { hex: HUE.special, e: 1.4, s: 1.24, ring: true },

  visit: { hex: HUE.flow, e: 0.85, s: 1.12, ring: true },
  visited: { hex: HUE.flow, e: 0.34, s: 1.02 },
  frontier: { hex: HUE.flow, e: 0.7, s: 1.08 },
  aux: { hex: '#6b6257', e: 0.28, s: 1.0 },

  reject: { hex: HUE.bad, e: 1.05, s: 1.1, ring: true },
  remove: { hex: HUE.bad, e: 1.45, s: 1.18, ring: true },
  wall: { hex: '#26221c', e: 0.04, s: 1 },
  mud: { hex: '#5c4a30', e: 0.14, s: 1 },
  water: { hex: '#1f3a50', e: 0.12, s: 1 },
  blocked: { hex: HUE.bad, e: 0.5, s: 1 },

  root: { hex: '#c8ac72', e: 0.3, s: 1.1 },
  pointer: { hex: HUE.probe, e: 1.7, s: 1 },
}

export const stateOf = (key) => STATE[key] || STATE.idle

/** Edge/link states — kept separate so a lit edge reads brighter than a node. */
export const LINK = {
  idle: { hex: '#556070', o: 0.82, w: 1.12 },
  base: { hex: '#556070', o: 0.82, w: 1.12 },
  tree: { hex: '#616d7d', o: 0.92, w: 1.45 },
  probe: { hex: HUE.probe, o: 1, w: 2.1, pulse: true },
  active: { hex: HUE.acid, o: 1, w: 2.4, pulse: true },
  flow: { hex: HUE.flow, o: 0.95, w: 2, pulse: true },
  visited: { hex: HUE.flow, o: 0.6, w: 1.5 },
  path: { hex: HUE.acid, o: 1, w: 2.6, pulse: true },
  reject: { hex: HUE.bad, o: 0.9, w: 2, pulse: true },
  swap: { hex: HUE.special, o: 1, w: 2.2, pulse: true },
}

export const linkOf = (key) => LINK[key] || LINK.idle

/** Colour ramp used by continuous values (heat maps on grids, bar heights). */
export function ramp(t, from = '#1a2027', to = HUE.acid) {
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
