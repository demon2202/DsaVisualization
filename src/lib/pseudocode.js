/**
 * pseudocode.js — one block per operation.
 * Each line is `id|indent|text`; the id is what an algorithm step references,
 * so the code panel can highlight the exact line being executed.
 */

const parse = (block) =>
  block
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [id, indent, ...rest] = l.split('|')
      return { id, indent: Number(indent), text: rest.join('|') }
    })

const CODE = {
  /* ── trees ───────────────────────────────────────────────────────────── */
  bstInsert: `
    ins.root|1|root ← Node(v)              // empty tree
    ins.null|1|if node is null:
    ins.attach|2|return Node(v)            // attach leaf
    ins.left|1|if v < node.value: node.left  ← insert(node.left, v)
    ins.right|1|else:            node.right ← insert(node.right, v)
    ins.done|1|return node                 // left < node < right holds
  `,
  bstSearch: `
    sea.hit|1|if v = node.value: return node
    sea.left|1|if v < node.value: node ← node.left
    sea.right|1|else:              node ← node.right
    sea.miss|1|return null                 // fell off the tree
  `,
  bstDelete: `
    del.left|1|if v < node.value: node.left  ← delete(node.left, v)
    del.right|1|elif v > node.value: node.right ← delete(node.right, v)
    del.found|1|else:                       // this is the node
    del.child|2|if ≤1 child: return that child   // 0 or 1 child case
    del.succ|2|succ ← min(node.right)      // 2 children case
    del.copy|2|node.value ← succ.value
    del.recurse|2|node.right ← delete(node.right, succ.value)
    del.done|1|return node
  `,
  avlInsert: `
    ins.null|1|if node is null: return Node(v)
    ins.left|1|if v < node.value: node.left  ← insert(node.left, v)
    ins.right|1|else:            node.right ← insert(node.right, v)
    rot.ll|1|bf = +2 & bf(left) ≥ 0  → rotateRight(node)
    rot.lr|1|bf = +2 & bf(left) < 0  → left ← rotateLeft(left)
    rot.rr|1|bf = −2 & bf(right) ≤ 0 → rotateLeft(node)
    rot.rl|1|bf = −2 & bf(right) > 0 → right ← rotateRight(right)
    rot.apply|2|recompute heights up the path
    ins.done|1|return node                 // |bf| ≤ 1 everywhere
  `,
  avlDelete: `
    del.left|1|if v < node.value: node.left  ← delete(node.left, v)
    del.right|1|elif v > node.value: node.right ← delete(node.right, v)
    del.found|1|else:                       // this is the node
    del.child|2|if ≤1 child: replace with that child
    del.succ|2|succ ← min(node.right)
    del.copy|2|node.value ← succ.value
    del.recurse|2|node.right ← delete(node.right, succ.value)
    rot.ll|1|bf = +2 & bf(left) ≥ 0  → rotateRight
    rot.lr|1|bf = +2 & bf(left) < 0  → LR double rotation
    rot.rr|1|bf = −2 & bf(right) ≤ 0 → rotateLeft
    rot.rl|1|bf = −2 & bf(right) > 0 → RL double rotation
    rot.apply|2|recompute heights up the path
    del.done|1|return node
  `,
  traverseIn: `
    trav.descend|1|inorder(node.left)
    trav.in|1|visit(node.value)
    trav.done|1|inorder(node.right)
  `,
  traversePre: `
    trav.pre|1|visit(node.value); preorder(left); preorder(right)
    trav.done|1|return collected order
  `,
  traversePost: `
    trav.post|1|postorder(left); postorder(right); visit(node.value)
    trav.done|1|return collected order
  `,
  traverseLevel: `
    trav.level|1|while queue not empty: node ← pop(); visit(node); push children
    trav.done|1|return collected order
  `,

  /* ── sorting ─────────────────────────────────────────────────────────── */
  bubble: `
    bub.cmp|1|for i, for j: if a[j] > a[j+1]:
    bub.swap|2|swap(a[j], a[j+1]); swapped ← true
    bub.lock|1|a[n−i−1] is now in final position
    bub.early|1|if not swapped: break     // already sorted
    bub.done|1|return a
  `,
  selection: `
    sel.init|1|min ← i                   // assume a[i] is smallest
    sel.cmp|1|for j from i+1 to n−1:
    sel.min|2|if a[j] < a[min]: min ← j
    sel.swap|1|swap(a[i], a[min])
    sel.noswap|1|// min = i, nothing to move
    sel.done|1|return a
  `,
  insertionSort: `
    ins.pick|1|key ← a[i]                // first unsorted value
    ins.shift|1|while j ≥ 0 and a[j] > key: a[j+1] ← a[j]; j−−
    ins.place|1|a[j+1] ← key              // drop into the gap
    ins.done|1|return a
  `,
  shell: `
    sh.gap|0|for gap ← n/2; gap > 0; gap ← gap/2:
    sh.take|1|tmp ← a[i]
    sh.shift|1|while j ≥ gap and a[j−gap] > tmp: a[j] ← a[j−gap]; j −← gap
    sh.place|1|a[j] ← tmp
    sh.done|0|return a
  `,
  merge: `
    mg.base|1|if lo ≥ hi: return          // one element is sorted
    mg.split|1|mid ← (lo+hi)/2; sort(lo,mid); sort(mid+1,hi)
    mg.merge|1|merge(lo, mid, hi):
    mg.cmp|2|while i < |L| and j < |R|:
    mg.takeL|3|if L[i] ≤ R[j]: pick L[i++]
    mg.takeR|3|else:               pick R[j++]
    mg.write|2|a[k++] ← picked           // write back into the array
    mg.drainL|2|copy remaining L
    mg.drainR|2|copy remaining R
    mg.block|2|// [lo..hi] is one sorted block
    mg.done|1|return a                    // O(n) scratch space used
  `,
  quick: `
    qk.base|1|if lo ≥ hi: return
    qk.pivot|1|pivot ← a[hi]             // Lomuto: last element
    qk.cmp|1|for j from lo to hi−1:
    qk.grow|2|if a[j] ≤ pivot: i++        // grow the ≤ region
    qk.swap|2|swap(a[i], a[j])
    qk.place|1|swap(a[i+1], a[hi])       // pivot lands in final slot
    qk.done|1|quicksort(lo, p−1); quicksort(p+1, hi)
  `,
  heapSort: `
    hs.build|0|for i ← n/2−1 down to 0: siftDown(i, n−1)
    hs.child|1|child ← larger of a[2i+1], a[2i+2]
    hs.stop|1|if a[i] ≥ a[child]: return  // heap property holds
    hs.sift|1|swap(a[i], a[child]); i ← child
    hs.heap|0|// index 0 now holds the maximum
    hs.extract|0|swap(a[0], a[end]); end−−; siftDown(0, end−1)
    hs.done|0|return a
  `,

  /* ── graphs ──────────────────────────────────────────────────────────── */
  bfs: `
    bfs.init|0|visited ← {start}; queue ← [start]
    bfs.dequeue|0|cur ← queue.shift()       // oldest first → rings
    bfs.enqueue|1|for n in adj(cur): if n ∉ visited: visited += n; queue.push(n)
    bfs.done|0|return visit order          // first reach = shortest hops
  `,
  dfs: `
    dfs.init|0|stack ← [start]
    dfs.skip|1|if cur ∈ visited: continue   // lazy deletion
    dfs.visit|0|cur ← stack.pop(); visited += cur
    dfs.push|1|for n in adj(cur): stack.push(n)
    dfs.done|0|return visit order
  `,
  dijkstra: `
    dij.init|0|dist[start] ← 0; dist[everything else] ← ∞
    dij.pick|0|cur ← unsettled node with smallest dist
    dij.lock|0|settled += cur              // final, never improves
    dij.relax|1|for n in adj(cur): alt ← dist[cur] + w(cur,n)
    dij.improve|2|if alt < dist[n]: dist[n] ← alt; prev[n] ← cur
    dij.done|0|reconstruct path by walking prev[] backwards
  `,
  prim: `
    prim.init|0|tree ← {start}; cost ← 0
    prim.cut|0|candidates ← edges with exactly one endpoint in tree
    prim.min|0|e ← cheapest candidate
    prim.add|0|tree += e.other; cost += e.weight
    prim.done|0|return cost                 // n−1 edges, no cycles
  `,

  /* ── pathfinding ─────────────────────────────────────────────────────── */
  path: `
    pf.init|0|open ← {start}; g[start] ← 0
    pf.expand|0|cur ← pop lowest-priority cell from open
    pf.score|1|priority ← g[cur] + h(cur, goal)   // A* only
    pf.goal|0|if cur = goal: stop
    pf.trace|0|path ← follow came[] from goal back to start
    pf.nopath|0|open empty → goal unreachable
    pf.done|0|return path, cost, cells expanded
  `,

  /* ── hashing ─────────────────────────────────────────────────────────── */
  hashInsertChain: `
    h.hash|0|bucket ← key mod capacity     // O(1) route to a slot
    h.empty|1|if bucket empty: store directly
    h.collision|1|else: collision
    h.chain|2|bucket.append(Node(key))    // chaining keeps both
    h.store|0|size++; loadFactor ← size / capacity
  `,
  hashInsertProbe: `
    h.hash|0|bucket ← key mod capacity
    h.probeHit|1|while slot[i] is occupied:
    h.probeStep|2|i ← (i + 1) mod capacity   // linear probe
    h.storeProbe|0|slot[i] ← key             // stored away from its hash
  `,
  hashFindChain: `
    h.lookup|0|bucket ← hash(key)
    h.chainStep|1|walk the chain, comparing keys
    h.chainHit|2|if key matches: return value
    h.miss|0|return NOT FOUND              // cost ∝ chain length
  `,
  hashFindProbe: `
    h.lookup|0|i ← hash(key)
    h.probeFound|1|if slot[i] = key: return value
    h.probeStep2|1|elif slot[i] occupied: i ← (i+1) mod capacity
    h.emptyMiss|1|else: return NOT FOUND   // gap ends the cluster
  `,
  hashResize: `
    h.resize|0|if loadFactor > 0.75: capacity ← 2·capacity + 1
    h.resize|1|rehash every stored key: bucket ← key mod newCapacity
    h.resize|2|loadFactor ← size / newCapacity   // chains shrink
  `,
  hashDelete: `
    h.del|0|unlink key from its bucket / mark tombstone
    h.delDone|0|size--; recompute loadFactor
  `,

  /* ── linear ──────────────────────────────────────────────────────────── */
  stack: `
    st.push|0|top++; a[top] ← v           // O(1)
    st.popPre|0|v ← a[top]
    st.pop|0|top−−; return v             // LIFO: newest leaves first
    st.peek|0|return a[top]               // read without removing
  `,
  recursion: `
    rec.intro|0|function fact(n):
    rec.base|1|if n = 0: return 1         // base case, no new frame
    rec.call|1|return n * fact(n−1)      // push frame, suspend
    rec.ret|1|frame receives value, multiplies, returns
    rec.pop|0|pop frame; stack depth −−
    rec.done|0|result arrives at the original caller
  `,
  queue: `
    q.enq|0|a[tail] ← v; tail ← (tail+1) mod cap   // O(1) at the back
    q.deqPre|0|v ← a[head]
    q.deq|0|head ← (head+1) mod cap; return v      // FIFO
    q.front|0|return a[head]
  `,
  deque: `
    dq.pf|0|head−−; a[head] ← v          // front insert, O(1)
    dq.pb|0|a[tail] ← v; tail++          // back insert, O(1)
    dq.popf|0|v ← a[head]; head++; return v
    dq.popb|0|tail−−; v ← a[tail]; return v
  `,

  /* ── linked list ─────────────────────────────────────────────────────── */
  llAppend: `
    ll.first|0|if head = null: head ← Node(v)
    ll.walk|0|cur ← head
    ll.step|1|while cur.next ≠ null: cur ← cur.next   // O(n) walk
    ll.link|0|cur.next ← Node(v)        // one pointer write
  `,
  llPrepend: `
    ll.prep|0|n.next ← head; head ← n   // O(1), no traversal
  `,
  llInsertAt: `
    ll.atWalk|0|cur ← head
    ll.atStep|1|advance cur (index−1) times   // no random access
    ll.splice|0|n.next ← cur.next; cur.next ← n   // assign n first
  `,
  llRemove: `
    ll.delHead|0|if target is head: head ← head.next
    ll.delHeadDone|0|free old head
    ll.delWalk|1|walk keeping prev until cur = target
    ll.delBypass|0|prev.next ← cur.next      // bypass, not move
    ll.delDone|0|free cur
  `,
  llSearch: `
    ll.search|0|cur ← head; i ← 0
    ll.searchStep|1|while cur ≠ null and cur.value ≠ v: cur ← cur.next
    ll.hit|0|return i
    ll.miss|0|return −1                     // reached null
  `,
  llReverse: `
    ll.revInit|0|prev ← null; cur ← head
    ll.revSave|1|next ← cur.next           // save before breaking the link
    ll.revFlip|1|cur.next ← prev; prev ← cur; cur ← next
    ll.revDone|0|head ← prev               // one pass, zero extra memory
  `,

  /* ── heap ────────────────────────────────────────────────────────────── */
  heapPush: `
    hp.place|0|a[size++] ← v             // last free slot keeps it complete
    hu.swap|1|while i>0 and better(a[i], a[parent]): swap up
    hu.stop|1|if heap order holds: stop sifting
    hu.root|0|// root is now the extremum
    hp.done|0|return
  `,
  heapPop: `
    hx.take|0|top ← a[0]
    hx.only|1|if size = 1: return top
    hx.last|0|a[0] ← a[−−size]          // last element fills the hole
    hx.sift|0|siftDown(0)
    hd.swap|1|swap with the better child
    hd.stop|1|if no child is better: stop
    hx.done|0|return top
  `,
  heapPeek: `
    hk.root|0|return a[0]                 // O(1)
  `,
  heapify: `
    hb.intro|0|for i ← n/2−1 down to 0:      // skip the leaves
    hb.step|1|siftDown(i)
    hb.done|0|// Floyd build-heap: O(n), not O(n log n)
  `,
}

export const code = (key) => parse(CODE[key] || '')
export default CODE
