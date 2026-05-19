import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGenerator, listGenerators, makeContext } from '../generators/registry'
import { PrayerRenderer } from '../components/PrayerRenderer'
import { useSettings } from '../lib/settings'
import { loadLocation } from '../lib/location'
import { t } from '../lib/ui'

export function PrayerPage() {
  const { id } = useParams()
  const gen = id ? getGenerator(id) : undefined
  const { settings } = useSettings()

  const rows = useMemo(() => {
    if (!gen) return []
    const ctx = makeContext(new Date(), settings, loadLocation())
    return gen.generate(ctx)
  }, [gen, settings])

  if (!gen) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <h1 className="text-xl font-semibold mb-4">Prayer not found: {id}</h1>
        <p className="mb-2 text-sm text-gray-600">Available prayers:</p>
        <ul className="list-disc pl-6">
          {listGenerators().map((g) => (
            <li key={g.id}>
              <Link className="text-blue-600 underline" to={`/prayer/${g.id}`}>
                {t(g.titleKey)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-4" data-testid="prayer-page">
      <h1 className="text-2xl font-semibold mb-6" data-testid="prayer-title">
        {t(gen.titleKey)}
      </h1>
      <PrayerRenderer rows={rows} />
    </div>
  )
}
