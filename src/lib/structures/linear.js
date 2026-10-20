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
    return [(i - (Math.max(total, 6) - 1) / 2) * QSTEP, 0.66, 0]
  }

  function snap(o = {}) {
    const { states = {}, marks = {} } = o
    return {
      nodes: items.map((it, i) => ({
        id: it.id,
        value: it.value,
        pos: pos(i, items.length),
        state: states[it.id] || 'base',
        block: mode === 'stack' ? { w: 3.1, h: BLOCK * 0.82, d: 1.75 } : { w: QSTEP * 0.84, h: 1.32, d: 1.42 },
        inset: true,
        tag: i === items.length - 1 && mode === 'stack' ? 'top' : i === 0 && mode !== 'stack' ? 'front' : i === items.length - 1 && mode !== 'stack' ? 'back' : null,
        frame: it.frame || null,
        sub: it.frame ? String(it.frame) : null,
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
        note: extra.note || `push(${v}). The value lands on top; nothing else moves, so push is O(1).`,
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
    steps.push(snap({ states: { [it.id]: 'remove' }, note: extra.preNote || `pop() takes ${it.value} off the top. Last in, first out.`, code: extra.preCode || ['st.popPre'], banner: 'POP', focus: pos(items.length - 1, items.length) }))
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
    steps.push(snap({ states: { [it.id]: 'probe' }, note: `peek() reads the top value (${it.value}) without removing it.`, code: ['st.peek'], banner: 'TOP', focus: pos(items.length - 1, items.length) }))
    return { ok: true, steps, summary: `peek() → ${it.value}`, value: it.value }
  }

  /* ── recursion trace ─────────────────────────────────────────────────── */
  function runRecursion(n = 5) {
    const steps = []
    const k = Math.max(1, Math.min(9, Number(n) || 5))
    items = []
    steps.push(snap({ note: `factorial(${k}) with plain recursion. Each call gets a stack frame for its argument and return value.`, code: ['rec.intro'], banner: `fact(${k})` }))

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
          note: i === 0 ? `Base case returns 1. Each frame then multiplies the result by its argument as the stack unwinds.` : `fact(${i}) returns ${acc}. Its frame is destroyed and control returns to fact(${i + 1}).`,
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
    steps.push(snap({ note: `factorial(${k}) = ${acc}. The run used ${k + 1} stack frames; recursion without a base case eventually exhausts them.`, code: ['rec.done'], banner: `${acc}` }))
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
        note: `enqueue(${value}) joins at the back. Existing items keep their position; first in, first out.`,
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
    steps.push(snap({ states: { [it.id]: 'remove' }, note: `dequeue() removes ${it.value} from the front.`, code: ['q.deqPre'], banner: 'DEQUEUE', focus: pos(0, items.length) }))
    items.shift()
    steps.push(snap({ note: `Returned ${it.value}. Every remaining item moved one position forward; size is now ${items.length}. BFS and job schedulers use this order.`, code: ['q.deq'] }))
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
    steps.push(snap({ states: { [it.id]: 'insert' }, note: `pushFront(${value}). A deque inserts at either end in O(1); a plain queue would shift every element.`, code: ['dq.pf'], banner: 'PUSH FRONT', focus: pos(0, items.length) }))
    return { ok: true, steps, summary: `pushFront(${value})` }
  }
  function pushBack(value) {
    const steps = []
    const it = { id: uid(), value }
    items.push(it)
    steps.push(snap({ states: { [it.id]: 'insert' }, note: `pushBack(${value}). Sliding-window maximum uses both ends of a deque.`, code: ['dq.pb'], banner: 'PUSH BACK', focus: pos(items.length - 1, items.length) }))
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
    steps.push(snap({ states: { [it.id]: 'remove' }, note: `popBack() → ${it.value}.`, code: ['dq.popb'], banner: 'POP BACK', focus: pos(items.length - 1, items.length) }))
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
    snapshot: () => snap({ note: 'Add elements to either end.' }),
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
