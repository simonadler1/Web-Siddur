import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { shacharitSofGenerator } from './shacharitSof'
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

describe('ShacharitSofGenerator', () => {
  it('always emits Ashrei, Uva LeZion, and Aleinu', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 8, 5))
    expect(ids(rows)).toEqual(expect.arrayContaining(['sof-ashrei', 'sof-uva-lezion', 'sof-aleinu']))
  })

  it('emits Shir Shel Yom on Sunday with the Sunday psalm', () => {
    // 4 Cheshvan 5786 = Sun
    const rows = shacharitSofGenerator.generate(ctx(5786, 8, 4))
    expect(ids(rows)).toContain('sof-shir-shel-yom')
    const ssy = rows.find((r) => r.id === 'sof-shir-shel-yom')!
    // Sunday's psalm 24 contains "לדוד מזמור" — Hebrew letters not too volatile.
    expect(ssy.body).toMatch(/[֐-׿]/)
  })

  it('omits Shir Shel Yom on Shabbat (handled by Mussaf)', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 8, 3)) // Sat
    expect(ids(rows)).not.toContain('sof-shir-shel-yom')
  })

  it('emits LeDavid in Elul', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 6, 15))
    expect(ids(rows)).toContain('sof-ledavid')
  })

  it('does not emit LeDavid in Cheshvan', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 8, 5))
    expect(ids(rows)).not.toContain('sof-ledavid')
  })

  it('emits the Omer count during the 49 days', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 1, 16)) // Day 1 of Omer
    expect(ids(rows)).toContain('sof-omer')
    const omerRow = rows.find((r) => r.id === 'sof-omer')!
    expect(omerRow.body).toContain('הַיּוֹם')
  })

  it('does not emit the Omer count in Tishrei', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 7, 11))
    expect(ids(rows)).not.toContain('sof-omer')
  })

  it('switches Omer text by nusach', () => {
    // Day 7 (Nisan 22) — Ashkenaz uses בעומר, Sefard uses לעומר.
    const ashk = shacharitSofGenerator.generate(ctx(5786, 1, 22, { nusach: 'ashkenaz' }))
    const sfarad = shacharitSofGenerator.generate(ctx(5786, 1, 22, { nusach: 'sfarad' }))
    const a = ashk.find((r) => r.id === 'sof-omer')!.body
    const s = sfarad.find((r) => r.id === 'sof-omer')!.body
    expect(a).not.toBe(s)
  })

  it('emits Hoshienu in non-Ashkenaz nusachim', () => {
    const ashk = shacharitSofGenerator.generate(ctx(5786, 8, 5, { nusach: 'ashkenaz' }))
    const sfarad = shacharitSofGenerator.generate(ctx(5786, 8, 5, { nusach: 'sfarad' }))
    expect(ids(ashk)).not.toContain('sof-hoshienu')
    expect(ids(sfarad)).toContain('sof-hoshienu')
  })

  it('emits special mizmor on Chanukah (edot)', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 9, 25, { nusach: 'edot' }))
    expect(ids(rows)).toContain('sof-special-mizmor')
  })

  it('does NOT emit special mizmor on Chanukah for Ashkenaz (source convention)', () => {
    const rows = shacharitSofGenerator.generate(ctx(5786, 9, 25, { nusach: 'ashkenaz' }))
    expect(ids(rows)).not.toContain('sof-special-mizmor')
  })
})
