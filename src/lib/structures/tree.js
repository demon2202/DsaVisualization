/**
 * tree.js — BST + AVL engine.
 *
 * Every mutation returns a `Run`: an array of absolute snapshots so the
 * timeline can be scrubbed forwards and backwards without state drift.
 *
 * Snapshot shape (shared by every structure in the app):
 *   { nodes:[{id,value,pos,state,depth?}], links:[{id,from,to,state}],
 *     aux?, note, code:[lineIdx], stats?, focus?, banner? }
 */

const Y_STEP = 2.15
const Z_STEP = 0.62

let seq = 0
const uid = () => `n${(++seq).toString(36)}`

class TNode {
  constructor(value) {
    this.id = uid()
    this.value = value
    this.left = null
    this.right = null
    this.h = 1
  }
}

const h = (n) => (n ? n.h : 0)
const bf = (n) => (n ? h(n.left) - h(n.right) : 0)
const size = (n) => (n ? 1 + size(n.left) + size(n.right) : 0)
const height = (n) => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0)
const minOf = (n) => (n && n.left ? minOf(n.left) : n)
const maxOf = (n) => (n && n.right ? maxOf(n.right) : n)

function isBalanced(n) {
  if (!n) return true
  return Math.abs(bf(n)) <= 1 && isBalanced(n.left) && isBalanced(n.right)
}

function rebalance(n) {
  n.h = 1 + Math.max(h(n.left), h(n.right))
  return n
}

/**
 * Layout: a tidy tree, not an in-order index.
 *
 * Leaves get consecutive slots; every parent sits over the midpoint of its
 * children. A parent with one child is offset from it, so a degenerate chain
 * still reads as a staircase rather than collapsing into a vertical line.
 * The slot widens as the tree shrinks, so a 5-node tree fills the stage as
 * confidently as a 30-node tree — and the root is always at x = 0.
 */
const leafCount = (n) => (n ? (!n.left && !n.right ? 1 : leafCount(n.left) + leafCount(n.right)) : 0)

function layout(root, states = {}, linkStates = {}) {
  const nodes = []
  const links = []
  if (!root) return { nodes, links }

  const leaves = Math.max(1, leafCount(root))
  const step = Math.max(1.3, Math.min(2.95, 23 / leaves))
  const slots = new Map()
  let cursor = 0

  const place = (n, depth) => {
    if (!n) return null
    const left = place(n.left, depth + 1)
    const own = cursor * step
    cursor += 1
    const right = place(n.right, depth + 1)
    let x = own
    if (left != null && right != null) x = (left + right) / 2
    else if (left != null) x = left + step * 0.58
    else if (right != null) x = right - step * 0.58
    slots.set(n.id, { x, depth })
    return x
  }
  place(root, 0)

  const dx = slots.get(root.id).x
  const walk = (n, parentId) => {
    if (!n) return
    const slot = slots.get(n.id)
    nodes.push({
      id: n.id,
      value: n.value,
      pos: [slot.x - dx, -slot.depth * Y_STEP, slot.depth * Z_STEP],
      state: states[n.id] || (slot.depth === 0 ? 'root' : 'base'),
      depth: slot.depth,
    })
    if (parentId) {
      const key = `${parentId}->${n.id}`
      links.push({ id: key, from: parentId, to: n.id, state: linkStates[key] || 'tree' })
    }
    walk(n.left, n.id)
    walk(n.right, n.id)
  }
  walk(root, null)
  return { nodes, links }
}

