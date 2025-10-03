import { describe, it, expect } from 'vitest'
import {
  APP_NAME,
  APP_VERSION,
  API_TIMEOUT,
  DEFAULT_PAGE_SIZE,
  MAX_UPLOAD_SIZE,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
  DESKTOP_BREAKPOINT,
  ANIMATION_DURATION,
  STORAGE_KEYS,
  DATE_FORMATS,
  VALIDATION_RULES,
  HTTP_STATUS,
  REGEX_PATTERNS,
  SEARCH_DEBOUNCE_MS
} from '~/utils/constants'

describe('constants utility', () => {
  describe('App Constants', () => {
    it('should have app name defined', () => {
      expect(APP_NAME).toBeDefined()
      expect(typeof APP_NAME).toBe('string')
    })

    it('should have app version defined', () => {
      expect(APP_VERSION).toBeDefined()
      expect(typeof APP_VERSION).toBe('string')
    })
  })

  describe('API Constants', () => {
    it('should have API timeout defined', () => {
      expect(API_TIMEOUT).toBeDefined()
      expect(typeof API_TIMEOUT).toBe('number')
      expect(API_TIMEOUT).toBeGreaterThan(0)
    })

    it('should have default page size defined', () => {
      expect(DEFAULT_PAGE_SIZE).toBeDefined()
      expect(typeof DEFAULT_PAGE_SIZE).toBe('number')
      expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0)
    })

    it('should have max upload size defined', () => {
      expect(MAX_UPLOAD_SIZE).toBeDefined()
      expect(typeof MAX_UPLOAD_SIZE).toBe('number')
      expect(MAX_UPLOAD_SIZE).toBeGreaterThan(0)
    })
  })

  describe('UI Constants', () => {
    it('should have mobile breakpoint defined', () => {
      expect(MOBILE_BREAKPOINT).toBeDefined()
      expect(typeof MOBILE_BREAKPOINT).toBe('number')
    })

    it('should have tablet breakpoint defined', () => {
      expect(TABLET_BREAKPOINT).toBeDefined()
      expect(typeof TABLET_BREAKPOINT).toBe('number')
    })

    it('should have desktop breakpoint defined', () => {
      expect(DESKTOP_BREAKPOINT).toBeDefined()
      expect(typeof DESKTOP_BREAKPOINT).toBe('number')
    })

    it('should have breakpoints in ascending order', () => {
      expect(MOBILE_BREAKPOINT).toBeLessThan(TABLET_BREAKPOINT)
      expect(TABLET_BREAKPOINT).toBeLessThan(DESKTOP_BREAKPOINT)
    })
  })

  describe('Animation Duration Constants', () => {
    it('should have animation durations defined', () => {
      expect(ANIMATION_DURATION).toBeDefined()
      expect(ANIMATION_DURATION.FAST).toBeDefined()
      expect(ANIMATION_DURATION.NORMAL).toBeDefined()
      expect(ANIMATION_DURATION.SLOW).toBeDefined()
    })

    it('should have durations in ascending order', () => {
      expect(ANIMATION_DURATION.FAST)
        .toBeLessThan(ANIMATION_DURATION.NORMAL)
      expect(ANIMATION_DURATION.NORMAL)
        .toBeLessThan(ANIMATION_DURATION.SLOW)
    })

    it('should have positive duration values', () => {
      expect(ANIMATION_DURATION.FAST).toBeGreaterThan(0)
      expect(ANIMATION_DURATION.NORMAL).toBeGreaterThan(0)
      expect(ANIMATION_DURATION.SLOW).toBeGreaterThan(0)
    })
  })

  describe('Storage Keys Constants', () => {
    it('should have storage keys defined', () => {
      expect(STORAGE_KEYS).toBeDefined()
      expect(STORAGE_KEYS.AUTH_TOKEN).toBeDefined()
      expect(STORAGE_KEYS.USER_PREFERENCES).toBeDefined()
      expect(STORAGE_KEYS.LANGUAGE).toBeDefined()
      expect(STORAGE_KEYS.THEME).toBeDefined()
    })

    it('should have string storage keys', () => {
      expect(typeof STORAGE_KEYS.AUTH_TOKEN).toBe('string')
      expect(typeof STORAGE_KEYS.USER_PREFERENCES).toBe('string')
      expect(typeof STORAGE_KEYS.LANGUAGE).toBe('string')
      expect(typeof STORAGE_KEYS.THEME).toBe('string')
    })

    it('should have non-empty storage keys', () => {
      expect(STORAGE_KEYS.AUTH_TOKEN.length).toBeGreaterThan(0)
      expect(STORAGE_KEYS.USER_PREFERENCES.length).toBeGreaterThan(0)
      expect(STORAGE_KEYS.LANGUAGE.length).toBeGreaterThan(0)
      expect(STORAGE_KEYS.THEME.length).toBeGreaterThan(0)
    })
  })

  describe('Date Format Constants', () => {
    it('should have date formats defined', () => {
      expect(DATE_FORMATS).toBeDefined()
      expect(DATE_FORMATS.SHORT).toBeDefined()
      expect(DATE_FORMATS.LONG).toBeDefined()
      expect(DATE_FORMATS.TIME).toBeDefined()
      expect(DATE_FORMATS.DATETIME).toBeDefined()
    })

    it('should have string date formats', () => {
      expect(typeof DATE_FORMATS.SHORT).toBe('string')
      expect(typeof DATE_FORMATS.LONG).toBe('string')
      expect(typeof DATE_FORMATS.TIME).toBe('string')
      expect(typeof DATE_FORMATS.DATETIME).toBe('string')
    })
  })

  describe('Validation Rules Constants', () => {
    it('should have validation rules defined', () => {
      expect(VALIDATION_RULES).toBeDefined()
      expect(VALIDATION_RULES.EMAIL_REGEX).toBeDefined()
      expect(VALIDATION_RULES.PHONE_REGEX).toBeDefined()
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBeDefined()
      expect(VALIDATION_RULES.NAME_MAX_LENGTH).toBeDefined()
      expect(VALIDATION_RULES.MESSAGE_MAX_LENGTH).toBeDefined()
    })

    it('should have valid regex patterns', () => {
      expect(VALIDATION_RULES.EMAIL_REGEX).toBeInstanceOf(RegExp)
      expect(VALIDATION_RULES.PHONE_REGEX).toBeInstanceOf(RegExp)
    })

    it('should have positive length constraints', () => {
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
        .toBeGreaterThan(0)
      expect(VALIDATION_RULES.NAME_MAX_LENGTH).toBeGreaterThan(0)
      expect(VALIDATION_RULES.MESSAGE_MAX_LENGTH).toBeGreaterThan(0)
    })
  })

  describe('HTTP Status Constants', () => {
    it('should have HTTP status codes defined', () => {
      expect(HTTP_STATUS).toBeDefined()
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.NO_CONTENT).toBe(204)
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.CONFLICT).toBe(409)
      expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422)
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('Regex Pattern Constants', () => {
    it('should have regex patterns defined', () => {
      expect(REGEX_PATTERNS).toBeDefined()
      expect(REGEX_PATTERNS.EMAIL).toBeDefined()
      expect(REGEX_PATTERNS.PHONE).toBeDefined()
      expect(REGEX_PATTERNS.URL).toBeDefined()
      expect(REGEX_PATTERNS.NUMBER_ONLY).toBeDefined()
      expect(REGEX_PATTERNS.LETTERS_ONLY).toBeDefined()
      expect(REGEX_PATTERNS.ALPHANUMERIC).toBeDefined()
    })

    it('should have valid regex instances', () => {
      expect(REGEX_PATTERNS.EMAIL).toBeInstanceOf(RegExp)
      expect(REGEX_PATTERNS.PHONE).toBeInstanceOf(RegExp)
      expect(REGEX_PATTERNS.URL).toBeInstanceOf(RegExp)
      expect(REGEX_PATTERNS.NUMBER_ONLY).toBeInstanceOf(RegExp)
      expect(REGEX_PATTERNS.LETTERS_ONLY).toBeInstanceOf(RegExp)
      expect(REGEX_PATTERNS.ALPHANUMERIC).toBeInstanceOf(RegExp)
    })
  })

  describe('Search and Filter Constants (Issue #114)',
  () => {
    it('should have SEARCH_DEBOUNCE_MS constant defined', () => {
      expect(SEARCH_DEBOUNCE_MS).toBeDefined()
      expect(typeof SEARCH_DEBOUNCE_MS).toBe('number')
    })

    it('should have SEARCH_DEBOUNCE_MS equal to 300', () => {
      expect(SEARCH_DEBOUNCE_MS).toBe(300)
    })

    it('should have SEARCH_DEBOUNCE_MS as positive value', () => {
      expect(SEARCH_DEBOUNCE_MS).toBeGreaterThan(0)
    })

    it('should have reasonable debounce duration', () => {
      expect(SEARCH_DEBOUNCE_MS).toBeGreaterThanOrEqual(100)
      expect(SEARCH_DEBOUNCE_MS).toBeLessThanOrEqual(1000)
    })
  })

  describe('Constant Values', () => {
    it('should preserve constant primitive values', () => {
      const originalDebounce = SEARCH_DEBOUNCE_MS
      expect(SEARCH_DEBOUNCE_MS).toBe(originalDebounce)
    })

    it('should have const assertion for immutability intent', () => {
      const typeCheck: 300 = SEARCH_DEBOUNCE_MS
      expect(typeCheck).toBe(300)
    })
  })

  describe('Constants Integration', () => {
    it('should have key numeric constants exportable', () => {
      const constants = {
        SEARCH_DEBOUNCE_MS
      }

      Object.values(constants).forEach(value => {
        expect(value).toBeDefined()
        expect(typeof value).toBe('number')
      })
    })

    it('should maintain backward compatibility', () => {
      expect(APP_NAME).toBeDefined()
      expect(API_TIMEOUT).toBeDefined()
      expect(HTTP_STATUS.OK).toBe(200)
      expect(REGEX_PATTERNS.EMAIL).toBeInstanceOf(RegExp)
    })
  })
})
