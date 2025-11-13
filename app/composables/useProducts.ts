import { ProductsRepository } from './api/repositories/ProductsRepository'
import type { ProductType } from '../../shared/types/api/content.types'

/**
 * Composable for managing products and purchases
 */
export const useProducts = () => {
  const repository = new ProductsRepository()

  /**
   * Purchase a product
   * @param productId - Product ID
   * @param productType - Type of product (content, tool, playlist, video, document)
   */
  const purchaseProduct = async (
    productId: string,
    productType: ProductType
  ) => {
    return await repository.purchaseProduct(productId, productType)
  }

  return {
    purchaseProduct
  }
}
