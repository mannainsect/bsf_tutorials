import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  WantedRepository
} from '~/composables/api/repositories/WantedRepository'
import type {
  MarketplaceWantedResponse,
  WantedPublicListing,
  Wanted,
  WantedPublicDetail,
  WantedAuthenticated
} from '~/shared/types/models/MarketplaceWanted'
vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: vi.fn(() => ({
    marketWanted: '/market/wanted'
  }))
}))
const createMockAuthStore = () => ({
  token: null as string | null,
  isAuthenticated: false
})
const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)
global.useApiEndpoints = vi.fn(() => ({
  marketWanted: '/market/wanted'
}))
describe('WantedRepository', () => {
  let repository: WantedRepository
  beforeEach(() => {
    mockAuthStore.token = null
    mockAuthStore.isAuthenticated = false
    repository = new WantedRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  describe('getWantedItems', () => {
    it('should fetch wanted items without authentication', async () => {
      const mockWanted: WantedPublicListing[] = [
        {
          id: '1',
          title: 'Public Wanted Item',
          description: 'Looking for electronic components',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA', 'Canada'],
          image_urls: ['https://example.com/image1.jpg'],
          additional_info: { urgent: true },
          company_name: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockWanted)
      const result = await repository.getWantedItems()
      expect(result).toEqual({
        items: mockWanted,
        total: mockWanted.length,
        page: 1,
        limit: 20
      })
      expect(repository.get).toHaveBeenCalledWith(
        '/market/wanted',
        { limit: 20, offset: 0 }
      )
    })
    it('should fetch wanted items with authentication', async () => {
      mockAuthStore.token = 'test-token'
      mockAuthStore.isAuthenticated = true
      const mockWanted: Wanted[] = [
        {
          id: '1',
          title: 'Authenticated Wanted Item',
          description: 'Full wanted details',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA', 'Canada'],
          image_urls: ['https://example.com/image1.jpg'],
          additional_info: { urgent: true },
          company_name: 'Test Company',
          company_id: 'company-1',
          user_id: 'user-1',
          contact_email: 'contact@example.com',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockWanted)
      const result = await repository.getWantedItems()
      expect(result.items).toEqual(mockWanted)
      expect(result.items[0]).toHaveProperty('user_id')
      expect(result.items[0]).toHaveProperty('contact_email')
      expect(result.items[0]).toHaveProperty('active')
    })
    it('should handle search parameters', async () => {
      vi.spyOn(repository as any, 'get').mockResolvedValue([])
      await repository.getWantedItems({
        search: 'electronics',
        category: 'Electronics',
        subcategory: 'Components',
        company_id: 'company-123',
        limit: 10,
        offset: 20
      })
      expect(repository.get).toHaveBeenCalledWith(
        '/market/wanted',
        {
          limit: 10,
          offset: 20,
          category: 'Electronics',
          subcategory: 'Components',
          company_id: 'company-123',
          search: 'electronics'
        }
      )
    })
    it('should handle wanted_id parameter', async () => {
      vi.spyOn(repository as any, 'get').mockResolvedValue([])
      await repository.getWantedItems({
        wanted_id: 'wanted-123'
      })
      expect(repository.get).toHaveBeenCalledWith(
        '/market/wanted',
        {
          limit: 20,
          offset: 0,
          wanted_id: 'wanted-123'
        }
      )
    })
    it('should handle rate limiting (429) gracefully', async () => {
      const rateLimitError = {
        statusCode: 429,
        message: 'Too many requests'
      }
      vi.spyOn(repository as any, 'get').mockRejectedValue(rateLimitError)
      const result = await repository.getWantedItems()
      expect(result).toEqual({ items: [] })
    })
    it('should throw other errors', async () => {
      const genericError = new Error('Network error')
      vi.spyOn(repository as any, 'get').mockRejectedValue(genericError)
      await expect(repository.getWantedItems()).rejects.toThrow(
        'Network error'
      )
    })
    it('should map MongoDB _id to id in wanted items', async () => {
      const mockResponse = [
        {
          _id: 'mongodb-wanted-id',
          title: 'Wanted with _id',
          description: 'Wanted from MongoDB',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 50,
          quantity_unit: 'pcs',
          countries: ['USA'],
          company_name: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getWantedItems()
      expect(result.items[0].id).toBe('mongodb-wanted-id')
    })
    it('should filter out wanted items without valid ID', async () => {
      const mockResponse = [
        {
          title: 'Wanted without ID',
          description: 'Should be filtered',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 50,
          quantity_unit: 'pcs',
          countries: ['USA'],
          company_name: 'Test Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        },
        {
          id: 'valid-id',
          title: 'Wanted with ID',
          description: 'Should be included',
          category: 'Electronics',
          subcategory: 'Components',
          budget_min: 200,
          budget_max: 600,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['Canada'],
          company_name: 'Test Company 2',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getWantedItems()
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('valid-id')
    })
  })
  describe('getWantedDetail', () => {
    it('should fetch wanted detail without authentication', async () => {
      const mockWanted: WantedPublicDetail = {
        id: '1',
        title: 'Public Wanted Detail',
        description: 'Detailed description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA', 'Canada'],
        image_urls: ['https://example.com/image1.jpg'],
        additional_info: { urgent: true, specifications: 'ISO 9001' },
        company_name: 'Test Company',
        company_id: 'company-1',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockWanted)
      const result = await repository.getWantedDetail('1')
      expect(result).toEqual(mockWanted)
      expect(repository.get).toHaveBeenCalledWith('/market/wanted/1')
    })
    it('should fetch wanted detail with authentication', async () => {
      mockAuthStore.token = 'test-token'
      mockAuthStore.isAuthenticated = true
      const mockWanted: WantedAuthenticated = {
        id: '1',
        title: 'Authenticated Wanted Detail',
        description: 'Detailed description',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA', 'Canada'],
        image_urls: ['https://example.com/image1.jpg'],
        additional_info: { urgent: true, specifications: 'ISO 9001' },
        company_name: 'Test Company',
        company_id: 'company-1',
        user_id: 'user-1',
        contact_email: 'contact@example.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockWanted)
      const result = await repository.getWantedDetail('1')
      expect(result).toEqual(mockWanted)
      expect(result).toHaveProperty('user_id')
      expect(result).toHaveProperty('contact_email')
    })
    it('should map MongoDB _id to id in wanted detail', async () => {
      const mockWanted = {
        _id: 'mongodb-wanted-id',
        title: 'Wanted with _id',
        description: 'Wanted from MongoDB',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD',
        quantity_needed: 100,
        quantity_unit: 'pcs',
        countries: ['USA'],
        company_name: 'Test Company',
        company_id: 'company-1',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockWanted)
      const result = await repository.getWantedDetail('mongodb-wanted-id')
      expect(result.id).toBe('mongodb-wanted-id')
      expect((result as any)._id).toBe('mongodb-wanted-id')
    })
    it('should handle rate limiting (429) gracefully', async () => {
      const rateLimitError = {
        statusCode: 429,
        message: 'Too many requests'
      }
      vi.spyOn(repository as any, 'get').mockRejectedValue(rateLimitError)
      await expect(repository.getWantedDetail('1')).rejects.toThrow(
        'Rate limit reached. Please try again later.'
      )
    })
    it('should throw error for invalid wanted item without ID', async () => {
      const mockWanted = {
        title: 'Wanted without ID',
        description: 'Invalid wanted',
        category: 'Electronics',
        subcategory: 'Components',
        budget_min: 100,
        budget_max: 500,
        budget_currency: 'USD'
      }
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockWanted)
      await expect(repository.getWantedDetail('1')).rejects.toThrow(
        'Invalid wanted item: missing ID'
      )
    })
    it('should throw other errors', async () => {
      const genericError = new Error('Wanted not found')
      vi.spyOn(repository as any, 'get').mockRejectedValue(genericError)
      await expect(repository.getWantedDetail('1')).rejects.toThrow(
        'Wanted not found'
      )
    })
  })
  describe('getRandomWanted', () => {
    it('should return a random wanted from the list', async () => {
      const mockWanted: WantedPublicListing[] = [
        {
          id: '1',
          title: 'Wanted 1',
          description: 'Description 1',
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
          company_name: 'Company 1',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Wanted 2',
          description: 'Description 2',
          category: 'Textiles',
          subcategory: 'Fabrics',
          budget_min: 200,
          budget_max: 800,
          budget_currency: 'EUR',
          quantity_needed: 500,
          quantity_unit: 'meters',
          countries: ['Germany', 'France'],
          image_urls: [],
          additional_info: {},
          company_name: 'Company 2',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository, 'getWantedItems').mockResolvedValue({
        items: mockWanted
      })
      const result = await repository.getRandomWanted()
      expect(result).toBeTruthy()
      expect(mockWanted).toContainEqual(result)
      expect(repository.getWantedItems).toHaveBeenCalledWith({ limit: 10 })
    })
    it('should return null when no wanted items are available', async () => {
      vi.spyOn(repository, 'getWantedItems').mockResolvedValue({
        items: []
      })
      const result = await repository.getRandomWanted()
      expect(result).toBeNull()
    })
    it('should handle errors gracefully and return null', async () => {
      vi.spyOn(repository, 'getWantedItems').mockRejectedValue(
        new Error('Network error')
      )
      const result = await repository.getRandomWanted()
      expect(result).toBeNull()
    })
  })
  describe('hasAuthentication', () => {
    it('should return false when no token exists', () => {
      mockAuthStore.token = null
      mockAuthStore.isAuthenticated = false
      const repo = new WantedRepository()
      const result = repo.hasAuthentication()
      expect(result).toBe(false)
    })
    it('should return true when token exists', () => {
      mockAuthStore.token = 'test-token'
      mockAuthStore.isAuthenticated = true
      const repo = new WantedRepository()
      const result = repo.hasAuthentication()
      expect(result).toBe(true)
    })
  })
  describe('updateWanted', () => {
    it('should update a wanted item successfully', async () => {
      const wantedId = 'wanted-123'
      const updateData = {
        title: 'Updated Wanted Title',
        description: 'Updated description',
        budget_min: 200,
        budget_max: 800
      }
      const mockResponse = {
        id: wantedId,
        message: 'Wanted item updated successfully'
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateWanted(wantedId, updateData)
      expect(result).toEqual(mockResponse)
      expect(repository.put).toHaveBeenCalledWith(
        `/market/wanted/${wantedId}`,
        updateData
      )
    })
    it('should map MongoDB _id to id in response', async () => {
      const wantedId = 'wanted-123'
      const updateData = { title: 'Updated' }
      const mockResponse = {
        _id: wantedId,
        message: 'Updated'
      }
      vi.spyOn(repository as any, 'put').mockResolvedValue(mockResponse)
      const result = await repository.updateWanted(wantedId, updateData)
      expect(result.id).toBe(wantedId)
    })
    it('should handle 401 authentication error', async () => {
      const error = {
        statusCode: 401,
        data: { message: 'Unauthorized' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Authentication required. Please log in.'
      )
    })
    it('should handle 403 forbidden error with custom message', async () => {
      const error = {
        statusCode: 403,
        data: { message: 'Custom forbidden message' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Custom forbidden message'
      )
    })
    it('should handle 403 forbidden error with default message', async () => {
      const error = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'You do not have permission to update this wanted item.'
      )
    })
    it('should handle 404 not found error', async () => {
      const error = {
        statusCode: 404,
        data: { message: 'Not found' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Wanted item not found or you do not have permission to edit it.'
      )
    })
    it('should handle 429 rate limit error', async () => {
      const error = {
        statusCode: 429,
        data: { message: 'Too many requests' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      )
    })
    it('should handle 500 server error', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Server error. Please try again later.'
      )
    })
    it('should handle unknown status code with custom message', async () => {
      const error = {
        statusCode: 418,
        data: { message: 'I am a teapot' }
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'I am a teapot'
      )
    })
    it('should handle unknown status code with default message', async () => {
      const error = {
        statusCode: 418,
        data: {}
      }
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Failed to update wanted item. Please try again.'
      )
    })
    it('should throw generic errors unchanged', async () => {
      const error = new Error('Network failure')
      vi.spyOn(repository as any, 'put').mockRejectedValue(error)
      await expect(repository.updateWanted('123', {})).rejects.toThrow(
        'Network failure'
      )
    })
  })
  describe('deleteWanted', () => {
    it('should delete a wanted item successfully', async () => {
      const wantedId = 'wanted-123'
      const mockResponse = {
        success: true,
        message: 'Wanted item deleted successfully'
      }
      vi.spyOn(repository as any, 'delete').mockResolvedValue(mockResponse)
      const result = await repository.deleteWanted(wantedId)
      expect(result).toEqual(mockResponse)
      expect(repository.delete).toHaveBeenCalledWith(
        `/market/wanted/${wantedId}`
      )
    })
    it('should handle 401 authentication error', async () => {
      const error = {
        statusCode: 401,
        data: { message: 'Unauthorized' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Authentication required. Please log in.'
      )
    })
    it('should handle 403 forbidden error with custom message', async () => {
      const error = {
        statusCode: 403,
        data: { message: 'Not your wanted item' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Not your wanted item'
      )
    })
    it('should handle 403 forbidden error with default message', async () => {
      const error = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'You do not have permission to delete this wanted item.'
      )
    })
    it('should handle 404 not found error', async () => {
      const error = {
        statusCode: 404,
        data: { message: 'Not found' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Wanted item not found or you do not have permission to delete it.'
      )
    })
    it('should handle 429 rate limit error', async () => {
      const error = {
        statusCode: 429,
        data: { message: 'Too many requests' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      )
    })
    it('should handle 500 server error', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Server error. Please try again later.'
      )
    })
    it('should handle unknown status code with custom message', async () => {
      const error = {
        statusCode: 418,
        data: { message: 'Unexpected error occurred' }
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Unexpected error occurred'
      )
    })
    it('should handle unknown status code with default message', async () => {
      const error = {
        statusCode: 418,
        data: {}
      }
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Failed to delete wanted item. Please try again.'
      )
    })
    it('should throw generic errors unchanged', async () => {
      const error = new Error('Connection lost')
      vi.spyOn(repository as any, 'delete').mockRejectedValue(error)
      await expect(repository.deleteWanted('123')).rejects.toThrow(
        'Connection lost'
      )
    })
  })

  describe('createWanted with new API response fields', () => {
    it('should handle wanted_id in creation response', async () => {
      const companyId = 'company-wanted-123'
      const formData = new FormData()
      formData.append('title', 'New Wanted Item')
      formData.append('budget_min', '500')

      const mockResponse = {
        status: 'Wanted item created successfully',
        wanted_id: 'want-67890-fghij-klmno-pqrst',
        id: 'wanted-456'
      }

      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)

      const result = await repository.createWanted(companyId, formData)

      expect(result).toBeDefined()
      expect(result.id).toBe('wanted-456')
      expect(result).toHaveProperty('id')
      expect(repository.post).toHaveBeenCalledWith(
        `/market/wanted/${companyId}`,
        formData
      )
    })

    it('should handle missing wanted_id gracefully (backward compat)',
    async () => {
      const companyId = 'company-wanted-legacy'
      const formData = new FormData()
      formData.append('title', 'Legacy Wanted Item')

      const mockResponse = {
        status: 'Wanted item created successfully',
        id: 'wanted-legacy-999'
      }

      const consoleDebugSpy = vi.spyOn(console, 'debug')
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)

      const result = await repository.createWanted(companyId, formData)

      expect(result).toBeDefined()
      expect(result.id).toBe('wanted-legacy-999')
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Response without wanted_id (backward compatible)'
      )
    })

    it('should handle wanted_id as empty string', async () => {
      const companyId = 'company-wanted-empty'
      const formData = new FormData()
      formData.append('title', 'Empty ID Wanted')

      const mockResponse = {
        status: 'Wanted item created successfully',
        wanted_id: '',
        id: 'wanted-empty-123'
      }

      const consoleDebugSpy = vi.spyOn(console, 'debug')
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)

      const result = await repository.createWanted(companyId, formData)

      expect(result.id).toBe('wanted-empty-123')
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Response without wanted_id (backward compatible)'
      )
    })

    it('should handle 403 error for space authorization', async () => {
      const companyId = 'company-wanted-unauthorized'
      const formData = new FormData()
      formData.append('title', 'Unauthorized Wanted')

      const mock403Error = {
        statusCode: 403,
        data: { detail: 'You do not have access to this space' }
      }

      vi.spyOn(repository as any, 'post').mockRejectedValue(mock403Error)

      await expect(
        repository.createWanted(companyId, formData)
      ).rejects.toThrow(
        'Insufficient permissions to create wanted item in space'
      )
    })

    it('should handle 500 error for database persistence',
    async () => {
      const companyId = 'company-wanted-db-error'
      const formData = new FormData()
      formData.append('title', 'DB Error Wanted')

      const mock500Error = {
        statusCode: 500,
        data: { detail: 'Database write failed' }
      }

      vi.spyOn(repository as any, 'post').mockRejectedValue(mock500Error)

      await expect(
        repository.createWanted(companyId, formData)
      ).rejects.toThrow(
        'Database error creating wanted item. Please try again.'
      )
    })

    it('should handle 500 error with listing limit message',
    async () => {
      const companyId = 'company-wanted-limit'
      const formData = new FormData()
      formData.append('title', 'Limit Reached Wanted')

      const mock500Error = {
        statusCode: 500,
        data: {
          message: 'You have reached your listing limit'
        }
      }

      vi.spyOn(repository as any, 'post').mockRejectedValue(mock500Error)

      await expect(
        repository.createWanted(companyId, formData)
      ).rejects.toThrow(
        'You have reached your listing limit. Please upgrade your plan ' +
        'to create more wanted items.'
      )
    })
  })

  describe('response normalization', () => {
    it('should handle multiple items with _id mapping', async () => {
      const mockResponse = [
        {
          _id: 'mongodb-id-1',
          title: 'Wanted with _id',
          description: 'Wanted from MongoDB',
          category: 'Test',
          subcategory: 'Test',
          budget_min: 100,
          budget_max: 500,
          budget_currency: 'USD',
          quantity_needed: 100,
          quantity_unit: 'pcs',
          countries: ['USA'],
          company_name: 'Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        },
        {
          _id: 'mongodb-id-2',
          id: 'should-be-ignored',
          title: 'Wanted with both _id and id',
          description: 'Should use _id',
          category: 'Test',
          subcategory: 'Test',
          budget_min: 200,
          budget_max: 600,
          budget_currency: 'EUR',
          quantity_needed: 200,
          quantity_unit: 'pcs',
          countries: ['Germany'],
          company_name: 'Company 2',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getWantedItems()
      expect(result.items).toHaveLength(2)
      expect(result.items[0].id).toBe('mongodb-id-1')
      expect(result.items[1].id).toBe('mongodb-id-2')
    })
    it('should handle undefined optional fields gracefully', async () => {
      const mockResponse = [
        {
          id: '1',
          title: 'Minimal Wanted',
          description: 'Basic description',
          category: 'Other',
          subcategory: 'Misc',
          budget_min: 50,
          budget_max: 100,
          budget_currency: 'USD',
          quantity_needed: 10,
          quantity_unit: 'pcs',
          countries: ['USA'],
          company_name: 'Company',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z'
        }
      ]
      vi.spyOn(repository as any, 'get').mockResolvedValue(mockResponse)
      const result = await repository.getWantedItems()
      expect(result.items[0]).toBeDefined()
      expect(result.items[0].image_urls).toBeUndefined()
      expect(result.items[0].additional_info).toBeUndefined()
    })
  })
})