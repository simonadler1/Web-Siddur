import { useState } from 'react'
import { searchPlaces, geocodeResultToLocation, type GeocodeResult } from '../lib/geocode'
import { loadLocation, saveLocation, type SiddurLocation } from '../lib/location'

export function LocationsPage() {
  const [current, setCurrent] = useState<SiddurLocation>(() => loadLocation())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setResults(await searchPlaces(query))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const pick = (r: GeocodeResult) => {
    const loc = geocodeResultToLocation(r)
    saveLocation(loc)
    setCurrent(loc)
    setResults([])
    setQuery('')
  }

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: SiddurLocation = {
          name: `My location`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          elevation: pos.coords.altitude ?? 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
        saveLocation(loc)
        setCurrent(loc)
        setBusy(false)
      },
      (err) => {
        setError(err.message)
        setBusy(false)
      },
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-4" data-testid="locations-page">
      <h1 className="text-2xl font-semibold mb-4">Locations</h1>

      <section className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="text-xs text-gray-500 uppercase mb-1">Current</div>
        <div className="font-medium" data-testid="current-location">
          {current.name}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {current.latitude.toFixed(4)}, {current.longitude.toFixed(4)} · {current.timezone}
        </div>
      </section>

      <form onSubmit={onSearch} className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          placeholder="Search city, e.g. Brooklyn"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-0 basis-full sm:basis-auto border rounded px-3 py-2"
          data-testid="location-query"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={busy || !query.trim()}
          data-testid="search-button"
        >
          Search
        </button>
        <button
          type="button"
          onClick={useDeviceLocation}
          className="px-3 py-2 border rounded"
          disabled={busy}
        >
          Use device
        </button>
      </form>

      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      {results.length > 0 && (
        <ul className="border rounded divide-y" data-testid="results-list">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">
                  {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                  {r.countryCode && ` · ${r.countryCode}`}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
