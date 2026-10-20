/**
 * SnapshotDiagram — the 2.5D stage.
 *
 * One SVG renderer for every spatial structure the engines emit: trees,
 * heaps, lists, stacks, queues, hash tables, graphs and grids. Positions come
 * from the snapshot itself, so a node moving between frames is the algorithm
 * moving, not a second animation invented for display.
 *
 * Depth is drawn, not simulated: circular nodes carry a cast plate, while
 * lists, buckets, heap cells and grid terrain are isometric slabs with a lit
 * top face and a shaded side. Values are printed at a size tied to the node,
 * never hidden when the structure grows — that was the failure of the old
 * WebGL labels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { linkOf, stateOf } from '../../lib/palette'

const COS = 0.866
const SIN = 0.5
const BONE = '#f2efe9'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const num = (v) => (v === null || v === undefined ? '' : String(v))

/** project a snapshot position into flat drawing units */
function project(scene, pos) {
  const [x = 0, y = 0, z = 0] = pos || []
  if (scene === 'graph' || scene === 'grid') return [(x - z) * COS, (x + z) * SIN]
  return [x + z * 0.55, -y + z * 0.34]
}

function radiusUnits(scene, node) {
  if (scene === 'tree') return 0.92
  if (scene === 'heap') return node.id?.startsWith('arr_') ? 0 : 0.72
  if (scene === 'graph') return 0.68
  if (scene === 'hash') return 0.55
  return 0.7
}

/** how much space a node's silhouette needs in drawing units */
function extentOf(scene, node, [u, v]) {
  if (node.tile) {
    const hw = (node.tile.w || 1) / 2
    const hd = (node.tile.d || node.tile.w || 1) / 2
    const h = node.tile.h || 0
    return {
      minU: u - (hw + hd) * COS,
      maxU: u + (hw + hd) * COS,
      minV: v - (hw + hd) * SIN - h,
      maxV: v + (hw + hd) * SIN,
    }
  }
  if (node.plate || node.block) {
    const box = node.plate || node.block
    const hw = (box.w || 1) / 2
    const hh = (box.h || 1) / 2
    return { minU: u - hw - 0.25, maxU: u + hw + 0.25, minV: v - hh - 0.35, maxV: v + hh + 0.35 }
  }
  const r = radiusUnits(scene, node)
  return { minU: u - r, maxU: u + r, minV: v - r - 0.25, maxV: v + r + 0.25 }
}

function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      setSize({ w: box.width, h: box.height })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])
  return size
}

function markerColors() {
  return ['#5a554c', '#ff5a36', '#8fa6b2', '#a9c3a3', '#d97a67', '#b3a1c9', '#3b3832']
}

/** the common circular node: a body, a cast plate, and a large value */
function CircleNode({ node, x, y, r, st, selected, hovered, tag, onSelect, onHover, onPointerDown, dragging }) {
  const chars = num(node.value).length
  const font = clamp(r * (chars > 3 ? 0.62 : chars > 2 ? 0.72 : 0.84), 10, 27)
  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={dragging ? { duration: 0 } : { duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(node.id, node) } : undefined}
      onPointerEnter={onHover ? () => onHover(node.id, node) : undefined}
      onPointerLeave={() => onHover?.(null, null)}
      onPointerDown={onPointerDown}
      className="diagram-node"
    >
      {st.ring && <circle r={r + 4.5} fill="none" stroke={st.stroke} strokeWidth="1" opacity="0.55" />}
      {(selected || hovered) && <circle r={r + 3} fill="none" stroke={selected ? '#ff5a36' : BONE} strokeWidth={selected ? 1.8 : 1} opacity="0.9" />}
      <circle cx={2.5} cy={4} r={r} fill="#000" opacity="0.42" />
      <circle r={r} fill={st.fill} stroke={st.stroke} strokeWidth="1.2" />
      <text
        y={font * 0.34}
        textAnchor="middle"
        fontSize={font}
        fontWeight="500"
        fill={st.ink}
        style={{ fontFamily: "'Fragment Mono', monospace", letterSpacing: '-0.02em' }}
      >
        {num(node.value)}
      </text>
      {tag && (
        <text
          y={-r - 7}
          textAnchor="middle"
          fontSize="9.5"
          fill="#908c83"
          style={{ fontFamily: "'Fragment Mono', monospace", letterSpacing: '0.08em' }}
        >
          {String(tag).toLowerCase()}
        </text>
      )}
      {node.badge && (
        <g transform={`translate(${r * 0.82}, ${-r * 0.82})`}>
          <rect x="-1" y="-9" width={num(node.badge).length * 6 + 10} height="16" fill="#0a0a0a" stroke="rgba(242,239,233,0.22)" />
          <text x={(num(node.badge).length * 6 + 10) / 2 - 1} y="2.5" textAnchor="middle" fontSize="9.5" fill="#d8d4ca" style={{ fontFamily: "'Fragment Mono', monospace" }}>
            {node.badge}
          </text>
        </g>
      )}
    </motion.g>
  )
}

