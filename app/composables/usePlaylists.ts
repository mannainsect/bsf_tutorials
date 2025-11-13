import { ref } from 'vue'
import { ProductsRepository } from './api/repositories/ProductsRepository'
import type {
  Playlist,
  PopulatedPlaylist,
  PlaylistCreate,
  PlaylistUpdate
} from '../../shared/types/api/content.types'

/**
 * Composable for managing playlists (courses, support programs, etc.)
 * Provides error handling, loading states, and proper type safety
 *
 * @example
 * ```ts
 * const { getAllPlaylists, loading, error } = usePlaylists()
 * const playlists = await getAllPlaylists('course')
 * if (error.value) {
 *   console.error('Failed to fetch playlists:', error.value)
 * }
 * ```
 */
export const usePlaylists = () => {
  const repository = new ProductsRepository()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Get all playlists with optional filtering
   * @param filter - Filter by category (default: "course")
   * @returns Promise<Playlist[]>
   * @throws Error if request fails
   */
  const getAllPlaylists = async (filter?: string): Promise<Playlist[]> => {
    loading.value = true
    error.value = null
    try {
      const result = await repository.getAllPlaylists(filter)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch playlists')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a specific playlist by ID with populated content and tools
   * @param playlistId - Playlist ID
   * @returns Promise<PopulatedPlaylist>
   * @throws Error if playlistId is empty or request fails
   */
  const getPlaylistById = async (playlistId: string): Promise<PopulatedPlaylist> => {
    if (!playlistId?.trim()) {
      throw new Error('Playlist ID is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.getPlaylistById(playlistId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch playlist by ID')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new playlist (superadmin only)
   * @param data - Playlist creation data
   * @returns Promise with creation result
   * @throws Error if data is invalid or request fails
   */
  const createPlaylist = async (data: PlaylistCreate): Promise<{ message: string; playlist_id?: string }> => {
    if (!data.name?.trim()) {
      throw new Error('Playlist name is required')
    }
    if (!data.description?.trim()) {
      throw new Error('Playlist description is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.createPlaylist(data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to create playlist')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing playlist
   * @param playlistId - Playlist ID
   * @param data - Playlist update data
   * @returns Promise with update result
   * @throws Error if playlistId is empty or request fails
   */
  const updatePlaylist = async (
    playlistId: string,
    data: PlaylistUpdate
  ): Promise<{ message: string }> => {
    if (!playlistId?.trim()) {
      throw new Error('Playlist ID is required')
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Update data is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.updatePlaylist(playlistId, data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update playlist')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete (disable) playlist
   * @param playlistId - Playlist ID
   * @returns Promise with deletion result
   * @throws Error if playlistId is empty or request fails
   */
  const deletePlaylist = async (playlistId: string): Promise<{ message: string }> => {
    if (!playlistId?.trim()) {
      throw new Error('Playlist ID is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.deletePlaylist(playlistId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to delete playlist')
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
    getAllPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist
  }
}
