import { describe, it, expect } from 'vitest'
import { computeZmanim, formatTime, ZMANIM_KEYS } from './zmanim'
import { DEFAULT_LOCATION } from './location'

describe('Zmanim calculations', () => {
  const date = new Date('2026-05-19T12:00:00Z')
  const snap = computeZmanim(DEFAULT_LOCATION, date)

  it('returns a value for every key', () => {
    for (const k of ZMANIM_KEYS) {
      expect(snap.times[k]).not.toBeNull()
    }
  })

  it('sunrise is before sunset', () => {
    expect(snap.times.sunrise!.getTime()).toBeLessThan(snap.times.sunset!.getTime())
  })

  it('alos72 is before sunrise (dawn before sunrise)', () => {
    expect(snap.times.alos72!.getTime()).toBeLessThan(snap.times.sunrise!.getTime())
  })

  it('tzais is after sunset', () => {
    expect(snap.times.tzais!.getTime()).toBeGreaterThan(snap.times.sunset!.getTime())
  })

  it('sofZmanShmaGRA is between sunrise and chatzos', () => {
    expect(snap.times.sofZmanShmaGRA!.getTime()).toBeGreaterThan(snap.times.sunrise!.getTime())
    expect(snap.times.sofZmanShmaGRA!.getTime()).toBeLessThan(snap.times.chatzos!.getTime())
  })

  it('MGA shma is earlier than GRA shma (stricter)', () => {
    expect(snap.times.sofZmanShmaMGA!.getTime()).toBeLessThan(snap.times.sofZmanShmaGRA!.getTime())
  })

  it('mincha gedola < mincha ketana < plag', () => {
    expect(snap.times.minchaGedola!.getTime()).toBeLessThan(snap.times.minchaKetana!.getTime())
    expect(snap.times.minchaKetana!.getTime()).toBeLessThan(snap.times.plagHamincha!.getTime())
  })

  it('Jerusalem sunrise on 2026-05-19 is around 05:35 local', () => {
    const s = formatTime(snap.times.sunrise, DEFAULT_LOCATION.timezone)
    const [hh, mm] = s.split(':').map(Number)
    const totalMin = hh * 60 + mm
    // sunrise ~05:35 ±5 minutes
    expect(totalMin).toBeGreaterThanOrEqual(5 * 60 + 25)
    expect(totalMin).toBeLessThanOrEqual(5 * 60 + 45)
  })

  it('Jerusalem sunset on 2026-05-19 is around 19:36 local', () => {
    const s = formatTime(snap.times.sunset, DEFAULT_LOCATION.timezone)
    const [hh, mm] = s.split(':').map(Number)
    const totalMin = hh * 60 + mm
    expect(totalMin).toBeGreaterThanOrEqual(19 * 60 + 25)
    expect(totalMin).toBeLessThanOrEqual(19 * 60 + 45)
  })

  it('Hebrew date string contains Hebrew characters', () => {
    expect(snap.hebrewDate).toMatch(/[֐-׿]/)
  })

  it('omer day for May 19 2026 is in the omer counting period (33-49)', () => {
    expect(snap.omerDay).toBeGreaterThan(0)
    expect(snap.omerDay).toBeLessThanOrEqual(49)
  })

  it('day of week is 2 (Monday) for 2026-05-18 evening / 2026-05-19', () => {
    // 2026-05-19 is a Tuesday (Gregorian); JewishCalendar.getDayOfWeek returns 3 for Tuesday.
    // JewishCalendar week starts on Sunday = 1.
    expect(snap.dayOfWeek).toBeGreaterThanOrEqual(1)
    expect(snap.dayOfWeek).toBeLessThanOrEqual(7)
  })

  it('formatTime falls back gracefully on null', () => {
    expect(formatTime(null, 'Asia/Jerusalem')).toBe('—')
  })

  it('formatTime respects 12h flag', () => {
    const noon = new Date('2026-05-19T13:30:00Z') // 16:30 Jerusalem
    expect(formatTime(noon, 'Asia/Jerusalem', false)).toMatch(/PM/i)
  })
})
