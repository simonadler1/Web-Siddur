import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Smart Siddur/i })).toBeVisible()
})

test('home page renders extracted Hebrew prayer text', async ({ page }) => {
  await page.goto('/')
  const sample = page.getByTestId('sample-prayer')
  await expect(sample).toBeVisible()
  // Niqqud (combining marks) breaks raw substring matching, so strip them first.
  const text = (await sample.innerText()).normalize('NFD').replace(/[֑-ׇ]/g, '')
  expect(text).toContain('ברוך אתה')
  expect(text).toContain('אברהם')
  await expect(page.getByTestId('prayer-count')).toHaveText(/^\d{3,}$/)
})

test('navigates to zmanim page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Zmanim' }).click()
  await expect(page.getByTestId('zmanim-page')).toBeVisible()
})

test('zmanim page renders sunrise/sunset for a fixed date', async ({ page }) => {
  await page.goto('/zmanim')
  // Force a known date (Jerusalem, 2026-05-19) so values are deterministic.
  await page.getByTestId('zmanim-date-input').fill('2026-05-19')
  // Sunrise around 05:35 local Jerusalem time
  await expect(page.getByTestId('zman-sunrise')).toHaveText(/05:3\d/)
  // Sunset around 19:36 local Jerusalem time
  await expect(page.getByTestId('zman-sunset')).toHaveText(/19:3\d/)
  await expect(page.getByTestId('hebrew-date')).toBeVisible()
  await expect(page.getByTestId('zmanim-location')).toHaveText('Jerusalem')
})
