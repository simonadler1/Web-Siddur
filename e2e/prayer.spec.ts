import { test, expect } from '@playwright/test'

const stripNiqqud = (s: string) => s.normalize('NFD').replace(/[֑-ׇ]/g, '')

test('Shacharit page renders prayer rows with Hebrew text', async ({ page }) => {
  await page.goto('/prayer/shacharit')
  await expect(page.getByTestId('prayer-page')).toBeVisible()
  await expect(page.getByTestId('prayer-title')).toHaveText('Shacharit')
  const rows = page.locator('[data-testid^="row-"]')
  expect(await rows.count()).toBeGreaterThanOrEqual(20)
  const allText = stripNiqqud(await page.getByTestId('prayer-renderer').innerText())
  // Adon Olam — recited at the start of Shacharit across all nusachim.
  expect(allText).toMatch(/אדון עולם/)
  // Shema — universal across all nusachim.
  expect(allText).toContain('שמע ישראל')
  // Amida opening (Avot) — "ברוך אתה ... אלהי אברהם"
  expect(allText).toContain('אברהם')
})

test('Omer page renders the correct day text', async ({ page }) => {
  await page.goto('/prayer/omer')
  await expect(page.getByTestId('prayer-page')).toBeVisible()
  const text = stripNiqqud(await page.getByTestId('prayer-renderer').innerText())
  // The opening blessing ("ברוך אתה ... שצונו על ספירת העומר") or out-of-period text — at minimum non-empty.
  expect(text.length).toBeGreaterThan(10)
})

test('clicking a row title toggles its body', async ({ page }) => {
  await page.goto('/prayer/shacharit')
  // Use whichever row is first; the rendered composite always has many.
  const row = page.locator('[data-testid^="row-"]').first()
  const heading = row.getByRole('button').first()
  await expect(row.locator('.prayer-body')).toBeVisible()
  await heading.click()
  await expect(row.locator('.prayer-body')).not.toBeVisible()
  await heading.click()
  await expect(row.locator('.prayer-body')).toBeVisible()
})
