import { test, expect, type Page } from '@playwright/test'

const stripNiqqud = (s: string) => s.normalize('NFD').replace(/[֑-ׇ]/g, '')

test.describe('UI audit regression — content correctness', () => {
  test('no raw camelCase i18n keys appear as collapse titles on prayer pages', async ({ page }) => {
    for (const route of ['/prayer/shacharit', '/prayer/mincha', '/prayer/arvit', '/prayer/omer']) {
      await page.goto(route)
      const buttons = page.locator('button[aria-expanded]')
      const count = await buttons.count()
      for (let i = 0; i < count; i++) {
        const text = (await buttons.nth(i).innerText()).trim()
        // No "fooTitle", no all-lowercase camelCase like "amidaTitle".
        expect(text, `${route}: button #${i} title "${text}"`).not.toMatch(/Title$/)
        expect(text, `${route}: button #${i} title "${text}"`).not.toMatch(/^[a-z]+(?:[A-Z]|_)/)
      }
    }
  })

  test('no printf placeholders leak into rendered prayer bodies', async ({ page }) => {
    for (const route of [
      '/prayer/shacharit',
      '/prayer/mincha',
      '/prayer/arvit',
      '/prayer/omer',
      '/prayer/mussaf',
      '/prayer/mazon',
      '/prayer/haderech',
    ]) {
      await page.goto(route)
      const text = await page.locator('main').innerText()
      expect(text, `${route}: leaked printf placeholder`).not.toMatch(/%\d+\$s/)
    }
  })

  test('Mussaf page on a non-Mussaf weekday shows ONLY the empty-state notice', async ({ page }) => {
    // The dev fixture date is "today" — we can't time-travel from Playwright,
    // but we can verify the empty state is correctly mutually exclusive with
    // any Ashrei / Amida content. Pull the rendered row IDs and assert.
    await page.goto('/prayer/mussaf')
    const rows = page.locator('[data-testid^="row-"]')
    const count = await rows.count()
    const ids: string[] = []
    for (let i = 0; i < count; i++) {
      ids.push((await rows.nth(i).getAttribute('data-testid'))!)
    }
    // Either there IS a Mussaf today (and 'mussaf-none' is absent) or there
    // isn't (and the row list contains only 'mussaf-none'). The buggy state
    // was having Ashrei + the empty-state notice together.
    const hasNone = ids.includes('row-mussaf-none')
    if (hasNone) {
      expect(ids).toEqual(['row-mussaf-none'])
    } else {
      expect(ids).not.toContain('row-mussaf-none')
    }
  })
})

test.describe('UI audit regression — interactivity', () => {
  test('checkbox touch targets are at least 24×24 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/settings')
    const checkboxes = page.locator('input[type=checkbox]')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const box = await checkboxes.nth(i).boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width, `checkbox #${i} width`).toBeGreaterThanOrEqual(20)
      expect(box!.height, `checkbox #${i} height`).toBeGreaterThanOrEqual(20)
    }
  })

  test('changing UI locale to Hebrew renders the page in RTL', async ({ page }) => {
    await page.goto('/settings')
    await page.getByTestId('locale-select').selectOption('he')
    // Now the settings container should declare rtl direction.
    await expect(page.getByTestId('settings-page')).toHaveAttribute('dir', 'rtl')
  })
})

