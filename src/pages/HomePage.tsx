import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import prayers from '@/data/prayers.json'
import summary from '@/data/extract-summary.json'
import { loadLocation, isInIsrael } from '@/lib/location'
import { useSettings } from '@/lib/settings'
import { relevantPrayers } from '@/lib/relevantPrayers'
import { computeZmanim } from '@/lib/zmanim'
import { getGenerator } from '@/generators/registry'
import { t } from '@/lib/ui'

export function HomePage() {
  const { settings } = useSettings()
  const location = useMemo(() => loadLocation(), [])
  const now = useMemo(() => new Date(), [])
  const relevant = useMemo(
    () => relevantPrayers(location, settings.inIsrael || isInIsrael(location), now),
    [location, settings.inIsrael, now],
  )
  const snap = useMemo(() => computeZmanim(location, now), [location, now])

  return (
    <div className="max-w-2xl mx-auto py-4 flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('app_name')}</h1>
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <span className="hebrew" data-testid="home-hebrew-date">
            {snap.hebrewDate}
          </span>
          {snap.parsha && (
            <>
              <span aria-hidden>·</span>
              <span className="hebrew">פרשת {snap.parsha}</span>
            </>
          )}
          {snap.yomTov && (
            <>
              <span aria-hidden>·</span>
              <span className="hebrew text-amber-700 dark:text-amber-400">
                {snap.yomTov}
              </span>
            </>
          )}
          {relevant.isTransition && (
            <Badge variant="secondary" className="ml-auto">
              {t('at_sunset')}
            </Badge>
          )}
        </div>
      </header>

      <section data-testid="today-prayers" className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('today')}
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {relevant.ids.map((id) => {
            const gen = getGenerator(id)
            if (!gen) return null
            return (
              <li key={id}>
                <Link to={`/prayer/${id}`} data-testid={`prayer-link-${id}`}>
                  <Card className="hover:bg-accent transition-colors h-full">
                    <CardHeader>
                      <CardTitle>{t(gen.titleKey)}</CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <Separator />

      <section className="text-sm text-muted-foreground flex flex-col gap-2">
        <div data-testid="data-stats">
          <span data-testid="prayer-count">{Object.keys(prayers).length}</span>{' '}
          prayer strings · {summary.locales.length} UI locales
        </div>
        <div>
          <Link to="/prayers" className="underline">
            {t('prayers')}
          </Link>
          {' · '}
          <Link to="/zmanim" className="underline">
            {t('zmanim')}
          </Link>
        </div>
      </section>

      <section
        className="prayer-body border-l-4 border-blue-200 dark:border-blue-900 pl-4"
        data-testid="sample-prayer"
      >
        <div dangerouslySetInnerHTML={{ __html: prayers.Avot.replace(/%1\$s/g, '') }} />
      </section>
    </div>
  )
}
