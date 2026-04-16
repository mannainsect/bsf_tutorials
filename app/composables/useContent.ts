import type { ContentPublic } from '../../shared/types/api/content.types'
import { ContentRepository } from './api/repositories/ContentRepository'

export const useContent = () => {
  const contentRepository = new ContentRepository()

  const loadPublic = async (): Promise<ContentPublic[]> => {
    return contentRepository.getPublic()
  }

  const pickRandomFreeVideo = (
    videos: ContentPublic[]
  ): ContentPublic | null => {
    const freeVideos = videos.filter(
      v => v.url !== null && v.level === 'basic' && v.credits === 0
    )
    if (freeVideos.length === 0) return null
    const idx = Math.floor(Math.random() * freeVideos.length)
    return freeVideos[idx] ?? null
  }

  return {
    loadPublic,
    pickRandomFreeVideo
  }
}
