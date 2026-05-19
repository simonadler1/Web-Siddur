import { describe, it, expect } from 'vitest'
import { bearingTo } from './CompassPage'

describe('bearingTo', () => {
  it('Jerusalem from itself is 0 (or undefined)', () => {
    const b = bearingTo(31.778, 35.235, 31.778, 35.235)
    // Whatever the impl returns for an identical point, it should be in [0, 360).
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThan(360)
  })

  it('NYC → Jerusalem bearing is northeast (~50–65°)', () => {
    // Known great-circle initial bearing NYC→Jerusalem is ~54°.
    const b = bearingTo(40.7128, -74.006, 31.778, 35.235)
    expect(b).toBeGreaterThan(40)
    expect(b).toBeLessThan(70)
  })

  it('Tel Aviv → Jerusalem is east-southeast (~110-115°)', () => {
    const b = bearingTo(32.085, 34.781, 31.778, 35.235)
    expect(b).toBeGreaterThan(90)
    expect(b).toBeLessThan(135)
  })

  it('London → Jerusalem is southeast (~120°)', () => {
    const b = bearingTo(51.507, -0.128, 31.778, 35.235)
    expect(b).toBeGreaterThan(100)
    expect(b).toBeLessThan(140)
  })
})
