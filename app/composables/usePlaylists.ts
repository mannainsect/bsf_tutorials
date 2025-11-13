import { ProductsRepository } from './api/repositories/ProductsRepository'
import type {
  PlaylistCreate,
  PlaylistUpdate
} from '../../shared/types/api/content.types'

/**
 * Composable for managing playlists (courses, support programs, etc.)
 */
export const usePlaylists = () => {
  const repository = new ProductsRepository()

  /**
   * Get all playlists with optional filtering
   * @param filter - Filter by category (default: "course")
   */
  const getAllPlaylists = async (filter?: string) => {
    return await repository.getAllPlaylists(filter)
  }

  /**
   * Get a specific playlist by ID with populated content and tools
   * @param playlistId - Playlist ID
   */
  const getPlaylistById = async (playlistId: string) => {
    return await repository.getPlaylistById(playlistId)
  }

  /**
   * Create new playlist (superadmin only)
   * @param data - Playlist creation data
   */
  const createPlaylist = async (data: PlaylistCreate) => {
    return await repository.createPlaylist(data)
  }

  /**
   * Update existing playlist
   * @param playlistId - Playlist ID
   * @param data - Playlist update data
   */
  const updatePlaylist = async (playlistId: string, data: PlaylistUpdate) => {
    return await repository.updatePlaylist(playlistId, data)
  }

  /**
   * Delete (disable) playlist
   * @param playlistId - Playlist ID
   */
  const deletePlaylist = async (playlistId: string) => {
    return await repository.deletePlaylist(playlistId)
  }

  return {
    getAllPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist
  }
}