export function createTree({ avl = false, seed = null } = {}) {
  let root = seed

  const stats = (extra = {}) => ({
    nodes: size(root),
    height: height(root),
    balanced: isBalanced(root),
    min: root ? minOf(root).value : null,
    max: root ? maxOf(root).value : null,
    idealHeight: root ? Math.ceil(Math.log2(size(root) + 1)) : 0,
    ...extra,
  })

  const snap = (o = {}) => {
    const { nodes, links } = layout(root, o.states, o.linkStates)
    return {
      nodes,
      links,
      note: o.note || '',
      code: o.code || [],
      stats: o.stats || stats(o.statExtra),
      focus: o.focus || null,
      banner: o.banner || null,
      aux: o.aux || null,
    }
  }

  const focusOf = (nodes, id) => nodes.find((n) => n.id === id)?.pos || null

  /* ── rotations (AVL) ─────────────────────────────────────────────────── */
  function rotR(y) {
    const x = y.left
    const t = x.right
    x.right = y
    y.left = t
    rebalance(y)
    rebalance(x)
    return x
  }
  function rotL(x) {
    const y = x.right
    const t = y.left
    y.left = x
    x.right = t
    rebalance(x)
    rebalance(y)
    return y
  }

  function balanceNode(n, steps, pathStates) {
    if (!n) return n
    rebalance(n)
    if (!avl) return n
    const b = bf(n)
    if (b > 1) {
      if (bf(n.left) < 0) {
        steps.push(
          snap({
            states: { ...pathStates, [n.id]: 'restructure', [n.left.id]: 'restructure' },
            note: `Balance factor at ${n.value} is +2 but its left child leans right — LR case. Rotate the child left first.`,
            banner: 'LR · double rotation',
            code: ['rot.lr'],
            stats: stats({ balanceFactor: b }),
          }),
        )
        n.left = rotL(n.left)
      } else {
        steps.push(
          snap({
            states: { ...pathStates, [n.id]: 'restructure' },
            note: `Balance factor at ${n.value} is +2 and the left subtree leans left — LL case. One right rotation fixes it.`,
            banner: 'LL · right rotation',
            code: ['rot.ll'],
            stats: stats({ balanceFactor: b }),
          }),
        )
      }
      const before = n.value
      n = rotR(n)
      steps.push(
        snap({
          states: { [n.id]: 'insert' },
          note: `Rotated right around ${before}. ${n.value} is the new subtree root and heights are back within 1.`,
          banner: 'ROTATE ⟲',
          code: ['rot.ll', 'rot.apply'],
          stats: stats({ balanceFactor: bf(n) }),
          focus: focusOf(layout(root).nodes, n.id),
        }),
      )
      return n
    }
    if (b < -1) {
      if (bf(n.right) > 0) {
        steps.push(
          snap({
            states: { ...pathStates, [n.id]: 'restructure', [n.right.id]: 'restructure' },
            note: `Balance factor at ${n.value} is −2 but its right child leans left — RL case. Rotate the child right first.`,
            banner: 'RL · double rotation',
            code: ['rot.rl'],
            stats: stats({ balanceFactor: b }),
          }),
        )
        n.right = rotR(n.right)
      } else {
        steps.push(
          snap({
            states: { ...pathStates, [n.id]: 'restructure' },
            note: `Balance factor at ${n.value} is −2 and the right subtree leans right — RR case. One left rotation fixes it.`,
            banner: 'RR · left rotation',
            code: ['rot.rr'],
            stats: stats({ balanceFactor: b }),
          }),
        )
      }
      const before = n.value
      n = rotL(n)
      steps.push(
        snap({
          states: { [n.id]: 'insert' },
          note: `Rotated left around ${before}. ${n.value} is the new subtree root — the tree stays O(log n) deep.`,
          banner: 'ROTATE ⟳',
          code: ['rot.rr', 'rot.apply'],
          stats: stats({ balanceFactor: bf(n) }),
          focus: focusOf(layout(root).nodes, n.id),
        }),
      )
      return n
    }
    return n
  }

  /* ── INSERT ──────────────────────────────────────────────────────────── */
  function insert(value) {
    const steps = []
    const v = Number(value)
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    if (find(root, v)) return { ok: false, error: `${v} is already in the tree`, steps }

    let comparisons = 0
    if (!root) {
      root = new TNode(v)
      steps.push(
        snap({
          states: { [root.id]: 'insert' },
          note: `Tree is empty. ${v} becomes the root.`,
          code: ['ins.root'],
          banner: 'ROOT',
        }),
      )
      return { ok: true, steps, summary: `Inserted ${v} as root` }
    }

    const path = []
    const insertInto = (node) => {
      if (!node) {
        const nn = new TNode(v)
        path.push(nn.id)
        steps.push(
          snap({
            states: Object.fromEntries(path.map((id, i) => [id, i === path.length - 1 ? 'insert' : 'visited'])),
            note: `Null pointer reached — ${v} is attached here as a new leaf.`,
            code: ['ins.null', 'ins.attach'],
            banner: 'ATTACH',
            statExtra: { comparisons },
          }),
        )
        return nn
      }
      comparisons++
      path.push(node.id)
      steps.push(
        snap({
          states: Object.fromEntries(path.map((id, i) => [id, i === path.length - 1 ? 'probe' : 'visited'])),
          note: `Compare ${v} with ${node.value}. ${v < node.value ? `${v} is smaller → descend left.` : `${v} is larger → descend right.`}`,
          code: v < node.value ? ['ins.left'] : ['ins.right'],
          focus: focusOf(layout(root).nodes, node.id),
          statExtra: { comparisons },
        }),
      )
      if (v < node.value) {
        node.left = insertInto(node.left)
        if (node.left) {
          const key = `${node.id}->${node.left.id}`
          steps.push(
            snap({
              states: Object.fromEntries(path.map((id) => [id, 'visited'])),
              linkStates: { [key]: 'flow' },
              note: `Link ${node.value} → left child established.`,
              code: ['ins.left'],
              statExtra: { comparisons },
            }),
          )
        }
      } else {
        node.right = insertInto(node.right)
        if (node.right) {
          const key = `${node.id}->${node.right.id}`
          steps.push(
            snap({
              states: Object.fromEntries(path.map((id) => [id, 'visited'])),
              linkStates: { [key]: 'flow' },
              note: `Link ${node.value} → right child established.`,
              code: ['ins.right'],
              statExtra: { comparisons },
            }),
          )
        }
      }
      return balanceNode(node, steps, Object.fromEntries(path.map((id) => [id, 'visited'])))
    }

    root = insertInto(root)
    steps.push(
      snap({
        states: { [path[path.length - 1]]: 'found' },
        note: `${v} is in the tree. ${avl ? 'AVL invariant restored: heights differ by at most 1.' : 'BST invariant holds: left < node < right.'}`,
        code: ['ins.done'],
        banner: avl ? 'BALANCED' : 'INSERTED',
      }),
    )
    return { ok: true, steps, summary: `Inserted ${v} · ${comparisons} comparison${comparisons === 1 ? '' : 's'}` }
  }

  /* ── SEARCH ──────────────────────────────────────────────────────────── */
  function find(n, v) {
    while (n) {
      if (v === n.value) return n
      n = v < n.value ? n.left : n.right
    }
    return null
  }

  function search(value) {
    const steps = []
    const v = Number(value)
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    if (!root) return { ok: false, error: 'Tree is empty', steps }

    let n = root
    let comparisons = 0
    const visited = []
    while (n) {
      comparisons++
      visited.push(n.id)
      if (v === n.value) {
        steps.push(
          snap({
            states: Object.fromEntries(visited.map((id, i) => [id, i === visited.length - 1 ? 'found' : 'visited'])),
            note: `${v} === ${n.value}. Found after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`,
            code: ['sea.hit'],
            banner: 'FOUND',
            focus: focusOf(layout(root).nodes, n.id),
            statExtra: { comparisons },
          }),
        )
        return { ok: true, steps, summary: `Found ${v} in ${comparisons} step${comparisons === 1 ? '' : 's'}` }
      }
      const goLeft = v < n.value
      steps.push(
        snap({
          states: Object.fromEntries(visited.map((id, i) => [id, i === visited.length - 1 ? 'probe' : 'visited'])),
          note: `${v} ${goLeft ? '<' : '>'} ${n.value} → go ${goLeft ? 'left' : 'right'}. Eliminates ${goLeft ? size(n.right) : size(n.left)} node${goLeft ? size(n.right) === 1 ? '' : 's' : size(n.left) === 1 ? '' : 's'} from the search.`,
          code: goLeft ? ['sea.left'] : ['sea.right'],
          focus: focusOf(layout(root).nodes, n.id),
          statExtra: { comparisons },
        }),
      )
      n = goLeft ? n.left : n.right
    }
    steps.push(
      snap({
        states: Object.fromEntries(visited.map((id) => [id, 'visited'])),
        note: `Null pointer. ${v} is not in the tree; the search took ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`,
        code: ['sea.miss'],
        banner: 'NOT FOUND',
        statExtra: { comparisons },
      }),
    )
    return { ok: false, steps, summary: `${v} not found · ${comparisons} comparisons` }
  }

  /* ── DELETE ──────────────────────────────────────────────────────────── */
  function remove(value) {
    const steps = []
    const v = Number(value)
    if (!Number.isFinite(v)) return { ok: false, error: 'Enter a number', steps }
    if (!root) return { ok: false, error: 'Tree is empty', steps }
    if (!find(root, v)) return { ok: false, error: `${v} is not in the tree`, steps }

    const path = []
    const pathStates = (extra = {}) => Object.fromEntries([...path.map((id) => [id, 'visited']), ...Object.entries(extra)])

    const del = (node) => {
      if (!node) return null
      path.push(node.id)
      if (v < node.value) {
        steps.push(snap({ states: pathStates({ [node.id]: 'probe' }), note: `${v} < ${node.value} → descend left to find it.`, code: ['del.left'], focus: focusOf(layout(root).nodes, node.id) }))
        node.left = del(node.left)
      } else if (v > node.value) {
        steps.push(snap({ states: pathStates({ [node.id]: 'probe' }), note: `${v} > ${node.value} → descend right to find it.`, code: ['del.right'], focus: focusOf(layout(root).nodes, node.id) }))
        node.right = del(node.right)
      } else {
        steps.push(snap({ states: pathStates({ [node.id]: 'remove' }), note: `Found ${v}. Count its children to choose the delete case.`, code: ['del.found'], banner: 'TARGET', focus: focusOf(layout(root).nodes, node.id) }))

        if (!node.left || !node.right) {
          const child = node.left || node.right
          steps.push(
            snap({
              states: pathStates({ [node.id]: 'remove' }),
              note: child ? `One child. Lift ${child.value} into its place.` : `Leaf node. Remove it; the parent's pointer becomes null.`,
              code: ['del.child'],
              banner: child ? 'ONE CHILD' : 'LEAF',
            }),
          )
          return balanceNode(child, steps, pathStates())
        }

        const succ = minOf(node.right)
        steps.push(
          snap({
            states: pathStates({ [node.id]: 'remove', [succ.id]: 'pivot' }),
            note: `Two children. Replace this value with the in-order successor: the smallest value in the right subtree (${succ.value}).`,
            code: ['del.succ'],
            banner: 'IN-ORDER SUCCESSOR',
            focus: focusOf(layout(root).nodes, succ.id),
          }),
        )
        node.value = succ.value
        steps.push(
          snap({
            states: pathStates({ [node.id]: 'swap' }),
            note: `Value copied. This node now holds ${succ.value}; remove the duplicate from the right subtree.`,
            code: ['del.copy'],
            banner: 'COPY VALUE',
          }),
        )
        const oldV = v
        // recurse to delete the successor from the right subtree
        const savedPath = [...path]
        const target = succ.value
        const delSucc = (n2) => {
          if (!n2) return null
          path.push(n2.id)
          if (target < n2.value) n2.left = delSucc(n2.left)
          else if (target > n2.value) n2.right = delSucc(n2.right)
          else {
            steps.push(snap({ states: pathStates({ [n2.id]: 'remove' }), note: `Reached the leftover copy of ${target} — remove it.`, code: ['del.recurse'] }))
            return balanceNode(n2.left || n2.right, steps, pathStates())
          }
          return balanceNode(n2, steps, pathStates())
        }
        node.right = delSucc(node.right)
        path.length = 0
        path.push(...savedPath)
        void oldV
      }
      return balanceNode(node, steps, pathStates())
    }

    root = del(root)
    steps.push(
      snap({
        note: `${v} removed. ${avl ? 'AVL rebalanced along the path to the root.' : 'BST ordering still holds for every remaining node.'}`,
        code: ['del.done'],
        banner: 'DELETED',
      }),
    )
    return { ok: true, steps, summary: `Deleted ${v}` }
  }

  /* ── TRAVERSALS ──────────────────────────────────────────────────────── */
  function traverse(kind) {
    const steps = []
    const out = []
    if (!root) return { ok: false, error: 'Tree is empty', steps }
    const done = new Set()
    const emit = (id, note, code, banner) => {
      const states = {}
      for (const d of done) states[d] = 'visited'
      if (id) states[id] = 'visit'
      steps.push(
        snap({
          states,
          note,
          code,
          banner,
          focus: id ? focusOf(layout(root).nodes, id) : null,
          aux: { kind: 'sequence', items: out.map((v) => ({ value: v })) },
        }),
      )
    }

    if (kind === 'in') {
      const walk = (n) => {
        if (!n) return
        steps.push(snap({ note: `In-order: descend into ${n.value}'s left subtree before visiting.`, code: ['trav.descend'] }))
        walk(n.left)
        out.push(n.value)
        done.add(n.id)
        emit(n.id, `Visit ${n.value}. In-order of a BST always prints ascending: ${out.join(' → ')}`, ['trav.in'], 'IN-ORDER')
        walk(n.right)
      }
      walk(root)
    } else if (kind === 'pre') {
      const walk = (n) => {
        if (!n) return
        out.push(n.value)
        done.add(n.id)
        emit(n.id, `Visit ${n.value} first, then recurse. Pre-order is how you would serialise or clone this tree.`, ['trav.pre'], 'PRE-ORDER')
        walk(n.left)
        walk(n.right)
      }
      walk(root)
    } else if (kind === 'post') {
      const walk = (n) => {
        if (!n) return
        walk(n.left)
        walk(n.right)
        out.push(n.value)
        done.add(n.id)
        emit(n.id, `Children done, now visit ${n.value}. Post-order is what a delete/evaluate pass looks like.`, ['trav.post'], 'POST-ORDER')
      }
      walk(root)
    } else {
      // level order
      const q = [root]
      let level = 0
      while (q.length) {
        const next = []
        for (const n of q) {
          out.push(n.value)
          done.add(n.id)
          emit(n.id, `Level ${level}: visit ${n.value}. BFS uses a queue, so a whole depth is drained before the next one starts.`, ['trav.level'], `LEVEL ${level}`)
          if (n.left) next.push(n.left)
          if (n.right) next.push(n.right)
        }
        q.length = 0
        q.push(...next)
        level++
      }
    }

    steps.push(
      snap({
        note: `${kind === 'level' ? 'Level-order' : kind === 'in' ? 'In-order' : kind === 'pre' ? 'Pre-order' : 'Post-order'} complete: [${out.join(', ')}]`,
        banner: 'DONE',
        code: ['trav.done'],
        aux: { kind: 'sequence', items: out.map((v) => ({ value: v, state: 'sorted' })) },
      }),
    )
    return { ok: true, steps, summary: `${kind}-order: [${out.join(', ')}]`, output: out }
  }

  /* ── bulk helpers ────────────────────────────────────────────────────── */
  function setFromArray(values) {
    for (const v of values) {
      if (!find(root, Number(v))) {
        const r = insert(Number(v))
        void r
      }
    }
  }

  function silentInsert(v) {
    if (find(root, v)) return false
    const ins = (node) => {
      if (!node) return new TNode(v)
      if (v < node.value) node.left = ins(node.left)
      else node.right = ins(node.right)
      return balanceNode(node, [], {})
    }
    root = ins(root)
    return true
  }

  return {
    kind: 'tree',
    get root() {
      return root
    },
    get size() {
      return size(root)
    },
    stats,
    snapshot: () => snap({ note: 'Idle. Choose an operation.' }),
    insert,
    search,
    remove,
    traverse,
    silentInsert,
    setFromArray,
    clear() {
      root = null
    },
    values(order = 'in') {
      const out = []
      if (order === 'level') {
        if (!root) return out
        const queue = [root]
        for (let i = 0; i < queue.length; i++) {
          const node = queue[i]
          out.push(node.value)
          if (node.left) queue.push(node.left)
          if (node.right) queue.push(node.right)
        }
        return out
      }
      const walk = (n) => n && (walk(n.left), out.push(n.value), walk(n.right))
      walk(root)
      return out
    },
  }
}
