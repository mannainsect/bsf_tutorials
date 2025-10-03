interface ExchangeRateCache {
  [currency: string]: {
    rate: number
    timestamp: number
  }
}

const CACHE_KEY = 'currency_exchange_rates'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const API_TIMEOUT = 5000 // 5 seconds

// Request deduplication
const pendingRequests = new Map<string, Promise<number | null>>()

export const useCurrencyExchange = () => {
  const config = useRuntimeConfig()

  const getUSDRate = async (
    currency: string
  ): Promise<number | null> => {
    // Check feature flag
    if (!config.public.featureFlags?.enableUSDConversion) {
      return null
    }

    if (currency === 'USD') return 1

    // Check for pending request
    if (pendingRequests.has(currency)) {
      return pendingRequests.get(currency)!
    }

    // Create new request promise
    const requestPromise = fetchRateWithCache(currency)
    pendingRequests.set(currency, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      pendingRequests.delete(currency)
    }
  }

  const fetchRateWithCache = async (
    currency: string
  ): Promise<number | null> => {
    try {
      // Check cache first
      const cached = getCachedRate(currency)
      if (cached !== null) return cached

      // Fetch from API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_TIMEOUT
      )

      // Use v6 API if key is available, otherwise use v4 (no key)
      const apiKey = config.public.exchangeRateApiKey
      const apiUrl = apiKey
        ? `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${currency}/USD`
        : `https://api.exchangerate-api.com/v4/latest/${currency}`

      let response: Response
      try {
        response = await fetch(apiUrl, { signal: controller.signal })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) return null

      const data = await response.json()

      // Handle different API response formats
      let rate: number | undefined
      if (config.public.exchangeRateApiKey) {
        // v6 API response format
        rate = data.conversion_rate
      } else {
        // v4 API response format
        rate = data.rates?.USD
      }

      if (rate && typeof rate === 'number') {
        saveToCache(currency, rate)
        return rate
      }

      return null
    } catch (error) {
      // Silent failure - return null
      console.warn(
        `Currency conversion failed for ${currency}:`,
        error
      )
      return null
    }
  }

  const getCachedRate = (currency: string): number | null => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY)
      if (!cacheStr) return null

      const cache: ExchangeRateCache = JSON.parse(cacheStr)
      const cached = cache[currency]

      if (!cached) return null

      const now = Date.now()
      if (now - cached.timestamp > CACHE_DURATION) {
        // Cache expired
        return null
      }

      return cached.rate
    } catch {
      return null
    }
  }

  const saveToCache = (currency: string, rate: number) => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY)
      const cache: ExchangeRateCache = cacheStr
        ? JSON.parse(cacheStr)
        : {}

      cache[currency] = {
        rate,
        timestamp: Date.now()
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.warn('Failed to save exchange rate to cache:', error)
    }
  }

  return { getUSDRate }
}