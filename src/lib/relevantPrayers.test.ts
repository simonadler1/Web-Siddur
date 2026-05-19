import { describe, it, expect } from 'vitest'
import { relevantPrayers } from './relevantPrayers'
import { DEFAULT_LOCATION } from './location'

const JERUSALEM = DEFAULT_LOCATION
// Sunset in Jerusalem on 2026-05-19 is ~19:36 local (Asia/Jerusalem = UTC+3 in May).
const SUNSET_2026_05_19_UTC = new Date('2026-05-19T16:36:00Z')

describe('relevantPrayers', () => {
  it('includes the daily core prayers on a regular Tuesday morning', () => {
    const morning = new Date('2026-05-19T07:00:00Z') // 10:00 Jerusalem
    const { ids, isTransition } = relevantPrayers(JERUSALEM, true, morning)
    expect(isTransition).toBe(false)
    expect(ids).toContain('shacharit')
    expect(ids).toContain('mincha')
    expect(ids).toContain('arvit')
    expect(ids).toContain('mazon')
    expect(ids).not.toContain('mussaf')
  })

  it('includes mussaf and havdala on Shabbat', () => {
    // 2026-05-23 is a Saturday.
    const shabbatMorning = new Date('2026-05-23T07:00:00Z')
    const { ids } = relevantPrayers(JERUSALEM, true, shabbatMorning)
    expect(ids).toContain('mussaf')
    expect(ids).toContain('havdala')
    expect(ids).toContain('torahReading')
  })

  it('includes omer during sefirat ha-omer', () => {
    const omerDay = new Date('2026-05-19T07:00:00Z') // within omer window
    const { ids } = relevantPrayers(JERUSALEM, true, omerDay)
    expect(ids).toContain('omer')
  })

  it('marks isTransition and unions both days within the buffer window', () => {
    // 10 min before sunset on Friday — still erev Shabbat, Shabbat just about to start.
    // 2026-05-22 is a Friday; sunset ~19:32 Jerusalem (~16:32 UTC). Take 16:25 UTC.
    const friday = new Date('2026-05-22T16:25:00Z')
    const { ids, isTransition } = relevantPrayers(JERUSALEM, true, friday)
    expect(isTransition).toBe(true)
    // Friday alone wouldn't yield mussaf, but Shabbat does — so union must include it.
    expect(ids).toContain('mussaf')
  })

  it('after the buffer past sunset, only the next Jewish day is shown', () => {
    // 1 hour after sunset on Tuesday → Wednesday Jewish date.
    const afterSunset = new Date(SUNSET_2026_05_19_UTC.getTime() + 60 * 60 * 1000)
    const { ids, isTransition } = relevantPrayers(JERUSALEM, true, afterSunset)
    expect(isTransition).toBe(false)
    expect(ids).toContain('shacharit')
  })

  it('orders shacharit/mincha/arvit first', () => {
    const morning = new Date('2026-05-19T07:00:00Z')
    const { ids } = relevantPrayers(JERUSALEM, true, morning)
    expect(ids[0]).toBe('shacharit')
    expect(ids[1]).toBe('mincha')
    expect(ids[2]).toBe('arvit')
  })
})
