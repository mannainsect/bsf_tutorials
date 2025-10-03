import { describe, it, expect } from 'vitest'
import {
  isAuthenticatedWanted,
  isWantedPublicDetail,
  isWantedAuthenticated
} from '../../../../shared/types/models/MarketplaceWanted'
import type {
  WantedPublicListing,
  Wanted,
  WantedPublicDetail,
  WantedAuthenticated
} from '../../../../shared/types/models/MarketplaceWanted'
describe('MarketplaceWanted Type Guards', () => {
  describe('isAuthenticatedWanted', () => {
    it('should return true for wanted with user_id and contact_email', () => {
      const authenticatedWanted: Wanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        user_id: 'user-1',
        contact_email: 'contact@test.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(isAuthenticatedWanted(authenticatedWanted)).toBe(true)
    })
    it('should return false for public wanted listing', () => {
      const publicWanted: WantedPublicListing = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(isAuthenticatedWanted(publicWanted)).toBe(false)
    })
    it('should return false for wanted with only user_id', () => {
      const partialWanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      expect(isAuthenticatedWanted(partialWanted)).toBe(false)
    })
    it('should return false for wanted with only contact_email', () => {
      const partialWanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        contact_email: 'contact@test.com',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      expect(isAuthenticatedWanted(partialWanted)).toBe(false)
    })
  })
  describe('isWantedPublicDetail', () => {
    it('should return true for wanted with company_id and active', () => {
      const publicDetail: WantedPublicDetail = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(isWantedPublicDetail(publicDetail)).toBe(true)
    })
    it('should return false for basic public listing', () => {
      const publicListing: WantedPublicListing = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(isWantedPublicDetail(publicListing)).toBe(false)
    })
    it('should return false for wanted with only company_id', () => {
      const partialWanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      expect(isWantedPublicDetail(partialWanted)).toBe(false)
    })
    it('should return false for wanted with only active', () => {
      const partialWanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      expect(isWantedPublicDetail(partialWanted)).toBe(false)
    })
    it('should return true even when active is false', () => {
      const inactiveDetail: WantedPublicDetail = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        active: false,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(isWantedPublicDetail(inactiveDetail)).toBe(true)
    })
  })
  describe('isWantedAuthenticated', () => {
    it('should return false (not yet implemented)', () => {
      const authenticatedDetail: WantedAuthenticated = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        user_id: 'user-1',
        contact_email: 'contact@test.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      // isWantedAuthenticated always returns false until backend provides auth fields
      expect(isWantedAuthenticated(authenticatedDetail)).toBe(false)
    })
    it('should return false for public detail without auth fields', () => {
      const publicDetail: WantedPublicDetail = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(isWantedAuthenticated(publicDetail)).toBe(false)
    })
    it('should return false for detail with only user_id', () => {
      const partialWanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        user_id: 'user-1',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      expect(isWantedAuthenticated(partialWanted)).toBe(false)
    })
    it('should return false for detail with only contact_email', () => {
      const partialWanted = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        contact_email: 'contact@test.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      expect(isWantedAuthenticated(partialWanted)).toBe(false)
    })
  })
  describe('edge cases', () => {
    it('should handle null values correctly', () => {
      const wantedWithNulls = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        user_id: null,
        contact_email: null,
        company_id: null,
        active: null,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      // company_id property exists (even if null), so isAuthenticatedWanted returns true
      expect(isAuthenticatedWanted(wantedWithNulls)).toBe(true)
      // company_id and active properties exist (even if null), so isWantedPublicDetail returns true
      expect(isWantedPublicDetail(wantedWithNulls)).toBe(true)
      // isWantedAuthenticated always returns false (not yet implemented)
      expect(isWantedAuthenticated(wantedWithNulls)).toBe(false)
    })
    it('should handle undefined values correctly', () => {
      const wantedWithUndefined = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as WantedPublicListing
      expect(isAuthenticatedWanted(wantedWithUndefined)).toBe(false)
      expect(isWantedPublicDetail(wantedWithUndefined)).toBe(false)
    })
    it('should handle empty strings correctly', () => {
      const wantedWithEmptyStrings = {
        id: '1',
        title: 'Test Wanted',
        description: 'Test description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        user_id: '',
        contact_email: '',
        company_id: '',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      } as any
      // Empty strings for company_id still means the property exists
      expect(isAuthenticatedWanted(wantedWithEmptyStrings)).toBe(true)
      expect(isWantedPublicDetail(wantedWithEmptyStrings)).toBe(true)
      expect(isWantedAuthenticated(wantedWithEmptyStrings)).toBe(false)
    })
  })
})