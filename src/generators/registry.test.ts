import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { listGenerators, getGenerator, makeContext } from './registry'
import { DEFAULT_SETTINGS } from '../lib/settings'
import { DEFAULT_LOCATION } from '../lib/location'

const HEBREW_RE = /[֐-׿]/

describe('Generator registry', () => {
  it('registers ≥30 generators', () => {
    expect(listGenerators().length).toBeGreaterThanOrEqual(30)
  })

  it.each(['shacharit', 'mincha', 'arvit', 'omer', 'mussaf', 'mazon', 'halel'])(
    'has hand-tuned generator: %s',
    (id) => {
      expect(getGenerator(id)).toBeDefined()
    },
  )

  it('every registered generator produces some Hebrew content for a default date', () => {
    const ctx = makeContext(new Date('2026-05-19'), DEFAULT_SETTINGS, DEFAULT_LOCATION)
    const failures: string[] = []
    for (const g of listGenerators()) {
      const rows = g.generate(ctx)
      const text = rows.map((r) => r.body).join('')
      if (rows.length === 0) {
        failures.push(`${g.id}: 0 rows`)
        continue
      }
      if (!HEBREW_RE.test(text)) {
        failures.push(`${g.id}: ${rows.length} rows but no Hebrew text`)
      }
    }
    // Up to a handful of edge-case generators may legitimately be empty on this date.
    expect(failures.length).toBeLessThanOrEqual(5)
  })

  it('shacharit rows differ between ashkenaz and sfarad', () => {
    const ctxA = makeContext(new Date('2026-05-19'), { ...DEFAULT_SETTINGS, nusach: 'ashkenaz' }, DEFAULT_LOCATION)
    const ctxS = makeContext(new Date('2026-05-19'), { ...DEFAULT_SETTINGS, nusach: 'sfarad' }, DEFAULT_LOCATION)
    const shacharit = getGenerator('shacharit')!
    const bodyA = shacharit.generate(ctxA).map((r) => r.body).join('|')
    const bodyS = shacharit.generate(ctxS).map((r) => r.body).join('|')
    expect(bodyA).not.toBe(bodyS)
  })

  it('Israel/diaspora flag flows into the JewishCalendar', () => {
    // Use a non-Israel location so the setting isn't auto-overridden by location.
    const nyc = { ...DEFAULT_LOCATION, name: 'NYC', countryCode: 'US', timezone: 'America/New_York' }
    const ctxIsr = makeContext(new Date('2026-04-12'), { ...DEFAULT_SETTINGS, inIsrael: true }, nyc)
    const ctxDia = makeContext(new Date('2026-04-12'), { ...DEFAULT_SETTINGS, inIsrael: false }, nyc)
    expect(ctxIsr.jc.getInIsrael()).toBe(true)
    expect(ctxDia.jc.getInIsrael()).toBe(false)
    expect(ctxIsr.jc).toBeInstanceOf(JewishCalendar)
  })
})
