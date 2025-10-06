import { ref } from 'vue'
import DOMPurify from 'isomorphic-dompurify'

// Types
interface TranslationProvider {
  name: string
  translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null>
}

interface CacheEntry {
  translation: string
  timestamp: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Constants
const MAX_TEXT_LENGTH = 5000
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in ms
const USER_RATE_LIMIT = 10 // per hour
const USER_RATE_WINDOW = 60 * 60 * 1000 // 1 hour in ms
const FETCH_TIMEOUT = 8000 // 8 seconds timeout for API calls

// Helper function for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

// LibreTranslate Provider
class LibreTranslateProvider implements TranslationProvider {
  name = 'LibreTranslate'
  private endpoint = 'https://libretranslate.com/translate'
  private rateLimit = 100
  private rateWindow = 60 * 60 * 1000 // 1 hour

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null> {
    if (!this.checkRateLimit()) {
      console.warn('LibreTranslate rate limit reached')
      return null
    }

    try {
      const response = await fetchWithTimeout(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      this.updateRateLimit()
      return data.translatedText || null
    } catch (error) {
      console.error('LibreTranslate error:', error)
      return null
    }
  }

  private checkRateLimit(): boolean {
    const key = 'libre_rate_limit'
    const stored = localStorage.getItem(key)
    if (!stored) return true

    const limit: RateLimitEntry = JSON.parse(stored)
    const now = Date.now()

    if (now > limit.resetTime) {
      return true
    }

    return limit.count < this.rateLimit
  }

  private updateRateLimit(): void {
    const key = 'libre_rate_limit'
    const stored = localStorage.getItem(key)
    const now = Date.now()

    let limit: RateLimitEntry
    if (!stored) {
      limit = { count: 1, resetTime: now + this.rateWindow }
    } else {
      limit = JSON.parse(stored)
      if (now > limit.resetTime) {
        limit = { count: 1, resetTime: now + this.rateWindow }
      } else {
        limit.count++
      }
    }

    localStorage.setItem(key, JSON.stringify(limit))
  }
}

// MyMemory Provider
class MyMemoryProvider implements TranslationProvider {
  name = 'MyMemory'
  private baseUrl = 'https://api.mymemory.translated.net/get'
  private rateLimit = 1000
  private rateWindow = 24 * 60 * 60 * 1000 // 24 hours

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null> {
    if (!this.checkRateLimit()) {
      console.warn('MyMemory rate limit reached')
      return null
    }

    try {
      const langPair = `${sourceLang}|${targetLang}`
      const url =
        `${this.baseUrl}?q=${encodeURIComponent(text)}` +
        `&langpair=${langPair}`

      const response = await fetchWithTimeout(url, {})
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.responseStatus !== 200) {
        throw new Error(data.responseDetails || 'Translation failed')
      }

      this.updateRateLimit()
      return data.responseData.translatedText || null
    } catch (error) {
      console.error('MyMemory error:', error)
      return null
    }
  }

  private checkRateLimit(): boolean {
    const key = 'mymemory_rate_limit'
    const stored = localStorage.getItem(key)
    if (!stored) return true

    const limit: RateLimitEntry = JSON.parse(stored)
    const now = Date.now()

    if (now > limit.resetTime) {
      return true
    }

    return limit.count < this.rateLimit
  }

