/**
 * linear.js — stack (LIFO), queue (FIFO) and deque, all in one model.
 * Includes a real call-stack recursion trace, because that is the thing
 * people actually need a stack for.
 */

const BLOCK = 1.05
const QSTEP = 1.95

let seq = 0
const uid = () => `s${(++seq).toString(36)}`

export function createLinear(mode = 'stack') {
  let items = [] // { id, value, frame? }

  const pos = (i, total) => {
    if (mode === 'stack') return [0, i * BLOCK - 2.2, 0]
    return [(i - (Math.max(total, 6) - 1) / 2) * QSTEP, 0, 0]
  }

  function snap(o = {}) {
    const { states = {}, marks = {} } = o
    return {
      nodes: items.map((it, i) => ({
        id: it.id,
        value: it.value,
        pos: pos(i, items.length),
        state: states[it.id] || 'base',
        block: mode === 'stack' ? { w: 3.1, h: BLOCK * 0.82, d: 2.1 } : { w: QSTEP * 0.84, h: 1.5, d: 1.7 },
        tag: i === items.length - 1 && mode === 'stack' ? 'top' : i === 0 && mode !== 'stack' ? 'front' : i === items.length - 1 && mode !== 'stack' ? 'back' : null,
        frame: it.frame || null,
      })),
      links:
        mode === 'stack'
          ? []
          : items.slice(1).map((it, i) => ({ id: `q${items[i].id}->${it.id}`, from: items[i].id, to: it.id, state: 'tree' })),
      note: o.note || '',
      code: o.code || [],
      banner: o.banner || null,
      focus: o.focus || null,
      aux: o.aux || null,
      stats: {
        size: items.length,
        ...(mode === 'stack' ? { top: items.length ? items[items.length - 1].value : null } : { front: items.length ? items[0].value : null, back: items.length ? items[items.length - 1].value : null }),
        ...(marks.stats || {}),
      },
    }
  }

  const last = () => items[items.length - 1]

  /* ── stack ───────────────────────────────────────────────────────────── */
  function push(value, extra = {}) {
    const steps = []
    const v = value
    const it = { id: uid(), value: v, frame: extra.frame }
    items.push(it)
    steps.push(
      snap({
        states: { [it.id]: 'insert' },
        note: extra.note || `push(${v}) — the value lands on top. Nothing else moves: that is why a stack push is O(1).`,
        code: extra.code || ['st.push'],
        banner: extra.banner || 'PUSH',
        focus: pos(items.length - 1, items.length),
        aux: extra.aux,
      }),
    )
    return { ok: true, steps, summary: `push(${v}) · size ${items.length}` }
  }

  function pop(extra = {}) {
    const steps = []
    if (!items.length) return { ok: false, error: 'Stack is empty', steps }
    const it = last()
    steps.push(snap({ states: { [it.id]: 'remove' }, note: extra.preNote || `pop() takes ${it.value} off the top. The most recently added value is always the first one out — LIFO.`, code: extra.preCode || ['st.popPre'], banner: 'POP', focus: pos(items.length - 1, items.length) }))
    items.pop()
    steps.push(
      snap({
        note: extra.note || `Returned ${it.value}. Stack size is now ${items.length}${items.length ? `, new top is ${last().value}.` : ' — empty.'}`,
        code: extra.code || ['st.pop'],
        aux: extra.aux,
        stats: { returned: it.value },
      }),
    )
    return { ok: true, steps, summary: `pop() → ${it.value}`, value: it.value }
  }

  function peek() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Stack is empty', steps }
    const it = last()
    steps.push(snap({ states: { [it.id]: 'probe' }, note: `peek() reads the top (${it.value}) without removing it. Browsers use exactly this for the Back button.`, code: ['st.peek'], banner: 'TOP', focus: pos(items.length - 1, items.length) }))
    return { ok: true, steps, summary: `peek() → ${it.value}`, value: it.value }
  }

  /* ── recursion trace ─────────────────────────────────────────────────── */
  function runRecursion(n = 5) {
    const steps = []
    const k = Math.max(1, Math.min(9, Number(n) || 5))
    items = []
    steps.push(snap({ note: `We will compute factorial(${k}) with plain recursion. Every call needs its own frame: its argument and somewhere to put the result. The runtime stack is what holds them.`, code: ['rec.intro'], banner: `fact(${k})` }))

    const calls = []
    for (let i = k; i >= 0; i--) {
      const it = { id: uid(), value: `fact(${i})`, frame: { arg: i, ret: null } }
      items.push(it)
      calls.push(it)
      steps.push(
        snap({
          states: { [it.id]: 'insert' },
          note: i === 0 ? `Call fact(0) — the base case. Push its frame and return 1 immediately without recursing further.` : `Call fact(${i}). Push a new frame; the function suspends here and waits for fact(${i - 1}) to come back.`,
          code: i === 0 ? ['rec.base'] : ['rec.call'],
          banner: `CALL fact(${i})`,
          focus: pos(items.length - 1, items.length),
          aux: { kind: 'math', title: 'call stack', items: items.slice().reverse().map((x) => ({ value: x.value, state: x === it ? 'insert' : 'visited' })) },
        }),
      )
    }
    let acc = 1
    for (let i = 0; i <= k; i++) {
      const it = calls[calls.length - 1 - i]
      it.frame.ret = acc
      steps.push(
        snap({
          states: { [it.id]: 'found' },
          note: i === 0 ? `Base case returns 1. Now the stack unwinds — each frame multiplies the returned value by its own argument.` : `fact(${i}) returns ${acc}. Its frame is destroyed and control goes back to fact(${i + 1}).`,
          code: ['rec.base', 'rec.ret'],
          banner: `RETURN ${acc}`,
          focus: pos(items.length - 1, items.length),
          aux: { kind: 'math', title: 'unwinding', items: [{ value: `${i === 0 ? '' : i + ' × '}${i === 0 ? '' : ''}${acc}`, state: 'found' }] },
        }),
      )
      items.pop()
      steps.push(
        snap({
          note: `Popped fact(${i}). Stack depth is now ${items.length}.`,
          code: ['rec.pop'],
          aux: { kind: 'math', title: 'call stack', items: items.slice().reverse().map((x) => ({ value: x.value, state: 'visited' })) },
        }),
      )
      acc *= i + 1
    }
    steps.push(snap({ note: `factorial(${k}) = ${acc}. Recursion depth equalled ${k + 1} frames — that is exactly what blows the stack when a recursion has no base case.`, code: ['rec.done'], banner: `${acc}` }))
    return { ok: true, steps, summary: `fact(${k}) = ${acc}` }
  }

  /* ── queue ───────────────────────────────────────────────────────────── */
  function enqueue(value) {
    const steps = []
    const it = { id: uid(), value }
    items.push(it)
    steps.push(
      snap({
        states: { [it.id]: 'insert' },
        note: `enqueue(${value}) joins at the back. Everyone already in the queue keeps their position — FIFO.`,
        code: ['q.enq'],
        banner: 'ENQUEUE',
        focus: pos(items.length - 1, items.length),
      }),
    )
    return { ok: true, steps, summary: `enqueue(${value}) · size ${items.length}` }
  }

  function dequeue() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Queue is empty', steps }
    const it = items[0]
    steps.push(snap({ states: { [it.id]: 'remove' }, note: `dequeue() removes ${it.value} from the front — it has waited the longest.`, code: ['q.deqPre'], banner: 'DEQUEUE', focus: pos(0, items.length) }))
    items.shift()
    steps.push(snap({ note: `Returned ${it.value}. Every remaining item slid one position forward; size is now ${items.length}. BFS and job schedulers are built on exactly this.`, code: ['q.deq'] }))
    return { ok: true, steps, summary: `dequeue() → ${it.value}`, value: it.value }
  }

  function peekFront() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Queue is empty', steps }
    steps.push(snap({ states: { [items[0].id]: 'probe' }, note: `front() reads ${items[0].value} without removing it.`, code: ['q.front'], banner: 'FRONT', focus: pos(0, items.length) }))
    return { ok: true, steps, summary: `front() → ${items[0].value}` }
  }

  /* ── deque ───────────────────────────────────────────────────────────── */
  function pushFront(value) {
    const steps = []
    const it = { id: uid(), value }
    items.unshift(it)
    steps.push(snap({ states: { [it.id]: 'insert' }, note: `pushFront(${value}) — a deque inserts at both ends in O(1). A plain queue cannot do this without shifting everything.`, code: ['dq.pf'], banner: 'PUSH FRONT', focus: pos(0, items.length) }))
    return { ok: true, steps, summary: `pushFront(${value})` }
  }
  function pushBack(value) {
    const steps = []
    const it = { id: uid(), value }
    items.push(it)
    steps.push(snap({ states: { [it.id]: 'insert' }, note: `pushBack(${value}) — the other end of the deque. Sliding-window maximum problems use both ends constantly.`, code: ['dq.pb'], banner: 'PUSH BACK', focus: pos(items.length - 1, items.length) }))
    return { ok: true, steps, summary: `pushBack(${value})` }
  }
  function popFront() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Deque is empty', steps }
    const it = items[0]
    steps.push(snap({ states: { [it.id]: 'remove' }, note: `popFront() → ${it.value}.`, code: ['dq.popf'], banner: 'POP FRONT' }))
    items.shift()
    steps.push(snap({ note: `Front removed; size ${items.length}.` }))
    return { ok: true, steps, summary: `popFront() → ${it.value}` }
  }
  function popBack() {
    const steps = []
    if (!items.length) return { ok: false, error: 'Deque is empty', steps }
    const it = items[items.length - 1]
    steps.push(snap({ states: { [it.id]: 'remove' }, note: `popBack() → ${it.value}. A deque used from one end is a stack; used from both, it is a sliding window.`, code: ['dq.popb'], banner: 'POP BACK', focus: pos(items.length - 1, items.length) }))
    items.pop()
    steps.push(snap({ note: `Back removed; size ${items.length}.` }))
    return { ok: true, steps, summary: `popBack() → ${it.value}` }
  }

  const api = {
    kind: 'linear',
    get mode() {
      return mode
    },
    get values() {
      return items.map((i) => i.value)
    },
    snapshot: () => snap({ note: 'Idle — add elements and watch the ends behave differently.' }),
    push,
    pop,
    peek,
    runRecursion,
    enqueue,
    dequeue,
    peekFront,
    pushFront,
    pushBack,
    popFront,
    popBack,
    seed(values) {
      items = values.map((v) => ({ id: uid(), value: v }))
    },
    clear() {
      items = []
    },
  }
  return api
}
