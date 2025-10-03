import { describe, it, expect } from 'vitest'
import type { User } from '~/shared/types/models/User'

describe('User type with onboarding_email_sent field', () => {
  it('should handle user with onboarding_email_sent field', () => {
    const user: User = {
      _id: 'user-123',
      email: 'test@example.com',
      balance: 100,
      account_type: 'standard',
      onboarding_email_sent: '2025-10-01T12:00:00Z',
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    expect(user).toBeDefined()
    expect(user.onboarding_email_sent).toBe('2025-10-01T12:00:00Z')
    expect(typeof user.onboarding_email_sent).toBe('string')
  })

  it('should handle user without onboarding_email_sent (backward compat)',
  () => {
    const user: User = {
      _id: 'user-456',
      email: 'legacy@example.com',
      balance: 50,
      account_type: 'basic',
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    expect(user).toBeDefined()
    expect(user.onboarding_email_sent).toBeUndefined()
  })

  it('should handle onboarding_email_sent as null', () => {
    const user: User = {
      _id: 'user-789',
      email: 'nulltest@example.com',
      balance: 75,
      account_type: 'premium',
      onboarding_email_sent: null,
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    expect(user).toBeDefined()
    expect(user.onboarding_email_sent).toBeNull()
  })

  it('should preserve other user fields with onboarding_email_sent',
  () => {
    const user: User = {
      _id: 'user-complete',
      email: 'complete@example.com',
      name: 'John Doe',
      country: 'USA',
      city: 'New York',
      balance: 200,
      account_type: 'enterprise',
      superadmin: false,
      onboarding_email_sent: '2025-09-15T08:30:00Z',
      share_code: 'SHARE123',
      purchased_products: [],
      subscription_valid_until: '2027-01-01T00:00:00Z',
      account_info: {
        subscription_tier: 'gold',
        trial_end_date: '2025-12-31T23:59:59Z'
      }
    }

    expect(user).toBeDefined()
    expect(user._id).toBe('user-complete')
    expect(user.email).toBe('complete@example.com')
    expect(user.name).toBe('John Doe')
    expect(user.country).toBe('USA')
    expect(user.city).toBe('New York')
    expect(user.balance).toBe(200)
    expect(user.account_type).toBe('enterprise')
    expect(user.superadmin).toBe(false)
    expect(user.onboarding_email_sent).toBe('2025-09-15T08:30:00Z')
    expect(user.share_code).toBe('SHARE123')
    expect(user.account_info?.subscription_tier).toBe('gold')
  })

  it('should allow type checking with optional field', () => {
    const userWithEmail: User = {
      _id: 'user-opt-1',
      email: 'opt1@example.com',
      balance: 100,
      account_type: 'standard',
      onboarding_email_sent: '2025-10-01T00:00:00Z',
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    const userWithoutEmail: User = {
      _id: 'user-opt-2',
      email: 'opt2@example.com',
      balance: 100,
      account_type: 'standard',
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    // Both should compile without errors
    expect(userWithEmail.onboarding_email_sent).toBeDefined()
    expect(userWithoutEmail.onboarding_email_sent).toBeUndefined()
  })

  it('should handle date string formats correctly', () => {
    const isoUser: User = {
      _id: 'user-iso',
      email: 'iso@example.com',
      balance: 100,
      account_type: 'standard',
      onboarding_email_sent: '2025-10-01T12:34:56.789Z',
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    const simpleUser: User = {
      _id: 'user-simple',
      email: 'simple@example.com',
      balance: 100,
      account_type: 'standard',
      onboarding_email_sent: '2025-10-01T12:00:00Z',
      purchased_products: [],
      subscription_valid_until: '2026-01-01T00:00:00Z'
    }

    expect(isoUser.onboarding_email_sent).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(simpleUser.onboarding_email_sent).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
