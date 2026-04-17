import { test, expect } from '@playwright/test'

test.describe('Password Reset Flow', () => {
  test('happy path: request and confirm resets password', async ({ page }) => {
    // Stub request endpoint - always returns success
    await page.route('**/auth/reset-password', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Email sent' })
        })
      }
      return route.continue()
    })

    // Stub confirm endpoint
    await page.route('**/auth/reset-password/confirm', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Password reset' })
        })
      }
      return route.continue()
    })

    // --- Request page ---
    await page.goto('/auth/reset-password')
    await page.waitForLoadState('networkidle')

    // Fill email and submit
    const emailInput = page.locator('ion-input[type="email"]')
    await emailInput.locator('input').fill('user@example.com')
    await page.locator('ion-button[type="submit"]').click()

    // Assert generic success message (does not reveal account existence)
    await expect(page.getByText(/if an account exists/i)).toBeVisible()

    // --- Confirm page ---
    await page.goto('/auth/reset-password/confirm?token=abc123')
    await page.waitForLoadState('networkidle')

    // Fill both password fields
    const passwordInputs = page.locator('ion-input[type="password"]')
    await passwordInputs.nth(0).locator('input').fill('NewSecurePass1')
    await passwordInputs.nth(1).locator('input').fill('NewSecurePass1')

    await page.locator('ion-button[type="submit"]').click()

    // Should redirect to login after successful reset
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('missing token shows error and hides form', async ({ page }) => {
    await page.goto('/auth/reset-password/confirm')
    await page.waitForLoadState('networkidle')

    // Assert invalid/missing token error message
    await expect(page.getByText(/invalid.*token|missing.*token/i)).toBeVisible()

    // Confirm form should NOT be rendered (no password inputs)
    await expect(page.locator('ion-input[type="password"]')).toHaveCount(0)

    // Submit button from confirm form should not exist
    await expect(page.locator('form ion-button[type="submit"]')).toHaveCount(0)
  })

  test('backend 400 shows error and stays on page', async ({ page }) => {
    // Stub confirm endpoint to return 400
    await page.route('**/auth/reset-password/confirm', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Token expired' })
        })
      }
      return route.continue()
    })

    await page.goto('/auth/reset-password/confirm?token=expired')
    await page.waitForLoadState('networkidle')

    // Fill both password fields
    const passwordInputs = page.locator('ion-input[type="password"]')
    await passwordInputs.nth(0).locator('input').fill('NewSecurePass1')
    await passwordInputs.nth(1).locator('input').fill('NewSecurePass1')

    const confirmResponse = page.waitForResponse(
      response =>
        response.url().includes('/reset-password/confirm') && response.request().method() === 'POST'
    )
    await page.locator('ion-button[type="submit"]').click()
    await confirmResponse

    // Should stay on confirm page (NOT redirected to /login)
    await expect(page).toHaveURL(/\/confirm/)

    // Should show error toast
    await expect(page.locator('ion-toast')).toBeVisible({ timeout: 5000 })

    // Should NOT have navigated to login
    expect(page.url()).not.toMatch(/\/login/)
  })
})
