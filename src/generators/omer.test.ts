import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { omerGenerator } from './omer'
import { DEFAULT_SETTINGS } from '../lib/settings'
import omerTables from '../data/omer.json'

function makeCtx(year: number, hebMonth: number, hebDay: number, overrides = {}) {
  const jc = new JewishCalendar()
  jc.setJewishDate(year, hebMonth, hebDay)
  jc.setInIsrael(true)
  return {
    date: jc.getDate().toJSDate(),
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    jc,
  }
}

describe('OmerGenerator', () => {
  it('returns multiple rows during the omer period', () => {
    // Iyar 1 (5786) — should be day 16 of omer
    const ctx = makeCtx(5786, 2, 1)
    const rows = omerGenerator.generate(ctx)
    expect(rows.length).toBeGreaterThanOrEqual(3)
    const body = rows.map((r) => r.body).join('\n')
    expect(body).toMatch(/בָּעֹמֶר|לָעוֹמֶר|לעומר|בעומר/)
  })

  it('produces ashkenaz omer text by default', () => {
    const ctx = makeCtx(5786, 1, 16) // Nisan 16 = day 1
    const rows = omerGenerator.generate(ctx)
    const dayRow = rows.find((r) => r.id === 'sefiratHaomer')!
    expect(dayRow.body).toContain(omerTables.ashkenaz[0])
  })

  it('switches to sfarad text when nusach is sfarad', () => {
    const ctx = makeCtx(5786, 1, 16, { nusach: 'sfarad' })
    const rows = omerGenerator.generate(ctx)
    const dayRow = rows.find((r) => r.id === 'sefiratHaomer')!
    expect(dayRow.body).toContain(omerTables.sfarad[0])
  })

  it('switches to edot text when nusach is edot', () => {
    const ctx = makeCtx(5786, 1, 16, { nusach: 'edot' })
    const rows = omerGenerator.generate(ctx)
    const dayRow = rows.find((r) => r.id === 'sefiratHaomer')!
    expect(dayRow.body).toContain(omerTables.edot[0])
  })

  it('includes the "menora" extra row only for edot', () => {
    const ashk = omerGenerator.generate(makeCtx(5786, 1, 16))
    const edot = omerGenerator.generate(makeCtx(5786, 1, 16, { nusach: 'edot' }))
    expect(ashk.find((r) => r.id === 'menora')).toBeUndefined()
    expect(edot.find((r) => r.id === 'menora')).toBeDefined()
  })

  it('handles out-of-omer dates gracefully', () => {
    const ctx = makeCtx(5786, 7, 15) // Tishrei — not omer
    const rows = omerGenerator.generate(ctx)
    expect(rows.length).toBeGreaterThan(0)
    // No day-text row when outside the period
    expect(rows.find((r) => r.id === 'sefiratHaomer')).toBeUndefined()
  })

  it('day 33 (Lag BaOmer) renders the correct ashkenaz text', () => {
    // Iyar 18 = day 33
    const ctx = makeCtx(5786, 2, 18)
    const rows = omerGenerator.generate(ctx)
    const dayRow = rows.find((r) => r.id === 'sefiratHaomer')!
    expect(dayRow.body).toContain(omerTables.ashkenaz[32])
  })
})
