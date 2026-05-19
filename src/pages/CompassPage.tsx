import { useEffect, useState } from 'react'
import { loadLocation } from '../lib/location'

const JERUSALEM = { lat: 31.778, lon: 35.235 }

/** Initial bearing (in degrees clockwise from north) from (lat1,lon1) to (lat2,lon2). */
export function bearingTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

interface OrientationLike {
  alpha?: number | null
  webkitCompassHeading?: number
}

export function CompassPage() {
  const location = loadLocation()
  const targetBearing = bearingTo(location.latitude, location.longitude, JERUSALEM.lat, JERUSALEM.lon)
  const [heading, setHeading] = useState<number | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)

  useEffect(() => {
    function handler(e: DeviceOrientationEvent) {
      const ev = e as DeviceOrientationEvent & OrientationLike
      const h = typeof ev.webkitCompassHeading === 'number' ? ev.webkitCompassHeading : ev.alpha
      if (typeof h === 'number') setHeading(h)
    }
    // iOS requires explicit permission; show a button if so.
    const anyDOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof anyDOE.requestPermission === 'function') {
      setNeedsPermission(true)
    } else {
      window.addEventListener('deviceorientation', handler, true)
    }
    return () => window.removeEventListener('deviceorientation', handler, true)
  }, [])

  const requestPermission = async () => {
    const anyDOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (!anyDOE.requestPermission) return
    const state = await anyDOE.requestPermission()
    if (state === 'granted') {
      setNeedsPermission(false)
      window.addEventListener('deviceorientation', (e) => {
        const ev = e as DeviceOrientationEvent & OrientationLike
        const h = typeof ev.webkitCompassHeading === 'number' ? ev.webkitCompassHeading : ev.alpha
        if (typeof h === 'number') setHeading(h)
      })
    }
  }

  const needleRotation = heading != null ? targetBearing - heading : targetBearing

  return (
    <div className="max-w-md mx-auto py-4 text-center" data-testid="compass-page">
      <h1 className="text-2xl font-semibold mb-4">Compass to Jerusalem</h1>
      <div className="text-sm text-gray-600 mb-2">
        From <strong data-testid="compass-from">{location.name}</strong>
      </div>
      <div className="text-3xl font-mono mb-6" data-testid="compass-bearing">
        {targetBearing.toFixed(1)}°
      </div>

      <div className="relative w-64 h-64 mx-auto rounded-full border-4 border-gray-300 mb-4" data-testid="compass-dial">
        {/* Cardinal labels positioned just inside the rim so the needle can't cover them. */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-semibold z-10" data-testid="compass-N">N</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold z-10" data-testid="compass-S">S</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold z-10" data-testid="compass-W">W</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold z-10" data-testid="compass-E">E</div>
        <div
          className="absolute top-1/2 left-1/2 origin-bottom"
          style={{
            width: '4px',
            height: '42%',
            background: 'red',
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) rotate(${needleRotation}deg)`,
            zIndex: 5,
          }}
          data-testid="compass-needle"
        />
      </div>

      {needsPermission && (
        <button
          type="button"
          onClick={requestPermission}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Enable orientation
        </button>
      )}
      {heading == null && !needsPermission && (
        <p className="text-xs text-gray-500">
          Device orientation unavailable — needle shows static bearing from north.
        </p>
      )}
    </div>
  )
}
