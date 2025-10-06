import { test, expect } from '@playwright/test'
test.describe('Homepage', () => {
  test('should display hero content with correct title', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toHaveText(
      /Launch secure account experiences faster/i
    )
  })

  test('should show authentication actions', async ({ page }) => {
    await page.goto('/')
    const registerButton = page.locator(
      'a[href="/register"], button:has-text("Get Started")'
    )
    const loginButton = page.locator(
      'a[href="/login"], button:has-text("Sign In")'
    )
    await expect(registerButton).toBeVisible()
    await expect(loginButton).toBeVisible()
  })
})
