import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { shacharitGenerator } from './shacharit'
import { DEFAULT_SETTINGS } from '../lib/settings'

function makeCtx(year: number, month: number, day: number, overrides = {}) {
  const jc = new JewishCalendar()
  jc.setJewishDate(year, month, day)
  return {
    date: jc.getDate().toJSDate(),
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    jc,
  }
}

const sectionsOf = (rows: { id: string }[]) =>
  new Set(rows.map((r) => r.id.split('-')[0]))

describe('ShacharitGenerator (full composite)', () => {
  it('produces 60+ rows on a regular weekday', () => {
    // 5 Cheshvan 5786 = Mon — plain weekday with no exemptions.
    // Lower threshold reflects per-nusach filtering: Edot-only sections (Patach
    // Eliyahu, Kaddish D'Rabbanan in morning prep, etc.) correctly drop out
    // for the default Ashkenaz nusach.
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5))
    expect(rows.length).toBeGreaterThanOrEqual(60)
  })

  it('includes every major service section', () => {
    const sections = sectionsOf(shacharitGenerator.generate(makeCtx(5786, 8, 5)))
    expect(sections).toContain('shachar') // Morning blessings, Birkot HaShachar
    expect(sections).toContain('opening') // Korbanot, Akedah, Eilu Devarim
    expect(sections).toContain('zimra') // Pesukei DeZimra
    expect(sections).toContain('shma') // Shma & its blessings
    expect(sections).toContain('amida') // The 18 blessings — silent prayer
    expect(sections).toContain('tahanun') // Tachanun (weekday)
    expect(sections).toContain('kaddish') // Hatzi / Titkabal / Mourner's Kaddish
    expect(sections).toContain('sof') // Closing — Ashrei/Uva/Aleinu
  })

  it('inserts Hatzi Kaddish after Pesukei DeZimra and after Tachanun', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5))
    const ids = rows.map((r) => r.id)
    expect(ids).toContain('kaddish-after-zimra')
    expect(ids).toContain('kaddish-after-tahanun')
  })

  it('closes with Full Kaddish (Titkabal) and Mourner\'s Kaddish', () => {
    const ids = shacharitGenerator.generate(makeCtx(5786, 8, 5)).map((r) => r.id)
    expect(ids).toContain('kaddish-closing')
    expect(ids).toContain('kaddish-mourners')
  })

  it('includes the Amida opening blessing (Avot) with patriarch names', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5))
    const amidaText = rows
      .filter((r) => r.id.startsWith('amida-'))
      .map((r) => r.body)
      .join(' ')
      .normalize('NFD')
      .replace(/[֑-ׇ]/g, '')
    expect(amidaText).toContain('אברהם') // Avraham
    expect(amidaText).toContain('יצחק') // Yitzchak
    expect(amidaText).toContain('יעקב') // Yaakov
  })

  it('Amida section has 20+ rows (the 18/19 blessings)', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5))
    const amidaRows = rows.filter((r) => r.id.startsWith('amida-'))
    expect(amidaRows.length).toBeGreaterThanOrEqual(20)
  })

  it('omits tahanun rows on Shabbat (Sat 3 Cheshvan 5786)', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 3))
    const tahanunMain = rows.find((r) => r.id === 'tahanun-tahanun-main')
    expect(tahanunMain).toBeUndefined()
  })

  it('includes a Mussaf section on Shabbat', () => {
    const sections = sectionsOf(shacharitGenerator.generate(makeCtx(5786, 8, 3)))
    expect(sections).toContain('mussaf')
  })

  it('omits Mussaf on a regular weekday', () => {
    const sections = sectionsOf(shacharitGenerator.generate(makeCtx(5786, 8, 5)))
    expect(sections).not.toContain('mussaf')
  })

  it('includes Mussaf on Rosh Chodesh weekday', () => {
    const sections = sectionsOf(shacharitGenerator.generate(makeCtx(5786, 9, 1)))
    expect(sections).toContain('mussaf')
  })

  it('every row has a non-empty body with Hebrew characters', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5))
    const HEB = /[֐-׿]/
    const empty = rows.filter((r) => !r.body || !HEB.test(r.body))
    expect(
      empty,
      `rows without Hebrew body:\n${empty.map((r) => '  ' + r.id).join('\n')}`,
    ).toHaveLength(0)
  })

  it('different nusachim produce different total content', () => {
    const ashk = shacharitGenerator.generate(makeCtx(5786, 8, 5, { nusach: 'ashkenaz' }))
    const sfarad = shacharitGenerator.generate(makeCtx(5786, 8, 5, { nusach: 'sfarad' }))
    const chabad = shacharitGenerator.generate(makeCtx(5786, 8, 5, { nusach: 'chabad' }))
    const joined = (rs: { body: string }[]) => rs.map((r) => r.body).join('|')
    expect(new Set([joined(ashk), joined(sfarad), joined(chabad)]).size).toBeGreaterThan(1)
  })

  it('no row body contains an unreplaced printf placeholder', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5, { nusach: 'sfarad' }))
    for (const r of rows) {
      expect(r.body, `row ${r.id}: ${r.body.slice(0, 80)}`).not.toMatch(/%\d+\$s/)
    }
  })

  it('row ids are unique', () => {
    const rows = shacharitGenerator.generate(makeCtx(5786, 8, 5))
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
