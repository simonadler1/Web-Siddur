import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchPlaces, timezoneForCoords, geocodeResultToLocation } from './geocode'

const sampleNominatimResponse = [
  {
    display_name: 'Jerusalem, Israel',
    lat: '31.778',
    lon: '35.235',
    address: { country_code: 'il' },
  },
  {
    display_name: 'Jerusalem, New York, USA',
    lat: '43.067',
    lon: '-74.323',
    address: { country_code: 'us' },
  },
]

describe('geocode', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleNominatimResponse,
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('searchPlaces returns parsed results', async () => {
    const results = await searchPlaces('Jerusalem')
    expect(results.length).toBe(2)
    expect(results[0].name).toContain('Jerusalem')
    expect(results[0].countryCode).toBe('IL')
    expect(results[0].latitude).toBeCloseTo(31.778, 2)
  })

  it('searchPlaces returns [] for empty query', async () => {
    const results = await searchPlaces('   ')
    expect(results).toEqual([])
  })

  it('timezoneForCoords returns Asia/Jerusalem for IL', () => {
    expect(timezoneForCoords(31.778, 35.235, 'IL')).toBe('Asia/Jerusalem')
  })

  it('timezoneForCoords falls back to Etc/GMT offset', () => {
    expect(timezoneForCoords(40.7128, -74, 'US')).toMatch(/^Etc\/GMT-?\d+$/)
  })

  it('geocodeResultToLocation produces a complete SiddurLocation', () => {
    const loc = geocodeResultToLocation({
      name: 'Tel Aviv, Israel',
      latitude: 32.085,
      longitude: 34.781,
      countryCode: 'IL',
    })
    expect(loc.timezone).toBe('Asia/Jerusalem')
    expect(loc.elevation).toBe(0)
  })
})
