import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { BaseRepository } from '~/composables/api/repositories/BaseRepository'

// Mock the useApi composable
vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    api: vi.fn()
  })
}))

// Test implementation of BaseRepository
class TestRepository extends BaseRepository {
  // Expose protected methods for testing
  public async testGet<T>(endpoint: string, query?: unknown): Promise<T> {
    return this.get<T>(endpoint, query)
  }

  public async testPost<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.post<T>(endpoint, body)
  }

  public async testPut<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.put<T>(endpoint, body)
  }

  public async testPatch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.patch<T>(endpoint, body)
  }

  public async testDelete<T>(endpoint: string): Promise<T> {
    return this.delete<T>(endpoint)
  }

  public testBuildPaginationQuery(
    page?: number,
    limit?: number,
    additionalQuery?: Record<string, string | number | boolean>
  ): Record<string, string | number | boolean> {
    return this.buildPaginationQuery(page, limit, additionalQuery)
  }

  public testIsRateLimitError(error: unknown): boolean {
    return this.isRateLimitError(error)
  }

  public testGetStatusCode(error: unknown): number | undefined {
    return this.getStatusCode(error)
  }

  public testIsServiceUnavailableError(error: unknown): boolean {
    return this.isServiceUnavailableError(error)
  }

  public testIsForbiddenError(error: unknown): boolean {
    return this.isForbiddenError(error)
  }

  public testIsServerError(error: unknown): boolean {
    return this.isServerError(error)
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository
  let mockApi: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    repository = new TestRepository()
    mockApi = repository['api'] as ReturnType<typeof vi.fn>
  })

  describe('HTTP methods', () => {
    it('should call api with GET method', async () => {
      mockApi.mockResolvedValue({ data: 'test' })

      await repository.testGet('/test')

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'GET'
      })
    })

    it('should call api with GET method and query params', async () => {
      mockApi.mockResolvedValue({ data: 'test' })

      await repository.testGet('/test', { page: 1, limit: 20 })

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'GET',
        query: { page: 1, limit: 20 }
      })
    })

    it('should call api with POST method', async () => {
      mockApi.mockResolvedValue({ id: '123' })

      await repository.testPost('/test', { name: 'Test' })

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'POST',
        body: { name: 'Test' }
      })
    })

    it('should call api with POST method without body', async () => {
      mockApi.mockResolvedValue({ success: true })

      await repository.testPost('/test')

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'POST'
      })
    })

    it('should call api with PUT method', async () => {
      mockApi.mockResolvedValue({ id: '123' })

      await repository.testPut('/test/123', { name: 'Updated' })

      expect(mockApi).toHaveBeenCalledWith('/test/123', {
        method: 'PUT',
        body: { name: 'Updated' }
      })
    })

    it('should call api with PATCH method', async () => {
      mockApi.mockResolvedValue({ id: '123' })

      await repository.testPatch('/test/123', { name: 'Patched' })

      expect(mockApi).toHaveBeenCalledWith('/test/123', {
        method: 'PATCH',
        body: { name: 'Patched' }
      })
    })

    it('should call api with DELETE method', async () => {
      mockApi.mockResolvedValue({ success: true })

      await repository.testDelete('/test/123')

      expect(mockApi).toHaveBeenCalledWith('/test/123', {
        method: 'DELETE'
      })
    })
  })

  describe('buildPaginationQuery', () => {
    it('should build query with default pagination', () => {
      const query = repository.testBuildPaginationQuery()

      expect(query).toEqual({
        page: 1,
        limit: 20
      })
    })

    it('should build query with custom page and limit', () => {
      const query = repository.testBuildPaginationQuery(3, 50)

      expect(query).toEqual({
        page: 3,
        limit: 50
      })
    })

    it('should merge additional query params', () => {
      const query = repository.testBuildPaginationQuery(2, 30, {
        category: 'test',
        active: true
      })

      expect(query).toEqual({
        page: 2,
        limit: 30,
        category: 'test',
        active: true
      })
    })

    it('should handle empty additional query', () => {
      const query = repository.testBuildPaginationQuery(1, 20, {})

      expect(query).toEqual({
        page: 1,
        limit: 20
      })
    })

    it('should handle additional query with number values', () => {
      const query = repository.testBuildPaginationQuery(1, 10, {
        minPrice: 100,
        maxPrice: 500
      })

      expect(query).toEqual({
        page: 1,
        limit: 10,
        minPrice: 100,
        maxPrice: 500
      })
    })

    it('should handle additional query with boolean values', () => {
      const query = repository.testBuildPaginationQuery(1, 10, {
        active: true,
        verified: false
      })

      expect(query).toEqual({
        page: 1,
        limit: 10,
        active: true,
        verified: false
      })
    })
  })

  describe('isRateLimitError', () => {
    it('should return true for 429 status code', () => {
      const error = {
        statusCode: 429,
        message: 'Too many requests'
      }

      expect(repository.testIsRateLimitError(error)).toBe(true)
    })

    it('should return false for non-429 status code', () => {
      const error = {
        statusCode: 500,
        message: 'Server error'
      }

      expect(repository.testIsRateLimitError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(repository.testIsRateLimitError(null)).toBe(false)
    })

    it('should return false for object without statusCode', () => {
      const error = {
        message: 'Some error'
      }

      expect(repository.testIsRateLimitError(error)).toBe(false)
    })

    it('should return false for non-object', () => {
      expect(repository.testIsRateLimitError('error')).toBe(false)
      expect(repository.testIsRateLimitError(123)).toBe(false)
    })
  })

  describe('getStatusCode', () => {
    it('should extract status code from error object', () => {
      const error = {
        statusCode: 404,
        message: 'Not found'
      }

      expect(repository.testGetStatusCode(error)).toBe(404)
    })

    it('should return undefined for null', () => {
      expect(repository.testGetStatusCode(null)).toBeUndefined()
    })

    it('should return undefined for non-object', () => {
      expect(repository.testGetStatusCode('error')).toBeUndefined()
      expect(repository.testGetStatusCode(123)).toBeUndefined()
    })

    it('should return undefined for object without statusCode', () => {
      const error = {
        message: 'Some error'
      }

      expect(repository.testGetStatusCode(error)).toBeUndefined()
    })

    it('should return undefined for non-numeric statusCode', () => {
      const error = {
        statusCode: 'not-a-number'
      }

      expect(repository.testGetStatusCode(error)).toBeUndefined()
    })

    it('should handle various status codes', () => {
      expect(repository.testGetStatusCode({ statusCode: 200 })).toBe(200)
      expect(repository.testGetStatusCode({ statusCode: 301 })).toBe(301)
      expect(repository.testGetStatusCode({ statusCode: 400 })).toBe(400)
      expect(repository.testGetStatusCode({ statusCode: 500 })).toBe(500)
      expect(repository.testGetStatusCode({ statusCode: 503 })).toBe(503)
    })
  })

  describe('isServiceUnavailableError', () => {
    it('should return true for 503 status code', () => {
      const error = {
        statusCode: 503,
        message: 'Service unavailable'
      }

      expect(repository.testIsServiceUnavailableError(error)).toBe(true)
    })

    it('should return false for non-503 status code', () => {
      const error = {
        statusCode: 500,
        message: 'Server error'
      }

      expect(repository.testIsServiceUnavailableError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(repository.testIsServiceUnavailableError(null)).toBe(false)
    })

    it('should return false for object without statusCode', () => {
      const error = {
        message: 'Some error'
      }

      expect(repository.testIsServiceUnavailableError(error)).toBe(false)
    })
  })

  describe('isForbiddenError', () => {
    it('should return true for 403 status code', () => {
      const error = {
        statusCode: 403,
        message: 'Forbidden'
      }

      expect(repository.testIsForbiddenError(error)).toBe(true)
    })

    it('should return false for non-403 status code', () => {
      const error = {
        statusCode: 401,
        message: 'Unauthorized'
      }

      expect(repository.testIsForbiddenError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(repository.testIsForbiddenError(null)).toBe(false)
    })

    it('should return false for object without statusCode', () => {
      const error = {
        message: 'Some error'
      }

      expect(repository.testIsForbiddenError(error)).toBe(false)
    })
  })

  describe('isServerError', () => {
    it('should return true for 500 status code', () => {
      const error = {
        statusCode: 500,
        message: 'Internal server error'
      }

      expect(repository.testIsServerError(error)).toBe(true)
    })

    it('should return false for non-500 status code', () => {
      const error = {
        statusCode: 503,
        message: 'Service unavailable'
      }

      expect(repository.testIsServerError(error)).toBe(false)
    })

    it('should return false for 400-level errors', () => {
      expect(repository.testIsServerError({ statusCode: 400 })).toBe(false)
      expect(repository.testIsServerError({ statusCode: 404 })).toBe(false)
    })

    it('should return false for null', () => {
      expect(repository.testIsServerError(null)).toBe(false)
    })
  })

  describe('integration tests', () => {
    it('should handle successful GET request', async () => {
      const mockData = { id: '123', name: 'Test' }
      mockApi.mockResolvedValue(mockData)

      const result = await repository.testGet('/test')

      expect(result).toEqual(mockData)
    })

    it('should handle GET request with query params', async () => {
      const mockData = { items: [], total: 0 }
      mockApi.mockResolvedValue(mockData)

      await repository.testGet('/test', { page: 1, limit: 10 })

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'GET',
        query: { page: 1, limit: 10 }
      })
    })

    it('should handle POST request with FormData', async () => {
      const formData = new FormData()
      formData.append('file', 'test')
      mockApi.mockResolvedValue({ success: true })

      await repository.testPost('/upload', formData)

      expect(mockApi).toHaveBeenCalledWith('/upload', {
        method: 'POST',
        body: formData
      })
    })

    it('should handle PUT request with JSON body', async () => {
      const body = { name: 'Updated Name' }
      mockApi.mockResolvedValue({ id: '123', ...body })

      await repository.testPut('/test/123', body)

      expect(mockApi).toHaveBeenCalledWith('/test/123', {
        method: 'PUT',
        body
      })
    })

    it('should propagate API errors', async () => {
      const error = new Error('API Error')
      mockApi.mockRejectedValue(error)

      await expect(repository.testGet('/test')).rejects.toThrow('API Error')
    })

    it('should detect error types correctly', () => {
      const error429 = { statusCode: 429 }
      const error403 = { statusCode: 403 }
      const error500 = { statusCode: 500 }
      const error503 = { statusCode: 503 }

      expect(repository.testIsRateLimitError(error429)).toBe(true)
      expect(repository.testIsForbiddenError(error403)).toBe(true)
      expect(repository.testIsServerError(error500)).toBe(true)
      expect(repository.testIsServiceUnavailableError(error503)).toBe(true)
    })

    it('should handle array query parameters', async () => {
      mockApi.mockResolvedValue({ items: [] })

      await repository.testGet('/test', {
        ids: ['1', '2', '3'],
        categories: ['a', 'b']
      })

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'GET',
        query: {
          ids: ['1', '2', '3'],
          categories: ['a', 'b']
        }
      })
    })

    it('should handle number array query parameters', async () => {
      mockApi.mockResolvedValue({ items: [] })

      await repository.testGet('/test', {
        prices: [100, 200, 300]
      })

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'GET',
        query: {
          prices: [100, 200, 300]
        }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle undefined body in POST', async () => {
      mockApi.mockResolvedValue({ success: true })

      await repository.testPost('/test', undefined)

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'POST'
      })
    })

    it('should handle null body in PUT', async () => {
      mockApi.mockResolvedValue({ success: true })

      await repository.testPut('/test', null)

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'PUT',
        body: null
      })
    })

    it('should handle empty string body', async () => {
      mockApi.mockResolvedValue({ success: true })

      await repository.testPost('/test', '')

      expect(mockApi).toHaveBeenCalledWith('/test', {
        method: 'POST',
        body: ''
      })
    })

    it('should distinguish between similar error codes', () => {
      expect(repository.testIsRateLimitError({ statusCode: 429 })).toBe(true)
      expect(repository.testIsRateLimitError({ statusCode: 420 })).toBe(false)
      expect(repository.testIsRateLimitError({ statusCode: 430 })).toBe(false)
    })

    it('should handle error objects with extra properties', () => {
      const error = {
        statusCode: 500,
        message: 'Error',
        data: { detail: 'Extra info' },
        stack: 'Stack trace'
      }

      expect(repository.testIsServerError(error)).toBe(true)
      expect(repository.testGetStatusCode(error)).toBe(500)
    })
  })
})
