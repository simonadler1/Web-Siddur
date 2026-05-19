import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { mussafKind } from './mussafRules'

function jc(year: number, month: number, day: number): JewishCalendar {
  const c = new JewishCalendar()
  c.setJewishDate(year, month, day)
  return c
}

describe('mussafKind', () => {
  it('shabbat on a plain Saturday', () => {
    expect(mussafKind(jc(5786, 8, 3))).toBe('shabbat')
  })

  it('null on a plain weekday', () => {
    expect(mussafKind(jc(5786, 8, 5))).toBeNull()
  })

  it('roshChodesh on a weekday Rosh Chodesh', () => {
    expect(mussafKind(jc(5786, 9, 1))).toBe('roshChodesh') // RC Kislev
  })

  it('roshChodeshShabbat when RC falls on Shabbat', () => {
    // 2 Iyar 5786 — Rosh Chodesh Iyar that lands on Shabbat (verified empirically).
    expect(mussafKind(jc(5786, 2, 1))).toBe('roshChodeshShabbat')
  })

  it('pesach on day 1 (15 Nisan)', () => {
    expect(mussafKind(jc(5786, 1, 15))).toBe('pesach')
  })

  it('pesach during Chol Hamoed (18 Nisan)', () => {
    expect(mussafKind(jc(5786, 1, 18))).toBe('pesach')
  })

  it('shavuot on 6 Sivan', () => {
    expect(mussafKind(jc(5786, 3, 6))).toBe('shavuot')
  })

  it('sukkot on 15 Tishrei', () => {
    expect(mussafKind(jc(5786, 7, 15))).toBe('sukkot')
  })

  it('sukkot through Hoshana Rabbah (21 Tishrei)', () => {
    expect(mussafKind(jc(5786, 7, 21))).toBe('sukkot')
  })

  it('shminiAtzeret on 22 Tishrei', () => {
    expect(mussafKind(jc(5786, 7, 22))).toBe('shminiAtzeret')
  })

  it('roshHashanah on 1 Tishrei', () => {
    expect(mussafKind(jc(5786, 7, 1))).toBe('roshHashanah')
  })

  it('yomKippur on 10 Tishrei', () => {
    expect(mussafKind(jc(5786, 7, 10))).toBe('yomKippur')
  })

  it('null on Chanukah (no Mussaf, despite festive day)', () => {
    expect(mussafKind(jc(5786, 9, 25))).toBeNull()
  })
})
