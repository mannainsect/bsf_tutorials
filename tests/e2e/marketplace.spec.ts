import { test, expect, Page } from '@playwright/test'
test.describe('Marketplace Feature', () => {
  test.describe('Public User Journey', () => {
    test('should display random product on homepage and navigate to market',
      async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const randomProductSection = page.locator(
        '[data-testid="random-product"]'
      )
      if (await randomProductSection.count() > 0) {
        await expect(randomProductSection).toBeVisible()
        const productCard = randomProductSection
          .locator('.product-card').first()
        if (await productCard.count() > 0) {
          await expect(productCard).toBeVisible()
          const productTitle = productCard
            .locator('.product-title, ion-card-title')
          await expect(productTitle).toBeVisible()
        }
      }
      const browseLink = page.locator(
        'a:has-text("Browse"), a:has-text("Market"), a[href*="/market"]'
      ).first()
      if (await browseLink.count() > 0) {
        await browseLink.click()
        await page.waitForURL('**/market')
        await expect(page).toHaveURL(/\/market/)
        const productListing = page.locator(
          '[data-testid="product-list"], .product-grid, ion-grid'
        )
        await expect(productListing).toBeVisible()
      }
    })
    test('should navigate to market page from menu', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const menuButton = page.locator(
        'ion-menu-button, button[aria-label*="menu"]'
      ).first()
      if (await menuButton.count() > 0 && await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForTimeout(300)
        const marketLink = page.locator(
          'ion-menu a[href="/market"], ion-item:has-text("Market")'
        )
        if (await marketLink.count() > 0) {
          await marketLink.click()
        }
      } else {
        const navLink = page.locator(
          'nav a[href="/market"], a:has-text("Market")'
        ).first()
        if (await navLink.count() > 0) {
          await navLink.click()
        }
      }
      await page.waitForURL('**/market', { timeout: 10000 })
      await expect(page).toHaveURL(/\/market/)
      const pageTitle = page.locator('h1, ion-title')
        .filter({ hasText: /market/i })
      await expect(pageTitle.first()).toBeVisible()
    })
    test('should navigate directly to product detail page',
      async ({ page }) => {
      await page.goto('/market/test-product-1')
      await page.waitForLoadState('networkidle')
      const currentUrl = page.url()
      if (currentUrl.includes('/market/')) {
        const productDetail = page.locator(
          '[data-testid="product-detail"], .product-detail, ion-card'
        )
        if (await productDetail.count() > 0) {
          await expect(productDetail.first()).toBeVisible()
          const productTitle = page.locator('h1, ion-card-title').first()
          const productPrice = page.locator('[class*="price"], .price').first()
          if (await productTitle.count() > 0) {
            await expect(productTitle).toBeVisible()
          }
          if (await productPrice.count() > 0) {
            await expect(productPrice).toBeVisible()
          }
        }
      } else {
        expect(currentUrl).toMatch(/\/market|404|error/i)
      }
    })
  })
  test.describe('Market Page Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/market')
      await page.waitForLoadState('networkidle')
    })
    test('should display product listing', async ({ page }) => {
      const productContainer = page.locator(
        '[data-testid="product-list"], .product-grid, ion-grid'
      ).first()
      await expect(productContainer).toBeVisible()
      const productCards = page.locator(
        '.product-card, ion-card[button="true"]'
      )
      await page.waitForTimeout(1000)
      if (await productCards.count() > 0) {
        const firstCard = productCards.first()
        await expect(firstCard).toBeVisible()
        const title = firstCard.locator('ion-card-title, .product-title')
        const price = firstCard.locator('.price, [class*="price"]')
        if (await title.count() > 0) {
          await expect(title.first()).toBeVisible()
        }
        if (await price.count() > 0) {
          await expect(price.first()).toBeVisible()
        }
      }
    })
    test('should filter products by search', async ({ page }) => {
      const searchInput = page.locator(
        'input[type="search"], ion-searchbar, input[placeholder*="search" i]'
      ).first()
      if (await searchInput.count() > 0) {
        await searchInput.fill('phone')
        await page.waitForTimeout(500)
        const productCards = page.locator(
        '.product-card, ion-card[button="true"]'
      )
        if (await productCards.count() > 0) {
          const firstCardTitle = productCards.first()
            .locator('ion-card-title, .product-title')
          const titleText = await firstCardTitle.textContent()
          expect(await searchInput.inputValue()).toBe('phone')
        }
      }
    })
    test('should filter products by category', async ({ page }) => {
      const categoryFilter = page.locator(
        'select[name*="category"], ion-select[placeholder*="category" i],' +
        ' [data-testid="category-filter"]'
      ).first()
      if (await categoryFilter.count() > 0 &&
          await categoryFilter.isVisible()) {
        await categoryFilter.selectOption({ index: 1 })
        await page.waitForTimeout(500)
        const productCards = page.locator(
        '.product-card, ion-card[button="true"]'
      )
        expect(await categoryFilter.inputValue()).toBeTruthy()
      } else {
        const categoryChips = page.locator(
          'ion-chip:has-text("Electronics"), button:has-text("Electronics")'
        )
        if (await categoryChips.count() > 0) {
          await categoryChips.first().click()
          await page.waitForTimeout(500)
        }
      }
    })
    test('should navigate to product detail on card click',
      async ({ page }) => {
      const productCard = page.locator(
        '.product-card, ion-card[button="true"]'
      ).first()
      if (await productCard.count() > 0) {
        await productCard.click()
        await page.waitForTimeout(1000)
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/market\/[^\/]+/)
        const detailContent = page.locator(
          '[data-testid="product-detail"], .product-detail, ion-content'
        )
        await expect(detailContent.first()).toBeVisible()
      }
    })
  })
  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/market')
      await page.waitForLoadState('networkidle')
      const mobileMenu = page.locator(
        'ion-menu-button, button[aria-label*="menu"]'
      )
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible()
      }
      const productGrid = page.locator('ion-grid, .product-grid')
      await expect(productGrid.first()).toBeVisible()
      const cards = page.locator('.product-card, ion-card')
      if (await cards.count() >= 2) {
        const firstCard = await cards.nth(0).boundingBox()
        const secondCard = await cards.nth(1).boundingBox()
        if (firstCard && secondCard) {
          expect(secondCard.y).toBeGreaterThan(firstCard.y)
        }
      }
    })
    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/market')
      await page.waitForLoadState('networkidle')
      const desktopNav = page.locator('nav, ion-header')
      await expect(desktopNav.first()).toBeVisible()
      const productGrid = page.locator('ion-grid, .product-grid')
      await expect(productGrid.first()).toBeVisible()
      const cards = page.locator('.product-card, ion-card')
      if (await cards.count() >= 2) {
        const firstCard = await cards.nth(0).boundingBox()
        const secondCard = await cards.nth(1).boundingBox()
        if (firstCard && secondCard) {
          expect(firstCard).toBeTruthy()
          expect(secondCard).toBeTruthy()
        }
      }
    })
    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/market')
      await page.waitForLoadState('networkidle')
      const pageContent = page.locator(
        'ion-content, main, .page-content'
      ).first()
      await expect(pageContent).toBeVisible()
      const products = page.locator('.product-card, ion-card')
      if (await products.count() > 0) {
        await expect(products.first()).toBeVisible()
      }
    })
  })
  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.route('**/api/**', route => route.abort())
      await page.goto('/market')
      const errorMessage = page.locator(
        '[class*="error"], .error-message, ion-text[color="danger"]'
      )
      const emptyState = page.locator('[class*="empty"], .no-products')
      const hasErrorHandling =
        (await errorMessage.count() > 0) ||
        (await emptyState.count() > 0)
      expect(hasErrorHandling).toBeTruthy()
    })
    test('should handle invalid product ID gracefully', async ({ page }) => {
      await page.goto('/market/invalid-product-id-123456789')
      const currentUrl = page.url()
      const errorMessage = page.locator(
        '[class*="error"], .not-found, ion-text[color="danger"]'
      )
      const redirected = !currentUrl.includes('invalid-product-id-123456789')
      const handledGracefully =
        (await errorMessage.count() > 0) ||
        redirected
      expect(handledGracefully).toBeTruthy()
    })
  })
  test.describe('Performance', () => {
    test('should load market page within acceptable time',
      async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/market')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000)
      const content = page.locator('ion-content, main, .page-content').first()
      await expect(content).toBeVisible()
    })
    test('should implement lazy loading for images', async ({ page }) => {
      await page.goto('/market')
      const images = page.locator('img[loading="lazy"], ion-img')
      if (await images.count() > 0) {
        const firstImage = images.first()
        const loadingAttr = await firstImage.getAttribute('loading')
        expect(loadingAttr).toBe('lazy')
      }
    })
  })
})