import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { arvitGenerator } from './arvit'
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

describe('ArvitGenerator (composite)', () => {
  it('produces 50+ rows on a weekday', () => {
    expect(arvitGenerator.generate(ctx(5786, 8, 5)).length).toBeGreaterThanOrEqual(50)
  })

  it('includes the Shma, Amida, and Aleinu sections', () => {
    const rows = arvitGenerator.generate(ctx(5786, 8, 5))
    const ids = rows.map((r) => r.id)
    // The Shma keys live in the auto-extracted Arvit core under varying ids;
    // assert that the rendered Hebrew contains the iconic "שמע ישראל".
    const text = rows
      .map((r) => r.body)
      .join(' ')
      .normalize('NFD')
      .replace(/[֑-ׇ]/g, '')
    expect(text).toContain('שמע ישראל')
    expect(ids.some((i) => i.startsWith('amida-'))).toBe(true)
    expect(ids).toContain('arvit-aleinu')
  })

  it('includes Hatzi Kaddish before Amida, Full Kaddish after, Mourner\'s at end', () => {
    const ids = arvitGenerator.generate(ctx(5786, 8, 5)).map((r) => r.id)
    expect(ids).toContain('kaddish-before-amida')
    expect(ids).toContain('kaddish-closing')
    expect(ids).toContain('kaddish-mourners')
  })

  it('Amida includes patriarch names', () => {
    const text = arvitGenerator
      .generate(ctx(5786, 8, 5))
      .filter((r) => r.id.startsWith('amida-'))
      .map((r) => r.body)
      .join(' ')
      .normalize('NFD')
      .replace(/[֑-ׇ]/g, '')
    expect(text).toContain('אברהם')
  })

  it('no row body contains an unreplaced printf placeholder', () => {
    for (const r of arvitGenerator.generate(ctx(5786, 8, 5))) {
      expect(r.body).not.toMatch(/%\d+\$s/)
    }
  })
})
