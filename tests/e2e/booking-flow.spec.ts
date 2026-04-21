import { test, expect } from '@playwright/test'
import Redis from 'ioredis'

/**
 * Full end-to-end booking flow — homepage to payment confirmation.
 *
 * Requires:
 * - Dev server running on localhost:3000
 * - PostgreSQL and Redis running
 * - Stripe test keys in .env
 * - Seeded database (4 properties)
 *
 * Uses Stripe test card 4242 4242 4242 4242.
 */

// Dates far enough in the future to avoid conflicts
const checkIn = '2026-06-15'
const checkOut = '2026-06-17'

// Clear rate limit and lock keys before each test to avoid stale state
test.beforeEach(async () => {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
  const rlKeys = await redis.keys('rl:*')
  const lockKeys = await redis.keys('lock:*')
  const allKeys = [...rlKeys, ...lockKeys]
  if (allKeys.length) await redis.del(...allKeys)
  await redis.quit()
})

test.describe('Booking Flow', () => {
  test('homepage shows all 4 properties', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Book Direct')
    await expect(page.getByText("Georgia's Cozy Rooms #1")).toBeVisible()
    await expect(page.getByText("Georgia's Cozy Rooms #2")).toBeVisible()
    await expect(page.getByText("Georgia's Cozy Rooms #3")).toBeVisible()
    await expect(page.getByText("Georgia's Cozy Rooms #4")).toBeVisible()
  })

  test('property detail page loads with images', async ({ page }) => {
    await page.goto('/properties/georgias-cozy-rooms-1')
    await expect(page.getByRole('heading', { name: "Georgia's Cozy Rooms #1" })).toBeVisible()
    // Should have property images (next/image rewrites src to /_next/image?url=...)
    await expect(page.locator('img[alt*="Georgia"]').first()).toBeVisible()
  })

  test('full booking flow with Stripe payment', async ({ page }) => {
    test.setTimeout(180_000)
    // Step 1: Go directly to the booking page with dates
    // Use property 3 (€65/night + €25 cleaning) with dates far in the future
    await page.goto(
      '/book/georgias-cozy-rooms-3?checkIn=2026-12-01&checkOut=2026-12-03',
      { waitUntil: 'domcontentloaded' }
    )

    // Wait for availability check and price breakdown to load
    await expect(page.getByText('Review Your Stay')).toBeVisible()
    await expect(page.getByText('Total')).toBeVisible({ timeout: 15_000 })

    // Verify price breakdown (property 3: €65/night x 2 nights + €25 cleaning = €155)
    await expect(page.getByText('€155.00')).toBeVisible()

    // Click Continue to go to step 2
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2: Fill guest details
    await expect(page.getByText('Guest Details')).toBeVisible()

    await page.fill('#guestName', 'E2E Test Guest')
    await page.fill('#guestEmail', 'e2e-test@example.com')
    await page.fill('#guestPhone', '+30 2510 123456')
    await page.fill('#guestCount', '2')
    await page.fill('#guestIdNumber', 'AB1234567')
    await page.selectOption('#guestNationality', 'GR')
    await page.selectOption('#guestResidenceCountry', 'GR')
    await page.fill('#guestDateOfBirth', '1990-05-15')

    // Submit guest details — creates booking and gets Stripe clientSecret
    await page.getByRole('button', { name: 'Continue to Payment' }).click()

    // Step 3: Stripe payment
    await expect(page.getByText('Payment')).toBeVisible({ timeout: 15_000 })

    // Stripe PaymentElement renders inside iframes.
    // Find the correct Stripe frame by iterating all frames for the one with "Card" text.
    let stripeFrame = null
    for (let attempt = 0; attempt < 20; attempt++) {
      for (const frame of page.frames()) {
        if (!frame.url().includes('stripe.com')) continue
        const hasCard = await frame.locator('text=Card').isVisible().catch(() => false)
        if (hasCard) {
          stripeFrame = frame
          break
        }
      }
      if (stripeFrame) break
      await page.waitForTimeout(1000)
    }

    expect(stripeFrame).not.toBeNull()

    // Click "Card" to expand card payment fields
    await stripeFrame!.locator('text=Card').first().click()
    await stripeFrame!.locator('#payment-numberInput').waitFor({ state: 'visible', timeout: 15_000 })

    // Fill card details with Stripe test card
    await stripeFrame!.locator('#payment-numberInput').fill('4242424242424242')
    await stripeFrame!.locator('#payment-expiryInput').fill('1230')
    await stripeFrame!.locator('#payment-cvcInput').fill('123')

    // Click Pay Now
    await page.getByRole('button', { name: /Pay Now/i }).click()

    // Wait for redirect to confirmation page (Stripe processes then redirects)
    await page.waitForURL(/\/confirmation\/KVL-/, { timeout: 60_000 })

    // Verify confirmation page
    await expect(page.getByText('Booking Confirmed')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText("Georgia's Cozy Rooms #3")).toBeVisible()
    await expect(page.getByText('€155.00')).toBeVisible()
    await expect(page.getByText('2026-12-01')).toBeVisible()
    await expect(page.getByText('2026-12-03')).toBeVisible()
  })

  test('health check is healthy', async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.checks.database.status).toBe('pass')
    expect(data.checks.redis.status).toBe('pass')
    expect(data.checks.stripe.status).toBe('pass')
  })
})
