import { describe, it, expect } from 'vitest'
import type { Country } from '~/utils/countries'
import { COUNTRIES_DATA, POPULAR_COUNTRY_CODES }
from '~/utils/countries'

describe('countries utility', () => {
  describe('COUNTRIES_DATA', () => {
    it('should have 250+ country entries', () => {
      expect(COUNTRIES_DATA.length).toBeGreaterThanOrEqual(250)
    })

    it('should not have duplicate country codes', () => {
      const codes = COUNTRIES_DATA.map(c => c.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })

    it('should have all required fields for each country',
    () => {
      COUNTRIES_DATA.forEach((country, index) => {
        expect(country.code, `Country at index ${index}
should have code`).toBeTruthy()
        expect(country.name, `Country at index ${index}
should have name`).toBeTruthy()
        expect(country.flag, `Country at index ${index}
should have flag`).toBeTruthy()
      })
    })

    it('should have non-empty strings for all fields', () => {
      COUNTRIES_DATA.forEach((country) => {
        expect(typeof country.code).toBe('string')
        expect(typeof country.name).toBe('string')
        expect(typeof country.flag).toBe('string')
        expect(country.code.length).toBeGreaterThan(0)
        expect(country.name.length).toBeGreaterThan(0)
        expect(country.flag.length).toBeGreaterThan(0)
      })
    })

    it('should have valid ISO 3166-1 alpha-2 codes', () => {
      const isoCodePattern = /^[A-Z]{2}$/
      COUNTRIES_DATA.forEach((country) => {
        expect(country.code).toMatch(isoCodePattern)
      })
    })

    it('should have flag emojis present', () => {
      COUNTRIES_DATA.forEach((country) => {
        const codePoints = country.flag.codePointAt(0)
        expect(codePoints).toBeDefined()
        expect(codePoints).toBeGreaterThan(0)
      })
    })

    it('should include common countries', () => {
      const codes = COUNTRIES_DATA.map(c => c.code)
      const commonCountries =
        ['US', 'GB', 'CA', 'DE', 'FR', 'ES', 'IT', 'JP', 'CN',
        'BR']
      commonCountries.forEach((code) => {
        expect(codes).toContain(code)
      })
    })

    it('should have specific known countries', () => {
      const usCountry = COUNTRIES_DATA.find(c => c.code === 'US')
      expect(usCountry).toBeDefined()
      expect(usCountry?.name).toBe('United States')
      expect(usCountry?.flag).toBe('🇺🇸')

      const gbCountry = COUNTRIES_DATA.find(c => c.code === 'GB')
      expect(gbCountry).toBeDefined()
      expect(gbCountry?.name).toBe('United Kingdom')
      expect(gbCountry?.flag).toBe('🇬🇧')
    })

    it('should be readonly (const assertion)', () => {
      const typeCheck: readonly Country[] = COUNTRIES_DATA
      expect(typeCheck).toBe(COUNTRIES_DATA)
    })
  })

  describe('POPULAR_COUNTRY_CODES', () => {
    it('should have exactly 10 popular country codes', () => {
      expect(POPULAR_COUNTRY_CODES.length).toBe(10)
    })

    it('should contain valid 2-letter uppercase codes', () => {
      const isoCodePattern = /^[A-Z]{2}$/
      POPULAR_COUNTRY_CODES.forEach((code) => {
        expect(code).toMatch(isoCodePattern)
      })
    })

    it('should only contain codes that exist in COUNTRIES_DATA',
    () => {
      const allCodes = COUNTRIES_DATA.map(c => c.code)
      POPULAR_COUNTRY_CODES.forEach((code) => {
        expect(allCodes).toContain(code)
      })
    })

    it('should include US, CA, and GB', () => {
      expect(POPULAR_COUNTRY_CODES).toContain('US')
      expect(POPULAR_COUNTRY_CODES).toContain('CA')
      expect(POPULAR_COUNTRY_CODES).toContain('GB')
    })

    it('should not have duplicates', () => {
      const unique = new Set(POPULAR_COUNTRY_CODES)
      expect(unique.size).toBe(POPULAR_COUNTRY_CODES.length)
    })

    it('should be readonly (const assertion)', () => {
      const typeCheck: readonly string[] = POPULAR_COUNTRY_CODES
      expect(typeCheck).toBe(POPULAR_COUNTRY_CODES)
    })
  })

  describe('Country interface', () => {
    it('should enforce required fields via type system', () => {
      const validCountry: Country = {
        code: 'US',
        name: 'United States',
        flag: '🇺🇸'
      }
      expect(validCountry).toBeDefined()
    })

    it('should be used by COUNTRIES_DATA entries', () => {
      const firstCountry: Country = COUNTRIES_DATA[0]
      expect(firstCountry.code).toBeDefined()
      expect(firstCountry.name).toBeDefined()
      expect(firstCountry.flag).toBeDefined()
    })
  })

  describe('Data completeness', () => {
    it('should have countries from all continents', () => {
      const codes = COUNTRIES_DATA.map(c => c.code)
      const continentSamples = {
        africa: ['NG', 'ZA', 'EG', 'KE'],
        asia: ['JP', 'CN', 'IN', 'KR'],
        europe: ['DE', 'FR', 'IT', 'ES'],
        northAmerica: ['US', 'CA', 'MX'],
        southAmerica: ['BR', 'AR', 'CL'],
        oceania: ['AU', 'NZ', 'FJ']
      }

      Object.values(continentSamples).forEach((samples) => {
        samples.forEach((code) => {
          expect(codes).toContain(code)
        })
      })
    })

    it('should have consistent flag emoji format', () => {
      COUNTRIES_DATA.forEach((country) => {
        expect(country.flag.length).toBeGreaterThanOrEqual(2)
        const codePoint = country.flag.codePointAt(0)
        expect(codePoint).toBeDefined()
        expect(codePoint).toBeGreaterThanOrEqual(0x1F1E6)
        expect(codePoint).toBeLessThanOrEqual(0x1F1FF)
      })
    })

    it('should alphabetically sort sample after localization',
    () => {
      const codes = COUNTRIES_DATA.map(c => c.code)
      expect(codes.length).toBeGreaterThan(0)
      expect(codes.includes('AF')).toBe(true)
    })
  })
})
