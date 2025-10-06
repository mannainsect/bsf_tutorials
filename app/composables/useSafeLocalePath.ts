import type { RouteLocationRaw } from 'vue-router'
import type { Ref } from 'vue'

/**
 * Type definitions for route handling
 */
type LocaleCode = 'en' | 'es' | 'fr' | 'de' | 'pt'
type RouteInput = RouteLocationRaw | string
type LocalePathOptions = LocaleCode | undefined

/**
 * Cache for resolved paths to improve performance
 */
const pathCache = new Map<string, string>()

/**
 * Safe wrapper around Nuxt i18n useLocalePath composable
 * Provides fallback behavior for missing locale configurations
 * and graceful error handling for navigation failures
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { localePath } = useSafeLocalePath()
 * router.push(localePath('/account'))
 *
 * // With specific locale
 * const spanishPath = localePath('/account', 'es')
 *
 * // Check if i18n is available
 * const { isAvailable } = useSafeLocalePath()
 * if (isAvailable()) {
 *   // Full i18n features available
 * }
 * ```
 */
export const useSafeLocalePath = () => {
  let localePath: ReturnType<typeof useLocalePath> | null = null
  let currentLocale: Ref<string> | null = null

  try {
    // Try to get the native localePath function
    localePath = useLocalePath()
    const { locale } = useI18n()
    currentLocale = locale
  } catch (error) {
    console.warn('useLocalePath not available:', error)
  }

  /**
   * Generate cache key for path resolution
   */
  const getCacheKey = (
    route: RouteInput,
    locale?: LocalePathOptions
  ): string => {
    const routeStr = typeof route === 'string' ? route : JSON.stringify(route)
    const localeStr = locale || currentLocale?.value || 'default'
    return `${localeStr}:${routeStr}`
  }

  /**
   * Fallback path resolution when localePath is not available
   */
  const fallbackPathResolver = (
    route: RouteInput,
    locale?: LocalePathOptions
  ): string => {
    // Handle string routes
    if (typeof route === 'string') {
      const targetLocale = locale || currentLocale?.value || 'en'

      // If route already has locale prefix, return as is
      const localePattern = /^\/(en|es|fr|de|pt)(\/|$)/
      if (localePattern.test(route)) {
        return route
      }

      // Add locale prefix for non-default locale
      if (targetLocale !== 'en') {
        const cleanPath = route.startsWith('/') ? route : `/${route}`
        return `/${targetLocale}${cleanPath}`
      }

      return route
    }

    // Handle complex route objects
    if (typeof route === 'object' && route !== null) {
      const routeObj = route as Record<string, unknown>

      // If it has a path property, process it
      if (routeObj.path && typeof routeObj.path === 'string') {
        return fallbackPathResolver(routeObj.path, locale)
      }

      // If it has a name property, return as is
      // (named routes need proper i18n setup)
      if (routeObj.name && typeof routeObj.name === 'string') {
        console.warn(`Named route "${routeObj.name}" requires i18n setup`)
        return routeObj.name
      }
    }

    // Last resort: return root path
    return '/'
  }

  /**
   * Main function to get localized path with fallback and caching
   */
  const safeLocalePath = (
    route: RouteInput,
    locale?: LocalePathOptions
  ): string => {
    try {
      // Check cache first
      const cacheKey = getCacheKey(route, locale)
      if (pathCache.has(cacheKey)) {
        return pathCache.get(cacheKey)!
      }

      let resolvedPath: string

      // Try to use native localePath if available
      if (localePath) {
        try {
          resolvedPath = localePath(route, locale)
        } catch (error) {
          console.warn('Failed to resolve path with localePath:', error)
          resolvedPath = fallbackPathResolver(route, locale)
        }
      } else {
        // Use fallback resolver
        resolvedPath = fallbackPathResolver(route, locale)
      }

      // Cache the resolved path
      pathCache.set(cacheKey, resolvedPath)

      // Limit cache size to prevent memory leaks
      if (pathCache.size > 100) {
        const firstKey = pathCache.keys().next().value
        if (firstKey) pathCache.delete(firstKey)
      }

      return resolvedPath
    } catch (error) {
      console.error('Failed to resolve localized path:', error)

      // Ultimate fallback: return original path or root
      if (typeof route === 'string') {
        return route
      }
      return '/'
    }
  }

  /**
   * Clear the path cache (useful for locale changes)
   */
  const clearCache = () => {
    pathCache.clear()
  }

  /**
   * Check if locale path resolution is available
   */
  const isAvailable = () => {
    return localePath !== null
  }

  return {
    localePath: safeLocalePath,
    clearCache,
    isAvailable
  }
}

/**
 * Export type for use in other components
 */
export type SafeLocalePath = ReturnType<typeof useSafeLocalePath>
