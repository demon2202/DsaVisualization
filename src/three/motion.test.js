import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { CT, EASE, T, VT, moveDuration } from './motion'

test('scalar transitions ease between endpoints and retarget without a jump', () => {
  const transition = new T(0)
  transition.set(0, 10, 1)
  assert.equal(transition.eval(0), 0)
  assert.equal(transition.eval(0.5), 8.75)
  assert.equal(transition.eval(1), 10)

  transition.set(0.5, 20, 0.5)
  assert.equal(transition.eval(0.5), 8.75)
  assert.equal(transition.eval(1), 20)
  assert.equal(transition.eval(1.5), 20)
})

test('vector transitions finish exactly at the destination with no residual arc', () => {
  const from = new THREE.Vector3(0, 0, 0)
  const to = new THREE.Vector3(4, 2, -1)
  const transition = new VT(from).set(0, to, { dur: 1, arcY: 2, arcZ: 1 })

  assert.deepEqual(transition.eval(0, new THREE.Vector3()).toArray(), from.toArray())
  assert.deepEqual(transition.eval(1, new THREE.Vector3()).toArray(), to.toArray())
  assert.deepEqual(transition.eval(2, new THREE.Vector3()).toArray(), to.toArray())
})

test('colour transitions converge exactly and move durations stay bounded', () => {
  const start = new THREE.Color('#101010')
  const end = new THREE.Color('#f2cc24')
  const transition = new CT(start).set(0, end, 0.2)

  assert.deepEqual(transition.eval(0.2, new THREE.Color()).toArray(), end.toArray())
  assert.equal(moveDuration(0), 0.14)
  assert.equal(moveDuration(2), 0.5)
  assert.equal(EASE.outCubic(1), 1)
})
