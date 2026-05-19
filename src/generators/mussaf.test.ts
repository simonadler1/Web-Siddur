import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { mussafGenerator } from './mussaf'
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

const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

describe('MussafGenerator', () => {
  it('emits Ashrei first when there IS a Mussaf today', () => {
    const rows = mussafGenerator.generate(ctx(5786, 8, 3)) // Shabbat
    expect(rows[0].id).toBe('mussaf-ashrei')
  })

  it('on a no-Mussaf day, emits ONLY the empty-state row (no Ashrei)', () => {
    const rows = mussafGenerator.generate(ctx(5786, 8, 5)) // regular Monday
    expect(ids(rows)).toEqual(['mussaf-none'])
  })

  it('emits Shabbat Mussaf on a regular Saturday', () => {
    const rows = mussafGenerator.generate(ctx(5786, 8, 3)) // Sat 25 Oct 2025
    expect(ids(rows)).toContain('mussaf-shabbat-main')
    expect(ids(rows)).not.toContain('mussaf-none')
  })

  it('emits Rosh Chodesh Mussaf on a weekday Rosh Chodesh', () => {
    const rows = mussafGenerator.generate(ctx(5786, 9, 1))
    expect(ids(rows)).toContain('mussaf-roshChodesh-main')
  })

  it('emits Rosh Chodesh + Shabbat Mussaf when both coincide', () => {
    const rows = mussafGenerator.generate(ctx(5786, 2, 1)) // 2 Iyar 5786 = Sat
    expect(ids(rows)).toContain('mussaf-roshChodeshShabbat-main')
  })

  it('emits Pesach Mussaf on 15 Nisan', () => {
    const rows = mussafGenerator.generate(ctx(5786, 1, 15))
    expect(ids(rows)).toContain('mussaf-pesach-main')
  })

  it('emits Shavuot Mussaf on 6 Sivan', () => {
    const rows = mussafGenerator.generate(ctx(5786, 3, 6))
    expect(ids(rows)).toContain('mussaf-shavuot-main')
  })

  it('emits Sukkot Mussaf with day-specific addition', () => {
    // 16 Tishrei = 2nd day of Sukkot
    const rows = mussafGenerator.generate(ctx(5786, 7, 16))
    expect(ids(rows)).toContain('mussaf-sukkot-main')
    expect(ids(rows)).toContain('mussaf-sukkot-day')
  })

  it('emits Yom Kippur Mussaf on 10 Tishrei', () => {
    const rows = mussafGenerator.generate(ctx(5786, 7, 10))
    expect(ids(rows)).toContain('mussaf-yomKippur-main')
  })

  it('emits Rosh Hashanah Mussaf on 1 Tishrei', () => {
    const rows = mussafGenerator.generate(ctx(5786, 7, 1))
    expect(ids(rows)).toContain('mussaf-roshHashanah-main')
  })

  it('every emitted body contains Hebrew', () => {
    const HEB = /[֐-׿]/
    const rows = mussafGenerator.generate(ctx(5786, 9, 1)) // RC
    for (const r of rows) {
      if (r.body && !r.body.includes('No Mussaf')) {
        expect(r.body).toMatch(HEB)
      }
    }
  })

  it('switches Kedusha by occasion', () => {
    const rcKd = mussafGenerator.generate(ctx(5786, 9, 1)).find((r) => r.id === 'mussaf-kedusha')!.body
    const shKd = mussafGenerator.generate(ctx(5786, 8, 3)).find((r) => r.id === 'mussaf-kedusha')!.body
    // Distinct content between RC and Shabbat.
    expect(rcKd).not.toBe(shKd)
  })
})
