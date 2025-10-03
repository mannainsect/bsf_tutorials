import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useWanted } from '~/composables/useWanted'
import type {
  WantedPublicListing,
  Wanted,
  WantedPublicDetail,
  WantedAuthenticated
} from '~/shared/types/models/MarketplaceWanted'
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    api: vi.fn()
  }))
}))
vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: vi.fn(() => ({
    marketWanted: '/market/wanted'
  }))
}))
const mockRepository = {
  getWantedItems: vi.fn(),
  getWantedDetail: vi.fn(),
  getRandomWanted: vi.fn(),
  hasAuthentication: vi.fn()
}
vi.mock('~/composables/api/repositories/WantedRepository', () => ({
  WantedRepository: vi.fn(() => mockRepository)
}))
const createMockAuthStore = () => ({
  token: ref<string | null>(null),
  isAuthenticated: ref(false)
})
let mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => ({
  ...mockAuthStore,
  token: mockAuthStore.token.value,
  isAuthenticated: mockAuthStore.isAuthenticated.value
}))
global.ref = ref
global.computed = vi.fn((fn) => {
  const r = ref()
  const update = () => { r.value = fn() }
  update()
  return { get value() { update(); return r.value } }
})
global.readonly = vi.fn((v) => v)
global.watch = vi.fn()
global.onUnmounted = vi.fn()
describe('useWanted', () => {
  let wantedComposable: ReturnType<typeof useWanted>
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore = createMockAuthStore()
    mockRepository.getWantedItems.mockResolvedValue({ items: [] })
    mockRepository.getWantedDetail.mockResolvedValue(null)
    mockRepository.getRandomWanted.mockResolvedValue(null)
    mockRepository.hasAuthentication.mockReturnValue(false)
    wantedComposable = useWanted()
  })
  afterEach(() => {
    vi.clearAllMocks()
  })
  describe('fetchWantedItems', () => {
    it('should fetch wanted items successfully', async () => {
      const mockWanted: WantedPublicListing[] = [
        {
          id: '1',
          title: 'Test Wanted',
          description: 'Test description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      mockRepository.getWantedItems.mockResolvedValue({
        items: mockWanted,
        total: 1,
        page: 1,
        limit: 20
      })
      await wantedComposable.fetchWantedItems()
      expect(mockRepository.getWantedItems).toHaveBeenCalledWith({})
      expect(wantedComposable.wantedItems.value).toEqual(mockWanted)
      expect(wantedComposable.isLoading.value).toBe(false)
      expect(wantedComposable.error.value).toBe(null)
    })
    it('should handle search parameters', async () => {
      await wantedComposable.fetchWantedItems({
        search: 'electronics',
        category: 'Electronics',
        subcategory: 'Components',
        limit: 10,
        offset: 20
      })
      expect(mockRepository.getWantedItems).toHaveBeenCalledWith({
        search: 'electronics',
        category: 'Electronics',
        subcategory: 'Components',
        limit: 10,
        offset: 20
      })
    })
    it('should handle errors gracefully', async () => {
      const error = new Error('Network error')
      mockRepository.getWantedItems.mockRejectedValue(error)
      await wantedComposable.fetchWantedItems()
      expect(wantedComposable.error.value).toEqual(error)
      expect(wantedComposable.isLoading.value).toBe(false)
      expect(wantedComposable.wantedItems.value).toEqual([])
    })
    it('should handle rate limiting errors', async () => {
      const rateLimitError = { statusCode: 429, message: 'Too many requests' }
      mockRepository.getWantedItems.mockRejectedValue(rateLimitError)
      await wantedComposable.fetchWantedItems()
      expect(wantedComposable.error.value?.message).toBe(
        'errors.rateLimit'
      )
      expect(wantedComposable.isLoading.value).toBe(false)
    })
    it('should use cache when available and no search', async () => {
      const mockWanted: WantedPublicListing[] = [
        {
          id: '1',
          title: 'Cached Wanted',
          description: 'Cached description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      mockRepository.getWantedItems.mockResolvedValue({
        items: mockWanted,
        total: 1,
        page: 1,
        limit: 20
      })
      await wantedComposable.fetchWantedItems()
      expect(mockRepository.getWantedItems).toHaveBeenCalledTimes(1)
      await wantedComposable.fetchWantedItems()
      expect(mockRepository.getWantedItems).toHaveBeenCalledTimes(1)
      expect(wantedComposable.wantedItems.value).toEqual(mockWanted)
    })
    it('should not use cache when searching', async () => {
      const mockWanted: WantedPublicListing[] = [
        {
          id: '1',
          title: 'Test Wanted',
          description: 'Test description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      mockRepository.getWantedItems.mockResolvedValue({
        items: mockWanted,
        total: 1,
        page: 1,
        limit: 20
      })
      await wantedComposable.fetchWantedItems({ search: 'test' })
      expect(mockRepository.getWantedItems).toHaveBeenCalledTimes(1)
      await wantedComposable.fetchWantedItems({ search: 'test' })
      expect(mockRepository.getWantedItems).toHaveBeenCalledTimes(2)
    })
  })
  describe('fetchWantedDetail', () => {
    it('should fetch wanted detail successfully', async () => {
      const mockDetail: WantedPublicDetail = {
        id: '1',
        title: 'Wanted Detail',
        description: 'Detailed description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      mockRepository.getWantedDetail.mockResolvedValue(mockDetail)
      await wantedComposable.fetchWantedDetail('1')
      expect(mockRepository.getWantedDetail).toHaveBeenCalledWith('1')
      expect(wantedComposable.currentWanted.value).toEqual(mockDetail)
      expect(wantedComposable.isLoading.value).toBe(false)
      expect(wantedComposable.error.value).toBe(null)
    })
    it('should handle errors when fetching detail', async () => {
      const error = new Error('Not found')
      mockRepository.getWantedDetail.mockRejectedValue(error)
      await wantedComposable.fetchWantedDetail('1')
      expect(wantedComposable.error.value).toEqual(error)
      expect(wantedComposable.currentWanted.value).toBe(null)
      expect(wantedComposable.isLoading.value).toBe(false)
    })
    it('should handle rate limiting for detail fetch', async () => {
      const rateLimitError = { statusCode: 429, message: 'Too many requests' }
      mockRepository.getWantedDetail.mockRejectedValue(rateLimitError)
      await wantedComposable.fetchWantedDetail('1')
      expect(wantedComposable.error.value?.message).toBe(
        'errors.rateLimit'
      )
    })
  })
  describe('fetchRandomWanted', () => {
    it('should fetch random wanted successfully', async () => {
      const mockWanted: WantedPublicListing = {
        id: '1',
        title: 'Random Wanted',
        description: 'Random description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      mockRepository.getRandomWanted.mockResolvedValue(mockWanted)
      const result = await wantedComposable.fetchRandomWanted()
      expect(mockRepository.getRandomWanted).toHaveBeenCalled()
      expect(result).toEqual(mockWanted)
    })
    it('should return null on error', async () => {
      mockRepository.getRandomWanted.mockRejectedValue(
        new Error('Network error')
      )
      const result = await wantedComposable.fetchRandomWanted()
      expect(result).toBe(null)
    })
  })
  // Filtering tests removed - functionality moved to useSearchFilter composable
  describe('showActiveOnly property', () => {
    it('should have showActiveOnly property defaulted to true', () => {
      expect(wantedComposable.showActiveOnly.value).toBe(true)
    })
    it('should allow changing showActiveOnly value', () => {
      wantedComposable.showActiveOnly.value = false
      expect(wantedComposable.showActiveOnly.value).toBe(false)
      wantedComposable.showActiveOnly.value = true
      expect(wantedComposable.showActiveOnly.value).toBe(true)
    })
  })
  describe('normalizeWantedItems', () => {
    it('should strip auth fields when not authenticated', () => {
      const items: Wanted[] = [
        {
          id: '1',
          title: 'Test Wanted',
          description: 'Test description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Test Company',
          company_id: 'company-1',
          user_id: 'user-1',
          contact_email: 'contact@test.com',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      mockAuthStore.isAuthenticated.value = false
      const normalized = wantedComposable.normalizeWantedItems(items)
      expect(normalized[0]).not.toHaveProperty('user_id')
      expect(normalized[0]).not.toHaveProperty('contact_email')
      expect(normalized[0]).toHaveProperty('title')
      expect(normalized[0]).toHaveProperty('company_name')
    })
    it('should keep auth fields when authenticated', () => {
      mockAuthStore.isAuthenticated.value = true
      global.useAuthStore = vi.fn(() => ({
        ...mockAuthStore,
        token: mockAuthStore.token.value,
        isAuthenticated: true
      }))
      const authenticatedComposable = useWanted()
      const items: Wanted[] = [
        {
          id: '1',
          title: 'Test Wanted',
          description: 'Test description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Test Company',
          company_id: 'company-1',
          user_id: 'user-1',
          contact_email: 'contact@test.com',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      const normalized = authenticatedComposable.normalizeWantedItems(items)
      expect(normalized[0]).toHaveProperty('user_id')
      expect(normalized[0]).toHaveProperty('contact_email')
    })
  })
  describe('hasAuthenticatedFields', () => {
    it('should detect authenticated wanted items', () => {
      const authenticatedItem: Wanted = {
        id: '1',
        title: 'Test',
        description: 'Test',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        company_id: 'company-1',
        user_id: 'user-1',
        contact_email: 'contact@test.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      const publicItem: WantedPublicListing = {
        id: '2',
        title: 'Test',
        description: 'Test',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        image_urls: [],
        additional_info: {},
        company_name: 'Test Company',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      expect(wantedComposable.hasAuthenticatedFields(authenticatedItem)).toBe(true)
      expect(wantedComposable.hasAuthenticatedFields(publicItem)).toBe(false)
    })
  })
  // Computed properties tests removed - functionality moved to useSearchFilter composable
  describe('cache management', () => {
    it('should maintain separate caches for auth and public', async () => {
      const publicItems: WantedPublicListing[] = [
        {
          id: '1',
          title: 'Public Item',
          description: 'Public description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      const authItems: Wanted[] = [
        {
          id: '2',
          title: 'Auth Item',
          description: 'Auth description',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 200,
          budget_max: 600,
          budget_currency: 'USD',
          quantity_needed: 200,
          quantity_unit: 'pcs',
          countries: ['USA'],
          image_urls: [],
          additional_info: {},
          company_name: 'Company',
          company_id: 'company-1',
          user_id: 'user-1',
          contact_email: 'contact@test.com',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      mockAuthStore.isAuthenticated.value = false
      mockRepository.getWantedItems.mockResolvedValue({
        items: publicItems,
        total: 1,
        page: 1,
        limit: 20
      })
      await wantedComposable.fetchWantedItems()
      mockAuthStore.isAuthenticated.value = true
      global.useAuthStore = vi.fn(() => ({
        ...mockAuthStore,
        token: mockAuthStore.token.value,
        isAuthenticated: true
      }))
      mockRepository.getWantedItems.mockResolvedValue({
        items: authItems,
        total: 1,
        page: 1,
        limit: 20
      })
      await nextTick()
      await wantedComposable.fetchWantedItems({ search: 'test' })
      expect(mockRepository.getWantedItems).toHaveBeenCalledTimes(2)
    })
  })
})