/**
 * Links.jsx — edges as instanced cylinders with real thickness per state.
 *
 * State changes are transitions, not teleports: when an edge becomes
 * explored (probe/flow/active/path) the tube *grows out of its source node*
 * over ~0.25 s, which is what "reaching along an edge" looks like; rejected
 * edges flare and settle; confirmed tree/path edges stay thicker and brighter
 * than the unexplored web, so the explored subtree reads at a glance.
 *
 * Endpoints are trimmed to the node surfaces every frame, so tubes never
 * poke through bodies while nodes move. The old travelling pulse dots were
 * decoration on top of state that the colour already communicated — gone.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { linkOf, STAGE_BACKGROUND } from '../lib/palette'
import { T, CT, EASE } from './motion'

const CAP = 420
const ACAP = 420
const FONT = '/fonts/JetBrainsMono-Medium.ttf'

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _scale = new THREE.Vector3()

const now = () => performance.now() / 1000

const _colorCache = new Map()
function colorCache(hex) {
  let c = _colorCache.get(hex)
  if (!c) {
    c = new THREE.Color(hex)
    _colorCache.set(hex, c)
  }
  return c
}

const LIT = new Set(['probe', 'active', 'flow', 'path', 'reject', 'swap'])

export function Links({ links, pool, material, quality, reduced = false, onLinkSelect, selectedLink }) {
  const D = (d) => (reduced ? 0 : d)
  const tubeRef = useRef()
  const arrowRef = useRef()
  const tubes = useRef(null)
  const arrows = useRef(null)
  const tubeOrder = useRef([])
  const state = useRef(new Map())

  const attach = (mesh, ref, cap) => {
    if (!mesh) return
    const geo = mesh.geometry
    if (!geo.getAttribute('aColor')) {
      const color = new Float32Array(cap * 3)
      const glow = new Float32Array(cap)
      const fade = new Float32Array(cap).fill(1)
      const colorAttr = new THREE.InstancedBufferAttribute(color, 3)
      const glowAttr = new THREE.InstancedBufferAttribute(glow, 1)
      const fadeAttr = new THREE.InstancedBufferAttribute(fade, 1)
      colorAttr.setUsage(THREE.DynamicDrawUsage)
      glowAttr.setUsage(THREE.DynamicDrawUsage)
      fadeAttr.setUsage(THREE.DynamicDrawUsage)
      geo.setAttribute('aColor', colorAttr)
      geo.setAttribute('aGlow', glowAttr)
      geo.setAttribute('aFade', fadeAttr)
      ref.current = { color, glow, fade, colorAttr, glowAttr, fadeAttr }
    }
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.count = 0
    mesh.frustumCulled = false
  }

  useFrame((st, rawDt) => {
    const dt = Math.min(0.05, rawDt)
    const time = now()
    const list = links || []

    const live = new Set()
    for (const l of list) live.add(l.id)
    for (const id of [...state.current.keys()]) if (!live.has(id)) state.current.delete(id)

    let ti = 0
    let ai = 0
    tubeOrder.current.length = 0

    for (const l of list) {
      const from = pool.current.get(l.from)
      const to = pool.current.get(l.to)
      if (!from || !to || from.exiting || to.exiting) continue
      if (ti >= CAP) break

      const ls = linkOf(l.state)
      const lit = LIT.has(l.state)
      let rec = state.current.get(l.id)
      if (!rec) {
        rec = {
          color: colorCache(ls.hex).clone(),
          colorT: new CT(colorCache(ls.hex)),
          glow: 0,
          glowT: new T(0),
          width: ls.w,
          widthT: new T(lit ? 0.4 : ls.w),
          o: 0,
          oT: new T(0),
          grow: lit ? 0 : 1,
          growT: new T(lit ? 0 : 1),
          wasLit: lit,
        }
        rec.colorT.set(time, colorCache(ls.hex), 0)
        rec.glowT.set(time, lit ? 0.9 : 0.16, 0)
        rec.oT.set(time, ls.o * Math.min(from.fade, to.fade), 0.2)
        state.current.set(l.id, rec)
      }
      if (lit && !rec.wasLit) {
        // edge just became explored: grow from the source, flare the width
        rec.growT.set(time, 1, D(0.26), EASE.outCubic)
        rec.widthT.set(time, ls.w, D(0.26), EASE.outCubic)
      } else if (!lit && rec.wasLit) {
        rec.growT.set(time, 1, 0) // stay full-length, only cool down
        rec.widthT.set(time, ls.w, D(0.22), EASE.outCubic)
      } else {
        rec.widthT.set(time, ls.w, D(0.18), EASE.outCubic)
      }
      rec.wasLit = lit
      rec.colorT.set(time, colorCache(ls.hex), D(0.14))
      rec.glowT.set(time, lit ? 0.9 : 0.16, D(0.18))
      rec.oT.set(time, ls.o * Math.min(from.fade, to.fade), D(0.18))

      const col = rec.colorT.eval(time, rec.color)
      const glow = rec.glowT.eval(time)
      const width = rec.widthT.eval(time)
      const o = rec.oT.eval(time) * (l.dashed ? 0.55 : 1)
      const grow = Math.max(0.02, rec.growT.eval(time))

      // endpoints trimmed so tubes never poke through the node bodies
      _a.copy(from.pos)
      _b.copy(to.pos)
      _dir.subVectors(_b, _a)
      const len = _dir.length()
      if (len < 0.001) continue
      _dir.divideScalar(len)

      const trimA = (from.kind === 'sphere' ? from.size[0] : Math.max(from.size[0], from.size[2]) * 0.55) * from.scale * 0.96
      const trimB = (to.kind === 'sphere' ? to.size[0] : Math.max(to.size[0], to.size[2]) * 0.55) * to.scale * 0.96
      const usable = (len - trimA - trimB) * grow
      if (usable <= 0.05) continue

      const zOff = l.z || 0
      _p.copy(_a).addScaledVector(_dir, trimA + usable / 2)
      _p.z += zOff
      _q.setFromUnitVectors(_up, _dir)

      const w = 0.03 * width
      _scale.set(w, usable, w)
      _m.compose(_p, _q, _scale)
      tubeRef.current?.setMatrixAt(ti, _m)
      if (tubes.current) {
        tubes.current.color[ti * 3] = col.r
        tubes.current.color[ti * 3 + 1] = col.g
        tubes.current.color[ti * 3 + 2] = col.b
        tubes.current.glow[ti] = glow
        tubes.current.fade[ti] = o
      }
      tubeOrder.current[ti] = l.id
      ti++

      // arrowhead appears only once the edge has grown in
      if (l.arrow && grow > 0.85 && ai < ACAP) {
        const tpos = l.toEnd ?? 0.5
        _p.copy(_a).addScaledVector(_dir, trimA + usable * tpos)
        _p.z += zOff
        const s = 0.16
        _scale.set(s, s * 1.9, s)
        _m.compose(_p, _q, _scale)
        arrowRef.current?.setMatrixAt(ai, _m)
        if (arrows.current) {
          arrows.current.color[ai * 3] = col.r
          arrows.current.color[ai * 3 + 1] = col.g
          arrows.current.color[ai * 3 + 2] = col.b
          arrows.current.glow[ai] = glow * 1.15
          arrows.current.fade[ai] = o
        }
        ai++
      }
    }

    if (tubeRef.current) {
      tubeRef.current.count = ti
      tubeRef.current.instanceMatrix.needsUpdate = true
      tubes.current.colorAttr.needsUpdate = true
      tubes.current.glowAttr.needsUpdate = true
      tubes.current.fadeAttr.needsUpdate = true
    }
    if (arrowRef.current) {
      arrowRef.current.count = ai
      arrowRef.current.instanceMatrix.needsUpdate = true
      arrows.current.colorAttr.needsUpdate = true
      arrows.current.glowAttr.needsUpdate = true
      arrows.current.fadeAttr.needsUpdate = true
    }
    void dt
  })

  const weights = useMemo(
    () => (links || []).filter((l) => l.weight != null && !l.thin).slice(0, 90),
    [links],
  )

  return (
    <group>
      <instancedMesh
        ref={(m) => {
          tubeRef.current = m
          if (m) attach(m, tubes, CAP)
        }}
        args={[undefined, undefined, CAP]}
        material={material}
        onClick={(e) => {
          if (!onLinkSelect) return
          e.stopPropagation()
          onLinkSelect(tubeOrder.current[e.instanceId] || null)
        }}
      >
        <cylinderGeometry args={[1, 1, 1, 8, 1, true]} />
      </instancedMesh>

      <instancedMesh
        ref={(m) => {
          arrowRef.current = m
          if (m) attach(m, arrows, ACAP)
        }}
        args={[undefined, undefined, ACAP]}
        material={material}
      >
        <coneGeometry args={[1, 1, 10]} />
      </instancedMesh>

      {quality !== 'eco' && weights.map((l) => <WeightLabel key={l.id} link={l} pool={pool} />)}
    </group>
  )
}

function WeightLabel({ link, pool }) {
  const ref = useRef()
  useFrame(({ camera }) => {
    const t = ref.current
    if (!t) return
    const a = pool.current.get(link.from)
    const b = pool.current.get(link.to)
    if (!a || !b) {
      t.visible = false
      return
    }
    t.position.set((a.pos.x + b.pos.x) / 2, (a.pos.y + b.pos.y) / 2 + 0.32, (a.pos.z + b.pos.z) / 2 + (link.z || 0))
    t.quaternion.copy(camera.quaternion)
    const ls = linkOf(link.state)
    if (t.material?.color) {
      t.material.color.set(ls.pulse || LIT.has(link.state) ? ls.hex : '#6f675c')
      t.material.opacity = LIT.has(link.state) ? 0.95 : 0.55
    }
    t.visible = !!t.material
  })
  return (
    <Text ref={ref} font={FONT} fontSize={0.28} color="#6f675c" anchorX="center" anchorY="middle" transparent depthWrite={false} outlineWidth={0.02} outlineColor={STAGE_BACKGROUND}>
      {String(link.weight)}
    </Text>
  )
}
