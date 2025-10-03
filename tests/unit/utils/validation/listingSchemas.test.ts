import { describe, it, expect } from 'vitest'
import {
  productSchema,
  wantedSchema,
  COMMON_CURRENCIES,
  QUANTITY_UNITS,
  VALID_CATEGORIES_EXPORT,
  createFallbackTranslator,
  getCommonCurrencies,
  getQuantityUnits
} from '~/utils/validation/listingSchemas'
describe('listingSchemas', () => {
  describe('productSchema', () => {
    it('should validate a complete product', () => {
      const validProduct = {
        title: 'Test Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'A test product description',
        price: 99.99,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'piece',
        countries: ['US', 'CA'],
        additional_info: 'Extra information',
        contact_email: 'test@example.com'
      }
      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })
    it('should require all mandatory fields', () => {
      const incompleteProduct = {
        title: 'Test Product'
        
      }
      const result = productSchema.safeParse(incompleteProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        const missingFields = result.error.issues.map(i => i.path[0])
        expect(missingFields).toContain('category')
        expect(missingFields).toContain('subcategory')
        expect(missingFields).toContain('description')
        expect(missingFields).toContain('price')
        expect(missingFields).toContain('price_currency')
        expect(missingFields).toContain('quantity')
        expect(missingFields).toContain('quantity_unit')
        expect(missingFields).toContain('countries')
      }
    })
    it('should validate title length constraints', () => {
      const tooLongTitle = 'a'.repeat(201)
      const product = {
        title: tooLongTitle,
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: ['US']
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(false)
      if (!result.success) {
        const titleError = result.error.issues.find(i => i.path[0] === 'title')
        expect(titleError?.message).toContain('200 characters')
      }
    })
    it('should validate description length constraints', () => {
      const tooLongDesc = 'a'.repeat(5001)
      const product = {
        title: 'Product',
        category: 'frass',
        subcategory: 'unprocessed',
        description: tooLongDesc,
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: ['US']
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(false)
      if (!result.success) {
        const descError = result.error.issues.find(i => i.path[0] === 'description')
        expect(descError?.message).toContain('5000 characters')
      }
    })
    it('should validate price is non-negative', () => {
      const product = {
        title: 'Product',
        category: 'substrate',
        subcategory: 'manure',
        description: 'Description',
        price: -10,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: ['US']
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(false)
      if (!result.success) {
        const priceError = result.error.issues.find(i => i.path[0] === 'price')
        expect(priceError?.message).toContain('0 or greater')
      }
    })
    it('should validate currency code format', () => {
      const invalidCurrencies = ['usd', 'USDD', 'U', '123', 'A', 'US', 'AU']
      invalidCurrencies.forEach(currency => {
        const product = {
          title: 'Product',
          category: 'equipment',
          subcategory: 'trays',
          description: 'Description',
          price: 100,
          price_currency: currency,
          quantity: 1,
          quantity_unit: 'piece',
          countries: ['US']
        }
        const result = productSchema.safeParse(product)
        expect(result.success).toBe(false)
      })
      
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF']
      validCurrencies.forEach(currency => {
        const product = {
          title: 'Product',
          category: 'equipment',
          subcategory: 'trays',
          description: 'Description',
          price: 100,
          price_currency: currency,
          quantity: 1,
          quantity_unit: 'piece',
          countries: ['US']
        }
        const result = productSchema.safeParse(product)
        expect(result.success).toBe(true)
      })
    })
    it('should validate quantity is non-negative', () => {
      const invalidQuantities = [-1, -10.5]
      invalidQuantities.forEach(quantity => {
        const product = {
          title: 'Product',
          category: 'services',
          subcategory: 'training',
          description: 'Description',
          price: 100,
          price_currency: 'USD',
          quantity,
          quantity_unit: 'piece',
          countries: ['US']
        }
        const result = productSchema.safeParse(product)
        expect(result.success).toBe(false)
      })
      
      const validQuantities = [0, 1, 1.5, 100, 9999]
      validQuantities.forEach(quantity => {
        const product = {
          title: 'Product',
          category: 'services',
          subcategory: 'training',
          description: 'Description',
          price: 100,
          price_currency: 'USD',
          quantity,
          quantity_unit: 'piece',
          countries: ['US']
        }
        const result = productSchema.safeParse(product)
        expect(result.success).toBe(true)
      })
    })
    it('should validate country codes', () => {

      const invalidProducts = [
        { countries: [] },
        { countries: ['USA'] },
        { countries: ['U'] },
        { countries: ['us'] },
        { countries: ['12'] },
        { countries: Array(260).fill('US') }
      ]
      invalidProducts.forEach(override => {
        const product = {
          title: 'Product',
          category: 'bsf',
          subcategory: 'oil',
          description: 'Description',
          price: 100,
          price_currency: 'USD',
          quantity: 1,
          quantity_unit: 'piece',
          ...override
        }
        const result = productSchema.safeParse(product)
        expect(result.success).toBe(false)
      })

      const validCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'JP']
      const product = {
        title: 'Product',
        category: 'bsf',
        subcategory: 'oil',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: validCountries
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(true)
    })
    it('should accept up to 250 countries', () => {
      const countries250 = Array.from({ length: 250 }, (_, i) => {
        const firstChar = String.fromCharCode(
          65 + Math.floor(i / 26)
        )
        const secondChar = String.fromCharCode(65 + (i % 26))
        return firstChar + secondChar
      })
      const product = {
        title: 'Product',
        category: 'bsf',
        subcategory: 'oil',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: countries250
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(true)
    })
    it('should reject more than 250 countries', () => {
      const countries251 = Array.from({ length: 251 }, (_, i) => {
        const firstChar = String.fromCharCode(
          65 + Math.floor(i / 26)
        )
        const secondChar = String.fromCharCode(65 + (i % 26))
        return firstChar + secondChar
      })
      const product = {
        title: 'Product',
        category: 'bsf',
        subcategory: 'oil',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: countries251
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(false)
      if (!result.success) {
        const countryError = result.error.issues.find(
          i => i.path[0] === 'countries'
        )
        expect(countryError?.message).toContain('250')
      }
    })
    it('should require at least one country', () => {
      const product = {
        title: 'Product',
        category: 'bsf',
        subcategory: 'oil',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: []
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(false)
      if (!result.success) {
        const countryError = result.error.issues.find(
          i => i.path[0] === 'countries'
        )
        expect(countryError?.message).toContain('one country')
      }
    })
    it('should validate optional email field', () => {
      const validEmails = ['test@example.com', '', undefined]
      validEmails.forEach(email => {
        const product = {
          title: 'Product',
          category: 'frass',
          subcategory: 'dried',
          description: 'Description',
          price: 100,
          price_currency: 'USD',
          quantity: 1,
          quantity_unit: 'piece',
          countries: ['US'],
          ...(email !== undefined && { contact_email: email })
        }
        const result = productSchema.safeParse(product)
        expect(result.success).toBe(true)
      })
      
      const product = {
        title: 'Product',
        category: 'frass',
        subcategory: 'dried',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: ['US'],
        contact_email: 'invalid-email'
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(false)
    })
  })
  describe('wantedSchema', () => {
    it('should validate a complete wanted listing', () => {
      const validWanted = {
        title: 'Looking for BSF larvae',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Need bulk BSF larvae',
        countries: ['US', 'CA'],
        additional_info: 'Urgent requirement',
        contact_email: 'buyer@example.com'
      }
      const result = wantedSchema.safeParse(validWanted)
      expect(result.success).toBe(true)
    })
    it('should require all mandatory fields for wanted', () => {
      const incompleteWanted = {
        title: 'Test Wanted'
        
      }
      const result = wantedSchema.safeParse(incompleteWanted)
      expect(result.success).toBe(false)
      if (!result.success) {
        const missingFields = result.error.issues.map(i => i.path[0])
        expect(missingFields).toContain('category')
        expect(missingFields).toContain('subcategory')
        expect(missingFields).toContain('description')
        expect(missingFields).toContain('countries')
      }
    })
    it('should not require price fields for wanted listings', () => {
      const wanted = {
        title: 'Looking for Equipment',
        category: 'equipment',
        subcategory: 'siever',
        description: 'Need industrial sievers',
        countries: ['US']
        
      }
      const result = wantedSchema.safeParse(wanted)
      expect(result.success).toBe(true)
    })
    it('should validate wanted with all optional fields', () => {
      const wanted = {
        title: 'Looking for Substrate',
        category: 'substrate',
        subcategory: 'municipal_waste',
        description: 'Need municipal waste substrate',
        countries: ['US', 'CA', 'MX'],
        additional_info: 'Please contact ASAP',
        contact_email: 'urgent@example.com'
      }
      const result = wantedSchema.safeParse(wanted)
      expect(result.success).toBe(true)
    })
    it('should accept up to 250 countries for wanted', () => {
      const countries250 = Array.from({ length: 250 }, (_, i) => {
        const firstChar = String.fromCharCode(
          65 + Math.floor(i / 26)
        )
        const secondChar = String.fromCharCode(65 + (i % 26))
        return firstChar + secondChar
      })
      const wanted = {
        title: 'Looking for BSF',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Need bulk BSF larvae',
        countries: countries250
      }
      const result = wantedSchema.safeParse(wanted)
      expect(result.success).toBe(true)
    })
    it('should reject more than 250 countries for wanted', () => {
      const countries251 = Array.from({ length: 251 }, (_, i) => {
        const firstChar = String.fromCharCode(
          65 + Math.floor(i / 26)
        )
        const secondChar = String.fromCharCode(65 + (i % 26))
        return firstChar + secondChar
      })
      const wanted = {
        title: 'Looking for BSF',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Need bulk BSF larvae',
        countries: countries251
      }
      const result = wantedSchema.safeParse(wanted)
      expect(result.success).toBe(false)
      if (!result.success) {
        const countryError = result.error.issues.find(
          i => i.path[0] === 'countries'
        )
        expect(countryError?.message).toContain('250')
      }
    })
    it('should require at least one country for wanted', () => {
      const wanted = {
        title: 'Looking for BSF',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Need bulk BSF larvae',
        countries: []
      }
      const result = wantedSchema.safeParse(wanted)
      expect(result.success).toBe(false)
      if (!result.success) {
        const countryError = result.error.issues.find(
          i => i.path[0] === 'countries'
        )
        expect(countryError?.message).toContain('one country')
      }
    })
  })
  describe('constants', () => {
    it('should have valid currency codes in COMMON_CURRENCIES', () => {
      const t = createFallbackTranslator()
      const translatedCurrencies = getCommonCurrencies(t)

      expect(COMMON_CURRENCIES.length).toBeGreaterThan(0)
      expect(translatedCurrencies.length).toBe(COMMON_CURRENCIES.length)

      COMMON_CURRENCIES.forEach(currency => {
        expect(currency.code).toMatch(/^[A-Z]{3}$/)
        expect(currency.nameKey).toMatch(/^currencies\./)
        expect(currency.symbol).toBeTruthy()
      })

      translatedCurrencies.forEach(currency => {
        expect(currency.code).toMatch(/^[A-Z]{3}$/)
        expect(currency.name).toBeTruthy()
        expect(currency.symbol).toBeTruthy()
      })
    })
    it('should have valid quantity units', () => {
      const t = createFallbackTranslator()
      const translatedUnits = getQuantityUnits(t)

      expect(QUANTITY_UNITS.length).toBeGreaterThan(0)
      expect(translatedUnits.length).toBe(QUANTITY_UNITS.length)

      QUANTITY_UNITS.forEach(unit => {
        expect(unit.value).toBeTruthy()
        expect(unit.labelKey).toMatch(/^units\./)
      })

      translatedUnits.forEach(unit => {
        expect(unit.value).toBeTruthy()
        expect(unit.label).toBeTruthy()
      })
    })
    it('should have valid product categories with subcategories', () => {
      expect(Object.keys(VALID_CATEGORIES_EXPORT).length).toBeGreaterThan(0)
      Object.entries(VALID_CATEGORIES_EXPORT).forEach(([category, subcategories]) => {
        expect(category).toBeTruthy()
        expect(subcategories).toBeInstanceOf(Array)
        expect(subcategories.length).toBeGreaterThan(0)
        subcategories.forEach(sub => {
          expect(sub).toBeTruthy()
        })
      })
    })
  })
  describe('image validation', () => {
    it('should validate image constraints', () => {
      
      
      const product = {
        title: 'Product with Images',
        category: 'bsf',
        subcategory: 'whole_dried_larvae',
        description: 'Description',
        price: 100,
        price_currency: 'USD',
        quantity: 1,
        quantity_unit: 'piece',
        countries: ['US'],
        images: undefined 
      }
      const result = productSchema.safeParse(product)
      expect(result.success).toBe(true)
    })
  })
})
