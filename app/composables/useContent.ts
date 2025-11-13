import { ProductsRepository } from './api/repositories/ProductsRepository'
import type {
  ContentCreate,
  ContentUpdate
} from '../../shared/types/api/content.types'

/**
 * Composable for managing content (videos, documents, etc.)
 */
export const useContent = () => {
  const repository = new ProductsRepository()

  /**
   * Get all content with optional filtering
   * @param filter - Filter by category (default: "video")
   */
  const getAllContent = async (filter?: string) => {
    return await repository.getAllContent(filter)
  }

  /**
   * Get public content (no auth required)
   * Premium content URLs are masked
   * @param categoryTags - Optional filter by category tags
   * @param profileTags - Optional filter by profile tags
   */
  const getPublicContent = async (
    categoryTags?: string[],
    profileTags?: string[]
  ) => {
    return await repository.getPublicContent(categoryTags, profileTags)
  }

  /**
   * Get a specific content by ID
   * @param contentId - Content ID
   */
  const getContentById = async (contentId: string) => {
    return await repository.getContentById(contentId)
  }

  /**
   * Create new content (superadmin only)
   * @param data - Content creation data
   */
  const createContent = async (data: ContentCreate) => {
    return await repository.createContent(data)
  }

  /**
   * Update existing content
   * @param contentId - Content ID
   * @param data - Content update data
   */
  const updateContent = async (contentId: string, data: ContentUpdate) => {
    return await repository.updateContent(contentId, data)
  }

  /**
   * Delete (disable) content
   * @param contentId - Content ID
   */
  const deleteContent = async (contentId: string) => {
    return await repository.deleteContent(contentId)
  }

  return {
    getAllContent,
    getPublicContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent
  }
}
