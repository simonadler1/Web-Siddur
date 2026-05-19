import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { shirShelYomKey, shouldSayLedavid, specialMizmorKey, omerDayHere } from './shacharitSofRules'

function jc(year: number, month: number, day: number): JewishCalendar {
  const c = new JewishCalendar()
  c.setJewishDate(year, month, day)
  return c
}

describe('Shir Shel Yom mapping', () => {
  it('returns shirShelN for days 1..6', () => {
    // 4 Cheshvan 5786 = Sun (dow 1), 5 = Mon (dow 2), ..., 9 = Fri (dow 6)
    for (let dow = 1; dow <= 6; dow++) {
      const c = jc(5786, 8, 3 + dow)
      expect(c.getDayOfWeek()).toBe(dow)
      expect(shirShelYomKey(c)).toBe(`shirShel${dow}`)
    }
  })

  it('returns null on Shabbat (handled by Mussaf)', () => {
    const c = jc(5786, 8, 3) // Sat
    expect(c.getDayOfWeek()).toBe(7)
    expect(shirShelYomKey(c)).toBeNull()
  })
})

describe('shouldSayLedavid', () => {
  it('true in Elul (month 6)', () => {
    expect(shouldSayLedavid(jc(5786, 6, 1))).toBe(true)
    expect(shouldSayLedavid(jc(5786, 6, 29))).toBe(true)
  })

  it('true through 21 Tishrei (Hoshana Rabbah)', () => {
    expect(shouldSayLedavid(jc(5786, 7, 1))).toBe(true)
    expect(shouldSayLedavid(jc(5786, 7, 21))).toBe(true)
  })

  it('false from 22 Tishrei onward', () => {
    expect(shouldSayLedavid(jc(5786, 7, 22))).toBe(false)
  })

  it('false in Cheshvan', () => {
    expect(shouldSayLedavid(jc(5786, 8, 1))).toBe(false)
  })

  it('false in Adar', () => {
    expect(shouldSayLedavid(jc(5785, 12, 1))).toBe(false)
  })
})

describe('specialMizmorKey', () => {
  it('returns mizmorHanukat on Chanukah', () => {
    expect(specialMizmorKey(jc(5786, 9, 25))).toBe('mizmorHanukat')
  })

  it('returns yazTamuz on 17 Tammuz', () => {
    expect(specialMizmorKey(jc(5786, 4, 17))).toBe('yazTamuz')
  })

  it('returns gdaliaAndAsaraTevet on 10 Tevet', () => {
    expect(specialMizmorKey(jc(5786, 10, 10))).toBe('gdaliaAndAsaraTevet')
  })

  it('returns afterYomKipur on 11 Tishrei', () => {
    expect(specialMizmorKey(jc(5786, 7, 11))).toBe('afterYomKipur')
  })

  it('returns null on a regular weekday', () => {
    expect(specialMizmorKey(jc(5786, 8, 5))).toBeNull()
  })
})

describe('omerDayHere', () => {
  it('returns 0 outside the Omer period', () => {
    expect(omerDayHere(jc(5786, 8, 1))).toBe(0)
  })

  it('returns the correct day during Omer', () => {
    // Nisan 16 = day 1; Iyar 1 = day 16; Iyar 18 = Lag BaOmer = day 33
    expect(omerDayHere(jc(5786, 1, 16))).toBe(1)
    expect(omerDayHere(jc(5786, 2, 1))).toBe(16)
    expect(omerDayHere(jc(5786, 2, 18))).toBe(33)
  })
})
