/**
 * Elements.jsx — one instanced field renders everything the lab shows:
 * spheres (tree/graph/list nodes), rounded slabs (bars, blocks, buckets,
 * tiles). Every object is a pool record carrying time-based transitions
 * (see motion.js), so:
 *
 *   - swaps braid: the two bars lift and pass on opposite sides in z,
 *     keeping their identity instead of sliding through each other
 *   - shifts slide one slot with a short settle curve
 *   - merge flights arc over into the auxiliary row and back
 *   - pivots step forward out of the row while they hold
 *   - seeks and structure switches converge instantly (no stale motion)
 *   - paused frames are exactly at rest (transitions finish, they don't creep)
 *
 * Labels: values ride their object; array slots get a quiet index numeral
 * under the baseline so positions are readable without watching motion.
 */
import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { stateOf } from '../lib/palette'
import { T, VT, CT, EASE, moveDuration } from './motion'

const CAP = 900
const FONT = '/fonts/JetBrainsMono-Bold.ttf'
const INDEX_FONT = '/fonts/JetBrainsMono-Medium.ttf'

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _tv = new THREE.Vector3()
const _target = new THREE.Vector3()

const now = () => performance.now() / 1000
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt))

const _colorCache = new Map()
function colorOf(hex) {
  let c = _colorCache.get(hex)
  if (!c) {
    c = new THREE.Color(hex)
    _colorCache.set(hex, c)
  }
  return c
}

function kindOf(node) {
  if (node.bar || node.tile || node.block || node.plate) return 'box'
  return 'sphere'
}

function sizeOf(node) {
  if (node.bar) return [0.62, node.bar.h, 0.62]
  if (node.tile) return [node.tile.w, node.tile.h, node.tile.d]
  if (node.block) return [node.block.w, node.block.h, node.block.d]
  if (node.plate) return [node.plate.w, node.plate.h, node.plate.d]
  const r = node.small ? 0.34 : node.ghost ? 0.4 : 0.6
  return [r, r, r]
}

/** choose the curve that matches what the algorithm actually did */
function moveFlavor(rec, node, target, beat, jump) {
  if (jump) return { dur: 0, ease: EASE.outCubic, arcY: 0, arcZ: 0 }
  const dx = target.x - rec.posT.to.x
  const dz = target.z - rec.posT.to.z
  const dy = target.y - rec.posT.to.y

  if (node.state === 'swap' && Math.abs(dx) > 0.2) {
    // two objects exchanged slots: lift, and braid past each other in z
    return { dur: moveDuration(beat, 0.95), ease: EASE.inOutCubic, arcY: 0.62, arcZ: dx > 0 ? 0.66 : -0.66 }
  }
  if (Math.abs(dz) > 2) {
    // merge sort: flight between the array row and the auxiliary row
    return { dur: moveDuration(beat, 1.05), ease: EASE.inOutCubic, arcY: 1.15 + Math.abs(dy) * 0.1, arcZ: 0 }
  }
  if (node.state === 'insert' || node.marks?.min) {
    return { dur: moveDuration(beat, 0.85), ease: EASE.inOutCubic, arcY: 0.45, arcZ: 0 }
  }
  if (Math.abs(dx) <= 1.05 && Math.abs(dz) < 0.01 && Math.abs(dy) < 0.01) {
    // one-slot shift (insertion sort, heap sift): a short, quiet slide
    return { dur: 0.2, ease: EASE.outCubic, arcY: 0, arcZ: 0 }
  }
  return { dur: moveDuration(beat, 0.75), ease: EASE.outCubic, arcY: 0, arcZ: 0 }
}

