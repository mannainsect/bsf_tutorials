import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  truncateText,
  capitalizeFirst,
  toKebabCase,
  formatFileSize,
  formatUSDConversion
} from '~/utils/formatters'
describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date with default locale', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/1\/15\/2024|15\/1\/2024/)
    })
    it('should format date string', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/1\/15\/2024|15\/1\/2024/)
    })
    it('should format date with specific locale', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date, 'de-DE')
      expect(result).toContain('15')
    })
  })
  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDateTime(date)
      expect(result).toContain('10')
      expect(result).toContain('30')
    })
  })
  describe('formatRelativeTime', () => {
    it('should return "just now" for very recent times', () => {
      const now = new Date()
      const result = formatRelativeTime(now)
      expect(result).toBe('just now')
    })
    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000)
      const result = formatRelativeTime(date)
      expect(result).toBe('5m ago')
    })
    it('should return hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const result = formatRelativeTime(date)
      expect(result).toBe('3h ago')
    })
    it('should return days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(date)
      expect(result).toBe('2d ago')
    })
  })
  describe('formatNumber', () => {
    it('should format number with default locale', () => {
      const result = formatNumber(1234567.89)
      expect(result).toBe('1,234,567.89')
    })
    it('should format number with specific locale', () => {
      const result = formatNumber(1234567.89, 'de-DE')
      expect(result).toBe('1.234.567,89')
    })
  })
  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      const result = formatCurrency(1234.56)
      expect(result).toBe('$1,234.56')
    })
    it('should format currency with EUR', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de-DE')
      expect(result).toMatch(/1\.234,56/)
    })
  })
  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      const result = formatPercentage(0.1234)
      expect(result).toBe('12.3%')
    })
    it('should format percentage with custom decimals', () => {
      const result = formatPercentage(0.1234, 2)
      expect(result).toBe('12.34%')
    })
  })
  describe('truncateText', () => {
    it('should not truncate short text', () => {
      const result = truncateText('Short text', 20)
      expect(result).toBe('Short text')
    })
    it('should truncate long text', () => {
      const result = truncateText('This is a very long text', 10)
      expect(result).toBe('This is...')
    })
  })
  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      const result = capitalizeFirst('hello WORLD')
      expect(result).toBe('Hello world')
    })
    it('should handle empty string', () => {
      const result = capitalizeFirst('')
      expect(result).toBe('')
    })
  })
  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      const result = toKebabCase('camelCaseString')
      expect(result).toBe('camel-case-string')
    })
    it('should convert spaces to dashes', () => {
      const result = toKebabCase('string with spaces')
      expect(result).toBe('string-with-spaces')
    })
    it('should convert underscores to dashes', () => {
      const result = toKebabCase('string_with_underscores')
      expect(result).toBe('string-with-underscores')
    })
  })
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      const result = formatFileSize(0)
      expect(result).toBe('0 Bytes')
    })
    it('should format bytes', () => {
      const result = formatFileSize(512)
      expect(result).toBe('512 Bytes')
    })
    it('should format KB', () => {
      const result = formatFileSize(1536)
      expect(result).toBe('1.5 KB')
    })
    it('should format MB', () => {
      const result = formatFileSize(1048576 * 2.5)
      expect(result).toBe('2.5 MB')
    })
    it('should format GB', () => {
      const result = formatFileSize(1073741824 * 1.5)
      expect(result).toBe('1.5 GB')
    })
  })
  describe('formatUSDConversion', () => {
    it('should format USD currency with 2 decimal places', () => {
      const result = formatUSDConversion(1234.5)
      expect(result).toBe('$1,234.50')
    })
    it('should format USD currency with exact 2 decimal places', () => {
      const result = formatUSDConversion(1234.567)
      expect(result).toBe('$1,234.57')
    })
    it('should format small amounts correctly', () => {
      const result = formatUSDConversion(0.99)
      expect(result).toBe('$0.99')
    })
    it('should format large amounts with thousand separators', () => {
      const result = formatUSDConversion(1234567.89)
      expect(result).toBe('$1,234,567.89')
    })
    it('should handle zero correctly', () => {
      const result = formatUSDConversion(0)
      expect(result).toBe('$0.00')
    })
    it('should handle negative amounts', () => {
      const result = formatUSDConversion(-500.5)
      expect(result).toBe('-$500.50')
    })
    it('should round to 2 decimal places', () => {
      const result = formatUSDConversion(10.999)
      expect(result).toBe('$11.00')
    })
    it('should maintain exactly 2 decimal places for whole numbers', () => {
      const result = formatUSDConversion(100)
      expect(result).toBe('$100.00')
    })
  })
})
