import { test, expect, type Page } from '@playwright/test'

const VIEWPORTS = [
  { name: 'mobile-sm', width: 320, height: 568 }, // iPhone SE
  { name: 'mobile', width: 390, height: 844 }, // iPhone 14
  { name: 'tablet', width: 768, height: 1024 }, // iPad portrait
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

const ROUTES = [
  '/',
  '/zmanim',
  '/prayer/shacharit',
  '/prayer/mincha',
  '/prayer/omer',
  '/prayer/mussaf',
  '/locations',
  '/settings',
  '/compass',
]

/** Pixel tolerance for sub-pixel rounding differences in scrollWidth comparisons. */
const TOLERANCE = 1

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate((tol) => {
    const doc = document.documentElement
    return {
      docScrollWidth: doc.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowingDoc: doc.scrollWidth > doc.clientWidth + tol,
      overflowingBody: document.body.scrollWidth > doc.clientWidth + tol,
    }
  }, TOLERANCE)
  expect(
    overflow.overflowingDoc || overflow.overflowingBody,
    `expected no horizontal scroll: docW=${overflow.docScrollWidth} bodyW=${overflow.bodyScrollWidth} clientW=${overflow.clientWidth}`,
  ).toBe(false)
}

async function findOverflowingElements(page: Page): Promise<string[]> {
  // Walk every element; return a list of selectors whose content overflows
  // their own client box horizontally. Filter out elements that *should* scroll
  // (textareas, code blocks, anything with overflow:auto/scroll on x).
  return page.evaluate((tol) => {
    const offenders: string[] = []
    const walk = (el: Element) => {
      if (!(el instanceof HTMLElement)) return
      const style = getComputedStyle(el)
      const xOverflowOk =
        style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden'
      if (!xOverflowOk && el.scrollWidth > el.clientWidth + tol) {
        const id =
          el.getAttribute('data-testid') ||
          el.id ||
          el.tagName.toLowerCase() + (el.className ? '.' + (el.className as string).split(/\s+/).slice(0, 2).join('.') : '')
        offenders.push(
          `${id} (scrollWidth=${el.scrollWidth}, clientWidth=${el.clientWidth})`,
        )
      }
      for (const child of el.children) walk(child)
    }
    walk(document.body)
    return offenders
  }, TOLERANCE)
}

async function assertNoCoveredHeading(page: Page) {
  // The main <h1> on each page should be fully visible — not clipped by an
  // overlapping fixed nav, sidebar, etc.
  const headings = page.locator('main h1')
  const count = await headings.count()
  if (count === 0) return
  const h1 = headings.first()
  await expect(h1).toBeVisible()
  const box = await h1.boundingBox()
  if (!box) return

  // Find the nav's bottom edge — h1 must be entirely below it.
  const navBottom = await page.evaluate(() => {
    const nav = document.querySelector('nav')
    if (!nav) return 0
    const rect = nav.getBoundingClientRect()
    return rect.bottom
  })
  expect(
    box.y >= navBottom - TOLERANCE,
    `h1 top (${box.y}) overlaps nav bottom (${navBottom})`,
  ).toBe(true)
}

async function assertPrimaryContentVisible(page: Page, route: string) {
  // Each page's primary test surface should still be visible at every viewport.
  const map: Record<string, string> = {
    '/': 'data-stats',
    '/zmanim': 'zmanim-table',
    '/prayer/shacharit': 'prayer-renderer',
    '/prayer/mincha': 'prayer-renderer',
    '/prayer/omer': 'prayer-renderer',
    '/prayer/mussaf': 'prayer-renderer',
    '/locations': 'current-location',
    '/settings': 'nusach-select',
    '/compass': 'compass-bearing',
  }
  const testid = map[route]
  if (!testid) return
  await expect(page.getByTestId(testid)).toBeVisible()
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    for (const route of ROUTES) {
      test(`${route} — no horizontal overflow, no element overflow, primary content visible`, async ({
        page,
      }) => {
        await page.goto(route)
        // Give layout a tick to settle (no animations to wait on, but be safe).
        await page.waitForLoadState('networkidle').catch(() => {})
        await page.waitForTimeout(50)

        await assertNoHorizontalOverflow(page)

        const offenders = await findOverflowingElements(page)
        // The prayer body legitimately may have very long lines that the browser
        // breaks, but it should never produce horizontal scroll *of itself* because
        // we control its width. If any element here overflows, fail.
        expect(offenders, `Elements overflowing their client box:\n  ${offenders.join('\n  ')}`).toEqual([])

        await assertPrimaryContentVisible(page, route)
        await assertNoCoveredHeading(page)
      })
    }
  })
}
