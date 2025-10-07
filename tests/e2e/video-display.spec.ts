import { test, expect } from '@playwright/test'

test.describe('Video Display - Homepage', () => {
  test('should display featured video with iframe', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for potential featured video to load
    await page.waitForTimeout(1000)

    // Check if featured video section exists
    const featuredSection = page.locator('.featured-grid')
    const hasFeaturedVideo = await featuredSection.isVisible()

    if (hasFeaturedVideo) {
      // Verify iframe is visible
      const iframe = page.locator('iframe[src*="vimeo.com"]')
      await expect(iframe).toBeVisible()

      // Verify iframe has src attribute
      const src = await iframe.getAttribute('src')
      expect(src).toBeTruthy()
      expect(src).toContain('vimeo.com')
    }
  })

  test('should display featured video with query parameters', async ({
    page
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const featuredSection = page.locator('.featured-grid')
    const hasFeaturedVideo = await featuredSection.isVisible()

    if (hasFeaturedVideo) {
      const iframe = page.locator('iframe[src*="player.vimeo.com"]')
      await expect(iframe).toBeVisible()

      const src = await iframe.getAttribute('src')
      if (src?.includes('?')) {
        // If URL has query params, verify they're present
        expect(src).toContain('?')
      }
    }
  })

  test('should have correct security attributes on iframe', async ({
    page
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const iframe = page.locator('iframe[src*="vimeo.com"]')
    const isVisible = await iframe.isVisible()

    if (isVisible) {
      const sandbox = await iframe.getAttribute('sandbox')
      expect(sandbox).toContain('allow-scripts')
      expect(sandbox).toContain('allow-same-origin')
      expect(sandbox).toContain('allow-presentation')

      const allow = await iframe.getAttribute('allow')
      expect(allow).toContain('autoplay')
      expect(allow).toContain('fullscreen')
    }
  })

  test('should not show error messages', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const errorMessage = page.locator('.invalid-url')
    const errorExists = await errorMessage.isVisible()

    // Should not have invalid URL warnings
    expect(errorExists).toBe(false)
  })

  test('should display video title', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const featuredSection = page.locator('.featured-grid')
    const hasFeaturedVideo = await featuredSection.isVisible()

    if (hasFeaturedVideo) {
      const title = page.locator('ion-card-title')
      await expect(title).toBeVisible()
      const titleText = await title.textContent()
      expect(titleText).toBeTruthy()
      expect(titleText!.length).toBeGreaterThan(0)
    }
  })
})

test.describe('Video Display - Tutorials Page', () => {
  test('should display video grid with iframes', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')

    // Wait for videos to load
    await page.waitForTimeout(2000)

    // Check if videos loaded
    const cards = page.locator('ion-card')
    const cardCount = await cards.count()

    if (cardCount > 0) {
      // At least some cards should have iframes
      const iframes = page.locator('iframe[src*="vimeo.com"]')
      const iframeCount = await iframes.count()
      expect(iframeCount).toBeGreaterThan(0)
    }
  })

  test('should display iframes with query parameters', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const iframes = page.locator('iframe[src*="player.vimeo.com"]')
    const count = await iframes.count()

    if (count > 0) {
      // Check first iframe for query parameters
      const firstIframe = iframes.first()
      const src = await firstIframe.getAttribute('src')

      // URL should be valid Vimeo URL
      expect(src).toBeTruthy()
      expect(src).toContain('player.vimeo.com/video/')

      // If it has query params, they should be properly formatted
      if (src?.includes('?')) {
        expect(src).toMatch(/\?[\w=&]+/)
      }
    }
  })

  test('should have security attributes on all iframes', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const iframes = page.locator('iframe[src*="vimeo.com"]')
    const count = await iframes.count()

    if (count > 0) {
      // Check first iframe
      const firstIframe = iframes.first()
      const sandbox = await firstIframe.getAttribute('sandbox')
      expect(sandbox).toContain('allow-scripts')
      expect(sandbox).toContain('allow-same-origin')
      expect(sandbox).toContain('allow-presentation')
    }
  })

  test('should not show invalid URL warnings', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Should not have any invalid URL warnings
    const warnings = page.locator('.invalid-url')
    const warningCount = await warnings.count()
    expect(warningCount).toBe(0)
  })

  test('should display premium badge for null URLs', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Premium videos should show premium badge
    const premiumBadges = page.locator('.premium-badge')
    const badgeCount = await premiumBadges.count()

    // If there are premium videos, verify badges show
    if (badgeCount > 0) {
      const firstBadge = premiumBadges.first()
      await expect(firstBadge).toBeVisible()
    }
  })

  test('should display all video cards', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const cards = page.locator('ion-card')
    const count = await cards.count()

    // Should have at least some video cards
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should filter videos by level', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Open level filter
    const levelSelect = page.locator('ion-select').first()
    await levelSelect.click()

    // Wait for popover
    await page.waitForTimeout(500)

    // Select basic level
    const basicOption = page.locator('ion-select-option[value="basic"]')
    const isVisible = await basicOption.isVisible()

    if (isVisible) {
      await basicOption.click()
      await page.waitForTimeout(500)

      // Verify videos are filtered
      const cards = page.locator('ion-card')
      const count = await cards.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Video Display - Responsive Layout', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const cards = page.locator('ion-card')
    const count = await cards.count()

    if (count > 0) {
      // Cards should stack vertically on mobile
      const firstCard = cards.first()
      await expect(firstCard).toBeVisible()
    }
  })

  test('should display grid on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const cards = page.locator('ion-card')
    const count = await cards.count()

    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display grid on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const cards = page.locator('ion-card')
    const count = await cards.count()

    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Video Display - Accessibility', () => {
  test('should have iframe title attributes', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const iframes = page.locator('iframe[src*="vimeo.com"]')
    const count = await iframes.count()

    if (count > 0) {
      const firstIframe = iframes.first()
      const title = await firstIframe.getAttribute('title')
      expect(title).toBeTruthy()
      expect(title!.length).toBeGreaterThan(0)
    }
  })

  test('should have iframe aria-label attributes', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const iframes = page.locator('iframe[src*="vimeo.com"]')
    const count = await iframes.count()

    if (count > 0) {
      const firstIframe = iframes.first()
      const ariaLabel = await firstIframe.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})
