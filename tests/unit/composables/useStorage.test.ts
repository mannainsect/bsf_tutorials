import { describe, it, expect, beforeEach } from 'vitest'
import { useStorage } from '~/composables/useStorage'

describe('useStorage composable', () => {
  // NOTE: SSR branch (import.meta.client === false) is unreachable
  // in jsdom because vitest.config.mjs replaces import.meta.client
  // with (!import.meta.env?.SSR) which is always true.

  let storage: ReturnType<typeof useStorage>

  beforeEach(() => {
    storage = useStorage()
  })

  describe('round-trip primitives', () => {
    it('stores and retrieves a string', () => {
      storage.set('k-str', 'hello')
      expect(storage.get<string>('k-str')).toBe('hello')
    })

    it('stores and retrieves a number', () => {
      storage.set('k-num', 42)
      expect(storage.get<number>('k-num')).toBe(42)
    })

    it('stores and retrieves a boolean', () => {
      storage.set('k-bool', true)
      expect(storage.get<boolean>('k-bool')).toBe(true)
    })
  })

  describe('round-trip complex types', () => {
    it('stores and retrieves an object', () => {
      const obj = { name: 'Alice', age: 30 }
      storage.set('k-obj', obj)
      expect(storage.get('k-obj')).toEqual(obj)
    })

    it('stores and retrieves an array', () => {
      const arr = [1, 'two', { three: 3 }]
      storage.set('k-arr', arr)
      expect(storage.get('k-arr')).toEqual(arr)
    })
  })

  describe('missing keys', () => {
    it('returns null for a key that was never set', () => {
      expect(storage.get('never-set')).toBeNull()
    })

    it('does not call removeItem for a missing key', () => {
      storage.get('never-set')
      expect(localStorage.removeItem).not.toHaveBeenCalled()
    })
  })

  describe('set writes JSON.stringify value', () => {
    it('raw localStorage value is JSON-stringified', () => {
      storage.set('k-raw', { a: 1 })
      const raw = localStorage.getItem('k-raw')
      expect(raw).toBe(JSON.stringify({ a: 1 }))
    })

    it('string value is double-quoted in storage', () => {
      storage.set('k-raw-str', 'hello')
      const raw = localStorage.getItem('k-raw-str')
      expect(raw).toBe('"hello"')
    })
  })

  describe('remove and clear', () => {
    it('remove deletes a single key', () => {
      storage.set('k-del', 'value')
      storage.remove('k-del')
      expect(storage.get('k-del')).toBeNull()
    })

    it('clear removes all keys', () => {
      storage.set('k1', 'a')
      storage.set('k2', 'b')
      storage.clear()
      expect(storage.get('k1')).toBeNull()
      expect(storage.get('k2')).toBeNull()
    })
  })

  describe('corruption handling', () => {
    // Verifies get() returns null and removes the key
    // when localStorage holds unparseable JSON data.

    const corruptValues = ['{not json', 'undefined', '[1,', '{"a":}']

    it.each(corruptValues)('returns null for corrupt value: %s', corrupt => {
      localStorage.setItem('bad', corrupt)
      expect(storage.get('bad')).toBeNull()
    })

    it.each(corruptValues)('removes corrupt key from localStorage: %s', corrupt => {
      localStorage.setItem('bad', corrupt)
      storage.get('bad')
      expect(localStorage.getItem('bad')).toBeNull()
    })

    it('does not throw for corrupt data', () => {
      localStorage.setItem('bad', '{not json')
      expect(() => storage.get('bad')).not.toThrow()
    })
  })
})
