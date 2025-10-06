import { describe, it, expect, vi } from 'vitest'
import { isValidRegex, createSafeRegex } from '../../../app/utils/helpers'

describe('Regex Validation', () => {
  describe('isValidRegex', () => {
    it('validates simple regex patterns', () => {
      expect(isValidRegex('hello')).toBe(true)
      expect(isValidRegex('test.*')).toBe(true)
      expect(isValidRegex('[a-z]+')).toBe(true)
      expect(isValidRegex('\\d{3}-\\d{4}')).toBe(true)
      expect(isValidRegex('^start.*end$')).toBe(true)
    })

    it('rejects invalid regex syntax', () => {
      expect(isValidRegex('[')).toBe(false)
      expect(isValidRegex('(unclosed')).toBe(false)
      expect(isValidRegex('[z-a]')).toBe(false) // Invalid range
      expect(isValidRegex('(?<')).toBe(false)
      expect(isValidRegex('\\')).toBe(false)
    })

    it('detects ReDoS vulnerable patterns', () => {
      const consoleSpy = vi.spyOn(console, 'warn')

      // Catastrophic backtracking patterns
      expect(isValidRegex('(a+)+')).toBe(false)
      expect(isValidRegex('(a*)+')).toBe(false)
      expect(isValidRegex('(.*+)+')).toBe(false)
      expect(isValidRegex('(\\w+{1,10})+')).toBe(false)

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('allows safe repetition patterns', () => {
      expect(isValidRegex('a+')).toBe(true)
      expect(isValidRegex('a*')).toBe(true)
      expect(isValidRegex('a{1,10}')).toBe(true)
      expect(isValidRegex('(abc)+')).toBe(true)
      expect(isValidRegex('[a-z]+')).toBe(true)
    })

    it('validates complex but safe patterns', () => {
      // Email-like pattern
      expect(
        isValidRegex('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ).toBe(true)

      // URL-like pattern
      expect(isValidRegex('https?://[\\w.-]+(/[\\w.-]*)*')).toBe(true)

      // Phone number pattern
      expect(
        isValidRegex(
          '\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}'
        )
      ).toBe(true)
    })

    it('handles empty string', () => {
      expect(isValidRegex('')).toBe(true)
    })

    it('handles special regex characters', () => {
      expect(isValidRegex('\\n')).toBe(true)
      expect(isValidRegex('\\t')).toBe(true)
      expect(isValidRegex('\\s')).toBe(true)
      expect(isValidRegex('\\S')).toBe(true)
      expect(isValidRegex('\\w')).toBe(true)
      expect(isValidRegex('\\W')).toBe(true)
      expect(isValidRegex('\\d')).toBe(true)
      expect(isValidRegex('\\D')).toBe(true)
    })

    it('validates lookahead and lookbehind', () => {
      expect(isValidRegex('(?=.*[A-Z])')).toBe(true) // Positive lookahead
      expect(isValidRegex('(?!.*[0-9])')).toBe(true) // Negative lookahead
      expect(isValidRegex('(?<=\\w)')).toBe(true) // Positive lookbehind
      expect(isValidRegex('(?<!\\d)')).toBe(true) // Negative lookbehind
    })

    it('validates Unicode patterns', () => {
      expect(isValidRegex('[\\u0000-\\uFFFF]')).toBe(true)
      // These patterns are technically valid (they don't throw errors)
      // even though they need 'u' flag to work as intended
      expect(isValidRegex('\\p{L}')).toBe(true) // Valid syntax
      expect(isValidRegex('\\u0041')).toBe(true) // Unicode for 'A'
      // Standard unicode ranges work
      expect(isValidRegex('[\\u0041-\\u005A]')).toBe(true) // A-Z range
    })
  })

  describe('createSafeRegex', () => {
    it('creates regex from valid patterns', () => {
      const regex = createSafeRegex('test')
      expect(regex).toBeInstanceOf(RegExp)
      expect(regex?.test('test')).toBe(true)
      expect(regex?.test('testing')).toBe(true)
      expect(regex?.test('no match')).toBe(false)
    })

    it('returns null for invalid patterns', () => {
      expect(createSafeRegex('[')).toBeNull()
      expect(createSafeRegex('(unclosed')).toBeNull()
      expect(createSafeRegex('(a+)+')).toBeNull() // ReDoS pattern
    })

    it('accepts flags', () => {
      const regex = createSafeRegex('test', 'i')
      expect(regex).toBeInstanceOf(RegExp)
      expect(regex?.flags).toBe('i')
      expect(regex?.test('TEST')).toBe(true)
      expect(regex?.test('Test')).toBe(true)
    })

    it('handles multiple flags', () => {
      const regex = createSafeRegex('test.*line', 'gim')
      expect(regex).toBeInstanceOf(RegExp)
      expect(regex?.flags).toBe('gim')
      expect(regex?.global).toBe(true)
      expect(regex?.ignoreCase).toBe(true)
      expect(regex?.multiline).toBe(true)
    })

    it('validates flags', () => {
      // Invalid flag should cause RegExp constructor to throw
      const regex = createSafeRegex('test', 'xyz')
      expect(regex).toBeNull()
    })

    it('creates working regex for common patterns', () => {
      // Email pattern
      const emailRegex = createSafeRegex('^[^@]+@[^@]+\\.[^@]+$')
      expect(emailRegex?.test('user@example.com')).toBe(true)
      expect(emailRegex?.test('invalid.email')).toBe(false)

      // Phone pattern
      const phoneRegex = createSafeRegex('^\\d{3}-\\d{3}-\\d{4}$')
      expect(phoneRegex?.test('123-456-7890')).toBe(true)
      expect(phoneRegex?.test('123456789')).toBe(false)

      // URL pattern
      const urlRegex = createSafeRegex('^https?://')
      expect(urlRegex?.test('http://example.com')).toBe(true)
      expect(urlRegex?.test('https://example.com')).toBe(true)
      expect(urlRegex?.test('ftp://example.com')).toBe(false)
    })

    it('handles word boundaries', () => {
      const regex = createSafeRegex('\\bword\\b')
      expect(regex?.test('word')).toBe(true)
      expect(regex?.test('a word here')).toBe(true)
      expect(regex?.test('sword')).toBe(false)
      expect(regex?.test('wording')).toBe(false)
    })

    it('handles anchors', () => {
      const startRegex = createSafeRegex('^start')
      expect(startRegex?.test('start of line')).toBe(true)
      expect(startRegex?.test('not at start')).toBe(false)

      const endRegex = createSafeRegex('end$')
      expect(endRegex?.test('at the end')).toBe(true)
      expect(endRegex?.test('end not here')).toBe(false)

      const exactRegex = createSafeRegex('^exact$')
      expect(exactRegex?.test('exact')).toBe(true)
      expect(exactRegex?.test('exactly')).toBe(false)
      expect(exactRegex?.test('inexact')).toBe(false)
    })

    it('handles character classes', () => {
      const digitRegex = createSafeRegex('^\\d+$')
      expect(digitRegex?.test('12345')).toBe(true)
      expect(digitRegex?.test('12a45')).toBe(false)

      const alphaRegex = createSafeRegex('^[a-zA-Z]+$')
      expect(alphaRegex?.test('abcXYZ')).toBe(true)
      expect(alphaRegex?.test('abc123')).toBe(false)

      const mixedRegex = createSafeRegex('^[a-zA-Z0-9_-]+$')
      expect(mixedRegex?.test('user_name-123')).toBe(true)
      expect(mixedRegex?.test('user@name')).toBe(false)
    })

    it('handles quantifiers', () => {
      const exactRegex = createSafeRegex('^\\d{5}$')
      expect(exactRegex?.test('12345')).toBe(true)
      expect(exactRegex?.test('1234')).toBe(false)
      expect(exactRegex?.test('123456')).toBe(false)

      const rangeRegex = createSafeRegex('^\\d{3,5}$')
      expect(rangeRegex?.test('12')).toBe(false)
      expect(rangeRegex?.test('123')).toBe(true)
      expect(rangeRegex?.test('12345')).toBe(true)
      expect(rangeRegex?.test('123456')).toBe(false)

      const minRegex = createSafeRegex('^\\d{3,}$')
      expect(minRegex?.test('12')).toBe(false)
      expect(minRegex?.test('123')).toBe(true)
      expect(minRegex?.test('123456789')).toBe(true)
    })
  })

  describe('Performance', () => {
    it('validates patterns quickly', () => {
      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        isValidRegex('test.*pattern')
        isValidRegex('[a-z]+@[a-z]+\\.[a-z]+')
        isValidRegex('\\d{3}-\\d{3}-\\d{4}')
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete 3000 validations in less than 100ms
      expect(duration).toBeLessThan(100)
    })

    it('creates regex instances efficiently', () => {
      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        const regex = createSafeRegex('test\\d+', 'gi')
        if (regex) {
          regex.test('test123')
        }
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete 1000 regex creations and tests in less than 50ms
      expect(duration).toBeLessThan(50)
    })
  })
})
