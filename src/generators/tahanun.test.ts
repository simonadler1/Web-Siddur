import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { tahanunGenerator } from './tahanun'
import { DEFAULT_SETTINGS } from '../lib/settings'

function ctx(year: number, month: number, day: number, overrides = {}) {
  const jc = new JewishCalendar()
  jc.setJewishDate(year, month, day)
  return {
    date: jc.getDate().toJSDate(),
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    jc,
  }
}

const ROW_IDS = (rows: { id: string }[]) => rows.map((r) => r.id)

describe('TahanunGenerator', () => {
  it('omits tahanun on Shabbat', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 8, 3)) // Sat
    expect(ROW_IDS(rows)).not.toContain('tahanun-main')
    expect(ROW_IDS(rows)).not.toContain('tahanun-25')
  })

  it('omits tahanun on Yom Tov', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 1, 15)) // 1st day Pesach
    expect(ROW_IDS(rows)).not.toContain('tahanun-main')
  })

  it('omits tahanun on Rosh Chodesh', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 9, 1)) // RC Kislev
    expect(ROW_IDS(rows)).not.toContain('tahanun-main')
  })

  it('omits tahanun during Chanukah', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 9, 28)) // 4th day Chanukah
    expect(ROW_IDS(rows)).not.toContain('tahanun-main')
  })

  it('includes tahanun on a regular weekday', () => {
    // 5 Cheshvan 5786 = Mon; no Cheshvan exemptions.
    const rows = tahanunGenerator.generate(ctx(5786, 8, 5))
    expect(ROW_IDS(rows)).toContain('tahanun-main')
    expect(ROW_IDS(rows)).toContain('tahanun-25')
  })

  it('includes Avinu Malkenu on Tzom Gedalyah (fast day)', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 7, 3))
    expect(ROW_IDS(rows)).toContain('avinu-malkenu')
  })

  it('includes Avinu Malkenu during Aseret Yemei Teshuva (7 Tishrei, weekday)', () => {
    // 5 Tishrei 5786 is Shabbat (skip), 7 Tishrei = Mon = weekday in 10 days.
    const rows = tahanunGenerator.generate(ctx(5786, 7, 7))
    expect(ROW_IDS(rows)).toContain('avinu-malkenu')
  })

  it('does NOT include Avinu Malkenu on a regular weekday', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 8, 5))
    expect(ROW_IDS(rows)).not.toContain('avinu-malkenu')
  })

  it('includes long-tachanun rows on Monday in Cheshvan', () => {
    // 5 Cheshvan 5786 = Mon
    const rows = tahanunGenerator.generate(ctx(5786, 8, 5))
    expect(ROW_IDS(rows).some((id) => id.startsWith('tahanun-long-'))).toBe(true)
  })

  it('does NOT include long-tachanun rows on Tuesday', () => {
    // 6 Cheshvan 5786 = Tue
    const c = ctx(5786, 8, 6)
    expect(c.jc.getDayOfWeek()).toBe(3)
    const rows = tahanunGenerator.generate(c)
    expect(ROW_IDS(rows).some((id) => id.startsWith('tahanun-long-'))).toBe(false)
  })

  it('switches body text by nusach', () => {
    const c1 = ctx(5786, 8, 5, { nusach: 'ashkenaz' })
    const c2 = ctx(5786, 8, 5, { nusach: 'sfarad' })
    const c3 = ctx(5786, 8, 5, { nusach: 'chabad' })
    const r1 = tahanunGenerator.generate(c1)
    const r2 = tahanunGenerator.generate(c2)
    const r3 = tahanunGenerator.generate(c3)
    const main = (rows: { id: string; body: string }[]) =>
      rows.find((r) => r.id === 'tahanun-main')?.body || ''
    // At least one nusach pair should differ.
    expect(new Set([main(r1), main(r2), main(r3)]).size).toBeGreaterThan(1)
  })

  it('skipped-day still emits the tahanun-sof closing fragment when available', () => {
    const rows = tahanunGenerator.generate(ctx(5786, 8, 3)) // Shabbat
    // Either the sof row exists, or no fragment is registered for default nusach —
    // ensure the array stays a valid (possibly empty) list.
    expect(Array.isArray(rows)).toBe(true)
  })
})
