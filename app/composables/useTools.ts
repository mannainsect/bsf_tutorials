import { ref } from 'vue'
import { ProductsRepository } from './api/repositories/ProductsRepository'
import type {
  Tool,
  ToolCreate,
  ToolUpdate
} from '../../shared/types/api/content.types'

/**
 * Composable for managing tools (calculators, analytics, etc.)
 * Provides error handling, loading states, and proper type safety
 *
 * @example
 * ```ts
 * const { getAllTools, loading, error } = useTools()
 * const tools = await getAllTools()
 * if (error.value) {
 *   console.error('Failed to fetch tools:', error.value)
 * }
 * ```
 */
export const useTools = () => {
  const repository = new ProductsRepository()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Get all tools with ownership checking
   * @returns Promise<Tool[]>
   * @throws Error if request fails
   */
  const getAllTools = async (): Promise<Tool[]> => {
    loading.value = true
    error.value = null
    try {
      const result = await repository.getAllTools()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch tools')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a specific tool by ID
   * @param toolId - Tool ID
   * @returns Promise<Tool>
   * @throws Error if toolId is empty or request fails
   */
  const getToolById = async (toolId: string): Promise<Tool> => {
    if (!toolId?.trim()) {
      throw new Error('Tool ID is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.getToolById(toolId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch tool by ID')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new tool (superadmin only)
   * @param data - Tool creation data
   * @returns Promise with creation result
   * @throws Error if data is invalid or request fails
   */
  const createTool = async (data: ToolCreate): Promise<{ message: string; tool_id?: string }> => {
    if (!data.name?.trim()) {
      throw new Error('Tool name is required')
    }
    if (!data.api_name?.trim()) {
      throw new Error('Tool API name is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.createTool(data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to create tool')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing tool
   * @param toolId - Tool ID
   * @param data - Tool update data
   * @returns Promise with update result
   * @throws Error if toolId is empty or request fails
   */
  const updateTool = async (
    toolId: string,
    data: ToolUpdate
  ): Promise<{ message: string }> => {
    if (!toolId?.trim()) {
      throw new Error('Tool ID is required')
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Update data is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.updateTool(toolId, data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update tool')
      throw error.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete (disable) tool
   * @param toolId - Tool ID
   * @returns Promise with deletion result
   * @throws Error if toolId is empty or request fails
   */
  const deleteTool = async (toolId: string): Promise<{ message: string }> => {
    if (!toolId?.trim()) {
      throw new Error('Tool ID is required')
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.deleteTool(toolId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to delete tool')
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
    getAllTools,
    getToolById,
    createTool,
    updateTool,
    deleteTool
  }
}
