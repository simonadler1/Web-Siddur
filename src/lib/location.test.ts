import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULT_LOCATION, loadLocation, saveLocation, isInIsrael } from './location'

describe('Location storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns Jerusalem default when nothing is saved', () => {
    expect(loadLocation()).toEqual(DEFAULT_LOCATION)
  })

  it('round-trips a saved location', () => {
    const ny = {
      name: 'New York',
      latitude: 40.7128,
      longitude: -74.006,
      elevation: 10,
      timezone: 'America/New_York',
      countryCode: 'US',
    }
    saveLocation(ny)
    expect(loadLocation()).toEqual(ny)
  })

  it('falls back to default on corrupted storage', () => {
    localStorage.setItem('siddur:location', 'not json')
    expect(loadLocation()).toEqual(DEFAULT_LOCATION)
  })

  it('isInIsrael recognises Asia/Jerusalem timezone', () => {
    expect(isInIsrael(DEFAULT_LOCATION)).toBe(true)
  })

  it('isInIsrael recognises non-Israel by country code', () => {
    expect(
      isInIsrael({
        name: 'NYC',
        latitude: 0,
        longitude: 0,
        elevation: 0,
        timezone: 'America/New_York',
        countryCode: 'US',
      }),
    ).toBe(false)
  })
})