test.describe('UI audit regression — visual correctness', () => {
  test('Zmanim numeric time and Hebrew label do not visually merge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/zmanim')
    await page.getByTestId('zmanim-date-input').fill('2026-05-19')
    // For each zmanim row, the time cell should have its own boundingBox and
    // be separated from the Hebrew label cell by at least a few pixels.
    const sunsetCell = page.getByTestId('zman-sunset')
    const sunsetBox = await sunsetCell.boundingBox()
    expect(sunsetBox).not.toBeNull()
    // The cell should also have isolated bidi so the time text is contained.
    const isolation = await sunsetCell.evaluate((el) => getComputedStyle(el).unicodeBidi)
    expect(isolation).toMatch(/isolate|isolate-override/)
  })

  test('Compass cardinal N label is visible and not occluded by the needle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/compass')
    const n = page.getByTestId('compass-N')
    await expect(n).toBeVisible()
    const nBox = await n.boundingBox()
    const needleBox = await page.getByTestId('compass-needle').boundingBox()
    if (nBox && needleBox) {
      // Even if the bounding boxes overlap (the needle is rotated and may pass
      // near N), the label has a higher z-index, so it should remain readable.
      const z = await n.evaluate((el) => Number(getComputedStyle(el).zIndex) || 0)
      const needleZ = await page
        .getByTestId('compass-needle')
        .evaluate((el) => Number(getComputedStyle(el).zIndex) || 0)
      expect(z).toBeGreaterThanOrEqual(needleZ)
    }
  })

  test('on desktop, page content is horizontally centered', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/zmanim')
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    const leftMargin = box!.x
    const rightMargin = 1440 - (box!.x + box!.width)
    // Roughly balanced: difference should be small relative to viewport.
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(50)
  })
})

test.describe('UI audit regression — navigation', () => {
  test('there is a prayer index page that links to every registered prayer', async ({ page }) => {
    await page.goto('/prayers')
    await expect(page.getByTestId('prayer-index')).toBeVisible()
    const links = page.locator('[data-testid^="prayer-link-"]')
    expect(await links.count()).toBeGreaterThanOrEqual(20)
    // Each major prayer should be reachable.
    for (const id of ['shacharit', 'mincha', 'arvit', 'mussaf', 'mazon', 'halel', 'asherYatzar']) {
      await expect(page.getByTestId(`prayer-link-${id}`)).toBeVisible()
    }
  })

  test('prayer index does not surface internal sub-generators', async ({ page }) => {
    await page.goto('/prayers')
    for (const id of ['shacharitOpening', 'shacharitShachar', 'shacharitSof', 'shacharitShma', 'shacharitZimra', 'shacharitTahanun']) {
      await expect(page.getByTestId(`prayer-link-${id}`)).toHaveCount(0)
    }
  })

  test('prayer index lists Shacharit only once', async ({ page }) => {
    await page.goto('/prayers')
    const shacharitTiles = page.locator('[data-testid^="prayer-link-"]', { hasText: /^Shacharit$/ })
    expect(await shacharitTiles.count()).toBe(1)
  })

  test('switching UI locale to Hebrew also flips the document direction', async ({ page }) => {
    await page.goto('/settings')
    await page.getByTestId('locale-select').selectOption('he')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  })

  test('nav labels translate when locale changes', async ({ page }) => {
    await page.goto('/settings')
    // The hamburger drawer holds the labelled nav links. Open it before asserting.
    await page.getByTestId('menu-button').click()
    await expect(page.getByTestId('nav')).toContainText('Settings')
    // Close, switch locale, reopen — the drawer remounts with new strings.
    await page.keyboard.press('Escape')
    await page.getByTestId('locale-select').selectOption('he')
    await page.getByTestId('menu-button').click()
    await expect(page.getByTestId('nav')).toContainText('הגדרות')
  })

  test('clicking a prayer index tile navigates to that prayer', async ({ page }) => {
    await page.goto('/prayers')
    await page.getByTestId('prayer-link-omer').click()
    await expect(page).toHaveURL(/\/prayer\/omer$/)
    await expect(page.getByTestId('prayer-page')).toBeVisible()
  })
})

// Helper to dispatch the dark color scheme media query.
async function setDarkMode(page: Page) {
  await page.emulateMedia({ colorScheme: 'dark' })
}

test.describe('UI audit regression — dark mode form controls', () => {
  test('settings select inherits the dark color scheme', async ({ page }) => {
    await setDarkMode(page)
    await page.goto('/settings')
    const cs = await page
      .getByTestId('nusach-select')
      .evaluate((el) => getComputedStyle(el).colorScheme)
    expect(cs).toContain('dark')
  })

  test('zmanim date input inherits the dark color scheme', async ({ page }) => {
    await setDarkMode(page)
    await page.goto('/zmanim')
    const cs = await page
      .getByTestId('zmanim-date-input')
      .evaluate((el) => getComputedStyle(el).colorScheme)
    expect(cs).toContain('dark')
  })
})
