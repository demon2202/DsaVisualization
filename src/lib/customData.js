function splitValues(input) {
  const values = String(input).trim().split(/[,\s]+/).filter(Boolean)
  if (!values.length) throw new Error('Enter at least one value.')
  return values
}

function parseNumbers(input, { integer = false, max = 48 } = {}) {
  const tokens = splitValues(input)
  if (tokens.length > max) throw new Error(`Use no more than ${max} values.`)
  const values = tokens.map(Number)
  if (values.some((value) => !Number.isFinite(value) || (integer && !Number.isInteger(value)))) {
    throw new Error(integer ? 'Enter whole numbers separated by commas.' : 'Enter valid numbers separated by commas.')
  }
  return values
}

function parseItems(input, max = 40) {
  const values = String(input).split(',').map((value) => value.trim())
  if (!values.length || values.some((value) => !value)) throw new Error('Separate values with commas; empty values are not allowed.')
  if (values.length > max) throw new Error(`Use no more than ${max} values.`)
  return values
}

function parseGraph(labelsInput, edgesInput) {
  const labels = parseItems(labelsInput, 26)
  if (labels.length < 2) throw new Error('A graph needs at least two nodes.')
  if (labels.some((label) => !/^[A-Za-z0-9_]{1,8}$/.test(label))) {
    throw new Error('Use node labels of 1–8 letters, numbers or underscores.')
  }
  if (new Set(labels).size !== labels.length) throw new Error('Node labels must be unique.')

  const connections = String(edgesInput)
    .split(/[\n,]+/)
    .map((edge) => edge.trim())
    .filter(Boolean)
    .map((edge) => {
      const match = edge.match(/^([A-Za-z0-9_]+)\s*-\s*([A-Za-z0-9_]+)(?:\s*:\s*(\d+))?$/)
      if (!match) throw new Error(`Invalid edge "${edge}". Use A-B or A-B:weight.`)
      const [, from, to, rawWeight] = match
      if (from === to) throw new Error(`Self-edges are not supported (${from}-${to}).`)
      if (!labels.includes(from) || !labels.includes(to)) throw new Error(`Edge ${from}-${to} refers to an unknown node.`)
      const weight = rawWeight === undefined ? 1 : Number(rawWeight)
      if (!Number.isInteger(weight) || weight < 1 || weight > 99) throw new Error('Edge weights must be whole numbers from 1 to 99.')
      return { from, to, weight }
    })

  const uniqueEdges = new Set()
  for (const { from, to } of connections) {
    const key = [from, to].sort().join('|')
    if (uniqueEdges.has(key)) throw new Error(`Edge ${from}-${to} is listed more than once.`)
    uniqueEdges.add(key)
  }
  return { labels, connections }
}

function parseGrid(input) {
  const rows = String(input)
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
  if (rows.length < 3 || rows.length > 21) throw new Error('A map must have between 3 and 21 rows.')
  const width = rows[0].length
  if (width < 3 || width > 31) throw new Error('A map must be between 3 and 31 columns wide.')
  if (rows.some((row) => row.length !== width)) throw new Error('Every map row must have the same width.')
  if (rows.some((row) => /[^.#mwSG]/.test(row))) throw new Error('Use only ., #, m, w, S and G in the map.')
  if (rows.join('').split('S').length !== 2 || rows.join('').split('G').length !== 2) {
    throw new Error('A map needs exactly one S start and one G goal.')
  }
  return rows
}

export function dataKind(machine) {
  if (machine.kind === 'tree' || machine.kind === 'list' || machine.kind === 'heap' || machine.kind === 'array') return machine.kind
  if (machine.kind === 'linear') return 'text-linear'
  if (machine.kind === 'hash') return 'hash'
  if (machine.kind === 'graph') return 'graph'
  if (machine.kind === 'grid') return 'grid'
  throw new Error(`Custom starting data is not available for "${machine.kind}".`)
}

export function initialCustomData(machine) {
  const kind = dataKind(machine)
  if (kind === 'graph') {
    const labels = machine.nodes.map((node) => node.value)
    const labelById = new Map(machine.nodes.map((node) => [node.id, node.value]))
    const edges = machine.edges.map((edge) => `${labelById.get(edge.from)}-${labelById.get(edge.to)}:${edge.weight}`)
    return { values: labels.join(', '), edges: edges.join('\n') }
  }
  if (kind === 'grid') {
    const cells = machine.cells
    const width = Math.max(...cells.map((cell) => cell.c)) + 1
    const height = Math.max(...cells.map((cell) => cell.r)) + 1
    const rows = Array.from({ length: height }, (_, r) =>
      Array.from({ length: width }, (_, c) => {
        const cell = cells[r * width + c]
        if (cell.id === machine.start()) return 'S'
        if (cell.id === machine.end()) return 'G'
        return { open: '.', wall: '#', mud: 'm', water: 'w' }[cell.terrain] || '.'
      }).join(''),
    )
    return { values: rows.join('\n') }
  }
  const values =
    kind === 'tree' ? machine.values('level') :
    kind === 'list' || kind === 'text-linear' ? machine.values :
    kind === 'hash' ? machine.keys() :
    kind === 'heap' ? machine.values :
    kind === 'array' ? machine.array : []
  return { values: values.join(', ') }
}

export function applyCustomData(machine, draft) {
  const kind = dataKind(machine)
  if (kind === 'graph') {
    const { labels, connections } = parseGraph(draft.values, draft.edges)
    machine.loadData(labels, connections)
  } else if (kind === 'grid') {
    const rows = parseGrid(draft.values)
    if (!machine.loadRows(rows)) throw new Error('The map needs one start and one goal, with valid dimensions.')
  } else if (kind === 'text-linear') {
    machine.seed(parseItems(draft.values))
  } else {
    const integer = kind === 'hash'
    const max = kind === 'hash' ? machine.capacity : 48
    const values = parseNumbers(draft.values, { integer, max })
    if (kind === 'tree' && new Set(values).size !== values.length) throw new Error('Tree values must be unique.')
    if (kind === 'hash' && new Set(values).size !== values.length) throw new Error('Hash keys must be unique.')
    if (kind === 'tree') {
      machine.clear()
      for (const value of values) machine.silentInsert(value)
    } else if (kind === 'list') {
      machine.seed(values)
    } else if (kind === 'hash') {
      machine.clear()
      for (const value of values) {
        if (!machine.silentInsert(value)) throw new Error(`Could not insert ${value}; values must be unique.`)
      }
    } else if (kind === 'heap') {
      const result = machine.heapify(values)
      if (!result.ok) throw new Error(result.error)
    } else if (kind === 'array') {
      machine.reset(values)
    }
  }
}
