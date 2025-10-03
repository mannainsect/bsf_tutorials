import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MarketplaceRepository
} from '~/composables/api/repositories/MarketplaceRepository'
vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: vi.fn(() => ({
    marketProducts: '/market/products'
  }))
}))
const createMockAuthStore = () => ({
  token: 'test-token',
  isAuthenticated: true
})
const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)
describe('MarketplaceRepository - createProduct', () => {
  let repository: MarketplaceRepository
  beforeEach(() => {
    mockAuthStore.token = 'test-token'
    mockAuthStore.isAuthenticated = true
    repository = new MarketplaceRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  describe('createProduct', () => {
    it('should successfully create a product', async () => {
      const mockResponse = {
        id: 'new-product-id',
        message: 'Product created successfully'
      }
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)
      const formData = new FormData()
      formData.append('title', 'New Product')
      formData.append('description', 'Product description')
      formData.append('price', '99.99')
      formData.append('category', 'electronics')
      const result = await repository.createProduct('company-123', formData)
      expect(result).toEqual(mockResponse)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/products/company-123',
        formData
      )
    })
    it('should map MongoDB _id to id in response', async () => {
      const mockResponse = {
        _id: 'mongodb-product-id',
        message: 'Product created'
      }
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)
      const formData = new FormData()
      formData.append('title', 'Product')
      const result = await repository.createProduct('company-123', formData)
      expect(result.id).toBe('mongodb-product-id')
    })
    it('should handle rate limit errors', async () => {
      const rateLimitError = {
        statusCode: 429,
        message: 'Too many requests'
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(rateLimitError)
      vi.spyOn(repository as any, 'isRateLimitError').mockReturnValue(true)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow('Rate limit exceeded. Please try again later.')
    })
    it('should handle authentication errors (401)', async () => {
      const authError = {
        statusCode: 401,
        data: { message: 'Not authenticated' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(authError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow('Authentication required. Please log in.')
    })
    it('should handle permission errors (403)', async () => {
      const permissionError = {
        statusCode: 403,
        data: { message: 'Insufficient permissions' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(permissionError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow('Insufficient permissions')
    })
    it('should handle company not found errors (404)', async () => {
      const notFoundError = {
        statusCode: 404,
        data: { message: 'Company not found' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(notFoundError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow('Company not found. Please check your account settings.')
    })
    it('should handle listing limit errors (500)', async () => {
      const limitError = {
        statusCode: 500,
        data: { message: 'Listing limit reached for this account' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(limitError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow(
        'You have reached your listing limit. Please upgrade your plan to create more products.'
      )
    })
    it('should handle generic server errors (500)', async () => {
      const serverError = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(serverError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow('Database error creating product. Please try again.')
    })
    it('should handle unknown status codes', async () => {
      const unknownError = {
        statusCode: 418,
        data: { message: "I'm a teapot" }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(unknownError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow("I'm a teapot")
    })
    it('should handle errors without data message', async () => {
      const errorWithoutMessage = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(errorWithoutMessage)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow(
        'Insufficient permissions to create product in this space'
      )
    })
    it('should pass through non-status-code errors', async () => {
      const genericError = new Error('Network error')
      vi.spyOn(repository as any, 'post').mockRejectedValue(genericError)
      const formData = new FormData()
      await expect(
        repository.createProduct('company-123', formData)
      ).rejects.toThrow('Network error')
    })
    it('should work with FormData containing images', async () => {
      const mockResponse = {
        id: 'product-with-images',
        message: 'Product created'
      }
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)
      const formData = new FormData()
      formData.append('title', 'Product with Images')
      formData.append('description', 'Description')
      formData.append('price', '150')
      const blob1 = new Blob(['image1'], { type: 'image/jpeg' })
      const blob2 = new Blob(['image2'], { type: 'image/png' })
      formData.append('images', blob1, 'image1.jpg')
      formData.append('images', blob2, 'image2.png')
      const result = await repository.createProduct('company-123', formData)
      expect(result).toEqual(mockResponse)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/products/company-123',
        formData
      )
    })
  })
})