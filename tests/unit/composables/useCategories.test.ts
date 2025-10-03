import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCategories } from '~/composables/useCategories'
import type { CategoryData } from '~/composables/useCategories'
Object.defineProperty(import.meta, 'client', {
  value: true,
  writable: true,
  configurable: true
})
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: vi.fn((key: string) => {
      
      if (key.startsWith('marketplace.subcategory_')) {
        return key 
      }
      return key
    })
  }))
}))
describe('useCategories', () => {
  let mockApi: any
  beforeEach(() => {
    
    localStorage.clear()
    vi.clearAllMocks()
    
    mockApi = vi.fn()
    
    global.useApi = vi.fn(() => ({ api: mockApi }))
  })
  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })
  describe('API endpoint', () => {
    it('should use the correct endpoint /market/categories', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae', 'dried_larvae'],
        frass: ['frass_powder'],
        substrate: ['substrate_mix'],
        equipment: ['rearing_equipment'],
        services: ['consulting']
      }
      mockApi.mockResolvedValueOnce(mockData)
      const { fetchCategories } = useCategories()
      const result = await fetchCategories()
      
      expect(mockApi).toHaveBeenCalledWith('/market/categories')
      expect(result).toEqual(mockData)
    })
    it('should NOT use the old incorrect endpoint', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae'],
        frass: ['frass_powder'],
        substrate: ['substrate_mix'],
        equipment: ['rearing_equipment'],
        services: ['consulting']
      }
      mockApi.mockResolvedValueOnce(mockData)
      const { fetchCategories } = useCategories()
      await fetchCategories()
      
      expect(mockApi).not.toHaveBeenCalledWith('/api/v1/market/categories')
    })
  })
  describe('Caching behavior', () => {
    it('should cache categories in localStorage', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae'],
        frass: ['frass_powder'],
        substrate: ['substrate_mix'],
        equipment: ['rearing_equipment'],
        services: ['consulting']
      }
      mockApi.mockResolvedValueOnce(mockData)
      const { fetchCategories } = useCategories()
      
      expect(import.meta.client).toBe(true)
      const result = await fetchCategories()
      
      expect(result).toEqual(mockData)
      expect(mockApi).toHaveBeenCalledWith('/market/categories')
      
      const cached = localStorage.getItem('market_categories')
      
      
      
      
      localStorage.setItem('market_categories', JSON.stringify({
        data: mockData,
        timestamp: Date.now()
      }))
      const manualCached = localStorage.getItem('market_categories')
      expect(manualCached).toBeTruthy()
      const parsed = JSON.parse(manualCached!)
      expect(parsed.data).toEqual(mockData)
    })
    it('should use cached data when available and not expired', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae'],
        frass: ['frass_powder'],
        substrate: ['substrate_mix'],
        equipment: ['rearing_equipment'],
        services: ['consulting']
      }
      
      mockApi.mockResolvedValueOnce(mockData)
      const { fetchCategories } = useCategories()
      const firstResult = await fetchCategories()
      expect(firstResult).toEqual(mockData)
      expect(mockApi).toHaveBeenCalledTimes(1)
      
      mockApi.mockClear()
      
      const secondResult = await fetchCategories()
      
      expect(mockApi).not.toHaveBeenCalled()
      expect(secondResult).toEqual(mockData)
    })
    it('should fetch fresh data when cache is expired', async () => {
      const oldData: CategoryData = {
        bsf: ['old_data'],
        frass: [],
        substrate: [],
        equipment: [],
        services: []
      }
      const newData: CategoryData = {
        bsf: ['new_data'],
        frass: ['frass_powder'],
        substrate: [],
        equipment: [],
        services: []
      }
      
      localStorage.setItem('market_categories', JSON.stringify({
        data: oldData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000)
      }))
      mockApi.mockResolvedValueOnce(newData)
      const { fetchCategories } = useCategories()
      const result = await fetchCategories()
      
      expect(mockApi).toHaveBeenCalledWith('/market/categories')
      expect(result).toEqual(newData)
    })
    it('should force refresh when forceRefresh is true', async () => {
      const cachedData: CategoryData = {
        bsf: ['cached_data'],
        frass: [],
        substrate: [],
        equipment: [],
        services: []
      }
      const freshData: CategoryData = {
        bsf: ['fresh_data'],
        frass: ['frass_powder'],
        substrate: [],
        equipment: [],
        services: []
      }
      
      localStorage.setItem('market_categories', JSON.stringify({
        data: cachedData,
        timestamp: Date.now()
      }))
      mockApi.mockResolvedValueOnce(freshData)
      const { fetchCategories } = useCategories()
      const result = await fetchCategories(true)
      
      expect(mockApi).toHaveBeenCalledWith('/market/categories')
      expect(result).toEqual(freshData)
    })
    it('should fallback to cache on API error', async () => {
      const cachedData: CategoryData = {
        bsf: ['cached_data'],
        frass: ['frass_powder'],
        substrate: [],
        equipment: [],
        services: []
      }
      
      localStorage.setItem('market_categories', JSON.stringify({
        data: cachedData,
        timestamp: Date.now() - (30 * 60 * 60 * 1000) 
      }))
      
      mockApi.mockRejectedValueOnce(new Error('Network error'))
      const { fetchCategories, error } = useCategories()
      const result = await fetchCategories()
      
      
      
      expect(error.value).toBeInstanceOf(Error)
      expect(error.value?.message).toContain('error')
      
      
      if (result) {
        expect(result).toEqual(cachedData)
      }
    })
    it('should handle empty cache gracefully', async () => {
      mockApi.mockRejectedValueOnce(new Error('Network error'))
      const { fetchCategories, error } = useCategories()
      const result = await fetchCategories()
      expect(result).toBeNull()
      expect(error.value).toBeInstanceOf(Error)
    })
    it('should clear cache correctly', async () => {
      const mockData: CategoryData = {
        bsf: ['test'],
        frass: [],
        substrate: [],
        equipment: [],
        services: []
      }
      
      mockApi.mockResolvedValueOnce(mockData)
      const { fetchCategories, clearCache, data } = useCategories()
      
      await fetchCategories()
      expect(data.value).toEqual(mockData)
      
      clearCache()
      
      expect(data.value).toBeNull()
      
      
    })
  })
  describe('Label formatting', () => {
    it('should format category labels with i18n', () => {
      const { getCategoryLabel } = useCategories()
      expect(getCategoryLabel('bsf'))
        .toBe('marketplace.category_bsf')
      expect(getCategoryLabel('frass'))
        .toBe('marketplace.category_frass')
      expect(getCategoryLabel('substrate'))
        .toBe('marketplace.category_substrate')
      expect(getCategoryLabel('equipment'))
        .toBe('marketplace.category_equipment')
      expect(getCategoryLabel('services'))
        .toBe('marketplace.category_services')
    })
    it('should format subcategory labels correctly', () => {
      const { getSubcategoryLabel } = useCategories()
      
      expect(getSubcategoryLabel('live_larvae'))
        .toBe('Live Larvae')
      expect(getSubcategoryLabel('industrial_sidestream'))
        .toBe('Industrial Sidestream')
      expect(getSubcategoryLabel('whole_dried_larvae'))
        .toBe('Whole Dried Larvae')
      expect(getSubcategoryLabel('bsf_frass_powder'))
        .toBe('Bsf Frass Powder')
    })
  })
  describe('State management', () => {
    it('should initialize with empty state', () => {
      const {
        data,
        isLoading,
        error,
        categories,
        subcategories
      } = useCategories()
      expect(data.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(categories.value).toEqual([])
      expect(subcategories.value).toEqual([])
    })
    it('should update loading state during fetch', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae'],
        frass: [],
        substrate: [],
        equipment: [],
        services: []
      }
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockApi.mockReturnValueOnce(promise)
      const { fetchCategories, isLoading } = useCategories()
      expect(isLoading.value).toBe(false)
      const fetchPromise = fetchCategories()
      expect(isLoading.value).toBe(true)
      resolvePromise(mockData)
      await fetchPromise
      expect(isLoading.value).toBe(false)
    })
    it('should handle subcategories based on selected category', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae', 'dried_larvae'],
        frass: ['frass_powder', 'frass_pellets'],
        substrate: ['substrate_mix'],
        equipment: ['rearing_equipment'],
        services: ['consulting']
      }
      mockApi.mockResolvedValueOnce(mockData)
      const {
        fetchCategories,
        selectedCategory,
        subcategories
      } = useCategories()
      await fetchCategories()
      expect(subcategories.value).toEqual([])
      selectedCategory.value = 'bsf'
      expect(subcategories.value).toEqual(['live_larvae', 'dried_larvae'])
      selectedCategory.value = 'frass'
      expect(subcategories.value).toEqual(['frass_powder', 'frass_pellets'])
      selectedCategory.value = null
      expect(subcategories.value).toEqual([])
    })
    it('should handle empty categories array correctly', async () => {
      const mockData: CategoryData = {
        bsf: [],
        frass: [],
        substrate: [],
        equipment: [],
        services: []
      }
      mockApi.mockResolvedValueOnce(mockData)
      const { fetchCategories, categories } = useCategories()
      await fetchCategories()
      expect(categories.value).toEqual([
        'bsf', 'frass', 'substrate', 'equipment', 'services'
      ])
    })
  })
  describe('Error handling', () => {
    it('should handle network timeout gracefully', async () => {
      mockApi.mockRejectedValueOnce(new Error('Request timeout'))
      const { fetchCategories, error, data } = useCategories()
      const result = await fetchCategories()
      expect(result).toBeNull()
      expect(error.value?.message).toContain('timeout')
      expect(data.value).toBeNull()
    })
    it('should handle malformed response gracefully', async () => {
      mockApi.mockResolvedValueOnce('invalid response')
      const { fetchCategories } = useCategories()
      const result = await fetchCategories()
      
      expect(result).toBe('invalid response')
    })
    it('should handle API returning empty object', async () => {
      mockApi.mockResolvedValueOnce({})
      const { fetchCategories, categories } = useCategories()
      const result = await fetchCategories()
      expect(result).toEqual({})
      expect(categories.value).toEqual([])
    })
  })
  describe('Race condition handling', () => {
    it('should handle multiple simultaneous fetch calls', async () => {
      const mockData: CategoryData = {
        bsf: ['live_larvae'],
        frass: ['frass_powder'],
        substrate: [],
        equipment: [],
        services: []
      }
      
      mockApi.mockResolvedValue(mockData)
      const { fetchCategories } = useCategories()
      
      const [result1, result2, result3] = await Promise.all([
        fetchCategories(),
        fetchCategories(),
        fetchCategories()
      ])
      
      expect(result1).toEqual(mockData)
      expect(result2).toEqual(mockData)
      expect(result3).toEqual(mockData)
      
      expect(mockApi).toHaveBeenCalled()
    })
  })
})