import { ref, computed, readonly } from 'vue'
import { useI18n } from 'vue-i18n'

// Type definitions
export interface CategoryData {
  bsf: string[]
  frass: string[]
  substrate: string[]
  equipment: string[]
  services: string[]
}

// Cache configuration
const CACHE_KEY = 'market_categories'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export const useCategories = () => {
  const { api } = useApi()
  const { t } = useI18n()

  // State management
  const data = ref<CategoryData | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const selectedCategory = ref<keyof CategoryData | null>(null)

  // Computed properties
  const categories = computed(() =>
    data.value ? Object.keys(data.value) as (keyof CategoryData)[] : []
  )

  const subcategories = computed(() =>
    data.value && selectedCategory.value
      ? data.value[selectedCategory.value] || []
      : []
  )

  // Cache management
  const loadFromCache = (): CategoryData | null => {
    try {
      if (!import.meta.client) return null
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const { data: cachedData, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }
      return cachedData
    } catch {
      return null
    }
  }

  const saveToCache = (categoryData: CategoryData) => {
    try {
      if (!import.meta.client) return
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: categoryData,
        timestamp: Date.now()
      }))
    } catch (err) {
      console.warn('Failed to cache categories:', err)
    }
  }

  // API fetching with caching
  const fetchCategories = async (
    forceRefresh = false
  ): Promise<CategoryData | null> => {
    if (!forceRefresh && data.value) return data.value

    if (!forceRefresh) {
      const cached = loadFromCache()
      if (cached) {
        data.value = cached
        return cached
      }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await api<CategoryData>(
        '/market/categories'
      )
      data.value = response
      saveToCache(response)
      return response
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error('Failed to fetch categories')

      // Fallback to cache on error
      const cached = loadFromCache()
      if (cached) {
        data.value = cached
        return cached
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  const clearCache = () => {
    if (import.meta.client) localStorage.removeItem(CACHE_KEY)
    data.value = null
  }

  // Helper functions
  const getCategoryLabel = (category: keyof CategoryData): string => {
    const key = `marketplace.category_${category}`
    return t(key)
  }

  const getSubcategoryLabel = (subcategory: string): string => {
    const key = `marketplace.subcategory_${subcategory}`
    // Fallback to formatted label if translation doesn't exist
    const translated = t(key)
    if (translated === key) {
      // No translation found, use formatted label
      return subcategory.split('_')
        .map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ')
    }
    return translated
  }

  return {
    // State
    data: readonly(data),
    selectedCategory,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    categories,
    subcategories,

    // Methods
    fetchCategories,
    clearCache,
    getCategoryLabel,
    getSubcategoryLabel
  }
}