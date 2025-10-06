import { describe, it, expect } from 'vitest'
import { createCompanyEditSchema } from '~/utils/validation/companySchemas'
import type { CompanyEditForm } from '~/utils/validation/companySchemas'

describe('companySchemas', () => {
  describe('companyEditSchema', () => {
    // Create mock translation function
    const t = (key: string) => key

    // Create schema instance
    const companyEditSchema = createCompanyEditSchema(t)
    it('should validate with all fields provided', () => {
      const validCompany: CompanyEditForm = {
        name: 'Test Company Ltd',
        street: '123 Main Street',
        city: 'Helsinki',
        country: 'FI',
        timezone: 'Europe/Helsinki',
        business_id: '1234567-8'
      }
      const result = companyEditSchema.safeParse(validCompany)
      expect(result.success).toBe(true)
    })

    it('should validate with all fields empty/undefined', () => {
      const emptyCompany = {}
      const result = companyEditSchema.safeParse(emptyCompany)
      expect(result.success).toBe(true)
    })

    it('should validate with only some fields provided', () => {
      const partialCompany = {
        name: 'Partial Company',
        country: 'US'
      }
      const result = companyEditSchema.safeParse(partialCompany)
      expect(result.success).toBe(true)
    })

    it('should reject name longer than 200 characters', () => {
      const company = {
        name: 'a'.repeat(201)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(false)
    })

    it('should accept name exactly 200 characters', () => {
      const company = {
        name: 'a'.repeat(200)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(true)
    })

    it('should reject empty string name', () => {
      const company = {
        name: ''
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(false)
    })

    it('should reject street longer than 200 characters', () => {
      const company = {
        street: 'a'.repeat(201)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(false)
    })

    it('should accept street exactly 200 characters', () => {
      const company = {
        street: 'a'.repeat(200)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(true)
    })

    it('should reject city longer than 100 characters', () => {
      const company = {
        city: 'a'.repeat(101)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(false)
    })

    it('should accept city exactly 100 characters', () => {
      const company = {
        city: 'a'.repeat(100)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(true)
    })

    it('should validate 2-letter ISO country codes', () => {
      const validCountries = ['FI', 'US', 'GB', 'SE', 'NO', 'DK']
      validCountries.forEach(country => {
        const company = { country }
        const result = companyEditSchema.safeParse(company)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid country codes', () => {
      const invalidCountries = ['USA', 'F', 'fin', '12', 'ABC']
      invalidCountries.forEach(country => {
        const company = { country }
        const result = companyEditSchema.safeParse(company)
        expect(result.success).toBe(false)
      })
    })

    it('should validate IANA timezone strings', () => {
      const validTimezones = [
        'Europe/Helsinki',
        'America/New_York',
        'Asia/Tokyo',
        'UTC'
      ]
      validTimezones.forEach(timezone => {
        const company = { timezone }
        const result = companyEditSchema.safeParse(company)
        expect(result.success).toBe(true)
      })
    })

    it('should reject business_id longer than 50 chars', () => {
      const company = {
        business_id: 'a'.repeat(51)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(false)
    })

    it('should accept business_id exactly 50 chars', () => {
      const company = {
        business_id: 'a'.repeat(50)
      }
      const result = companyEditSchema.safeParse(company)
      expect(result.success).toBe(true)
    })
  })
})
