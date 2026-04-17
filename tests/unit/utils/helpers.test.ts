import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  uniqueArray,
  groupBy,
  sortBy,
  pick,
  omit,
  isEmpty,
  debounce,
  throttle,
  buildUrl,
  generateId
} from '../../../app/utils/helpers'

describe('Array utilities', () => {
  it('uniqueArray removes duplicates', () => {
    expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    expect(uniqueArray(['a', 'b', 'a'])).toEqual(['a', 'b'])
    expect(uniqueArray([])).toEqual([])
  })

  it('groupBy groups items by key function', () => {
    const items = [
      { id: 1, tag: 'a' },
      { id: 2, tag: 'b' },
      { id: 3, tag: 'a' }
    ]
    const result = groupBy(items, i => i.tag)
    expect(result).toEqual({
      a: [
        { id: 1, tag: 'a' },
        { id: 3, tag: 'a' }
      ],
      b: [{ id: 2, tag: 'b' }]
    })
  })

  it('groupBy returns empty record for empty array', () => {
    expect(groupBy([] as { tag: string }[], i => i.tag)).toEqual({})
  })

  it('sortBy sorts ascending by default', () => {
    const items = [{ id: 3 }, { id: 1 }, { id: 2 }]
    const sorted = sortBy(items, i => i.id)
    expect(sorted.map(i => i.id)).toEqual([1, 2, 3])
  })

  it('sortBy sorts descending', () => {
    const items = [{ id: 1 }, { id: 3 }, { id: 2 }]
    const sorted = sortBy(items, i => i.id, 'desc')
    expect(sorted.map(i => i.id)).toEqual([3, 2, 1])
  })

  it('sortBy does not mutate original array', () => {
    const items = [{ id: 2 }, { id: 1 }]
    const original = [...items]
    sortBy(items, i => i.id)
    expect(items).toEqual(original)
  })
})

describe('Object utilities', () => {
  it('pick selects specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('pick ignores missing keys', () => {
    const obj: Record<string, number> = { a: 1 }
    expect(pick(obj, ['a', 'b'])).toEqual({ a: 1 })
  })

  it('omit removes specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 })
  })

  it('omit removes multiple keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(omit(obj, ['a', 'c'])).toEqual({ b: 2 })
  })

  it('isEmpty returns true for null and undefined', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
  })

  it('isEmpty returns true for empty array and string', () => {
    expect(isEmpty([])).toBe(true)
    expect(isEmpty('')).toBe(true)
  })

  it('isEmpty returns true for empty object', () => {
    expect(isEmpty({})).toBe(true)
  })

  it('isEmpty returns false for non-empty values', () => {
    expect(isEmpty([1])).toBe(false)
    expect(isEmpty('hi')).toBe(false)
    expect(isEmpty({ a: 1 })).toBe(false)
  })

  it('isEmpty returns false for numbers', () => {
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(42)).toBe(false)
  })

  it('isEmpty returns false for booleans', () => {
    expect(isEmpty(false)).toBe(false)
    expect(isEmpty(true)).toBe(false)
  })
})

describe('Function utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('debounce delays execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('debounce resets timer on repeated calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('debounce forwards arguments', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('a', 42)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 42)
  })

  it('throttle fires first call immediately', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    expect(fn).toHaveBeenCalledOnce()
  })

  it('throttle suppresses calls during limit window', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throttle forwards arguments', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('x', 99)
    expect(fn).toHaveBeenCalledWith('x', 99)
  })
})

describe('URL utilities', () => {
  it('buildUrl appends query params', () => {
    const url = new URL(buildUrl('https://example.com', { q: 'test', p: 1 }))
    expect(url.origin).toBe('https://example.com')
    expect(url.searchParams.get('q')).toBe('test')
    expect(url.searchParams.get('p')).toBe('1')
  })

  it('buildUrl skips null and undefined values', () => {
    const url = buildUrl('https://example.com', {
      a: 'keep',
      b: null,
      c: undefined
    })
    expect(url).toBe('https://example.com/?a=keep')
  })

  it('buildUrl handles boolean params', () => {
    const url = buildUrl('https://example.com', { active: true })
    expect(url).toBe('https://example.com/?active=true')
  })
})

describe('Random utilities', () => {
  it('generateId returns string of default length 8', () => {
    const id = generateId()
    expect(id).toHaveLength(8)
  })

  it('generateId respects custom length', () => {
    expect(generateId(16)).toHaveLength(16)
    expect(generateId(1)).toHaveLength(1)
  })

  it('generateId contains only alphanumeric chars', () => {
    const id = generateId(100)
    expect(id).toMatch(/^[A-Za-z0-9]+$/)
  })
})
