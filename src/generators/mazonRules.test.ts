import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import {
  shouldInsertAlHanissim,
  shouldInsertYaalehVyavo,
  isShabbat,
  isNoTachanunMeal,
} from './mazonRules'

function jc(year: number, month: number, day: number): JewishCalendar {
  const c = new JewishCalendar()
  c.setJewishDate(year, month, day)
  return c
}

describe('Al Hanissim gating', () => {
  it('chanukah on Kislev 25', () => {
    expect(shouldInsertAlHanissim(jc(5786, 9, 25))).toBe('chanukah')
  })

  it('chanukah on Tevet 2 (last day, 8th)', () => {
    expect(shouldInsertAlHanissim(jc(5786, 10, 2))).toBe('chanukah')
  })

  it('purim on 14 Adar (non-leap year)', () => {
    expect(shouldInsertAlHanissim(jc(5785, 12, 14))).toBe('purim')
  })

  it('returns null on a regular day', () => {
    expect(shouldInsertAlHanissim(jc(5786, 8, 5))).toBeNull()
  })

  it('returns null on Rosh Chodesh (handled separately by Ya\'aleh V\'Yavo)', () => {
    expect(shouldInsertAlHanissim(jc(5786, 9, 1))).toBeNull()
  })
})

describe('Ya\'aleh V\'Yavo gating', () => {
  it('roshChodesh on Rosh Chodesh Kislev', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 9, 1))).toBe('roshChodesh')
  })

  it('pesach on day 1 (15 Nisan)', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 1, 15))).toBe('pesach')
  })

  it('pesach during Chol Hamoed Pesach (18 Nisan)', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 1, 18))).toBe('pesach')
  })

  it('succos on day 1 (15 Tishrei)', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 7, 15))).toBe('succos')
  })

  it('succos during Hoshana Rabbah (21 Tishrei)', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 7, 21))).toBe('succos')
  })

  it('succos on Shemini Atzeret (22 Tishrei)', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 7, 22))).toBe('succos')
  })

  it('null on a regular weekday', () => {
    expect(shouldInsertYaalehVyavo(jc(5786, 8, 5))).toBeNull()
  })

  it('null on Shavuot (only Rosh Chodesh/Pesach/Sukkot bucket)', () => {
    // Shavuot itself does have a Ya'aleh V'Yavo equivalent, but the source
    // bucket only switches on Pesach/Sukkot/RC — other yom tovim fall through
    // to "klum". Verify our faithful port matches that.
    expect(shouldInsertYaalehVyavo(jc(5786, 3, 6))).toBeNull()
  })
})

describe('isShabbat', () => {
  it('true on 3 Cheshvan 5786', () => {
    expect(isShabbat(jc(5786, 8, 3))).toBe(true)
  })
  it('false on 5 Cheshvan 5786', () => {
    expect(isShabbat(jc(5786, 8, 5))).toBe(false)
  })
})

describe('isNoTachanunMeal', () => {
  it('true on Shabbat', () => {
    expect(isNoTachanunMeal(jc(5786, 8, 3))).toBe(true)
  })
  it('true on Chanukah', () => {
    expect(isNoTachanunMeal(jc(5786, 9, 25))).toBe(true)
  })
  it('true on Rosh Chodesh', () => {
    expect(isNoTachanunMeal(jc(5786, 9, 1))).toBe(true)
  })
  it('false on a regular weekday', () => {
    expect(isNoTachanunMeal(jc(5786, 8, 5))).toBe(false)
  })
})
