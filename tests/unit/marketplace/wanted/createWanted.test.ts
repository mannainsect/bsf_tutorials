import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  WantedRepository
} from '~/composables/api/repositories/WantedRepository'
vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: vi.fn(() => ({
    marketWanted: '/market/wanted'
  }))
}))
const createMockAuthStore = () => ({
  token: 'test-token',
  isAuthenticated: true
})
const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)
global.useApiEndpoints = vi.fn(() => ({
  marketWanted: '/market/wanted'
}))
describe('WantedRepository - createWanted', () => {
  let repository: WantedRepository
  beforeEach(() => {
    mockAuthStore.token = 'test-token'
    mockAuthStore.isAuthenticated = true
    repository = new WantedRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  describe('createWanted', () => {
    it('should successfully create a wanted listing', async () => {
      const mockResponse = {
        id: 'new-wanted-id',
        message: 'Wanted listing created successfully'
      }
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)
      const formData = new FormData()
      formData.append('title', 'Looking for Electronics')
      formData.append('description', 'Need bulk electronics')
      formData.append('category', 'electronics')
      const result = await repository.createWanted('company-123', formData)
      expect(result).toEqual(mockResponse)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/wanted/company-123',
        formData
      )
    })
    it('should map MongoDB _id to id in response', async () => {
      const mockResponse = {
        _id: 'mongodb-wanted-id',
        message: 'Wanted created'
      }
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)
      const formData = new FormData()
      formData.append('title', 'Wanted')
      const result = await repository.createWanted('company-123', formData)
      expect(result.id).toBe('mongodb-wanted-id')
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
        repository.createWanted('company-123', formData)
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
        repository.createWanted('company-123', formData)
      ).rejects.toThrow('Authentication required. Please log in.')
    })
    it('should handle permission errors (403)', async () => {
      const permissionError = {
        statusCode: 403,
        data: { message: 'Cannot create wanted listings' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(permissionError)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow(
        'Insufficient permissions to create wanted item in space'
      )
    })
    it('should handle company not found errors (404)', async () => {
      const notFoundError = {
        statusCode: 404,
        data: { message: 'Company not found' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(notFoundError)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow('Company not found. Please check your account settings.')
    })
    it('should handle listing limit errors (500)', async () => {
      const limitError = {
        statusCode: 500,
        data: { message: 'Wanted limit reached for this account' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(limitError)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow(
        'You have reached your listing limit. Please upgrade your plan to create more wanted items.'
      )
    })
    it('should handle generic server errors (500)', async () => {
      const serverError = {
        statusCode: 500,
        data: { message: 'Database connection failed' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(serverError)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow(
        'Database error creating wanted item. Please try again.'
      )
    })
    it('should handle unknown status codes', async () => {
      const unknownError = {
        statusCode: 422,
        data: { message: 'Validation error' }
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(unknownError)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow('Validation error')
    })
    it('should handle errors without data message', async () => {
      const errorWithoutMessage = {
        statusCode: 403,
        data: {}
      }
      vi.spyOn(repository as any, 'post').mockRejectedValue(errorWithoutMessage)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow(
        'Insufficient permissions to create wanted item in space'
      )
    })
    it('should pass through non-status-code errors', async () => {
      const genericError = new Error('Connection timeout')
      vi.spyOn(repository as any, 'post').mockRejectedValue(genericError)
      const formData = new FormData()
      await expect(
        repository.createWanted('company-123', formData)
      ).rejects.toThrow('Connection timeout')
    })
    it('should work with FormData containing all fields', async () => {
      const mockResponse = {
        id: 'wanted-full',
        message: 'Wanted created'
      }
      vi.spyOn(repository as any, 'post').mockResolvedValue(mockResponse)
      const formData = new FormData()
      formData.append('title', 'Looking for Suppliers')
      formData.append('description', 'Need reliable suppliers')
      formData.append('category', 'electronics')
      formData.append('subcategory', 'components')
      formData.append('countries', 'US,CA,MX')
      formData.append('additional_info', 'Urgent requirement')
      const result = await repository.createWanted('company-123', formData)
      expect(result).toEqual(mockResponse)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/wanted/company-123',
        formData
      )
    })
  })
  describe('hasAuthentication', () => {
    it('should return true when token exists', () => {
      mockAuthStore.token = 'test-token'
      const repo = new WantedRepository()
      expect(repo.hasAuthentication()).toBe(true)
    })
    it('should return false when token is null', () => {
      mockAuthStore.token = null
      const repo = new WantedRepository()
      expect(repo.hasAuthentication()).toBe(false)
    })
  })
})