import { ref } from 'vue'
import { ProductsRepository } from './api/repositories/ProductsRepository'
import type { ProductType } from '../../shared/types/api/content.types'

/**
 * Composable for managing products and purchases
 * Provides error handling, loading states, and proper type safety
 *
 * @example
 * ```ts
 * const { purchaseProduct, loading, error } = useProducts()
 * await purchaseProduct('product-id-123', 'video')
 * if (error.value) {
 *   console.error('Purchase failed:', error.value)
 * }
 * ```
 */
export const useProducts = () => {
  const repository = new ProductsRepository()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Purchase a product
   * @param productId - Product ID
   * @param productType - Type of product (content, tool, playlist, video, document)
   * @returns Promise with purchase result
   * @throws Error if parameters are invalid or request fails
   */
  const purchaseProduct = async (
    productId: string,
    productType: ProductType
  ): Promise<{ message: string }> => {
    if (!productId?.trim()) {
      throw new Error('Product ID is required')
    }
    if (!productType) {
      throw new Error('Product type is required')
    }

    // Validate product type
    const validProductTypes: ProductType[] = [
      'content',
      'tool',
      'playlist',
      'video',
      'document',
      'podcast',
      'webinar'
    ]
    if (!validProductTypes.includes(productType)) {
      throw new Error(`Invalid product type: ${productType}`)
    }

    loading.value = true
    error.value = null
    try {
      const result = await repository.purchaseProduct(productId, productType)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to purchase product')
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
    purchaseProduct
  }
}
