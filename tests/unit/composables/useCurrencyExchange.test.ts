import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useCurrencyExchange } from '~/composables/useCurrencyExchange'
const mockFetch = vi.fn()
global.fetch = mockFetch
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      const newStore: Record<string, string> = {}
      Object.keys(store).forEach(k => {
        if (k !== key) {
          newStore[k] = store[k]
        }
      })
      store = newStore
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})
describe('useCurrencyExchange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockFetch.mockClear()
    vi.useFakeTimers()

    global.useRuntimeConfig.mockReturnValue({
      public: {
        featureFlags: {
          enableUSDConversion: true
        },
        exchangeRateApiKey: 'test-api-key'
      }
    })
  })
  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })
  describe('getUSDRate', () => {
    it('should return 1 for USD currency', async () => {
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('USD')
      expect(rate).toBe(1)
      expect(mockFetch).not.toHaveBeenCalled()
    })
    it('should return null when feature flag is disabled', async () => {
      global.useRuntimeConfig.mockReturnValue({
        public: {
          featureFlags: {
            enableUSDConversion: false
          },
          exchangeRateApiKey: 'test-api-key'
        }
      })
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(null)
      expect(mockFetch).not.toHaveBeenCalled()
    })
    it('should fetch rate from API when not cached', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          conversion_rate: 1.18
        })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(1.18)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://v6.exchangerate-api.com/v6/test-api-key/pair/EUR/USD',
        expect.any(Object)
      )
    })
    it('should use cached rate when available and not expired', async () => {
      const cache = {
        EUR: {
          rate: 1.2,
          timestamp: Date.now() - 1000
        }
      }
      localStorageMock.setItem(
        'currency_exchange_rates',
        JSON.stringify(cache)
      )
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(1.2)
      expect(mockFetch).not.toHaveBeenCalled()
    })
    it('should fetch new rate when cache is expired', async () => {
      const cache = {
        EUR: {
          rate: 1.2,
          timestamp: Date.now() - 25 * 60 * 60 * 1000
        }
      }
      localStorageMock.setItem(
        'currency_exchange_rates',
        JSON.stringify(cache)
      )
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          conversion_rate: 1.25
        })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(1.25)
      expect(mockFetch).toHaveBeenCalled()
    })
    it('should use v4 API when API key is not provided', async () => {
      global.useRuntimeConfig.mockReturnValue({
        public: {
          featureFlags: {
            enableUSDConversion: true
          },
          exchangeRateApiKey: ''
        }
      })
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          rates: {
            USD: 1.18
          }
        })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(1.18)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.exchangerate-api.com/v4/latest/EUR',
        expect.any(Object)
      )
    })
    it('should return null on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(null)
    })
    it('should return null when API returns non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      }
      mockFetch.mockResolvedValueOnce(mockResponse)
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(null)
    })
    it('should handle request deduplication', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          conversion_rate: 1.18
        })
      }
      mockFetch.mockResolvedValue(mockResponse)
      const { getUSDRate } = useCurrencyExchange()

      const [rate1, rate2, rate3] = await Promise.all([
        getUSDRate('EUR'),
        getUSDRate('EUR'),
        getUSDRate('EUR')
      ])
      expect(rate1).toBe(1.18)
      expect(rate2).toBe(1.18)
      expect(rate3).toBe(1.18)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
    it('should handle timeout properly', async () => {
      mockFetch.mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              reject(new Error('AbortError'))
            })
          }
        })
      })
      const { getUSDRate } = useCurrencyExchange()

      const promise = getUSDRate('EUR')

      await vi.advanceTimersByTimeAsync(5001)

      const result = await promise
      expect(result).toBe(null)
    })
    it('should save fetched rate to cache', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          conversion_rate: 1.18
        })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)
      const { getUSDRate } = useCurrencyExchange()
      await getUSDRate('EUR')

      expect(localStorageMock.setItem).toHaveBeenCalled()
      const savedCache = localStorageMock.setItem.mock.calls[0]
      expect(savedCache).toBeDefined()
      expect(savedCache[0]).toBe('currency_exchange_rates')
      const cache = JSON.parse(savedCache[1])
      expect(cache.EUR.rate).toBe(1.18)
      expect(cache.EUR.timestamp).toBeDefined()
    })
    it('should handle invalid cache data gracefully', async () => {
      localStorageMock.setItem('currency_exchange_rates', 'invalid-json')
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          conversion_rate: 1.18
        })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)
      const { getUSDRate } = useCurrencyExchange()
      const rate = await getUSDRate('EUR')
      expect(rate).toBe(1.18)
      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
