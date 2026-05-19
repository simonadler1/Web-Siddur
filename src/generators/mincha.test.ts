import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { minchaGenerator } from './mincha'
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

describe('MinchaGenerator (composite)', () => {
  it('produces 40+ rows on a weekday', () => {
    expect(minchaGenerator.generate(ctx(5786, 8, 5)).length).toBeGreaterThanOrEqual(40)
  })

  it('includes Ashrei, Amida, Tachanun, and Aleinu on a weekday', () => {
    const ids = minchaGenerator.generate(ctx(5786, 8, 5)).map((r) => r.id)
    expect(ids).toContain('mincha-ashrei')
    expect(ids.some((i) => i.startsWith('amida-'))).toBe(true)
    expect(ids.some((i) => i.startsWith('tahanun-'))).toBe(true)
    expect(ids).toContain('mincha-aleinu')
  })

  it('includes Hatzi Kaddish before Amida, Titkabal after, Mourner\'s at the end', () => {
    const ids = minchaGenerator.generate(ctx(5786, 8, 5)).map((r) => r.id)
    expect(ids).toContain('kaddish-before-amida')
    expect(ids).toContain('kaddish-closing')
    expect(ids).toContain('kaddish-mourners')
  })

  it('omits Tachanun on Shabbat', () => {
    const ids = minchaGenerator.generate(ctx(5786, 8, 3)).map((r) => r.id)
    expect(ids.some((i) => i.startsWith('tahanun-'))).toBe(false)
  })

  it('omits Tachanun at Mincha on Erev Shabbat (Friday)', () => {
    // 2 Cheshvan 5786 = Fri
    const c = ctx(5786, 8, 2)
    expect(c.jc.getDayOfWeek()).toBe(6)
    const ids = minchaGenerator.generate(c).map((r) => r.id)
    expect(ids.some((i) => i.startsWith('tahanun-'))).toBe(false)
  })

  it('does NOT include long-Tachanun additions at Mincha on Monday', () => {
    // 5 Cheshvan 5786 = Mon (same weekday Shacharit does include them)
    const c = ctx(5786, 8, 5)
    expect(c.jc.getDayOfWeek()).toBe(2)
    const ids = minchaGenerator.generate(c).map((r) => r.id)
    // Short Tachanun is still present
    expect(ids).toContain('tahanun-tahanun-main')
    // But the Mon/Thu expansions are not
    expect(ids.some((i) => i.startsWith('tahanun-tahanun-long-'))).toBe(false)
  })

  it('does NOT include long-Tachanun additions at Mincha on Thursday', () => {
    // 8 Cheshvan 5786 = Thu (Shacharit Tachanun is long; Mincha must not be)
    const c = ctx(5786, 8, 8)
    expect(c.jc.getDayOfWeek()).toBe(5)
    const ids = minchaGenerator.generate(c).map((r) => r.id)
    expect(ids).toContain('tahanun-tahanun-main')
    expect(ids.some((i) => i.startsWith('tahanun-tahanun-long-'))).toBe(false)
  })

  it('Amida includes patriarch names', () => {
    const text = minchaGenerator
      .generate(ctx(5786, 8, 5))
      .filter((r) => r.id.startsWith('amida-'))
      .map((r) => r.body)
      .join(' ')
      .normalize('NFD')
      .replace(/[֑-ׇ]/g, '')
    expect(text).toContain('אברהם')
    expect(text).toContain('יצחק')
    expect(text).toContain('יעקב')
  })

  it('no row body contains an unreplaced printf placeholder', () => {
    for (const r of minchaGenerator.generate(ctx(5786, 8, 5))) {
      expect(r.body).not.toMatch(/%\d+\$s/)
    }
  })

  it('row ids are unique', () => {
    const ids = minchaGenerator.generate(ctx(5786, 8, 5)).map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
