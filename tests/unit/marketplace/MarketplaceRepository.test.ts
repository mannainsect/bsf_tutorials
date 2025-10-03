import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MarketplaceRepository
} from '~/composables/api/repositories/MarketplaceRepository'
import type {
  MarketplaceProductsResponse,
  ProductPublicListing,
  Product,
  ProductPublicDetail,
  ProductAuthenticated
} from '~/shared/types/models/MarketplaceProduct'
vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: vi.fn(() => ({
    marketProducts: '/market/products'
  }))
}))
const createMockAuthStore = () => ({
  token: null as string | null,
  isAuthenticated: false
})
const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)
describe('MarketplaceRepository', () => {
  let repository: MarketplaceRepository
  beforeEach(() => {
    mockAuthStore.token = null
    mockAuthStore.isAuthenticated = false
    repository = new MarketplaceRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  describe('getProducts', () => {
    it('should fetch products without authentication', async () => {
      const mockProducts: ProductPublicListing[] = [
        {
          id: '1',
          title: 'Public Product',
          description: 'A product visible to everyone',
          price: 99.99,
          price_currency: 'USD',
          category: 'Electronics',
          subcategory: 'Phones',
          company_id: 'company-1',
          company_name: 'Test Company',
          image_urls: ['https://example.com/image1.jpg'],
          quantity: 10,
          quantity_unit: 'pcs',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(
        mockProducts
      )
      const result = await repository.getProducts()
      expect(result).toEqual({
        items: mockProducts,
        total: mockProducts.length,
        page: 1,
        limit: 20
      })
      expect(repository.get).toHaveBeenCalledWith(
        '/market/products',
        { limit: 20, offset: 0 }
      )
    })
    it('should fetch products with authentication', async () => {
      mockAuthStore.token = 'test-token'
      mockAuthStore.isAuthenticated = true
      const mockProducts: Product[] = [
        {
          id: '1',
          title: 'Authenticated Product',
          description: 'Full product details',
          price: 99.99,
          price_currency: 'USD',
          category: 'Electronics',
          subcategory: 'Phones',
          company_id: 'company-1',
          company_name: 'Test Company',
          user_id: 'user-1',
          contact_email: 'contact@example.com',
          image_urls: ['https://example.com/image1.jpg'],
          quantity: 10,
          quantity_unit: 'pcs',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(
        mockProducts
      )
      const result = await repository.getProducts()
      expect(result.items).toEqual(mockProducts)
      expect(result.items[0]).toHaveProperty('user_id')
      expect(result.items[0]).toHaveProperty('contact_email')
    })
    it('should handle search parameters', async () => {
      vi.spyOn(repository as any, 'get').mockResolvedValue([])
      await repository.getProducts({
        search: 'phone',
        category: 'Electronics',
        subcategory: 'Mobile',
        company_id: 'company-123',
        limit: 10,
        offset: 20
      })
      expect(repository.get).toHaveBeenCalledWith(
        '/market/products',
        {
          limit: 10,
          offset: 20,
          category: 'Electronics',
          subcategory: 'Mobile',
          company_id: 'company-123',
          search: 'phone'
        }
      )
    })
    it('should handle rate limiting (429) gracefully', async () => {
      const rateLimitError = {
        statusCode: 429,
        message: 'Too many requests'
      }
      vi.spyOn(repository as any, 'get').mockRejectedValue(rateLimitError)
      const result = await repository.getProducts()
      expect(result).toEqual({ items: [] })
      expect(console.warn).toHaveBeenCalledWith(
        'Rate limit reached for marketplace products'
      )
    })
    it('should throw other errors', async () => {
      const genericError = new Error('Network error')
      vi.spyOn(repository as any, 'get').mockRejectedValue(genericError)
      await expect(repository.getProducts()).rejects.toThrow('Network error')
    })
  })
  describe('getProductDetail', () => {
    it('should fetch product detail without authentication', async () => {
      const mockProduct: ProductPublicDetail = {
        id: '1',
        title: 'Public Product Detail',
        description: 'Detailed description',
        long_description: 'Long detailed description',
        price: 99.99,
        price_currency: 'USD',
        category: 'Electronics',
        subcategory: 'Phones',
        company_id: 'company-1',
        company_name: 'Test Company',
        company_address: '123 Main St',
        company_phone: '+1234567890',
        image_urls: ['https://example.com/image1.jpg'],
        quantity: 10,
        quantity_unit: 'pcs',
        min_order_quantity: 1,
        max_order_quantity: 100,
        delivery_time_days: 3,
        payment_terms: 'Net 30',
        shipping_terms: 'FOB',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockProduct)
      const result = await repository.getProductDetail('1')
      expect(result).toEqual(mockProduct)
      expect(repository.get).toHaveBeenCalledWith('/market/products/1')
    })
    it('should fetch product detail with authentication', async () => {
      mockAuthStore.token = 'test-token'
      mockAuthStore.isAuthenticated = true
      const mockProduct: ProductAuthenticated = {
        id: '1',
        title: 'Authenticated Product Detail',
        description: 'Detailed description',
        long_description: 'Long detailed description',
        price: 99.99,
        price_currency: 'USD',
        category: 'Electronics',
        subcategory: 'Phones',
        company_id: 'company-1',
        company_name: 'Test Company',
        company_address: '123 Main St',
        company_phone: '+1234567890',
        user_id: 'user-1',
        contact_email: 'contact@example.com',
        contact_phone: '+9876543210',
        contact_name: 'John Doe',
        image_urls: ['https://example.com/image1.jpg'],
        quantity: 10,
        quantity_unit: 'pcs',
        min_order_quantity: 1,
        max_order_quantity: 100,
        delivery_time_days: 3,
        payment_terms: 'Net 30',
        shipping_terms: 'FOB',
        certifications: ['ISO 9001'],
        warranty_months: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockProduct)
      const result = await repository.getProductDetail('1')
      expect(result).toEqual(mockProduct)
      expect(result).toHaveProperty('user_id')
      expect(result).toHaveProperty('contact_email')
      expect(result).toHaveProperty('contact_phone')
    })
    it('should map MongoDB _id to id in product detail', async () => {
      const mockProduct = {
        _id: 'mongodb-product-id',
        title: 'Product with _id',
        description: 'Product from MongoDB',
        price: 100,
        price_currency: 'USD',
        category: 'Electronics',
        subcategory: 'Phones',
        company_id: 'company-1',
        company_name: 'Test Company',
        image_urls: ['https://example.com/image1.jpg'],
        quantity: 10,
        quantity_unit: 'pcs',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockProduct)
      const result = await repository.getProductDetail('mongodb-product-id')
      expect(result.id).toBe('mongodb-product-id')
      expect((result as any)._id).toBe('mongodb-product-id')
    })
    it('should handle rate limiting (429) gracefully', async () => {
      const rateLimitError = {
        statusCode: 429,
        message: 'Too many requests'
      }
      vi.spyOn(repository as any, 'get').mockRejectedValue(rateLimitError)
      await expect(repository.getProductDetail('1')).rejects.toThrow(
        'Rate limit reached. Please try again later.'
      )
      expect(console.warn).toHaveBeenCalledWith(
        'Rate limit reached for product detail'
      )
    })
    it('should throw other errors', async () => {
      const genericError = new Error('Product not found')
      vi.spyOn(repository as any, 'get').mockRejectedValue(genericError)
      await expect(repository.getProductDetail('1')).rejects.toThrow(
        'Product not found'
      )
    })
  })
  describe('getRandomProduct', () => {
    it('should return a random product from the list', async () => {
      const mockProducts: ProductPublicListing[] = [
        {
          id: '1',
          title: 'Product 1',
          description: 'Description 1',
          price: 99.99,
          price_currency: 'USD',
          category: 'Electronics',
          subcategory: 'Phones',
          company_id: 'company-1',
          company_name: 'Company 1',
          image_urls: [],
          quantity: 10,
          quantity_unit: 'pcs',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Product 2',
          description: 'Description 2',
          price: 149.99,
          price_currency: 'USD',
          category: 'Electronics',
          subcategory: 'Laptops',
          company_id: 'company-2',
          company_name: 'Company 2',
          image_urls: [],
          quantity: 5,
          quantity_unit: 'pcs',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository, 'getProducts').mockResolvedValue({
        items: mockProducts
      })
      const result = await repository.getRandomProduct()
      expect(result).toBeTruthy()
      expect(mockProducts).toContainEqual(result)
      expect(repository.getProducts).toHaveBeenCalledWith({ limit: 10 })
    })
    it('should return null when no products are available', async () => {
      vi.spyOn(repository, 'getProducts').mockResolvedValue({
        items: []
      })
      const result = await repository.getRandomProduct()
      expect(result).toBeNull()
    })
    it('should handle errors gracefully and return null', async () => {
      vi.spyOn(repository, 'getProducts').mockRejectedValue(
        new Error('Network error')
      )
      const result = await repository.getRandomProduct()
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch random product: Network error',
        expect.any(Error)
      )
    })
  })
  describe('hasAuthentication', () => {
    it('should return false when no token exists', () => {
      mockAuthStore.token = null
      mockAuthStore.isAuthenticated = false
      const repo = new MarketplaceRepository()
      const result = repo.hasAuthentication()
      expect(result).toBe(false)
    })
    it('should return true when token exists', () => {
      mockAuthStore.token = 'test-token'
      mockAuthStore.isAuthenticated = true
      const repo = new MarketplaceRepository()
      const result = repo.hasAuthentication()
      expect(result).toBe(true)
    })
  })
  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const productId = 'product-123'
      const updateData = {
        title: 'Updated Product Title',
        description: 'Updated description',
        price: 199.99
      }
      const mockResponse = {
        id: productId,
        message: 'Product updated successfully'
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateProduct(productId, updateData)
      expect(result).toEqual(mockResponse)
      expect(repository.put).toHaveBeenCalledWith(
        `/market/products/${productId}`,
        updateData
      )
    })
    it('should map MongoDB _id to id in response', async () => {
      const productId = 'product-123'
      const updateData = { title: 'Updated' }
      const mockResponse = {
        _id: productId,
        message: 'Updated'
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateProduct(productId, updateData)
      expect(result.id).toBe(productId)
    })
    it('should handle 401 authentication error', async () => {
      const error = {
        statusCode: 401,
        data: { message: 'Unauthorized' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Authentication required. Please log in.'
      )
    })
    it('should handle 403 forbidden error with custom message', async () => {
      const error = {
        statusCode: 403,
        data: { message: 'Custom forbidden message' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Custom forbidden message'
      )
    })
    it('should handle 403 forbidden error with default message', async () => {
      const error = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'You do not have permission to update this product.'
      )
    })
    it('should handle 404 not found error', async () => {
      const error = {
        statusCode: 404,
        data: { message: 'Not found' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Product not found or you do not have permission to edit it.'
      )
    })
    it('should handle 429 rate limit error', async () => {
      const error = {
        statusCode: 429,
        data: { message: 'Too many requests' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      )
    })
    it('should handle 500 server error', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Server error. Please try again later.'
      )
    })
    it('should handle unknown status code with custom message', async () => {
      const error = {
        statusCode: 418,
        data: { message: 'I am a teapot' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'I am a teapot'
      )
    })
    it('should handle unknown status code with default message', async () => {
      const error = {
        statusCode: 418,
        data: {}
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Failed to update product. Please try again.'
      )
    })
    it('should throw generic errors unchanged', async () => {
      const error = new Error('Network failure')
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProduct('123', {})).rejects.toThrow(
        'Network failure'
      )
    })
  })
  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      const productId = 'product-123'
      const mockResponse = {
        success: true,
        message: 'Product deleted successfully'
      }
      vi.spyOn(repository as any, 'delete').mockResolvedValue(mockResponse)
      const result = await repository.deleteProduct(productId)
      expect(result).toEqual(mockResponse)
      expect(repository.delete).toHaveBeenCalledWith(
        `/market/products/${productId}`
      )
    })
    it('should handle 401 authentication error', async () => {
      const error = {
        statusCode: 401,
        data: { message: 'Unauthorized' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Authentication required. Please log in.'
      )
    })
    it('should handle 403 forbidden error with custom message', async () => {
      const error = {
        statusCode: 403,
        data: { message: 'Not your product' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Not your product'
      )
    })
    it('should handle 403 forbidden error with default message', async () => {
      const error = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'You do not have permission to delete this product.'
      )
    })
    it('should handle 404 not found error', async () => {
      const error = {
        statusCode: 404,
        data: { message: 'Not found' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Product not found or you do not have permission to delete it.'
      )
    })
    it('should handle 429 rate limit error', async () => {
      const error = {
        statusCode: 429,
        data: { message: 'Too many requests' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      )
    })
    it('should handle 500 server error', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Server error. Please try again later.'
      )
    })
    it('should handle unknown status code with custom message', async () => {
      const error = {
        statusCode: 418,
        data: { message: 'Unexpected error occurred' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Unexpected error occurred'
      )
    })
    it('should handle unknown status code with default message', async () => {
      const error = {
        statusCode: 418,
        data: {}
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Failed to delete product. Please try again.'
      )
    })
    it('should throw generic errors unchanged', async () => {
      const error = new Error('Connection lost')
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteProduct('123')).rejects.toThrow(
        'Connection lost'
      )
    })
  })
  describe('updateProductImages', () => {
    it('should update product images successfully', async () => {
      const productId = 'product-123'
      const files = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
      ]
      const mockResponse = {
        id: productId,
        message: 'Images updated successfully',
        image_urls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateProductImages(productId, files)
      expect(result).toEqual(mockResponse)
      const putCall = (repository.put as any).mock.calls[0]
      expect(putCall[0]).toBe(`/market/products/${productId}/images`)
      expect(putCall[1]).toBeInstanceOf(FormData)
    })
    it('should create FormData with multiple images', async () => {
      const productId = 'product-123'
      const files = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' }),
        new File(['image3'], 'image3.png', { type: 'image/png' })
      ]
      const mockResponse = {
        id: productId,
        message: 'Success'
      }
      let capturedFormData: FormData | null = null
      vi.spyOn(repository as any, 'put').mockImplementation(
        (url: string, data: FormData) => {
          capturedFormData = data
          return Promise.resolve(mockResponse)
        }
      )
      await repository.updateProductImages(productId, files)
      expect(capturedFormData).toBeInstanceOf(FormData)
      const entries = Array.from(capturedFormData!.entries())
      expect(entries).toHaveLength(3)
      entries.forEach((entry) => {
        expect(entry[0]).toBe('images')
        expect(entry[1]).toBeInstanceOf(File)
      })
    })
    it('should map MongoDB _id to id in response', async () => {
      const productId = 'product-123'
      const files = [new File(['image'], 'image.jpg')]
      const mockResponse = {
        _id: productId,
        message: 'Updated',
        image_urls: ['https://example.com/image.jpg']
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateProductImages(productId, files)
      expect(result.id).toBe(productId)
    })
    it('should handle 401 authentication error', async () => {
      const error = {
        statusCode: 401,
        data: { message: 'Unauthorized' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Authentication required. Please log in.'
      )
    })
    it('should handle 403 forbidden error with custom message', async () => {
      const error = {
        statusCode: 403,
        data: { message: 'Cannot modify images' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Cannot modify images'
      )
    })
    it('should handle 403 forbidden error with default message', async () => {
      const error = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'You do not have permission to update product images.'
      )
    })
    it('should handle 404 not found error', async () => {
      const error = {
        statusCode: 404,
        data: { message: 'Not found' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Product not found or you do not have permission to edit it.'
      )
    })
    it('should handle 429 rate limit error', async () => {
      const error = {
        statusCode: 429,
        data: { message: 'Too many requests' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      )
    })
    it('should handle 500 server error', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Server error. Please try again later.'
      )
    })
    it('should handle unknown status code with custom message', async () => {
      const error = {
        statusCode: 413,
        data: { message: 'File too large' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'File too large'
      )
    })
    it('should handle unknown status code with default message', async () => {
      const error = {
        statusCode: 413,
        data: {}
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Failed to update product images. Please try again.'
      )
    })
    it('should throw generic errors unchanged', async () => {
      const error = new Error('Upload failed')
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateProductImages('123', [])).rejects.toThrow(
        'Upload failed'
      )
    })
    it('should handle empty files array', async () => {
      const productId = 'product-123'
      const files: File[] = []
      const mockResponse = {
        id: productId,
        message: 'No images to update'
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateProductImages(productId, files)
      expect(result).toEqual(mockResponse)
      const putCall = (repository.put as any).mock.calls[0]
      expect(putCall[1]).toBeInstanceOf(FormData)
    })
  })
  describe('createProduct with new API response fields', () => {
    it('should handle product_id in creation response', async () => {
      const companyId = 'company-123'
      const formData = new FormData()
      formData.append('title', 'New Product')
      formData.append('price', '99.99')

      const mockResponse = {
        status: 'Product listing created successfully',
        product_id: '67890abc-def1-2345-6789-0abcdef12345',
        id: 'prod-123'
      }

      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)

      const result = await repository.createProduct(companyId, formData)

      expect(result).toBeDefined()
      expect(result.id).toBe('prod-123')
      expect(result).toHaveProperty('id')
      expect(repository.post).toHaveBeenCalledWith(
        `/market/products/${companyId}`,
        formData
      )
    })

    it('should handle missing product_id gracefully (backward compat)',
    async () => {
      const companyId = 'company-456'
      const formData = new FormData()
      formData.append('title', 'Legacy Product')

      const mockResponse = {
        status: 'Product listing created successfully',
        id: 'prod-legacy-789'
      }

      const consoleDebugSpy = vi.spyOn(console, 'debug')
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)

      const result = await repository.createProduct(companyId, formData)

      expect(result).toBeDefined()
      expect(result.id).toBe('prod-legacy-789')
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Response without product_id (backward compatible)'
      )
    })

    it('should handle product_id as null', async () => {
      const companyId = 'company-789'
      const formData = new FormData()
      formData.append('title', 'Null ID Product')

      const mockResponse = {
        status: 'Product listing created successfully',
        product_id: null,
        id: 'prod-null-123'
      }

      const consoleDebugSpy = vi.spyOn(console, 'debug')
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)

      const result = await repository.createProduct(companyId, formData)

      expect(result.id).toBe('prod-null-123')
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Response without product_id (backward compatible)'
      )
    })

    it('should handle 403 error for space authorization', async () => {
      const companyId = 'company-unauthorized'
      const formData = new FormData()
      formData.append('title', 'Unauthorized Product')

      const mock403Error = {
        statusCode: 403,
        data: { detail: 'You do not have access to this company' }
      }

      vi.spyOn(repository as any, 'post').mockRejectedValue(mock403Error)

      await expect(
        repository.createProduct(companyId, formData)
      ).rejects.toThrow(
        'Insufficient permissions to create product in this space'
      )
    })

    it('should handle 500 error for database persistence',
    async () => {
      const companyId = 'company-db-error'
      const formData = new FormData()
      formData.append('title', 'DB Error Product')

      const mock500Error = {
        statusCode: 500,
        data: { detail: 'Database operation failed' }
      }

      vi.spyOn(repository as any, 'post').mockRejectedValue(mock500Error)

      await expect(
        repository.createProduct(companyId, formData)
      ).rejects.toThrow('Database error creating product. Please try again.')
    })

    it('should handle 500 error with listing limit message',
    async () => {
      const companyId = 'company-limit'
      const formData = new FormData()
      formData.append('title', 'Limit Reached Product')

      const mock500Error = {
        statusCode: 500,
        data: {
          message: 'You have reached your listing limit for this tier'
        }
      }

      vi.spyOn(repository as any, 'post').mockRejectedValue(mock500Error)

      await expect(
        repository.createProduct(companyId, formData)
      ).rejects.toThrow(
        'You have reached your listing limit. Please upgrade your plan ' +
        'to create more products.'
      )
    })
  })

  describe('response normalization', () => {
    it('should map MongoDB _id to id field', async () => {
      const mockResponse = [
        {
          _id: 'mongodb-id-1',
          title: 'Product with _id',
          description: 'Product from MongoDB',
          price: 100,
          price_currency: 'USD',
          category: 'Test',
          subcategory: 'Test',
          company_id: 'comp-1',
          company_name: 'Company',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          _id: 'mongodb-id-2',
          id: 'should-be-ignored',
          title: 'Product with both _id and id',
          description: 'Should use _id',
          price: 200,
          price_currency: 'USD',
          category: 'Test',
          subcategory: 'Test',
          company_id: 'comp-2',
          company_name: 'Company 2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getProducts()
      expect(result.items).toHaveLength(2)
      expect(result.items[0].id).toBe('mongodb-id-1')
      expect(result.items[1].id).toBe('mongodb-id-2')
    })
    it('should filter out products without valid ID', async () => {
      const mockResponse = [
        {
          title: 'Product without ID',
          description: 'Should be filtered',
          price: 100,
          price_currency: 'USD',
          category: 'Test',
          subcategory: 'Test',
          company_id: 'comp-1',
          company_name: 'Company',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'valid-id',
          title: 'Product with ID',
          description: 'Should be included',
          price: 200,
          price_currency: 'USD',
          category: 'Test',
          subcategory: 'Test',
          company_id: 'comp-2',
          company_name: 'Company 2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getProducts()
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('valid-id')
      expect(console.warn).toHaveBeenCalledWith(
        'Product without valid ID filtered out:',
        expect.objectContaining({
          title: 'Product without ID'
        })
      )
    })
    it('should handle undefined optional fields gracefully', async () => {
      const mockResponse = [
        {
          id: '1',
          title: 'Minimal Product',
          description: 'Basic description',
          price: 50,
          price_currency: 'USD',
          category: 'Other',
          subcategory: 'Misc',
          company_id: 'comp-1',
          company_name: 'Company',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getProducts()
      expect(result.items[0]).toBeDefined()
      expect(result.items[0].image_urls).toBeUndefined()
      expect(result.items[0].quantity).toBeUndefined()
    })
  })

  describe('BaseRepository error detection methods', () => {
    it('should detect 503 service unavailable error', () => {
      const mock503Error = {
        statusCode: 503,
        data: { detail: 'Service temporarily unavailable' }
      }

      const result = (repository as any).isServiceUnavailableError(
        mock503Error
      )

      expect(result).toBe(true)
    })

    it('should return false for non-503 errors', () => {
      const mock500Error = { statusCode: 500, data: {} }
      const mock429Error = { statusCode: 429, data: {} }

      expect((repository as any).isServiceUnavailableError(
        mock500Error
      )).toBe(false)
      expect((repository as any).isServiceUnavailableError(
        mock429Error
      )).toBe(false)
    })

    it('should handle error without statusCode property', () => {
      const genericError = new Error('Network error')
      const nullError = null
      const undefinedError = undefined

      expect((repository as any).isServiceUnavailableError(
        genericError
      )).toBe(false)
      expect((repository as any).isServiceUnavailableError(
        nullError
      )).toBe(false)
      expect((repository as any).isServiceUnavailableError(
        undefinedError
      )).toBe(false)
    })

    it('should use getStatusCode helper correctly', () => {
      const mock403Error = { statusCode: 403, data: {} }
      const mockNoStatus = { data: 'error' }

      expect((repository as any).getStatusCode(mock403Error)).toBe(403)
      expect((repository as any).getStatusCode(mockNoStatus)).toBeUndefined()
      expect((repository as any).getStatusCode(null)).toBeUndefined()
    })
  })
})