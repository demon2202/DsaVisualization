/**
 * Stage.jsx — the WebGL viewport: camera rig, ground, atmosphere, effects,
 * and the element/link fields driven by the current snapshot.
 */
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useLab } from '../state/lab'
import { createElementMaterial, createGroundMaterial } from './materials'
import { STAGE_BACKGROUND } from '../lib/palette'
import { Elements } from './Elements'
import { Links } from './Links'

const _box = new THREE.Box3()
const _v = new THREE.Vector3()

/* opening orientation per scene: grids read best from above, arrays head-on */
const SCENE_VIEW = {
  tree: [0.16, 0.52, 1],
  heap: [0.14, 0.46, 1],
  list: [0.2, 0.34, 1],
  linear: [0.24, 0.36, 1],
  hash: [0.16, 0.4, 1],
  graph: [0.3, 0.72, 1],
  array: [0.2, 0.42, 1],
  grid: [0.08, 1.15, 0.55],
}

const SCENE_GROUND = {
  tree: -8.6,
  heap: -8.6,
  list: -3.6,
  linear: -4.6,
  hash: -7.0,
  graph: -8.6,
  array: -3.55,
  grid: -2.6,
}

/* ── camera rig: auto-frames the structure, tracks focus, never fights you ─ */
function CameraRig({ snapshot, scene, controlsRef, frameToken, autoRotate, reduced, frameScale }) {
  const { camera } = useThree()
  const desired = useRef(new THREE.Vector3(0, 0, 0))
  const desiredDist = useRef(26)
  const bounds = useRef({ w: 20, h: 12, d: 8 })
  const userBusy = useRef(0)
  const lastToken = useRef(null)

  // compute framing from the live element bounds
  useEffect(() => {
    const nodes = snapshot?.nodes || []
    if (!nodes.length) return
    _box.makeEmpty()
    for (const n of nodes) _box.expandByPoint(_v.set(n.pos[0], n.pos[1], n.pos[2]))
    const center = _box.getCenter(new THREE.Vector3())
    const size = _box.getSize(new THREE.Vector3())
    desired.current.copy(center)
    bounds.current = {
      w: Math.max(size.x, 6) + 3,
      h: Math.max(size.y, 5) + 3,
      d: Math.max(size.z, 4) + 3,
    }
  }, [snapshot, scene])

  // aspect-aware fit distance, recomputed every frame so panel resizes adapt
  const fitDistance = () => {
    const b = bounds.current
    const vFov = (camera.fov * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(camera.aspect, 0.35))
    const span = scene === 'grid' ? Math.max(b.w, b.h) : Math.max(b.w, b.d)
    const fit = Math.max(span / 2 / Math.tan(hFov / 2), b.h / 2 / Math.tan(vFov / 2))
    return THREE.MathUtils.clamp(fit * (scene === 'grid' ? 1.28 : frameScale), 8, 96)
  }

  // hard re-frame when the structure changes or the user asks for it
  useEffect(() => {
    const c = controlsRef.current
    if (!c) return
    if (lastToken.current === frameToken) return
    lastToken.current = frameToken
    c.target.copy(desired.current)
    const pref = SCENE_VIEW[scene] || SCENE_VIEW.tree
    const dir = new THREE.Vector3(pref[0], pref[1], pref[2]).normalize()
    camera.position.copy(c.target).addScaledVector(dir, fitDistance())
    c.update()
  }, [frameToken, camera, controlsRef, frameScale])

  useFrame((state, rawDt) => {
    const dt = Math.min(0.05, rawDt)
    const c = controlsRef.current
    if (!c) return
    if (userBusy.current > 0) {
      userBusy.current -= dt
      return
    }

    // drift the orbit target towards the algorithm's focus, else the centroid
    const f = snapshot?.focus
    const goal = f ? _v.set(f[0], f[1], f[2]) : desired.current
    if (reduced) {
      // reduced motion: the rig snaps, it does not drift
      c.target.copy(goal)
      const off = new THREE.Vector3().subVectors(camera.position, c.target)
      off.setLength(fitDistance())
      camera.position.copy(c.target).add(off)
      c.update()
      return
    }
    const k = 1 - Math.exp(-(f ? 3.1 : 2.0) * dt)
    c.target.x += (goal.x - c.target.x) * k
    c.target.y += (goal.y - c.target.y) * k
    c.target.z += (goal.z - c.target.z) * k

    // hold a comfortable distance without stealing zoom control
    const goalDist = fitDistance()
    const offset = new THREE.Vector3().subVectors(camera.position, c.target)
    const d = offset.length() || 1
    const drift = THREE.MathUtils.clamp((goalDist - d) / d, -0.02, 0.02)
    offset.multiplyScalar(1 + drift * (1 - Math.exp(-1.8 * dt)) * 5)
    camera.position.copy(c.target).add(offset)
    void state
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.075}
      rotateSpeed={0.62}
      zoomSpeed={0.75}
      panSpeed={0.6}
      minDistance={5}
      maxDistance={110}
      maxPolarAngle={Math.PI * 0.92}
      autoRotate={autoRotate && userBusy.current <= 0}
      autoRotateSpeed={0.32}
      onStart={() => (userBusy.current = 0.9)}
      onEnd={() => (userBusy.current = 1.4)}
    />
  )
}

