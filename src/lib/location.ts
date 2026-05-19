export interface SiddurLocation {
  name: string
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  /** Optional GeoNames id, kept so saved locations can be re-resolved later. */
  geonameId?: string
  /** ISO 3166-1 alpha-2 country code; used for Israel/diaspora logic. */
  countryCode?: string
}

export const DEFAULT_LOCATION: SiddurLocation = {
  name: 'Jerusalem',
  latitude: 31.778,
  longitude: 35.235,
  elevation: 800,
  timezone: 'Asia/Jerusalem',
  countryCode: 'IL',
}

const STORAGE_KEY = 'siddur:location'

export function loadLocation(): SiddurLocation {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCATION
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_LOCATION
  try {
    return { ...DEFAULT_LOCATION, ...(JSON.parse(raw) as Partial<SiddurLocation>) }
  } catch {
    return DEFAULT_LOCATION
  }
}

export function saveLocation(loc: SiddurLocation): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
}

export function isInIsrael(loc: SiddurLocation): boolean {
  return loc.countryCode === 'IL' || loc.timezone === 'Asia/Jerusalem'
}
