import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { kaddishRow, type KaddishKind } from './kaddish'
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

const KINDS: KaddishKind[] = ['derabbanan', 'yehe', 'titkabal', 'hazi']

describe('Kaddish generator', () => {
  it.each(KINDS)('produces a row with Hebrew body for kind=%s', (kind) => {
    const row = kaddishRow(kind, ctx(5786, 8, 5))
    expect(row).not.toBeNull()
    expect(row!.body).toMatch(/[֐-׿]/)
  })

  it('every kind starts with the iconic "יִתְגַּדַּל" / יתגדל opener', () => {
    for (const kind of KINDS) {
      const row = kaddishRow(kind, ctx(5786, 8, 5))!
      const stripped = row.body.normalize('NFD').replace(/[֑-ׇ]/g, '')
      expect(stripped, `kind=${kind}: body does not start with יתגדל`).toMatch(/יתגדל/)
    }
  })

  it('different nusachim produce different Kaddish text', () => {
    const a = kaddishRow('hazi', ctx(5786, 8, 5, { nusach: 'ashkenaz' }))!.body
    const s = kaddishRow('hazi', ctx(5786, 8, 5, { nusach: 'sfarad' }))!.body
    const c = kaddishRow('hazi', ctx(5786, 8, 5, { nusach: 'chabad' }))!.body
    const e = kaddishRow('hazi', ctx(5786, 8, 5, { nusach: 'edot' }))!.body
    expect(new Set([a, s, c, e]).size).toBeGreaterThan(1)
  })

  it('on a fast day, ashkenaz Kaddish uses the "Aseret" insertion', () => {
    // 17 Tammuz is a public fast day.
    const fast = kaddishRow('titkabal', ctx(5786, 4, 17, { nusach: 'ashkenaz' }))!.body
    const normal = kaddishRow('titkabal', ctx(5786, 8, 5, { nusach: 'ashkenaz' }))!.body
    expect(fast).not.toBe(normal)
  })

  it('no unreplaced printf placeholders leak through', () => {
    for (const kind of KINDS) {
      for (const nusach of ['ashkenaz', 'sfarad', 'chabad', 'edot'] as const) {
        const row = kaddishRow(kind, ctx(5786, 8, 5, { nusach }))!
        expect(row.body, `kind=${kind} nusach=${nusach}`).not.toMatch(/%\d+\$s/)
      }
    }
  })

  it('different KaddishKinds emit recognizably different rows', () => {
    const ctx1 = ctx(5786, 8, 5)
    const bodies = KINDS.map((k) => kaddishRow(k, ctx1)!.body)
    expect(new Set(bodies).size).toBe(KINDS.length)
  })

  it('row id includes the kind suffix', () => {
    expect(kaddishRow('yehe', ctx(5786, 8, 5))!.id).toContain('yehe')
    expect(kaddishRow('hazi', ctx(5786, 8, 5))!.id).toContain('hazi')
  })

  it('caller-supplied rowIdSuffix is honoured (for uniqueness across many calls)', () => {
    const row = kaddishRow('hazi', ctx(5786, 8, 5), 'after-amida')
    expect(row!.id).toBe('kaddish-after-amida')
  })
})
