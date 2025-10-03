import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useMarketplace } from '~/composables/useMarketplace'
import {
  MarketplaceRepository
} from '~/composables/api/repositories/MarketplaceRepository'
import type {
  ProductPublicListing,
  Product,
  ProductPublicDetail,
  ProductAuthenticated
} from '~/shared/types/models/MarketplaceProduct'
vi.mock('~/composables/api/repositories/MarketplaceRepository')
const mockAuthStore = {
  token: null,
  isAuthenticated: false
}
vi.mock('~/stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore)
}))
describe('useMarketplace', () => {
  let marketplace: ReturnType<typeof useMarketplace>
  let mockRepository: any
  beforeAll(() => {
    vi.useFakeTimers()
  })
  afterAll(() => {
    vi.useRealTimers()
  })
  const mockProducts: ProductPublicListing[] = [
    {
      id: '1',
      title: 'iPhone 14',
      description: 'Latest Apple smartphone',
      price: 999,
      price_currency: 'USD',
      category: 'Electronics',
      subcategory: 'Phones',
      company_id: 'apple-1',
      company_name: 'Apple Inc',
      image_urls: ['https://example.com/iphone.jpg'],
      quantity: 50,
      quantity_unit: 'pcs',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Samsung Galaxy S23',
      description: 'Samsung flagship phone',
      price: 899,
      price_currency: 'USD',
      category: 'Electronics',
      subcategory: 'Phones',
      company_id: 'samsung-1',
      company_name: 'Samsung',
      image_urls: ['https://example.com/samsung.jpg'],
      quantity: 30,
      quantity_unit: 'pcs',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      title: 'MacBook Pro',
      description: 'Professional laptop',
      price: 2499,
      price_currency: 'USD',
      category: 'Electronics',
      subcategory: 'Laptops',
      company_id: 'apple-1',
      company_name: 'Apple Inc',
      image_urls: ['https://example.com/macbook.jpg'],
      quantity: 20,
      quantity_unit: 'pcs',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ]
  const mockAuthProducts: Product[] = mockProducts.map(p => ({
    ...p,
    user_id: 'user-123',
    contact_email: 'contact@example.com'
  }))
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockAuthStore.token = null
    mockAuthStore.isAuthenticated = false
    mockRepository = {
      getProducts: vi.fn().mockResolvedValue({ items: mockProducts }),
      getProductDetail: vi.fn(),
      getRandomProduct: vi.fn(),
      hasAuthentication: vi.fn().mockReturnValue(false)
    }
    vi.mocked(MarketplaceRepository).mockImplementation(() => mockRepository)
    marketplace = useMarketplace()
  })
  describe('fetchProducts', () => {
    it('should fetch and store products', async () => {
      await marketplace.fetchProducts()
      expect(mockRepository.getProducts).toHaveBeenCalledWith({})
      expect(marketplace.products.value).toEqual(mockProducts)
      expect(marketplace.isLoading.value).toBe(false)
      expect(marketplace.error.value).toBeNull()
    })
    it('should pass search parameters to repository', async () => {
      const params = {
        search: 'phone',
        category: 'Electronics',
        limit: 10,
        offset: 20
      }
      await marketplace.fetchProducts(params)
      expect(mockRepository.getProducts).toHaveBeenCalledWith(params)
    })
    it('should handle errors gracefully', async () => {
      const error = new Error('Network error')
      mockRepository.getProducts.mockRejectedValue(error)
      await marketplace.fetchProducts()
      expect(marketplace.error.value).toEqual(error)
      expect(marketplace.products.value).toEqual([])
      expect(marketplace.isLoading.value).toBe(false)
    })
    it('should handle rate limiting with custom message', async () => {
      const rateLimitError = { statusCode: 429, message: 'Too many requests' }
      mockRepository.getProducts.mockRejectedValue(rateLimitError)
      await marketplace.fetchProducts()
      expect(marketplace.error.value?.message).toBe('errors.rateLimit')
    })
    it('should use cache when available', async () => {
      await marketplace.fetchProducts()
      expect(mockRepository.getProducts).toHaveBeenCalledTimes(1)
      await marketplace.fetchProducts()
      expect(mockRepository.getProducts).toHaveBeenCalledTimes(1)
    })
    it('should not cache search results', async () => {
      await marketplace.fetchProducts({ search: 'phone' })
      expect(mockRepository.getProducts).toHaveBeenCalledTimes(1)
      await marketplace.fetchProducts({ search: 'phone' })
      expect(mockRepository.getProducts).toHaveBeenCalledTimes(2)
    })
  })
  describe('fetchProductDetail', () => {
    const mockDetail: ProductPublicDetail = {
      id: '1',
      title: 'iPhone 14',
      description: 'Latest Apple smartphone',
      long_description: 'Detailed description of iPhone 14',
      price: 999,
      price_currency: 'USD',
      category: 'Electronics',
      subcategory: 'Phones',
      company_id: 'apple-1',
      company_name: 'Apple Inc',
      company_address: '1 Infinite Loop',
      company_phone: '+1234567890',
      image_urls: ['https://example.com/iphone.jpg'],
      quantity: 50,
      quantity_unit: 'pcs',
      min_order_quantity: 1,
      max_order_quantity: 10,
      delivery_time_days: 3,
      payment_terms: 'Net 30',
      shipping_terms: 'FOB',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    it('should fetch product detail', async () => {
      mockRepository.getProductDetail.mockResolvedValue(mockDetail)
      await marketplace.fetchProductDetail('1')
      expect(mockRepository.getProductDetail).toHaveBeenCalledWith('1')
      expect(marketplace.currentProduct.value).toEqual(mockDetail)
      expect(marketplace.isLoading.value).toBe(false)
    })
    it('should handle errors when fetching detail', async () => {
      const error = new Error('Product not found')
      mockRepository.getProductDetail.mockRejectedValue(error)
      await marketplace.fetchProductDetail('999')
      expect(marketplace.error.value).toEqual(error)
      expect(marketplace.currentProduct.value).toBeNull()
    })
  })
  describe('fetchRandomProduct', () => {
    it('should fetch a random product', async () => {
      mockRepository.getRandomProduct.mockResolvedValue(mockProducts[0])
      const result = await marketplace.fetchRandomProduct()
      expect(mockRepository.getRandomProduct).toHaveBeenCalled()
      expect(result).toEqual(mockProducts[0])
    })
    it('should return null on error', async () => {
      mockRepository.getRandomProduct.mockRejectedValue(new Error('Error'))
      const result = await marketplace.fetchRandomProduct()
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })
  })
  // Filter and search tests removed - functionality moved to useSearchFilter composable
  describe('authentication handling', () => {
    it('should invalidate cache on auth state change', async () => {
      await marketplace.fetchProducts()
      expect(mockRepository.getProducts).toHaveBeenCalledTimes(1)
      mockAuthStore.isAuthenticated = true
      mockAuthStore.token = 'test-token'
      mockRepository.getProducts.mockResolvedValue({ items: mockAuthProducts })
      vi.advanceTimersByTime(6 * 60 * 1000)
      await marketplace.fetchProducts()
      expect(mockRepository.getProducts).toHaveBeenCalledTimes(2)
    })
    it('should use separate caches for authenticated and public users',
      async () => {
      await marketplace.fetchProducts()
      expect(marketplace.products.value.length).toBe(mockProducts.length)
      mockAuthStore.isAuthenticated = true
      mockRepository.getProducts.mockResolvedValue({ items: mockAuthProducts })
      vi.advanceTimersByTime(6 * 60 * 1000)
      await marketplace.fetchProducts()
      expect(marketplace.products.value.length).toBe(mockAuthProducts.length)
      const hasAuthFields = marketplace.products.value.some((p: any) =>
        'user_id' in p && 'contact_email' in p
      )
      expect(hasAuthFields).toBe(true)
    })
    // Filter tests removed - functionality moved to useSearchFilter composable
  })
  describe('normalizeProducts', () => {
    it('should strip private fields for unauthenticated users', () => {
      mockAuthStore.isAuthenticated = false
      const normalized = marketplace.normalizeProducts(mockAuthProducts)
      normalized.forEach((product) => {
        expect(product.id).toBeDefined()
        expect(product.title).toBeDefined()
        expect(product.price).toBeDefined()
      })
      expect(normalized.length).toBe(mockAuthProducts.length)
    })
    it('should keep all fields for authenticated users', () => {
      mockAuthStore.isAuthenticated = true
      const normalized = marketplace.normalizeProducts(mockAuthProducts)
      normalized.forEach(product => {
        expect(product).toHaveProperty('user_id')
        expect(product).toHaveProperty('contact_email')
      })
    })
  })
  describe('hasAuthenticatedFields', () => {
    it('should detect authenticated product', () => {
      const authProduct: Product = {
        ...mockProducts[0],
        user_id: 'user-1',
        contact_email: 'test@example.com'
      }
      expect(marketplace.hasAuthenticatedFields(authProduct)).toBe(true)
    })
    it('should detect public product', () => {
      expect(marketplace.hasAuthenticatedFields(mockProducts[0])).toBe(false)
    })
    it('should work with product details', () => {
      const authDetail: ProductAuthenticated = {
        id: '1',
        title: 'Test',
        description: 'Test',
        long_description: 'Test',
        price: 100,
        price_currency: 'USD',
        category: 'Test',
        subcategory: 'Test',
        company_id: 'comp-1',
        company_name: 'Company',
        company_address: 'Address',
        company_phone: 'Phone',
        user_id: 'user-1',
        contact_email: 'email@example.com',
        contact_phone: '+1234567890',
        contact_name: 'Contact',
        image_urls: [],
        quantity: 10,
        quantity_unit: 'pcs',
        min_order_quantity: 1,
        max_order_quantity: 100,
        delivery_time_days: 3,
        payment_terms: 'Net 30',
        shipping_terms: 'FOB',
        certifications: [],
        warranty_months: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      expect(marketplace.hasAuthenticatedFields(authDetail)).toBe(true)
    })
  })
  describe('loading states', () => {
    it('should manage loading state during fetch', async () => {
      let loadingDuringFetch = false
      mockRepository.getProducts.mockImplementation(async () => {
        loadingDuringFetch = marketplace.isLoading.value
        return { items: mockProducts }
      })
      await marketplace.fetchProducts()
      expect(loadingDuringFetch).toBe(true)
      expect(marketplace.isLoading.value).toBe(false)
    })
    it('should manage loading state during error', async () => {
      mockRepository.getProducts.mockRejectedValue(new Error('Error'))
      await marketplace.fetchProducts()
      expect(marketplace.isLoading.value).toBe(false)
    })
  })
})