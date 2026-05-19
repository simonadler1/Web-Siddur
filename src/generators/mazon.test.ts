import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { mazonGenerator } from './mazon'
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

describe('MazonGenerator', () => {
  it('always emits the four core blessings', () => {
    const rows = mazonGenerator.generate(ctx(5786, 8, 5))
    expect(ids(rows)).toEqual(
      expect.arrayContaining([
        'mazon-bHazan',
        'mazon-bNode',
        'mazon-bRahem',
        'mazon-bHatov',
        'mazon-rahaman',
      ]),
    )
  })

  it('includes a zimun row only when minyan = tzibur', () => {
    const ashk = mazonGenerator.generate(ctx(5786, 8, 5, { minyan: 'yahid' }))
    expect(ids(ashk)).not.toContain('mazon-zimun')
    const tzibur = mazonGenerator.generate(ctx(5786, 8, 5, { minyan: 'tzibur' }))
    expect(ids(tzibur)).toContain('mazon-zimun')
  })

  it('inserts Al Hanissim text into the bNode blessing on Chanukah', () => {
    const reg = mazonGenerator.generate(ctx(5786, 8, 5)) // regular day
    const han = mazonGenerator.generate(ctx(5786, 9, 25)) // 1st day Chanukah
    const regBody = reg.find((r) => r.id === 'mazon-bNode')!.body
    const hanBody = han.find((r) => r.id === 'mazon-bNode')!.body
    expect(regBody).not.toBe(hanBody)
  })

  it('inserts Al Hanissim text into the bNode blessing on Purim', () => {
    const reg = mazonGenerator.generate(ctx(5786, 8, 5))
    const pur = mazonGenerator.generate(ctx(5785, 12, 14)) // 14 Adar (non-leap)
    expect(reg.find((r) => r.id === 'mazon-bNode')!.body).not.toBe(
      pur.find((r) => r.id === 'mazon-bNode')!.body,
    )
  })

  it('emits the extra Hanukkah closing line on Chanukah, not on a regular day', () => {
    expect(ids(mazonGenerator.generate(ctx(5786, 8, 5)))).not.toContain('mazon-yita-hanuka')
    expect(ids(mazonGenerator.generate(ctx(5786, 9, 25)))).toContain('mazon-yita-hanuka')
  })

  it('inserts Ya\'aleh V\'Yavo into bRahem on Rosh Chodesh', () => {
    const reg = mazonGenerator.generate(ctx(5786, 8, 5))
    const rc = mazonGenerator.generate(ctx(5786, 9, 1)) // RC Kislev
    expect(reg.find((r) => r.id === 'mazon-bRahem')!.body).not.toBe(
      rc.find((r) => r.id === 'mazon-bRahem')!.body,
    )
  })

  it('inserts Ya\'aleh V\'Yavo on Pesach (Nisan 15) and Chol Hamoed', () => {
    const reg = mazonGenerator.generate(ctx(5786, 8, 5))
    const pesach1 = mazonGenerator.generate(ctx(5786, 1, 15))
    const cholHamoed = mazonGenerator.generate(ctx(5786, 1, 18))
    const regBody = reg.find((r) => r.id === 'mazon-bRahem')!.body
    expect(pesach1.find((r) => r.id === 'mazon-bRahem')!.body).not.toBe(regBody)
    expect(cholHamoed.find((r) => r.id === 'mazon-bRahem')!.body).not.toBe(regBody)
  })

  it('switches text by nusach', () => {
    const ashk = mazonGenerator.generate(ctx(5786, 8, 5, { nusach: 'ashkenaz' }))
    const sfarad = mazonGenerator.generate(ctx(5786, 8, 5, { nusach: 'sfarad' }))
    const chabad = mazonGenerator.generate(ctx(5786, 8, 5, { nusach: 'chabad' }))

    const a = ashk.find((r) => r.id === 'mazon-bHazan')!.body
    const s = sfarad.find((r) => r.id === 'mazon-bHazan')!.body
    const c = chabad.find((r) => r.id === 'mazon-bHazan')!.body
    expect(new Set([a, s, c]).size).toBeGreaterThan(1)
  })

  it('every emitted row contains Hebrew text', () => {
    const rows = mazonGenerator.generate(ctx(5786, 9, 25))
    const HEB = /[֐-׿]/
    for (const r of rows) {
      if (r.body) expect(r.body).toMatch(HEB)
    }
  })
})
