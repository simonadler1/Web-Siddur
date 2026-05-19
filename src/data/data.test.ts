import { describe, it, expect } from 'vitest'
import prayers from './prayers.json'
import uiEn from './ui/en.json'
import uiIw from './ui/iw.json'
import uiDe from './ui/de.json'
import slihot from './slihot.json'
import summary from './extract-summary.json'

const HEBREW_RE = /[֐-׿]/

describe('Phase 0: data extraction', () => {
  it('extracted at least 1000 prayer strings', () => {
    expect(Object.keys(prayers).length).toBeGreaterThan(1000)
  })

  it('every prayer string contains Hebrew characters', () => {
    for (const [, value] of Object.entries(prayers)) {
      expect(HEBREW_RE.test(value)).toBe(true)
    }
  })

  it('contains the well-known Amida opening (Avot)', () => {
    expect(prayers).toHaveProperty('Avot')
    // Strip niqqud (combining marks) before comparing so the test isn't fragile to vowel-mark variations.
    const stripped = prayers.Avot.normalize('NFD').replace(/[֑-ׇ]/g, '')
    expect(stripped).toContain('ברוך אתה')
    expect(stripped).toContain('אברהם')
  })

  it('preserves embedded HTML tags', () => {
    expect(prayers.Avot).toContain('<small>')
    expect(prayers.Avot).toContain('<br>')
    expect(prayers.Avot).toContain('%1$s')
  })

  it('has nusach variants for the Amida opening', () => {
    expect(prayers).toHaveProperty('AvotSefarad')
    expect(prayers).toHaveProperty('AvotChabad')
  })

  it('has English UI labels for core navigation', () => {
    expect(uiEn).toMatchObject({
      app_name: 'Smart Siddur',
      shacharit: 'Shacharit',
      mincha: 'Mincha',
      settings: 'Settings',
    })
  })

  it('UI label set never overlaps with the prayer-text set', () => {
    for (const key of Object.keys(uiEn)) {
      expect(prayers).not.toHaveProperty(key)
    }
  })

  it('Hebrew UI labels translate basic terms', () => {
    expect(uiIw.shacharit).toBe('שחרית')
    expect(uiIw.mincha).toMatch(/מנחה/)
  })

  it('German UI labels are present', () => {
    expect(uiDe).toBeDefined()
    expect(Object.keys(uiDe).length).toBeGreaterThan(50)
  })

  it('parses slihot composition JSON', () => {
    expect(slihot).toHaveProperty('sfarad')
    const sfarad1 = (slihot as { sfarad: Record<string, unknown[]> }).sfarad['1']
    expect(Array.isArray(sfarad1)).toBe(true)
    expect(sfarad1[0]).toMatchObject({ id: expect.any(String) })
  })

  it('summary reports counts', () => {
    expect(summary.prayers).toBeGreaterThan(1000)
    expect(summary.locales.length).toBeGreaterThan(50)
  })
})