/** an isometric slab — the body language for lists, stacks, buckets and heap cells */
function Slab({ w, h, fill, stroke, depth = 6, children, ...rest }) {
  const hw = w / 2
  const hh = h / 2
  const d = Math.min(depth, Math.min(w, h) * 0.26)
  const x = -hw
  const y = -hh
  return (
    <g {...rest}>
      <polygon
        points={`${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`}
        fill={fill}
        stroke="none"
        opacity="0.92"
      />
      <polygon
        points={`${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`}
        fill="#000"
        opacity="0.28"
        stroke="none"
      />
      <polygon
        points={`${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`}
        fill={BONE}
        opacity="0.055"
        stroke="none"
      />
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth="1.1" />
      {children}
    </g>
  )
}

function SlabNode({ node, x, y, scale, st, selected, hovered, onSelect, onHover }) {
  const box = node.plate || node.block || node.tile
  const w = Math.max(12, box.w * scale)
  const h = Math.max(12, box.h * scale)
  const font = clamp(Math.min(w / Math.max(2, num(node.value).length) * 0.72, h * 0.44), 10, 32)
  const sub = node.sub || node.index
  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(node.id, node) } : undefined}
      onPointerEnter={onHover ? () => onHover(node.id, node) : undefined}
      onPointerLeave={() => onHover?.(null, null)}
      className="diagram-node"
    >
      {(selected || hovered) && (
        <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} fill="none" stroke={selected ? '#ff5a36' : BONE} strokeWidth={selected ? 1.8 : 1} opacity="0.9" />
      )}
      <Slab w={w} h={h} fill={st.fill} stroke={st.stroke} depth={7}>
        {node.value !== null && node.value !== undefined && (
          <text y={font * 0.34} textAnchor="middle" fontSize={font} fontWeight="500" fill={st.ink} style={{ fontFamily: "'Fragment Mono', monospace" }}>
            {num(node.value)}
          </text>
        )}
        {node.value === null && (
          <text y={4} textAnchor="middle" fontSize={clamp(h * 0.3, 9, 15)} fill="#6f6a61" style={{ fontFamily: "'Fragment Mono', monospace" }}>
            —
          </text>
        )}
        {node.tag && (
          <text y={-h / 2 - 8} textAnchor="middle" fontSize="9.5" fill="#908c83" style={{ fontFamily: "'Fragment Mono', monospace", letterSpacing: '0.08em' }}>
            {node.tag}
          </text>
        )}
        {sub !== null && sub !== undefined && (
          <text y={h / 2 + 15} textAnchor="middle" fontSize="10" fill="#625f57" style={{ fontFamily: "'Fragment Mono', monospace" }}>
            {sub}
          </text>
        )}
      </Slab>
      {node.pointer && (
        <text y={-h / 2 - 9} textAnchor="middle" fontSize="9.5" fill="#ff5a36" style={{ fontFamily: "'Fragment Mono', monospace", letterSpacing: '0.08em' }}>
          {node.pointer}
        </text>
      )}
    </motion.g>
  )
}

