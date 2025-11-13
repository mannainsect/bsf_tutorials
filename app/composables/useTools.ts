import { ProductsRepository } from './api/repositories/ProductsRepository'
import type { ToolCreate, ToolUpdate } from '../../shared/types/api/content.types'

/**
 * Composable for managing tools (calculators, analytics, etc.)
 */
export const useTools = () => {
  const repository = new ProductsRepository()

  /**
   * Get all tools with ownership checking
   */
  const getAllTools = async () => {
    return await repository.getAllTools()
  }

  /**
   * Get a specific tool by ID
   * @param toolId - Tool ID
   */
  const getToolById = async (toolId: string) => {
    return await repository.getToolById(toolId)
  }

  /**
   * Create new tool (superadmin only)
   * @param data - Tool creation data
   */
  const createTool = async (data: ToolCreate) => {
    return await repository.createTool(data)
  }

  /**
   * Update existing tool
   * @param toolId - Tool ID
   * @param data - Tool update data
   */
  const updateTool = async (toolId: string, data: ToolUpdate) => {
    return await repository.updateTool(toolId, data)
  }

  /**
   * Delete (disable) tool
   * @param toolId - Tool ID
   */
  const deleteTool = async (toolId: string) => {
    return await repository.deleteTool(toolId)
  }

  return {
    getAllTools,
    getToolById,
    createTool,
    updateTool,
    deleteTool
  }
}
