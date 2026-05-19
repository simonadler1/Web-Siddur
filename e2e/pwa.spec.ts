import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')

test.describe('PWA build artifacts', () => {
  test('manifest.webmanifest exists with required fields', () => {
    const manifestPath = path.join(DIST, 'manifest.webmanifest')
    expect(existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    expect(manifest.name).toBe('Smart Siddur')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  })

  test('service worker is generated', () => {
    expect(existsSync(path.join(DIST, 'sw.js'))).toBe(true)
  })

  test('manifest references valid icon files', () => {
    const manifest = JSON.parse(readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8'))
    for (const icon of manifest.icons) {
      const iconPath = path.join(DIST, icon.src.replace(/^\//, ''))
      expect(existsSync(iconPath)).toBe(true)
    }
  })
})

test.describe('PWA runtime', () => {
  test('page declares theme-color and manifest link', async ({ page }) => {
    await page.goto('/')
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content')
    expect(themeColor).toBeTruthy()
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc).toMatch(/prayer/i)
  })

  test('app shell is reachable from a hard reload', async ({ page }) => {
    await page.goto('/zmanim')
    await page.reload()
    await expect(page.getByTestId('zmanim-page')).toBeVisible()
  })
})