/* ── ground: infinite-feeling grid with a pool of light under the scene ──── */
function Ground({ material, y = -8.6 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[420, 420, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function SceneContents({ snapshot, scene, material, groundMat, selected, onSelect, hoveredRef, onHover, controlsRef, frameToken, autoRotate, quality, pool, frameIndex, editMode, onNodeMove, onLinkSelect, selectedLink, frameScale }) {
  /* the motion beat: how long a frame stays on screen at the current speed.
     transitions finish inside it, so playback never stacks unfinished moves */
  const playing = useLab((s) => s.playing)
  const speed = useLab((s) => s.speed)
  const beat = playing ? Math.min(0.5, Math.max(0.14, (0.72 / speed) * 0.62)) : 0.45
  const reduced = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  return (
    <>
      <CameraRig snapshot={snapshot} scene={scene} controlsRef={controlsRef} frameToken={frameToken} autoRotate={autoRotate && !reduced} reduced={reduced} frameScale={frameScale} />
      <Ground material={groundMat} y={SCENE_GROUND[scene] ?? -8.6} />

      <Elements
        scene={scene}
        quality={quality}
        nodes={snapshot?.nodes || []}
        material={material}
        pool={pool}
        selected={selected}
        onSelect={onSelect}
        onHover={onHover}
        hoveredRef={hoveredRef}
        beat={beat}
        frameIndex={frameIndex}
        reduced={reduced}
        editMode={editMode}
        onNodeMove={onNodeMove}
      />
      <Links links={snapshot?.links || []} pool={pool} material={material} quality={quality} reduced={reduced} onLinkSelect={onLinkSelect} selectedLink={selectedLink} />

      {(!snapshot?.nodes || snapshot.nodes.length === 0) && <EmptyHint />}
    </>
  )
}

/* The element pool (id -> sprung transform record) is created once per Stage
   and shared by Elements and Links so tubes follow the nodes they connect. */

function EmptyHint() {
  return (
    <Text position={[0, 0, 0]} font="/fonts/JetBrainsMono-Medium.ttf" fontSize={0.5} color="#3a424e" anchorX="center" anchorY="middle">
      empty — run an operation
    </Text>
  )
}

export default function Stage({ snapshot, scene, selected, onSelect, onHover, frameToken, autoRotate, quality, frameIndex = null, editMode = false, onNodeMove, onLinkSelect, selectedLink = null, frameScale = 1.42 }) {
  const material = useMemo(() => createElementMaterial(), [])
  const groundMat = useMemo(() => createGroundMaterial(), [])
  const controlsRef = useRef()
  const hoveredRef = useRef(null)
  const pool = useRef(new Map())

  useEffect(() => {
    return () => {
      material.dispose()
      groundMat.dispose()
    }
  }, [material, groundMat])

  /* DEV-only introspection: lets tests prove convergence of the pool */
  useEffect(() => {
    if (import.meta.env.DEV) window.__stagePool = pool
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    return () => {
      delete window.__stageCam
    }
  }, [])

  return (
    <Canvas
      flat
      dpr={quality === 'high' ? [1, 2] : [1, 1.35]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true }}
      camera={{ position: [0, 10.5, 28], fov: 40, near: 0.1, far: 400 }}
      onCreated={({ gl, scene, camera }) => {
        gl.setClearColor(STAGE_BACKGROUND, 1)
        scene.background = new THREE.Color(STAGE_BACKGROUND)
        if (import.meta.env.DEV) window.__stageCam = camera
      }}
    >
      <Suspense fallback={null}>
        <SceneContents
          snapshot={snapshot}
          scene={scene}
          material={material}
          groundMat={groundMat}
          selected={selected}
          onSelect={onSelect}
          onHover={onHover}
          hoveredRef={hoveredRef}
          controlsRef={controlsRef}
          frameToken={frameToken}
          autoRotate={autoRotate}
          quality={quality}
          pool={pool}
          frameIndex={frameIndex}
          editMode={editMode}
          onNodeMove={onNodeMove}
          onLinkSelect={onLinkSelect}
          selectedLink={selectedLink}
          frameScale={frameScale}
        />
      </Suspense>
    </Canvas>
  )
}
