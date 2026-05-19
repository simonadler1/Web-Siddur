import { test, expect } from '@playwright/test'

const HEBREW_RE = /[֐-׿]/

// Spot-check a sample of prayer pages across categories. The unit-test
// `every registered generator produces Hebrew content` is the authoritative
// check; this is a UI-rendering smoke screen.
const SAMPLE = [
  'shacharit',
  'mincha',
  'arvit',
  'mussaf',
  'mazon',
  'halel',
  'omer',
  'haderech',
  'hala',
  'ushpizin',
  'asherYatzar',
  'havdala',
  'hanuka',
  'levana',
  'blessings',
]

// Mussaf is empty on most weekdays (no Mussaf service) — accept its empty state.
const EMPTY_STATE_ALLOWED = new Set(['mussaf'])

for (const id of SAMPLE) {
  test(`prayer page renders for /${id}`, async ({ page }) => {
    await page.goto(`/prayer/${id}`)
    await expect(page.getByTestId('prayer-page')).toBeVisible()
    const text = await page.getByTestId('prayer-renderer').innerText()
    expect(text.length).toBeGreaterThan(20)
    if (EMPTY_STATE_ALLOWED.has(id) && /No Mussaf service today/i.test(text)) return
    expect(text).toMatch(HEBREW_RE)
  })
}
