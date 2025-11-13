import { ref } from 'vue'
import { ProductsRepository } from './api/repositories/ProductsRepository'
import type {
  Content,
  ContentPublic,
  ContentCreate,
  ContentUpdate
} from '../../shared/types/api/content.types'

/**
 * Composable for managing content (videos, documents, etc.)
 * Provides error handling, loading states, and proper type safety
 *
 * @example
 * ```ts
 * const { getAllContent, loading, error } = useContent()
 * const contents = await getAllContent('video')
 * if (error.value) {
 *   console.error('Failed to fetch content:', error.value)
 * }
 * ```
 */
export const useContent = () => {
  const repository = new ProductsRepository()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Get all content with optional filtering
   * @param filter - Filter by category (default: "video")
   * @returns Promise<Content[]>
   * @throws Error if request fails
   */
  const getAllContent = async (filter?: string): Promise<Content[]> => {
    loading.value = true
    error.value = null
    try {
      const result = await repository.getAllContent(filter)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch content')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Get public content (no auth required)
   * Premium content URLs are masked
   * @param categoryTags - Optional filter by category tags
   * @param profileTags - Optional filter by profile tags
   * @returns Promise<ContentPublic[]>
   * @throws Error if request fails
   */
  const getPublicContent = async (
    categoryTags?: string[],
    profileTags?: string[]
  ): Promise<ContentPublic[]> => {
    loading.value = true
    error.value = null
    try {
      const result = await repository.getPublicContent(categoryTags, profileTags)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch public content')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a specific content by ID
   * @param contentId - Content ID
   * @returns Promise<Content>
   * @throws Error if contentId is empty or request fails
   */
  const getContentById = async (contentId: string): Promise<Content> => {
    if (!contentId?.trim()) {
      throw new Error('Content ID is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.getContentById(contentId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch content by ID')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new content (superadmin only)
   * @param data - Content creation data
   * @returns Promise with creation result
   * @throws Error if data is invalid or request fails
   */
  const createContent = async (data: ContentCreate): Promise<{ message: string; content_id?: string }> => {
    if (!data.title?.trim()) {
      throw new Error('Content title is required')
    }
    if (!data.url?.trim()) {
      throw new Error('Content URL is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.createContent(data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to create content')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing content
   * @param contentId - Content ID
   * @param data - Content update data
   * @returns Promise with update result
   * @throws Error if contentId is empty or request fails
   */
  const updateContent = async (
    contentId: string,
    data: ContentUpdate
  ): Promise<{ message: string }> => {
    if (!contentId?.trim()) {
      throw new Error('Content ID is required')
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Update data is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.updateContent(contentId, data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update content')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete (disable) content
   * @param contentId - Content ID
   * @returns Promise with deletion result
   * @throws Error if contentId is empty or request fails
   */
  const deleteContent = async (contentId: string): Promise<{ message: string }> => {
    if (!contentId?.trim()) {
      throw new Error('Content ID is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.deleteContent(contentId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to delete content')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    // Methods
    getAllContent,
    getPublicContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent
  }
}
