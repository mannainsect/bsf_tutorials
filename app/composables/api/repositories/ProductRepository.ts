import type { 
  GetProductsResponse,
  GetProductResponse,
  GetPurchasedProductsResponse,
  GetProductCategoriesResponse,
  PurchaseProductResponse,
  GetProductsRequest,
  GetPurchasedProductsRequest,
  PurchaseProductRequest
} from '../../../../shared/types'
import { BaseRepository } from './BaseRepository'

export class ProductRepository extends BaseRepository {
  /**
   * Get all products (content/tools/playlists)
   */
  async getProducts(params: GetProductsRequest = {}): Promise<GetProductsResponse> {
    const endpoints = useApiEndpoints()
    const {
      category,
      type,
      status,
      search,
      page = 1,
      limit = 20
    } = params

    const query = this.buildPaginationQuery(page, limit, {
      ...(category && { category }),
      ...(type && { type }),
      ...(status && { status }),
      ...(search && { search })
    })

    // Use different endpoints based on product type
    let endpoint = endpoints.productsContent
    if (type === 'playlist') {
      endpoint = endpoints.productsPlaylists
    } else if (type === 'tool') {
      endpoint = endpoints.productsTools
    }

    return this.get<GetProductsResponse>(endpoint, query)
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string, type: 'content' | 'playlist' | 'tool' = 'content'): Promise<GetProductResponse> {
    const endpoints = useApiEndpoints()
    
    let endpoint = endpoints.productsContent
    if (type === 'playlist') {
      endpoint = endpoints.productsPlaylists
    } else if (type === 'tool') {
      endpoint = endpoints.productsTools
    }

    return this.get<GetProductResponse>(`${endpoint}/${id}`)
  }

  /**
   * Get purchased products for current user
   */
  async getPurchasedProducts(params: GetPurchasedProductsRequest = {}): Promise<GetPurchasedProductsResponse> {
    const endpoints = useApiEndpoints()
    const {
      user_id,
      status,
      type,
      page = 1,
      limit = 20
    } = params

    const query = this.buildPaginationQuery(page, limit, {
      ...(user_id && { user_id }),
      ...(status && { status }),
      ...(type && { type })
    })

    return this.get<GetPurchasedProductsResponse>(`${endpoints.productsPurchase}/history`, query)
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(purchaseData: PurchaseProductRequest): Promise<PurchaseProductResponse> {
    const endpoints = useApiEndpoints()
    return this.post<PurchaseProductResponse>(endpoints.productsPurchase, purchaseData)
  }

  /**
   * Get product categories
   */
  async getProductCategories(): Promise<GetProductCategoriesResponse> {
    const endpoints = useApiEndpoints()
    return this.get<GetProductCategoriesResponse>(`${endpoints.productsContent}/categories`)
  }
}