import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { amidaGenerator } from './amida'
import type { GeneratorContext } from './types'
import { DEFAULT_SETTINGS, type SiddurSettings } from '../lib/settings'
import prayers from '../data/prayers.json'

const P = prayers as Record<string, string>

function ctx(
  year: number,
  month: number,
  day: number,
  overrides: Partial<SiddurSettings> = {},
): GeneratorContext {
  const jcal = new JewishCalendar()
  jcal.setJewishDate(year, month, day)
  return {
    date: new Date(),
    jc: jcal,
    settings: { ...DEFAULT_SETTINGS, ...overrides },
  }
}

function bodyOf(rows: { id: string; body: string }[], id: string): string {
  const r = rows.find((x) => x.id === id)
  if (!r) throw new Error(`row ${id} not found`)
  return r.body
}

describe('Amida placeholder substitution', () => {
  it('never leaves a literal %1$s or %2$s in any rendered body', () => {
    const rows = amidaGenerator.generate(ctx(5786, 8, 5))
    for (const r of rows) {
      expect(r.body).not.toMatch(/%1\$s/)
      expect(r.body).not.toMatch(/%2\$s/)
    }
  })
})

describe('Tal/Geshem gating (b2 + b9)', () => {
  it('winter weekday recites Mashiv haRuach (Geshem) in b2', () => {
    const rows = amidaGenerator.generate(ctx(5786, 8, 5, { isWinter: true }))
    expect(bodyOf(rows, 'amida-gevurot')).toContain(P['b2Winter'])
    expect(bodyOf(rows, 'amida-gevurot')).not.toContain(P['b2Summer'])
  })

  it('summer weekday recites Morid haTal in b2', () => {
    const rows = amidaGenerator.generate(ctx(5786, 2, 20, { isWinter: false }))
    expect(bodyOf(rows, 'amida-gevurot')).toContain(P['b2Summer'])
    expect(bodyOf(rows, 'amida-gevurot')).not.toContain(P['b2Winter'])
  })

  it('b9 uses the Winter (Bareh aleinu) text in winter, Summer otherwise', () => {
    const winter = amidaGenerator.generate(ctx(5786, 8, 5, { isWinter: true }))
    const summer = amidaGenerator.generate(ctx(5786, 2, 20, { isWinter: false }))
    expect(bodyOf(winter, 'amida-birkat-shanim')).not.toBe(
      bodyOf(summer, 'amida-birkat-shanim'),
    )
    // Winter is the longer "Bareh aleinu" form.
    expect(bodyOf(winter, 'amida-birkat-shanim').length).toBeGreaterThan(
      bodyOf(summer, 'amida-birkat-shanim').length,
    )
  })
})

describe('Aseret Yemei Teshuva gating', () => {
  it('inserts Zochrenu in Avot during the Ten Days', () => {
    const rows = amidaGenerator.generate(ctx(5786, 7, 5))
    // ashkenaz default → AvotAseretSefarad insertion text
    expect(bodyOf(rows, 'amida-avot')).toContain(P['AvotAseretSefarad'])
  })

  it('does not insert Zochrenu on an ordinary day', () => {
    const rows = amidaGenerator.generate(ctx(5786, 8, 5))
    expect(bodyOf(rows, 'amida-avot')).not.toContain(P['AvotAseretSefarad'])
    expect(bodyOf(rows, 'amida-avot')).not.toContain(P['AvotAseret'])
  })

  it('swaps HaEl HaKadosh → HaMelech HaKadosh in b3 during Aseret', () => {
    const aseret = amidaGenerator.generate(ctx(5786, 7, 5))
    const regular = amidaGenerator.generate(ctx(5786, 8, 5))
    expect(bodyOf(aseret, 'amida-kedusha-hashem')).toContain(P['b3Aseret'])
    expect(bodyOf(regular, 'amida-kedusha-hashem')).toContain(P['b3Sof'])
  })

  it('swaps Melech Ohev Tzedaka → HaMelech HaMishpat in b11 during Aseret', () => {
    const aseret = amidaGenerator.generate(ctx(5786, 7, 5))
    const regular = amidaGenerator.generate(ctx(5786, 8, 5))
    expect(bodyOf(aseret, 'amida-mishpat')).toContain(P['b11aseret'])
    expect(bodyOf(regular, 'amida-mishpat')).toContain(P['b11Sof'])
  })

  it('picks the per-nusach b19 Aseret variant', () => {
    const ash = amidaGenerator.generate(ctx(5786, 7, 5, { nusach: 'ashkenaz' }))
    const sfa = amidaGenerator.generate(ctx(5786, 7, 5, { nusach: 'sfarad' }))
    const chb = amidaGenerator.generate(ctx(5786, 7, 5, { nusach: 'chabad' }))
    const edt = amidaGenerator.generate(ctx(5786, 7, 5, { nusach: 'edot' }))
    expect(bodyOf(ash, 'amida-shalom')).toContain(P['b19AseretAshkenaz'])
    expect(bodyOf(sfa, 'amida-shalom')).toContain(P['b19AseretSefarad'])
    expect(bodyOf(chb, 'amida-shalom')).toContain(P['b19AseretChabad'])
    expect(bodyOf(edt, 'amida-shalom')).toContain(P['b19Aseret'])
  })

  it('omits the b19 Aseret insertion on a regular weekday', () => {
    const rows = amidaGenerator.generate(ctx(5786, 8, 5, { nusach: 'ashkenaz' }))
    expect(bodyOf(rows, 'amida-shalom')).not.toContain(P['b19AseretAshkenaz'])
  })
})