  private updateRateLimit(): void {
    const key = 'mymemory_rate_limit'
    const stored = localStorage.getItem(key)
    const now = Date.now()

    let limit: RateLimitEntry
    if (!stored) {
      limit = { count: 1, resetTime: now + this.rateWindow }
    } else {
      limit = JSON.parse(stored)
      if (now > limit.resetTime) {
        limit = { count: 1, resetTime: now + this.rateWindow }
      } else {
        limit.count++
      }
    }

    localStorage.setItem(key, JSON.stringify(limit))
  }
}

// Main composable
export function useTranslation() {
  const isTranslating = ref(false)
  const error = ref<string | null>(null)

  const providers: TranslationProvider[] = [
    new LibreTranslateProvider(),
    new MyMemoryProvider()
  ]

  // Check user rate limit
  function checkUserRateLimit(): boolean {
    const key = 'user_translation_limit'
    const stored = localStorage.getItem(key)
    if (!stored) return true

    const limit: RateLimitEntry = JSON.parse(stored)
    const now = Date.now()

    if (now > limit.resetTime) {
      return true
    }

    return limit.count < USER_RATE_LIMIT
  }

  // Update user rate limit
  function updateUserRateLimit(): void {
    const key = 'user_translation_limit'
    const stored = localStorage.getItem(key)
    const now = Date.now()

    let limit: RateLimitEntry
    if (!stored) {
      limit = { count: 1, resetTime: now + USER_RATE_WINDOW }
    } else {
      limit = JSON.parse(stored)
      if (now > limit.resetTime) {
        limit = { count: 1, resetTime: now + USER_RATE_WINDOW }
      } else {
        limit.count++
      }
    }

    localStorage.setItem(key, JSON.stringify(limit))
  }

  // Generate cache key using hash or truncated text
  function generateCacheKey(
    text: string,
    source: string,
    target: string
  ): string {
    // Create a simple hash of the text to avoid btoa Unicode issues
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    // Include truncated text start for uniqueness
    const textPreview = text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')
    return `trans_${source}_${target}_${hash}_${textPreview}`
  }

  // Get cached translation
  function getCachedTranslation(
    text: string,
    source: string,
    target: string
  ): string | null {
    const cacheKey = generateCacheKey(text, source, target)
    const stored = localStorage.getItem(cacheKey)
    if (!stored) return null

    const entry: CacheEntry = JSON.parse(stored)
    const now = Date.now()

    if (now - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return entry.translation
  }

  // Cache translation
  function cacheTranslation(
    text: string,
    source: string,
    target: string,
    translation: string
  ): void {
    const cacheKey = generateCacheKey(text, source, target)
    const entry: CacheEntry = {
      translation,
      timestamp: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(entry))
  }

  // Open Google Translate in new tab
  function openGoogleTranslate(
    text: string,
    sourceLang: string = 'auto',
    targetLang: string = 'es'
  ): void {
    // Encode the text for URL
    const encodedText = encodeURIComponent(text)

    // Map our language codes to Google Translate codes if needed
    const langMap: Record<string, string> = {
      en: 'en',
      es: 'es',
      fr: 'fr',
      de: 'de',
      pt: 'pt',
      it: 'it',
      ru: 'ru',
      zh: 'zh',
      ja: 'ja',
      ko: 'ko',
      ar: 'ar',
      auto: 'auto'
    }

    const googleSourceLang = langMap[sourceLang] || 'auto'
    const googleTargetLang = langMap[targetLang] || 'es'

    // Build Google Translate URL
    const googleTranslateUrl = `https://translate.google.com/?sl=${googleSourceLang}&tl=${googleTargetLang}&text=${encodedText}&op=translate`

    // Open in new tab
    window.open(googleTranslateUrl, '_blank')
  }

  // Main translate function
  async function translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'es'
  ): Promise<string> {
    error.value = null

    // Validate input
    if (!text || text.trim().length === 0) {
      error.value = 'Text is required'
      throw new Error(error.value)
    }

    if (text.length > MAX_TEXT_LENGTH) {
      error.value = `Text exceeds ${MAX_TEXT_LENGTH} characters`
      throw new Error(error.value)
    }

    // Check user rate limit
    if (!checkUserRateLimit()) {
      error.value = 'Translation limit reached (10 per hour)'
      throw new Error(error.value)
    }

    // Check cache first
    const cached = getCachedTranslation(text, sourceLang, targetLang)
    if (cached) {
      return cached
    }

    isTranslating.value = true

    try {
      // Always use Google Translate directly - no API calls
      openGoogleTranslate(text, sourceLang, targetLang)

      // Return a success message
      const successMessage = 'Opening Google Translate in new tab...'

      // Update rate limit tracking (optional, for consistency)
      updateUserRateLimit()

      // Don't cache since we're not actually translating
      return successMessage
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Translation failed'
      throw err
    } finally {
      isTranslating.value = false
    }
  }

  return {
    translate,
    isTranslating,
    error
  }
}
