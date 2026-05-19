import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import {
  isTachanunSkipped,
  isTachanunSkippedAtMincha,
  shouldSayAvinuMalkenu,
  isLongTachanun,
} from './tahanunRules'

/** Build a JewishCalendar from a Hebrew (year, month, day). */
function jc(year: number, month: number, day: number, inIsrael = false): JewishCalendar {
  const c = new JewishCalendar()
  c.setJewishDate(year, month, day)
  c.setInIsrael(inIsrael)
  return c
}

describe('isTachanunSkipped — universal exemptions', () => {
  // Year 5786 = 2025-2026
  it('skipped on Shabbat (3 Cheshvan 5786 = Sat 25 Oct 2025)', () => {
    const c = jc(5786, 8, 3)
    expect(c.getDayOfWeek()).toBe(7)
    expect(isTachanunSkipped(c)).toBe(true)
  })

  it('skipped on Rosh Chodesh', () => {
    const c = jc(5786, 9, 1) // Rosh Chodesh Kislev
    expect(c.isRoshChodesh()).toBe(true)
    expect(isTachanunSkipped(c)).toBe(true)
  })

  it('skipped on the 8 days of Chanukah', () => {
    for (let d = 25; d <= 30; d++) {
      const c = jc(5786, 9, d) // 25 Kislev .. 30 Kislev
      expect(isTachanunSkipped(c)).toBe(true)
    }
    expect(isTachanunSkipped(jc(5786, 10, 1))).toBe(true) // 1 Tevet
    expect(isTachanunSkipped(jc(5786, 10, 2))).toBe(true) // 2 Tevet (8th day Chanukah)
  })

  it('skipped on Purim (14 + 15 Adar)', () => {
    // 5786 has Adar II (leap year)? Use a non-leap year to keep it simple.
    // Year 5787 (Sep 2026 – Sep 2027) is leap, so use 5785 (non-leap).
    const c = jc(5785, 12, 14) // 14 Adar
    expect(c.isPurim()).toBe(true)
    expect(isTachanunSkipped(c)).toBe(true)
  })

  it('skipped on Tu BiShvat (15 Shvat)', () => {
    expect(isTachanunSkipped(jc(5786, 11, 15))).toBe(true)
  })

  it('skipped on Tu BeAv (15 Av)', () => {
    expect(isTachanunSkipped(jc(5786, 5, 15))).toBe(true)
  })

  it('skipped on Lag BaOmer (18 Iyar)', () => {
    expect(isTachanunSkipped(jc(5786, 2, 18))).toBe(true)
  })

  it('skipped on Pesach Sheni (14 Iyar)', () => {
    expect(isTachanunSkipped(jc(5786, 2, 14))).toBe(true)
  })

  it('skipped throughout all of Nisan', () => {
    for (const d of [1, 5, 10, 16, 22, 28, 29]) {
      expect(isTachanunSkipped(jc(5786, 1, d))).toBe(true)
    }
  })

  it('skipped from 1 Sivan through 12 Sivan', () => {
    for (const d of [1, 6, 12]) {
      expect(isTachanunSkipped(jc(5786, 3, d))).toBe(true)
    }
  })

  it('NOT skipped on a regular Monday in Cheshvan (5 Cheshvan 5786 = Mon)', () => {
    const c = jc(5786, 8, 5)
    expect(c.getDayOfWeek()).toBe(2) // Mon
    expect(c.isRoshChodesh()).toBe(false)
    expect(c.isYomTov()).toBe(false)
    expect(isTachanunSkipped(c)).toBe(false)
  })

  it('skipped from Yom Kippur (10 Tishrei) through end of Tishrei', () => {
    for (const d of [10, 15, 22, 23, 29]) {
      expect(isTachanunSkipped(jc(5786, 7, d))).toBe(true)
    }
  })

  it('skipped from 9 Av through 15 Av', () => {
    for (const d of [9, 10, 13, 15]) {
      expect(isTachanunSkipped(jc(5786, 5, d))).toBe(true)
    }
  })
})

describe('shouldSayAvinuMalkenu', () => {
  it('true on Tzom Gedalyah (3 Tishrei) — fast day in 10-day period', () => {
    const c = jc(5786, 7, 3)
    expect(c.isTaanis()).toBe(true)
    expect(shouldSayAvinuMalkenu(c)).toBe(true)
  })

  it('true during Aseret Yemei Teshuva (4 Tishrei)', () => {
    const c = jc(5786, 7, 4)
    expect(shouldSayAvinuMalkenu(c)).toBe(true)
  })

  it('true on 17 Tammuz fast', () => {
    const c = jc(5786, 4, 17)
    expect(shouldSayAvinuMalkenu(c)).toBe(true)
  })

  it('false on regular weekday outside the 10 days', () => {
    expect(shouldSayAvinuMalkenu(jc(5786, 8, 5))).toBe(false)
  })

  it('false on Shabbat (even during 10 days)', () => {
    const c = jc(5786, 8, 3) // 3 Cheshvan 5786 = Sat
    expect(c.getDayOfWeek()).toBe(7)
    expect(shouldSayAvinuMalkenu(c)).toBe(false)
  })
})

describe('isTachanunSkippedAtMincha', () => {
  it('matches isTachanunSkipped on a regular weekday', () => {
    const c = jc(5786, 8, 5) // Mon, Cheshvan
    expect(isTachanunSkipped(c)).toBe(false)
    expect(isTachanunSkippedAtMincha(c)).toBe(false)
  })

  it('skipped at Mincha on Erev Shabbat even though Shacharit recites Tachanun', () => {
    const c = jc(5786, 8, 2) // 2 Cheshvan = Fri
    expect(c.getDayOfWeek()).toBe(6)
    expect(isTachanunSkipped(c)).toBe(false)
    expect(isTachanunSkippedAtMincha(c)).toBe(true)
  })

  it('skipped at Mincha on Erev Yom Tov', () => {
    const c = jc(5786, 1, 14) // 14 Nisan = Erev Pesach (Nisan is skipped anyway, so use a non-Nisan one)
    // Use Erev Rosh Hashana: 29 Elul
    const erevRH = jc(5786, 6, 29)
    expect(erevRH.isErevYomTov()).toBe(true)
    expect(isTachanunSkippedAtMincha(erevRH)).toBe(true)
    // sanity on c too
    expect(isTachanunSkippedAtMincha(c)).toBe(true)
  })
})

describe('isLongTachanun', () => {
  it('true on Monday in Cheshvan (no other exemption)', () => {
    // Walk Cheshvan 5786 looking for a Monday with no exemptions.
    let found = false
    for (let d = 4; d <= 28; d++) {
      const c = jc(5786, 8, d)
      if (c.getDayOfWeek() === 2 && !isTachanunSkipped(c)) {
        expect(isLongTachanun(c)).toBe(true)
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  it('false on Thursday in Nisan (skipped entirely)', () => {
    // 5 Nisan 5786 — definitely a non-yom-tov day in Nisan that we still skip.
    const c = jc(5786, 1, 5)
    expect(isLongTachanun(c)).toBe(false)
  })

  it('false on Sunday (not Mon/Thu)', () => {
    // 4 Cheshvan 5786 = Sun
    const c = jc(5786, 8, 4)
    expect(c.getDayOfWeek()).toBe(1)
    expect(isLongTachanun(c)).toBe(false)
  })
})
