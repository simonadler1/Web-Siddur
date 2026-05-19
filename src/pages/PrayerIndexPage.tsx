import { Link } from 'react-router-dom'
import { listGenerators } from '../generators/registry'
import { t } from '../lib/ui'

// Sub-generators that exist only as building blocks of Shacharit/Mussaf;
// they shouldn't surface in the public prayer list.
const INTERNAL = new Set([
  'shacharitOpening',
  'shacharitShachar',
  'shacharitSof',
  'shacharitShma',
  'shacharitZimra',
  'shacharitTahanun',
  'slihotAshkenaz', // duplicate of `slihot`
])

// Preferred ordering for the most-used prayers, then alphabetical for the rest.
const ORDER = ['shacharit', 'mincha', 'arvit', 'mussaf', 'mazon', 'omer', 'halel']

export function PrayerIndexPage() {
  const gens = listGenerators()
    .filter((g) => !INTERNAL.has(g.id))
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.id)
      const bi = ORDER.indexOf(b.id)
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      }
      return t(a.titleKey).localeCompare(t(b.titleKey))
    })

  return (
    <div className="max-w-2xl mx-auto py-4" data-testid="prayer-index">
      <h1 className="text-2xl font-semibold mb-4">{t('prayers')}</h1>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="prayer-grid">
        {gens.map((g) => (
          <li key={g.id}>
            <Link
              to={`/prayer/${g.id}`}
              className="block px-3 py-3 border rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
              data-testid={`prayer-link-${g.id}`}
            >
              {t(g.titleKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
