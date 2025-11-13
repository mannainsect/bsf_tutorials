import type {
  Content,
  ContentPublic,
  ContentCreate,
  ContentUpdate,
  Playlist,
  PopulatedPlaylist,
  PlaylistCreate,
  PlaylistUpdate,
  Tool,
  ToolCreate,
  ToolUpdate,
  ProductType
} from '../../../../shared/types/api/content.types'
import { BaseRepository } from './BaseRepository'

/**
 * Repository for managing products (content, playlists, tools) and purchases
 * Extends BaseRepository to provide API communication with proper error handling
 *
 * @example
 * ```ts
 * const repository = new ProductsRepository()
 * const contents = await repository.getAllContent('video')
 * const playlist = await repository.getPlaylistById('playlist-id-123')
 * ```
 */
export class ProductsRepository extends BaseRepository {
  // ==================== Content Management ====================

  /**
   * Get all content with optional filtering
   * @param filter - Filter by category (default: "video")
   */
  async getAllContent(filter?: string): Promise<Content[]> {
    const endpoints = useApiEndpoints()
    const query = filter ? { filter } : undefined
    return await this.get<Content[]>(endpoints.productsContent, query)
  }

  /**
   * Get public content (no auth required)
   * Premium content URLs are masked
   * @param categoryTags - Optional filter by category tags
   * @param profileTags - Optional filter by profile tags
   */
  async getPublicContent(
    categoryTags?: string[],
    profileTags?: string[]
  ): Promise<ContentPublic[]> {
    const endpoints = useApiEndpoints()
    const query: Record<string, string | string[]> = {}

    if (categoryTags && categoryTags.length > 0) {
      query.category_tags = categoryTags
    }
    if (profileTags && profileTags.length > 0) {
      query.profile_tags = profileTags
    }

    return await this.get<ContentPublic[]>(
      endpoints.productsContentPublic,
      query
    )
  }

  /**
   * Get a specific content by ID
   * @param contentId - Content ID
   */
  async getContentById(contentId: string): Promise<Content> {
    const endpoints = useApiEndpoints()
    return await this.get<Content>(`${endpoints.productsContent}/${contentId}`)
  }

  /**
   * Create new content (superadmin only)
   * @param data - Content creation data
   */
  async createContent(
    data: ContentCreate
  ): Promise<{ message: string; content_id?: string }> {
    const endpoints = useApiEndpoints()
    return await this.post<{ message: string; content_id?: string }>(
      endpoints.productsContent,
      data
    )
  }

  /**
   * Update existing content
   * @param contentId - Content ID
   * @param data - Content update data
   */
  async updateContent(
    contentId: string,
    data: ContentUpdate
  ): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.put<{ message: string }>(
      `${endpoints.productsContent}/${contentId}`,
      data
    )
  }

  /**
   * Delete (disable) content
   * @param contentId - Content ID
   */
  async deleteContent(contentId: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.delete<{ message: string }>(
      `${endpoints.productsContent}/${contentId}`
    )
  }

  // ==================== Playlist Management ====================

  /**
   * Get all playlists with optional filtering
   * @param filter - Filter by category (default: "course")
   */
  async getAllPlaylists(filter?: string): Promise<Playlist[]> {
    const endpoints = useApiEndpoints()
    const query = filter ? { filter } : undefined
    return await this.get<Playlist[]>(endpoints.productsPlaylists, query)
  }

  /**
   * Get a specific playlist by ID with populated content and tools
   * @param playlistId - Playlist ID
   */
  async getPlaylistById(playlistId: string): Promise<PopulatedPlaylist> {
    const endpoints = useApiEndpoints()
    return await this.get<PopulatedPlaylist>(
      `${endpoints.productsPlaylists}/${playlistId}`
    )
  }

  /**
   * Create new playlist (superadmin only)
   * @param data - Playlist creation data
   */
  async createPlaylist(
    data: PlaylistCreate
  ): Promise<{ message: string; playlist_id?: string }> {
    const endpoints = useApiEndpoints()
    return await this.post<{ message: string; playlist_id?: string }>(
      endpoints.productsPlaylists,
      data
    )
  }

  /**
   * Update existing playlist
   * @param playlistId - Playlist ID
   * @param data - Playlist update data
   */
  async updatePlaylist(
    playlistId: string,
    data: PlaylistUpdate
  ): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.put<{ message: string }>(
      `${endpoints.productsPlaylists}/${playlistId}`,
      data
    )
  }

  /**
   * Delete (disable) playlist
   * @param playlistId - Playlist ID
   */
  async deletePlaylist(playlistId: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.delete<{ message: string }>(
      `${endpoints.productsPlaylists}/${playlistId}`
    )
  }

  // ==================== Tool Management ====================

  /**
   * Get all tools with ownership checking
   */
  async getAllTools(): Promise<Tool[]> {
    const endpoints = useApiEndpoints()
    return await this.get<Tool[]>(endpoints.productsTools)
  }

  /**
   * Get a specific tool by ID
   * @param toolId - Tool ID
   */
  async getToolById(toolId: string): Promise<Tool> {
    const endpoints = useApiEndpoints()
    return await this.get<Tool>(`${endpoints.productsTools}/${toolId}`)
  }

  /**
   * Create new tool (superadmin only)
   * @param data - Tool creation data
   */
  async createTool(
    data: ToolCreate
  ): Promise<{ message: string; tool_id?: string }> {
    const endpoints = useApiEndpoints()
    return await this.post<{ message: string; tool_id?: string }>(
      endpoints.productsTools,
      data
    )
  }

  /**
   * Update existing tool
   * @param toolId - Tool ID
   * @param data - Tool update data
   */
  async updateTool(
    toolId: string,
    data: ToolUpdate
  ): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.put<{ message: string }>(
      `${endpoints.productsTools}/${toolId}`,
      data
    )
  }

  /**
   * Delete (disable) tool
   * @param toolId - Tool ID
   */
  async deleteTool(toolId: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.delete<{ message: string }>(
      `${endpoints.productsTools}/${toolId}`
    )
  }

  // ==================== Purchase Management ====================

  /**
   * Purchase a product
   * @param productId - Product ID
   * @param productType - Type of product (content, tool, playlist, video, document)
   */
  async purchaseProduct(
    productId: string,
    productType: ProductType
  ): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return await this.request<{ message: string }>(
      `${endpoints.productsPurchase}/${productId}`,
      {
        method: 'POST',
        query: { product_type: productType }
      }
    )
  }
}
