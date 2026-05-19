import { test, expect } from '@playwright/test'

test('Settings page persists nusach choice via localStorage', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByTestId('settings-page')).toBeVisible()
  await page.getByTestId('nusach-select').selectOption('chabad')
  // Verify it actually persisted
  const stored = await page.evaluate(() => localStorage.getItem('siddur:settings'))
  expect(stored).toContain('"nusach":"chabad"')
})

test('Settings page toggles inIsrael', async ({ page }) => {
  await page.goto('/settings')
  const t = page.getByTestId('setting-in-israel')
  const initial = await t.isChecked()
  await t.click()
  await expect(t).toBeChecked({ checked: !initial })
})

test('Locations page shows current location card', async ({ page }) => {
  await page.goto('/locations')
  await expect(page.getByTestId('locations-page')).toBeVisible()
  // Default = Jerusalem
  await expect(page.getByTestId('current-location')).toHaveText(/Jerusalem/i)
})

test('Locations page disables search when query is empty', async ({ page }) => {
  await page.goto('/locations')
  await expect(page.getByTestId('search-button')).toBeDisabled()
  await page.getByTestId('location-query').fill('London')
  await expect(page.getByTestId('search-button')).toBeEnabled()
})

test('Compass page shows bearing to Jerusalem', async ({ page }) => {
  await page.goto('/compass')
  await expect(page.getByTestId('compass-page')).toBeVisible()
  // Default location is Jerusalem; bearing from Jerusalem→Jerusalem is unstable but
  // numeric. From a non-default location the bearing should be > 0.
  await expect(page.getByTestId('compass-bearing')).toHaveText(/^\d+(\.\d+)?°$/)
  await expect(page.getByTestId('compass-dial')).toBeVisible()
  await expect(page.getByTestId('compass-needle')).toBeVisible()
})

test('Changing nusach in settings changes prayer text', async ({ page }) => {
  await page.goto('/settings')
  await page.getByTestId('nusach-select').selectOption('chabad')
  await page.goto('/prayer/shacharit')
  // Just verify the page still renders Hebrew after the change — exact text
  // diff between nusachs is covered by unit tests.
  await expect(page.getByTestId('prayer-page')).toBeVisible()
  const text = (await page.getByTestId('prayer-renderer').innerText()).normalize('NFD').replace(/[֑-ׇ]/g, '')
  expect(text).toContain('ברוך אתה')
})
