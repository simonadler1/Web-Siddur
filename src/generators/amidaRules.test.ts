import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import {
  avotAseretKey,
  b19AseretKey,
  b2AseretKey,
  geshemSeason,
  isAseretYemeiTeshuva,
} from './amidaRules'

function jc(year: number, month: number, day: number): JewishCalendar {
  const c = new JewishCalendar()
  c.setJewishDate(year, month, day)
  return c
}

describe('isAseretYemeiTeshuva', () => {
  it('true on Rosh Hashana (1 Tishrei)', () => {
    expect(isAseretYemeiTeshuva(jc(5786, 7, 1))).toBe(true)
  })

  it('true on 8 Tishrei (Tzom Gedaliah window)', () => {
    expect(isAseretYemeiTeshuva(jc(5786, 7, 8))).toBe(true)
  })

  it('true on Yom Kippur (10 Tishrei)', () => {
    expect(isAseretYemeiTeshuva(jc(5786, 7, 10))).toBe(true)
  })

  it('false on 11 Tishrei (immediately after YK)', () => {
    expect(isAseretYemeiTeshuva(jc(5786, 7, 11))).toBe(false)
  })

  it('false on a typical winter weekday', () => {
    expect(isAseretYemeiTeshuva(jc(5786, 8, 5))).toBe(false)
  })
})

describe('geshemSeason', () => {
  it('returns winter when isWinter is true', () => {
    expect(geshemSeason(true)).toBe('winter')
  })
  it('returns summer when isWinter is false', () => {
    expect(geshemSeason(false)).toBe('summer')
  })
})

describe('Aseret nusach key selection', () => {
  it('Avot: edot uses the unsuffixed form', () => {
    expect(avotAseretKey('edot')).toBe('AvotAseret')
  })
  it('Avot: ashkenaz/sfarad/chabad all share the Sefarad form', () => {
    expect(avotAseretKey('ashkenaz')).toBe('AvotAseretSefarad')
    expect(avotAseretKey('sfarad')).toBe('AvotAseretSefarad')
    expect(avotAseretKey('chabad')).toBe('AvotAseretSefarad')
  })

  it('b2: edot/ashkenaz/sfarad/chabad branch per nusach', () => {
    expect(b2AseretKey('edot')).toBe('b2Aseret')
    expect(b2AseretKey('ashkenaz')).toBe('b2AseretAshkenaz')
    expect(b2AseretKey('sfarad')).toBe('b2AseretSefarad')
    expect(b2AseretKey('chabad')).toBe('b2AseretSefarad')
  })

  it('b19: all four nusachim have distinct keys', () => {
    expect(b19AseretKey('edot')).toBe('b19Aseret')
    expect(b19AseretKey('ashkenaz')).toBe('b19AseretAshkenaz')
    expect(b19AseretKey('sfarad')).toBe('b19AseretSefarad')
    expect(b19AseretKey('chabad')).toBe('b19AseretChabad')
  })
})