export function Elements({ nodes, material, selected, onSelect, onHover, hoveredRef, pool, scene, quality, beat = 0.45, frameIndex = null, reduced = false, editMode = false, onNodeMove }) {
  /* reduced motion: every transition collapses to an exact set */
  const D = (d) => (reduced ? 0 : d)
  const sphereRef = useRef()
  const boxRef = useRef()
  const ringRef = useRef()
  const order = useRef({ sphere: [], box: [] })
  const { camera } = useThree()

  const sphereAttrs = useRef(null)
  const boxAttrs = useRef(null)
  const prevFrame = useRef(null)
  const prevScene = useRef(scene)
  const dragRef = useRef(null)
  const planeRef = useRef(new THREE.Plane())
  const ptRef = useRef(new THREE.Vector3())
  const camDir = useRef(new THREE.Vector3())

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 26, 18), [])
  const boxGeo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.09), [])
  useEffect(
    () => () => {
      sphereGeo.dispose()
      boxGeo.dispose()
    },
    [sphereGeo, boxGeo],
  )

  /* a new structure means a new world: drop ghosts instead of shrinking them */
  if (prevScene.current !== scene) {
    prevScene.current = scene
    pool.current.clear()
  }
  const jump = frameIndex != null && prevFrame.current != null && Math.abs(frameIndex - prevFrame.current) !== 1
  prevFrame.current = frameIndex

  /* ── reconcile the snapshot into pool records ────────────────────────── */
  const t = now()
  const seen = new Set()
  for (const node of nodes) {
    seen.add(node.id)
    const st = stateOf(node.state)
    const kind = kindOf(node)
    const size = sizeOf(node)
    _target.set(node.pos[0], node.pos[1], node.pos[2] + (node.bar && node.marks?.pivot ? 0.55 : 0))

    let rec = pool.current.get(node.id)
    if (!rec) {
      rec = {
        id: node.id,
        kind,
        pos: new THREE.Vector3(_target.x, _target.y - (jump ? 0 : 0.7), _target.z),
        posT: new VT(new THREE.Vector3(_target.x, _target.y - (jump ? 0 : 0.7), _target.z)),
        scale: 0.0001,
        scaleT: new T(jump ? 1 : 0.0001),
        color: colorOf(st.hex).clone(),
        colorT: new CT(colorOf(st.hex)),
        glow: 0,
        glowT: new T(0),
        fade: jump ? 1 : 0,
        fadeT: new T(jump ? 1 : 0),
        size,
        baseSize: size,
        exiting: false,
        hoverK: 1,
        selK: 1,
        node,
      }
      rec.posT.set(t, _target, { dur: D(jump ? 0 : 0.4), ease: EASE.outCubic })
      rec.scaleT.set(t, 1, D(jump ? 0 : 0.32), EASE.outCubic)
      rec.glowT.set(t, st.e, D(0.2))
      rec.fadeT.set(t, 1, D(jump ? 0 : 0.26))
      pool.current.set(node.id, rec)
    } else {
      rec.kind = kind
      rec.node = node
      rec.size = size
      rec.baseSize = size
      if (rec.posT.to.distanceToSquared(_target) > 1e-8) {
        const fl = moveFlavor(rec, node, _target, beat, jump)
        rec.posT.set(t, _target, { ...fl, dur: D(fl.dur) })
      }
      rec.colorT.set(t, colorOf(st.hex), D(0.12))
      rec.glowT.set(t, st.e, D(0.16))
      rec.fadeT.set(t, 1, D(0.2))
      rec.scaleT.set(t, st.s ?? 1, D(0.24), EASE.outCubic)
      rec.exiting = false
      rec.ring = !!st.ring
    }
  }
  for (const rec of pool.current.values()) {
    if (!seen.has(rec.id) && !rec.exiting) {
      rec.exiting = true
      rec.scaleT.set(t, 0.0001, D(jump ? 0 : 0.16), EASE.inCubic)
      rec.fadeT.set(t, 0.04, D(jump ? 0 : 0.16))
      rec.glowT.set(t, 0, D(0.1))
    }
  }

  /* ── per-frame evaluation: transitions, then one instanced write ─────── */
  useFrame((state, rawDt) => {
    const dt = Math.min(0.05, rawDt)
    const time = now()

    const hovered = hoveredRef?.current
    const buckets = { sphere: [], box: [] }

    for (const rec of pool.current.values()) {
      const isHover = hovered === rec.id
      const isSel = selected === rec.id

      rec.posT.eval(time, rec.pos)
      rec.hoverK = damp(rec.hoverK, isHover ? 1.1 : 1, 16, dt)
      rec.selK = damp(rec.selK, isSel ? 1.07 : 1, 16, dt)
      rec.scale = rec.scaleT.eval(time) * rec.hoverK * rec.selK
      rec.fade = rec.fadeT.eval(time)
      rec.glow = rec.glowT.eval(time) + (isHover ? 0.3 : 0) + (isSel ? 0.2 : 0)
      rec.colorT.eval(time, rec.color)

      if (rec.exiting && rec.scale < 0.012 && rec.fade < 0.05) {
        pool.current.delete(rec.id)
        continue
      }
      buckets[rec.kind].push(rec)
    }

    for (const kind of ['sphere', 'box']) {
      const mesh = kind === 'sphere' ? sphereRef.current : boxRef.current
      const attrs = kind === 'sphere' ? sphereAttrs.current : boxAttrs.current
      if (!mesh || !attrs) continue
      const list = buckets[kind]
      order.current[kind] = list.map((r) => r.id)
      const n = Math.min(list.length, CAP)
      for (let i = 0; i < n; i++) {
        const r = list[i]
        const [w, h, d] = r.size
        const sc = r.scale
        _q.identity()
        _s.set(Math.max(w * sc, 1e-5), Math.max(h * sc, 1e-5), Math.max(d * sc, 1e-5))
        _m.compose(r.pos, _q, _s)
        mesh.setMatrixAt(i, _m)
        attrs.color[i * 3] = r.color.r
        attrs.color[i * 3 + 1] = r.color.g
        attrs.color[i * 3 + 2] = r.color.b
        attrs.glow[i] = r.glow
        attrs.fade[i] = r.fade
      }
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
      attrs.colorAttr.needsUpdate = true
      attrs.glowAttr.needsUpdate = true
      attrs.fadeAttr.needsUpdate = true
    }

    /* selection ring: a calm gold circle, no pulse */
    const ring = ringRef.current
    if (ring) {
      const rec = pool.current.get(selected)
      if (rec && !rec.exiting) {
        ring.visible = true
        ring.position.copy(rec.pos)
        ring.quaternion.copy(camera.quaternion)
        const base = rec.kind === 'sphere' ? rec.size[0] : Math.max(rec.size[0], rec.size[2]) * 0.62
        ring.scale.setScalar(base * 1.5 * rec.scale)
      } else {
        ring.visible = false
      }
    }
    void state
  })

  const pick = useCallback(
    (kind) => (e) => {
      e.stopPropagation()
      const id = order.current[kind][e.instanceId]
      if (id && onSelect) onSelect(id, pool.current.get(id)?.node)
    },
    [onSelect],
  )
  const hover = useCallback(
    (kind) => (e) => {
      e.stopPropagation()
      const id = order.current[kind][e.instanceId]
      if (hoveredRef) hoveredRef.current = id || null
      if (onHover) onHover(id || null, pool.current.get(id)?.node)
      document.body.style.cursor = id ? 'pointer' : 'auto'
    },
    [onHover, hoveredRef],
  )
  /* edit-mode dragging: slide a node along the camera-facing plane through it */
  const downNode = useCallback(
    (e) => {
      if (!editMode || !onNodeMove) return
      const id = order.current.sphere[e.instanceId]
      const rec = id && pool.current.get(id)
      if (!rec) return
      e.stopPropagation()
      camera.getWorldDirection(camDir.current)
      planeRef.current.setFromNormalAndCoplanarPoint(camDir.current, rec.pos)
      dragRef.current = id
      e.target.setPointerCapture?.(e.pointerId)
    },
    [editMode, onNodeMove, pool, camera],
  )
  const moveNode = useCallback(
    (e) => {
      if (dragRef.current && onNodeMove) {
        e.stopPropagation()
        if (e.ray.intersectPlane(planeRef.current, ptRef.current)) {
          onNodeMove(dragRef.current, ptRef.current)
        }
        return
      }
      hover('sphere')(e)
    },
    [onNodeMove, hover],
  )
  const upNode = useCallback((e) => {
    if (dragRef.current) {
      dragRef.current = null
      e.target.releasePointerCapture?.(e.pointerId)
    }
  }, [])

  const hoverOut = useCallback(() => {
    if (hoveredRef) hoveredRef.current = null
    if (onHover) onHover(null, null)
    document.body.style.cursor = 'auto'
  }, [onHover, hoveredRef])

  const attachAttrs = (mesh, ref) => {
    if (!mesh) return
    const geo = mesh.geometry
    if (!geo.getAttribute('aColor')) {
      const color = new Float32Array(CAP * 3)
      const glow = new Float32Array(CAP)
      const fade = new Float32Array(CAP).fill(1)
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

  useEffect(() => () => (document.body.style.cursor = 'auto'), [])

  const labeled = nodes.filter((n) => n.value !== null && n.value !== undefined && !n.pin)

  return (
    <group>
      <instancedMesh
        ref={(m) => {
          sphereRef.current = m
          if (m) attachAttrs(m, sphereAttrs)
        }}
        args={[undefined, undefined, CAP]}
        material={material}
        onClick={pick('sphere')}
        onPointerDown={downNode}
        onPointerMove={moveNode}
        onPointerUp={upNode}
        onPointerOut={hoverOut}
      >
        <primitive object={sphereGeo} attach="geometry" />
      </instancedMesh>

      <instancedMesh
        ref={(m) => {
          boxRef.current = m
          if (m) attachAttrs(m, boxAttrs)
        }}
        args={[undefined, undefined, CAP]}
        material={material}
        onClick={pick('box')}
        onPointerMove={hover('box')}
        onPointerOut={hoverOut}
      >
        <primitive object={boxGeo} attach="geometry" />
      </instancedMesh>

      <mesh ref={ringRef} visible={false} renderOrder={2}>
        <ringGeometry args={[0.9, 1, 72]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={{ uColor: { value: new THREE.Color('#c9a45a') } }}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`uniform vec3 uColor;
            void main(){ gl_FragColor = vec4(uColor, 0.55); }`}
        />
      </mesh>

      <Labels quality={quality} scene={scene} nodes={labeled} pool={pool} />
    </group>
  )
}

/* ── labels: values on objects, indices under the baseline ─────────────── */
function Labels({ quality, scene, nodes, pool }) {
  const refs = useRef(new Map())
  const idxRefs = useRef(new Map())
  const { camera } = useThree()

  useFrame(() => {
    for (const node of nodes) {
      const rec = pool.current.get(node.id)
      if (!rec) continue
      const text = refs.current.get(node.id)
      if (text) {
        const inside = rec.kind === 'sphere'
        const lift = inside ? 0 : rec.size[1] * rec.scale * 0.5 + 0.34
        if (inside) {
          _tv.copy(camera.position).sub(rec.pos).normalize()
          text.position.copy(rec.pos).addScaledVector(_tv, rec.size[0] * rec.scale * 1.12)
        } else {
          text.position.set(rec.pos.x, rec.pos.y + lift, rec.pos.z)
        }
        text.quaternion.copy(camera.quaternion)
        text.scale.setScalar(Math.max(rec.scale * (inside ? 1 : 0.94), 0.001))
        text.visible = rec.fade > 0.08
        if (text.material) text.material.opacity = rec.fade
      }
      const idx = idxRefs.current.get(node.id)
      if (idx) {
        idx.position.set(rec.pos.x, rec.pos.y - rec.size[1] * rec.scale * 0.5 - 0.42, rec.pos.z)
        idx.quaternion.copy(camera.quaternion)
        idx.scale.setScalar(Math.max(rec.scale, 0.001))
        idx.visible = rec.fade > 0.08
        if (idx.material) idx.material.opacity = rec.fade * 0.8
      }
    }
  })

  return (
    <group>
      {nodes.map((node) => {
        const st = stateOf(node.state)
        const str = String(node.value)
        const inside = !node.bar && !node.tile && !node.block && !node.plate
        const size = inside ? (str.length > 3 ? 0.38 : str.length > 2 ? 0.44 : 0.52) : str.length > 4 ? 0.32 : 0.38
        const hot = ['probe', 'active', 'found', 'insert', 'target', 'visit', 'remove', 'swap', 'restructure', 'frontier'].includes(node.state)
        // eco mode drops resting tile/value glyphs (315 troika texts on grids)
        if (quality === 'eco' && scene === 'grid' && !hot && !inside) return null
        const darkLabel = hot || (inside && node.state === 'root')
        const color = darkLabel ? '#21140c' : '#fff0dc'
        return (
          <group key={node.id}>
            <Text
              ref={(r) => {
                if (r) refs.current.set(node.id, r)
                else refs.current.delete(node.id)
              }}
              font={FONT}
              fontSize={size}
              color={color}
              anchorX="center"
              anchorY="middle"
              transparent
              depthWrite={false}
              depthTest={false}
              outlineWidth={0.035}
              outlineColor="#1b0d11"
              renderOrder={8}
            >
              {str}
            </Text>
            {node.bar && (
              <Text
                ref={(r) => {
                  if (r) idxRefs.current.set(node.id, r)
                  else idxRefs.current.delete(node.id)
                }}
                font={INDEX_FONT}
                fontSize={0.24}
                color="#6f675c"
                anchorX="center"
                anchorY="middle"
                transparent
                depthWrite={false}
                renderOrder={4}
              >
                {String(node.bar.index)}
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}

export function edgeDirection(from, to, out = new THREE.Vector3()) {
  return out.set(to[0] - from[0], to[1] - from[1], to[2] - from[2])
}
