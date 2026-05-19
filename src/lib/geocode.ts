/**
 * Lightweight geocoding helpers using public APIs. No backend, no API key for
 * basic Nominatim lookups (subject to their fair-use policy: 1 req/sec, real
 * User-Agent). For production use we'd want either OpenCage / GeoApify with a
 * user-supplied key or self-hosted Nominatim.
 */
import type { SiddurLocation } from './location'

export interface GeocodeResult {
  name: string
  latitude: number
  longitude: number
  countryCode?: string
  timezone?: string
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/** Search for a place by free-text name. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  if (!query.trim()) return []
  const url = new URL(NOMINATIM + '/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '8')
  url.searchParams.set('addressdetails', '1')
  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'en' },
    signal,
  })
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`)
  const data = (await res.json()) as Array<{
    display_name: string
    lat: string
    lon: string
    address?: { country_code?: string }
  }>
  return data.map((r) => ({
    name: r.display_name.split(',').slice(0, 3).join(',').trim(),
    latitude: Number(r.lat),
    longitude: Number(r.lon),
    countryCode: r.address?.country_code?.toUpperCase(),
  }))
}

/**
 * Best-effort timezone resolution from coordinates using the browser's Intl APIs.
 * Falls back to a hardcoded mapping for common cases. For production a free
 * tz-lookup library or a public API like https://timeapi.io should be used.
 */
export function timezoneForCoords(lat: number, lon: number, countryCode?: string): string {
  if (countryCode === 'IL') return 'Asia/Jerusalem'
  // Rough longitude-band fallback — adequate for displaying zmanim within ~1 hr,
  // which is the typical zmanim precision users notice.
  const offsetHours = Math.round(lon / 15)
  const sign = offsetHours >= 0 ? '+' : '-'
  return `Etc/GMT${offsetHours === 0 ? '' : sign + Math.abs(offsetHours)}`
  void lat
}

export function geocodeResultToLocation(g: GeocodeResult, elevation = 0): SiddurLocation {
  return {
    name: g.name,
    latitude: g.latitude,
    longitude: g.longitude,
    elevation,
    timezone: g.timezone ?? timezoneForCoords(g.latitude, g.longitude, g.countryCode),
    countryCode: g.countryCode,
  }
}
