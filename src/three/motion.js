/**
 * motion.js — the transition system behind every object in the 3D stage.
 *
 * Why this exists: the old renderer damped every property with one eternal
 * exponential (cur += (target-cur) * k*dt). That made all motion identical
 * (no easing vocabulary), never quite arrived (paused scenes kept creeping),
 * and sent swapping bars straight through each other.
 *
 * The replacement is a set of tiny time-based transitions:
 *   - frame-rate independent (evaluated from the clock, not per-frame steps)
 *   - interruptible (re-starting captures the current evaluated value)
 *   - exact (at t >= dur the value IS the target, so the scene always
 *     converges to the snapshot — including after rapid scrubbing)
 *   - duration-aware (playback beat, seeks and reduced-motion all feed in)
 *
 * Nothing here knows about algorithms; Elements/Links decide *what* a move
 * means (swap braid, shift slide, merge flight) and ask for a curve.
 */
import * as THREE from 'three'

export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

export const EASE = {
  linear: (t) => t,
  /** deliberate moves: swaps, flights — accelerate, cruise, settle */
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  /** arrivals and state responses: fast out, no overshoot, no bounce */
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  /** departures (exits, fades out) */
  inCubic: (t) => t * t * t,
}

/** scalar transition */
export class T {
  constructor(v = 0, ease = EASE.outCubic) {
    this.from = v
    this.to = v
    this.t0 = 0
    this.dur = 0
    this.ease = ease
  }
  set(now, to, dur, ease) {
    if (to === this.to && this.dur === 0) return this
    this.from = this.eval(now)
    this.to = to
    this.t0 = now
    this.dur = dur || 0
    this.ease = ease || this.ease
    return this
  }
  eval(now) {
    if (this.dur <= 0 || now >= this.t0 + this.dur) return this.to
    return this.from + (this.to - this.from) * this.ease(clamp01((now - this.t0) / this.dur))
  }
  get settled() {
    return this.dur <= 0
  }
}

/** vec3 transition with an optional sinusoidal arc (lift / braid offset) */
export class VT {
  constructor(v = new THREE.Vector3()) {
    this.from = v.clone()
    this.to = v.clone()
    this.t0 = 0
    this.dur = 0
    this.ease = EASE.inOutCubic
    this.arcY = 0
    this.arcZ = 0
  }
  set(now, to, { dur = 0.4, ease, arcY = 0, arcZ = 0, from } = {}) {
    this.from.copy(from || this.eval(now, new THREE.Vector3()))
    this.to.copy(to)
    this.t0 = now
    this.dur = dur || 0
    if (ease) this.ease = ease
    this.arcY = arcY
    this.arcZ = arcZ
    return this
  }
  eval(now, out) {
    if (this.dur <= 0 || now >= this.t0 + this.dur) return out.copy(this.to)
    const t = this.ease(clamp01((now - this.t0) / this.dur))
    out.lerpVectors(this.from, this.to, t)
    if (this.arcY || this.arcZ) {
      const s = Math.sin(Math.PI * t) // zero at both ends: no pops
      out.y += this.arcY * s
      out.z += this.arcZ * s
    }
    return out
  }
  get settled() {
    return this.dur <= 0
  }
}

/** colour transition (linear-space Colors, lerped in linear) */
export class CT {
  constructor(c = new THREE.Color()) {
    this.from = c.clone()
    this.to = c.clone()
    this.t0 = 0
    this.dur = 0
  }
  set(now, to, dur = 0.12) {
    if (to === this.to && this.dur === 0) return this
    this.from.copy(this.eval(now, new THREE.Color()))
    this.to.copy(to)
    this.t0 = now
    this.dur = dur || 0
    return this
  }
  eval(now, out) {
    if (this.dur <= 0 || now >= this.t0 + this.dur) return out.copy(this.to)
    return out.copy(this.from).lerp(this.to, clamp01((now - this.t0) / this.dur))
  }
}

/**
 * Pick a move duration from the playback beat so transitions always finish
 * inside the frame that announced them — fast playback gets snappier moves,
 * paused stepping gets the full deliberate curve.
 */
export const moveDuration = (beat, scale = 1) => Math.min(0.5, Math.max(0.14, beat * scale))
