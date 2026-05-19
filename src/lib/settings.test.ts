import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'

describe('Settings storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips a saved settings object', () => {
    saveSettings({ ...DEFAULT_SETTINGS, nusach: 'sfarad', inIsrael: true })
    expect(loadSettings()).toMatchObject({ nusach: 'sfarad', inIsrael: true })
  })

  it('falls back to defaults on corrupted storage', () => {
    localStorage.setItem('siddur:settings', 'not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('merges partial saved data with defaults', () => {
    localStorage.setItem('siddur:settings', JSON.stringify({ nusach: 'chabad' }))
    const loaded = loadSettings()
    expect(loaded.nusach).toBe('chabad')
    expect(loaded.use24h).toBe(DEFAULT_SETTINGS.use24h)
  })
})
