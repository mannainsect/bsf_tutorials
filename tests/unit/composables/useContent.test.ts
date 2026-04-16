import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ContentPublic } from '../../../shared/types/api/content.types'
import {
  freeVideoWithQueryParams,
  premiumVideo,
  directVimeoUrlWithWww,
  directVimeoUrlNoWww,
  freeVideoNoQueryParams,
  videoWithManyQueryParams
} from '../../fixtures/videos'

const mockGetPublic = vi.fn()

vi.mock('~/composables/api/repositories/ContentRepository', () => ({
  ContentRepository: vi.fn().mockImplementation(() => ({
    getPublic: mockGetPublic
  }))
}))

import { useContent } from '../../../app/composables/useContent'

describe('useContent', () => {
  let content: ReturnType<typeof useContent>

  beforeEach(() => {
    vi.clearAllMocks()
    content = useContent()
  })

  describe('loadPublic', () => {
    it('should delegate to ContentRepository.getPublic', async () => {
      const videos = [freeVideoWithQueryParams, premiumVideo]
      mockGetPublic.mockResolvedValue(videos)

      const result = await content.loadPublic()

      expect(mockGetPublic).toHaveBeenCalledOnce()
      expect(result).toEqual(videos)
    })

    it('should return empty array when no content', async () => {
      mockGetPublic.mockResolvedValue([])

      const result = await content.loadPublic()

      expect(result).toEqual([])
    })

    it('should propagate errors from repository', async () => {
      const error = new Error('Network error')
      mockGetPublic.mockRejectedValue(error)

      await expect(content.loadPublic()).rejects.toThrow('Network error')
    })
  })

  describe('pickRandomFreeVideo', () => {
    it('should return null for empty array', () => {
      const result = content.pickRandomFreeVideo([])
      expect(result).toBeNull()
    })

    it('should filter out videos with null url', () => {
      // premiumVideo has url: null, level: 'advanced', credits: 10
      // Create a video that is basic + 0 credits but null url
      const nullUrlBasic: ContentPublic = {
        ...freeVideoWithQueryParams,
        _id: 'null-url',
        url: null
      }
      const result = content.pickRandomFreeVideo([nullUrlBasic])
      expect(result).toBeNull()
    })

    it('should filter out non-basic level videos', () => {
      // freeVideoNoQueryParams has level: 'intermediate'
      const result = content.pickRandomFreeVideo([freeVideoNoQueryParams])
      expect(result).toBeNull()
    })

    it('should filter out videos with credits > 0', () => {
      // directVimeoUrlNoWww has level: 'intermediate', credits: 5
      // Create a basic video with credits > 0
      const paidBasic: ContentPublic = {
        ...freeVideoWithQueryParams,
        _id: 'paid-basic',
        credits: 5
      }
      const result = content.pickRandomFreeVideo([paidBasic])
      expect(result).toBeNull()
    })

    it('should return a matching free basic video', () => {
      // freeVideoWithQueryParams: url set, level: 'basic', credits: 0
      const result = content.pickRandomFreeVideo([freeVideoWithQueryParams])
      expect(result).toEqual(freeVideoWithQueryParams)
    })

    it('should only return videos matching all criteria', () => {
      const videos = [
        premiumVideo, // url: null, advanced, credits: 10
        freeVideoNoQueryParams, // intermediate, credits: 0
        freeVideoWithQueryParams // basic, credits: 0, url set
      ]
      // Run multiple times to ensure only valid video returned
      for (let i = 0; i < 20; i++) {
        const result = content.pickRandomFreeVideo(videos)
        expect(result).toEqual(freeVideoWithQueryParams)
      }
    })

    it('should use Math.random for selection', () => {
      const eligible = [
        freeVideoWithQueryParams, // basic, 0 credits, url set
        directVimeoUrlWithWww, // basic, 0 credits, url set
        videoWithManyQueryParams // basic, 0 credits, url set
      ]

      // Force Math.random to return 0 -> index 0
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(content.pickRandomFreeVideo(eligible)).toEqual(freeVideoWithQueryParams)

      // Force Math.random to return 0.99 -> last index
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      expect(content.pickRandomFreeVideo(eligible)).toEqual(videoWithManyQueryParams)

      vi.restoreAllMocks()
    })

    it('should return null when all videos are filtered out', () => {
      const videos = [
        premiumVideo, // url: null, advanced, credits: 10
        freeVideoNoQueryParams, // intermediate
        directVimeoUrlNoWww // intermediate, credits: 5
      ]
      const result = content.pickRandomFreeVideo(videos)
      expect(result).toBeNull()
    })
  })
})
