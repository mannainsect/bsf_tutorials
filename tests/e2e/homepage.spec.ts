import { test, expect } from '@playwright/test'
test.describe('Homepage', () => {
  test('should navigate to homepage and verify title', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/BSF/)
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('BSF')
  })
  test('should display navigation menu', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
  })
  test('should have search functionality visible', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
  })
})