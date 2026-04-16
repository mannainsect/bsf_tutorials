import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContentRepository } from '~/composables/api/repositories/ContentRepository'
import type { ContentPublic } from '../../../../shared/types'

const createMockAuthStore = () => ({
  token: null as string | null,
  isAuthenticated: false
})

const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)

global.useApiEndpoints = vi.fn(() => ({
  productsContentPublic: '/products/content/public'
}))

const mockContent: ContentPublic[] = [{
  _id: '1',
  title: 'Test Video',
  description: 'A test',
  category: 'video',
  level: 'basic',
  credits: 0,
  profile_tags: ['newbie'],
  category_tags: ['breeding'],
  url: 'https://example.com/video.mp4',
  active: true,
  expiry_days: 30,
  created_at: '2024-01-01T00:00:00Z',
  available_at: '2024-01-01T00:00:00Z'
}]

describe('ContentRepository', () => {
  let repository: ContentRepository

  beforeEach(() => {
    mockAuthStore.token = 'test-token'
    mockAuthStore.isAuthenticated = true
    repository = new ContentRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getPublic', () => {
    it('should fetch public content', async () => {
      vi.spyOn(
        repository as unknown as { get: () => unknown },
        'get'
      ).mockResolvedValue(mockContent)

      const result = await repository.getPublic()

      expect(result).toEqual(mockContent)
      expect(repository.get).toHaveBeenCalledWith(
        '/products/content/public'
      )
    })

    it('should return typed ContentPublic array', async () => {
      vi.spyOn(
        repository as unknown as { get: () => unknown },
        'get'
      ).mockResolvedValue(mockContent)

      const result: ContentPublic[] = await repository.getPublic()

      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('_id')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('category')
    })

    it('should handle API errors', async () => {
      const error = {
        statusCode: 500,
        data: { message: 'Internal server error' }
      }

      vi.spyOn(
        repository as unknown as { get: () => unknown },
        'get'
      ).mockRejectedValue(error)

      await expect(repository.getPublic()).rejects.toMatchObject(error)
    })
  })
})
