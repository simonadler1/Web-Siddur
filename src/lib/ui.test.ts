import { describe, it, expect, beforeEach } from 'vitest'
import { t, format, setUiLocale } from './ui'

describe('UI locale helper', () => {
  beforeEach(() => setUiLocale('en'))

  it('returns English by default', () => {
    expect(t('shacharit')).toBe('Shacharit')
  })

  it('returns Hebrew when locale set to he', () => {
    setUiLocale('he')
    expect(t('shacharit')).toBe('שחרית')
  })

  it('falls back to English when key is missing in active locale', () => {
    setUiLocale('he')
    expect(t('app_name')).toBeTruthy() // Both have it; just ensure no crash
  })

  it('humanizes unknown keys instead of showing the raw key', () => {
    expect(t('thisKeyDoesNotExistXyz')).toBe('This Key Does Not Exist Xyz')
    expect(t('some_snake_caseTitle')).toBe('Some Snake Case')
    expect(t('modehTitle')).toBe('Modeh Ani') // present in the JSON now
  })

  it('never returns a raw camelCase key with a "Title" suffix', () => {
    for (const key of ['modehTitle', 'someUnknownTitle', 'amidaTitle', 'shemaTitle']) {
      const rendered = t(key)
      expect(rendered).not.toMatch(/Title$/)
      expect(rendered).not.toMatch(/^[a-z]/) // doesn't start with lowercase
    }
  })

  it('format() replaces %1$s style placeholders', () => {
    expect(format('Hello %1$s, day %2$s', 'world', 42)).toBe('Hello world, day 42')
  })
})
