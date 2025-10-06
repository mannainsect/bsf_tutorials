import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { COUNTRIES_DATA, POPULAR_COUNTRY_CODES } from '~/utils/countries'
import { useCountries } from '~/composables/useCountries'

describe('useCountries composable (data layer tests)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Data Layer Validation', () => {
    it('should have access to COUNTRIES_DATA', () => {
      expect(COUNTRIES_DATA).toBeDefined()
      expect(Array.isArray(COUNTRIES_DATA)).toBe(true)
      expect(COUNTRIES_DATA.length).toBeGreaterThanOrEqual(250)
    })

    it('should have access to POPULAR_COUNTRY_CODES', () => {
      expect(POPULAR_COUNTRY_CODES).toBeDefined()
      expect(Array.isArray(POPULAR_COUNTRY_CODES)).toBe(true)
      expect(POPULAR_COUNTRY_CODES.length).toBe(10)
    })
  })

  describe('Composable Logic Tests', () => {
    it('should verify data sources are accessible', () => {
      const allCodes = COUNTRIES_DATA.map(c => c.code)
      expect(allCodes).toContain('US')
      expect(allCodes).toContain('GB')
      expect(allCodes).toContain('CA')
    })

    it('should verify popular countries exist in main data', () => {
      const allCodes = COUNTRIES_DATA.map(c => c.code)
      POPULAR_COUNTRY_CODES.forEach(code => {
        expect(allCodes).toContain(code)
      })
    })

    it('should validate country lookup pattern', () => {
      const foundUS = COUNTRIES_DATA.find(c => c.code === 'US')
      expect(foundUS).toBeDefined()
      expect(foundUS?.name).toBe('United States')
      expect(foundUS?.flag).toBe('🇺🇸')
    })

    it('should validate country name formatting', () => {
      const usCountry = COUNTRIES_DATA.find(c => c.code === 'US')
      if (usCountry) {
        const formatted = `${usCountry.flag} ${usCountry.name}`
        expect(formatted).toBe('🇺🇸 United States')
      }
    })

    it('should validate popular countries extraction', () => {
      const popularCountries = POPULAR_COUNTRY_CODES.map(code =>
        COUNTRIES_DATA.find(c => c.code === code)
      ).filter(c => c !== undefined)
      expect(popularCountries.length).toBe(10)
      popularCountries.forEach(country => {
        expect(country).toHaveProperty('code')
        expect(country).toHaveProperty('name')
        expect(country).toHaveProperty('flag')
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain Country interface structure', () => {
      const testCountry = COUNTRIES_DATA[0]
      expect(testCountry).toHaveProperty('code')
      expect(testCountry).toHaveProperty('name')
      expect(testCountry).toHaveProperty('flag')
      expect(typeof testCountry.code).toBe('string')
      expect(typeof testCountry.name).toBe('string')
      expect(typeof testCountry.flag).toBe('string')
    })

    it('should verify type export availability', () => {
      const typed: {
        code: string
        name: string
        flag: string
      } = COUNTRIES_DATA[0]
      expect(typed).toBeDefined()
    })
  })

  describe('Data Integrity', () => {
    it('should not have duplicate codes', () => {
      const codes = COUNTRIES_DATA.map(c => c.code)
      const unique = new Set(codes)
      expect(unique.size).toBe(codes.length)
    })

    it('should preserve all country data', () => {
      const originalLength = COUNTRIES_DATA.length
      const copy = [...COUNTRIES_DATA]
      expect(copy.length).toBe(originalLength)
      expect(COUNTRIES_DATA.length).toBe(originalLength)
    })

    it('should maintain ISO code integrity', () => {
      COUNTRIES_DATA.forEach(country => {
        expect(country.code).toMatch(/^[A-Z]{2}$/)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid data access', () => {
      for (let i = 0; i < 100; i++) {
        const country = COUNTRIES_DATA.find(c => c.code === 'US')
        expect(country?.code).toBe('US')
      }
    })

    it('should handle non-existent country codes', () => {
      const result = COUNTRIES_DATA.find(c => c.code === 'INVALID')
      expect(result).toBeUndefined()
    })
  })

  describe('Performance Considerations', () => {
    it('should access data efficiently', () => {
      const start = performance.now()
      const data = COUNTRIES_DATA
      const popular = POPULAR_COUNTRY_CODES
      data.forEach(country => country.code)
      popular.forEach(code => code)
      const end = performance.now()
      expect(end - start).toBeLessThan(50)
    })

    it('should perform lookups quickly', () => {
      const start = performance.now()
      for (let i = 0; i < 50; i++) {
        COUNTRIES_DATA.find(c => c.code === 'US')
        COUNTRIES_DATA.find(c => c.code === 'GB')
        COUNTRIES_DATA.find(c => c.code === 'CA')
      }
      const end = performance.now()
      expect(end - start).toBeLessThan(100)
    })
  })

  describe('Composable Behavior Tests', () => {
    it('should return localized countries', () => {
      const { countries } = useCountries()
      expect(countries).toBeDefined()
      expect(Array.isArray(countries.value)).toBe(true)
      expect(countries.value.length).toBeGreaterThan(0)
    })

    it('should get country by code', () => {
      const { getCountryByCode } = useCountries()
      const us = getCountryByCode('US')
      expect(us).toBeDefined()
      expect(us?.code).toBe('US')
      expect(us?.name).toBe('United States')
      expect(us?.flag).toBe('🇺🇸')
    })

    it('should return undefined for invalid country code', () => {
      const { getCountryByCode } = useCountries()
      const invalid = getCountryByCode('INVALID')
      expect(invalid).toBeUndefined()
    })

    it('should format country name with flag', () => {
      const { getCountryName } = useCountries()
      const formatted = getCountryName('US')
      expect(formatted).toBeDefined()
      expect(formatted).toContain('🇺🇸')
      expect(formatted).toContain('United States')
    })

    it('should return popular countries', () => {
      const { getPopularCountries } = useCountries()
      const popular = getPopularCountries()
      expect(popular).toBeDefined()
      expect(Array.isArray(popular)).toBe(true)
      expect(popular.length).toBe(10)
      popular.forEach(country => {
        expect(country).toHaveProperty('code')
        expect(country).toHaveProperty('name')
        expect(country).toHaveProperty('flag')
      })
    })

    it('should return localized countries via computed', () => {
      const { localizedCountries } = useCountries()
      expect(localizedCountries.value).toBeDefined()
      expect(Array.isArray(localizedCountries.value)).toBe(true)
      expect(localizedCountries.value.length).toBeGreaterThan(0)
    })
  })
})