export default function SnapshotDiagram({
  snapshot,
  scene = 'tree',
  fitSteps = null,
  selected = null,
  selectedLink = null,
  editMode = false,
  onSelect,
  onHover,
  onLinkSelect,
  onNodeMove,
  className = '',
}) {
  const hostRef = useRef(null)
  const svgRef = useRef(null)
  const { w: width, h: height } = useSize(hostRef)
  const [hovered, setHovered] = useState(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const nodes = useMemo(() => snapshot?.nodes || [], [snapshot])
  const links = useMemo(() => snapshot?.links || [], [snapshot])

  const bounds = useMemo(() => {
    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    const visit = (n) => {
      if (!n?.pos) return
      const p = project(scene, scene === 'grid' ? [n.pos[0], 0, n.pos[2]] : n.pos)
      const e = extentOf(scene, n, p)
      if (e.minU < minU) minU = e.minU
      if (e.maxU > maxU) maxU = e.maxU
      if (e.minV < minV) minV = e.minV
      if (e.maxV > maxV) maxV = e.maxV
    }
    if (fitSteps?.length) {
      for (const step of fitSteps) for (const n of step.nodes || []) visit(n)
    }
    for (const n of nodes) visit(n)
    if (!Number.isFinite(minU)) return { minU: -6, maxU: 6, minV: -4, maxV: 4 }
    const pad = scene === 'grid' ? 0.15 : 0.6
    return { minU: minU - pad, maxU: maxU + pad, minV: minV - pad, maxV: maxV + pad }
  }, [scene, nodes, fitSteps])

  const spanU = Math.max(0.001, bounds.maxU - bounds.minU)
  const spanV = Math.max(0.001, bounds.maxV - bounds.minV)
  const padPx = width < 520 ? 18 : 34
  const scale = Math.min((width - padPx * 2) / spanU, (height - padPx * 2) / spanV)
  const offsetX = width / 2 - ((bounds.minU + bounds.maxU) / 2) * scale
  const offsetY = height / 2 - ((bounds.minV + bounds.maxV) / 2) * scale

  const sx = (pos) => offsetX + project(scene, scene === 'grid' ? [pos[0], 0, pos[2]] : pos)[0] * scale
  const sy = (pos) => offsetY + project(scene, scene === 'grid' ? [pos[0], 0, pos[2]] : pos)[1] * scale

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const linkTransition = { duration: 0.44, ease: [0.16, 1, 0.3, 1] }

  const moveDrag = useCallback(
    (e) => {
      if (!dragRef.current || !onNodeMove) return
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      if (scene !== 'graph') return
      const u = (px - offsetX) / scale
      const v = (py - offsetY) / scale
      const x = u / (2 * COS) + v / (2 * SIN)
      const z = v / (2 * SIN) - u / (2 * COS)
      onNodeMove(dragRef.current, { x, y: 0, z })
    },
    [offsetX, offsetY, onNodeMove, scale, scene],
  )

  const endDrag = useCallback(() => {
    dragRef.current = null
    setDragging(false)
  }, [])

  useEffect(() => {
    const up = () => endDrag()
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [endDrag])

  const startDrag = (id) => (e) => {
    if (!editMode || scene !== 'graph' || !onNodeMove) return
    e.stopPropagation()
    dragRef.current = id
    setDragging(true)
    svgRef.current?.setPointerCapture?.(e.pointerId)
  }

  const colors = markerColors()

  if (!width || !height) return <div ref={hostRef} className={`h-full w-full ${className}`} />

  return (
    <div ref={hostRef} className={`relative h-full w-full ${className}`} data-stage={scene}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="block h-full w-full select-none"
        role="group"
        aria-label={`${scene} drawn from the current engine snapshot`}
        onPointerMove={moveDrag}
        onPointerDown={(e) => {
          if (scene === 'graph' && editMode && e.target === e.currentTarget) endDrag()
        }}
      >
        <defs>
          {colors.map((c, i) => (
            <marker key={c} id={`sd-arrow-${i}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 8 4 0 8 2 4z" fill={c} />
            </marker>
          ))}
          <pattern id="sd-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#625f57" strokeWidth="1" />
          </pattern>
        </defs>

        {/* ── links ───────────────────────────────────────────────────── */}
        {links.map((l) => {
          const a = byId.get(l.from)
          const b = byId.get(l.to)
          if (!a || !b) return null
          const st = linkOf(l.state)
          const x1 = sx(a.pos)
          const y1 = sy(a.pos)
          const x2 = sx(b.pos)
          const y2 = sy(b.pos)
          const isGraph = scene === 'graph'
          const selectedEdge = selectedLink === l.id
          const markerIndex = Math.max(0, colors.indexOf(selectedEdge ? '#ff5a36' : st.hex))
          const dx = x2 - x1
          const dy = y2 - y1
          const len = Math.hypot(dx, dy) || 1
          const padA = isGraph ? 13 : a.plate || a.block ? 18 : scene === 'tree' ? 0 : 6
          const padB = isGraph ? 13 : b.plate || b.block ? 18 : scene === 'tree' ? 0 : 10
          const ax = x1 + (dx / len) * padA
          const ay = y1 + (dy / len) * padA
          const bx = x2 - (dx / len) * padB
          const by = y2 - (dy / len) * padB
          return (
            <g key={l.id}>
              <motion.line
                initial={false}
                animate={{ x1: ax, y1: ay, x2: bx, y2: by }}
                transition={linkTransition}
                stroke={selectedEdge ? '#ff5a36' : st.hex}
                strokeWidth={selectedEdge ? 2.6 : st.w}
                strokeOpacity={st.o}
                strokeDasharray={st.dashed ? '4 5' : undefined}
                markerEnd={l.arrow ? `url(#sd-arrow-${markerIndex})` : undefined}
              />
              {isGraph && l.weight !== undefined && (
                <motion.g
                  initial={false}
                  animate={{ x: (x1 + x2) / 2, y: (y1 + y2) / 2 }}
                  transition={linkTransition}
                >
                  <rect x="-9" y="-8" width="18" height="15" fill="#060606" stroke="rgba(242,239,233,0.16)" />
                  <text textAnchor="middle" y="3" fontSize="9.5" fill="#b9b3a8" style={{ fontFamily: "'Fragment Mono', monospace" }}>
                    {l.weight}
                  </text>
                </motion.g>
              )}
              {onLinkSelect && editMode && isGraph && (
                <motion.line
                  initial={false}
                  animate={{ x1: ax, y1: ay, x2: bx, y2: by }}
                  transition={linkTransition}
                  stroke="transparent"
                  strokeWidth="16"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLinkSelect(l.id)
                  }}
                />
              )}
            </g>
          )
        })}

        {/* ── grid terrain: true isometric tiles ─────────────────────── */}
        {scene === 'grid' &&
          nodes.map((n) => {
            const st = stateOf(n.state)
            const tile = n.tile || { w: 1, h: 0.1, d: 1 }
            const hw = tile.w / 2
            const hd = tile.d / 2
            const [cx, cz] = [n.pos[0], n.pos[2]]
            const h = Math.max(0.04, tile.h || 0.06)
            const top = [
              [cx - hw, cz - hd],
              [cx + hw, cz - hd],
              [cx + hw, cz + hd],
              [cx - hw, cz + hd],
            ].map(([x, z]) => [offsetX + (x - z) * COS * scale, offsetY + (x + z) * SIN * scale - h * scale])
            const foot = top.map(([x, y]) => [x, y + h * scale])
            const glyphSize = clamp(tile.w * scale * 0.5, 9, 17)
            return (
              <g key={n.id} className="diagram-tile">
                <polygon points={`${foot[0]} ${foot[1]} ${top[1]} ${top[0]}`} fill="#000" opacity="0.32" />
                <polygon points={`${foot[1]} ${foot[2]} ${top[2]} ${top[1]}`} fill="#000" opacity="0.42" />
                <polygon
                  points={top.map((p) => p.join(',')).join(' ')}
                  fill={st.fill}
                  stroke={hovered === n.id ? BONE : st.stroke}
                  strokeWidth={hovered === n.id ? 1.5 : 0.8}
                  strokeLinejoin="round"
                  style={{ cursor: 'crosshair' }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onSelect?.(n.id, n)
                  }}
                  onPointerEnter={(e) => {
                    setHovered(n.id)
                    onHover?.(n.id, n)
                    if (e.buttons === 1) onHover?.(n.id, n)
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1) onHover?.(n.id, n)
                  }}
                  onPointerLeave={() => setHovered((id) => (id === n.id ? null : id))}
                />
                {n.glyph && (
                  <text
                    x={top.reduce((a, p) => a + p[0], 0) / 4}
                    y={top.reduce((a, p) => a + p[1], 0) / 4 + glyphSize * 0.36}
                    textAnchor="middle"
                    fontSize={glyphSize}
                    fontWeight="600"
                    fill={st.ink}
                    style={{ fontFamily: "'Fragment Mono', monospace", pointerEvents: 'none' }}
                  >
                    {n.glyph}
                  </text>
                )}
              </g>
            )
          })}

        {/* ── graph / tree / hash circular nodes ─────────────────────── */}
        {scene !== 'grid' &&
          nodes.map((n) => {
            if (n.bar) return null
            if (n.plate || n.block || n.tile) {
              return (
                <SlabNode
                  key={n.id}
                  node={n}
                  x={sx(n.pos)}
                  y={sy(n.pos)}
                  scale={scale}
                  st={stateOf(n.state)}
                  selected={selected === n.id}
                  hovered={hovered === n.id}
                  onSelect={onSelect}
                  onHover={(id, node) => {
                    setHovered(id)
                    onHover?.(id, node)
                  }}
                />
              )
            }
            const st = stateOf(n.state)
            const minRadius = scene === 'tree' ? 17 : scene === 'graph' ? 16 : 14
            const r = clamp(radiusUnits(scene, n) * scale, minRadius, 45)
            return (
              <CircleNode
                key={n.id}
                node={n}
                x={sx(n.pos)}
                y={sy(n.pos)}
                r={r}
                st={st}
                selected={selected === n.id}
                hovered={hovered === n.id}
                tag={n.pin ? n.value : n.tag || n.pointer || null}
                onSelect={onSelect}
                onHover={(id, node) => {
                  setHovered(id)
                  onHover?.(id, node)
                }}
                onPointerDown={startDrag(n.id)}
                dragging={dragging}
              />
            )
          })}

        {!nodes.length && (
          <g>
            <text x={width / 2} y={height / 2 - 8} textAnchor="middle" fontSize="12" fill="#625f57" style={{ fontFamily: "'Fragment Mono', monospace", letterSpacing: '0.12em' }}>
              NO DATA
            </text>
            <text x={width / 2} y={height / 2 + 14} textAnchor="middle" fontSize="12" fill="#908c83">
              Run an operation to record a frame
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
