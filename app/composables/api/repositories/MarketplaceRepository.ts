import type {
  MarketplaceProductsResponse,
  ProductPublicDetail,
  ProductAuthenticated,
  GetMarketplaceProductsRequest,
  ProductPublicListing,
  Product
} from '../../../../shared/types/models/MarketplaceProduct'
import { BaseRepository } from './BaseRepository'
import { handleApiError } from '../utils/errorHandler'

export class MarketplaceRepository extends BaseRepository {
  /**
   * Map MongoDB _id field to id for frontend consistency
   */
  private mapMongoIdToId(item: any): any {
    if (!item) return item
    return {
      ...item,
      id: item._id || item.id
    }
  }

  /**
   * Validate that product has a valid ID
   */
  private validateProductId(item: any): boolean {
    if (!item.id) {
      console.warn('Product without valid ID filtered out:', item)
      return false
    }
    return true
  }

  /**
   * Get marketplace products list
   * Returns different fields based on authentication status
   */
  async getProducts(
    params: GetMarketplaceProductsRequest = {}
  ): Promise<MarketplaceProductsResponse> {
    const endpoints = useApiEndpoints()
    const {
      category,
      subcategory,
      company_id,
      limit = 20,
      offset = 0,
      search
    } = params

    const query: Record<string, string | number | boolean> = {
      limit,
      offset,
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(company_id && { company_id }),
      ...(search && { search })
    }

    try {
      // The API returns an array directly, not an object with items
      const response = await this.get<
        ProductPublicListing[] | Product[]
      >(endpoints.marketProducts, query)

      // Map MongoDB _id to id and filter out invalid products
      const mappedItems = Array.isArray(response)
        ? response
            .map((item: any) => this.mapMongoIdToId(item))
            .filter((item: any) => this.validateProductId(item))
        : []

      // Wrap the array response in the expected format
      return {
        items: mappedItems,
        total: mappedItems.length,
        limit: limit,
        page: Math.floor(offset / limit) + 1
      }
    } catch (error) {
      // Handle rate limiting (429) gracefully
      if (this.isRateLimitError(error)) {
        console.warn('Rate limit reached for marketplace products')
        return { items: [] }
      }
      throw error
    }
  }

  /**
   * Get single marketplace product detail
   * Returns different fields based on authentication status
   */
  async getProductDetail(
    productId: string
  ): Promise<ProductPublicDetail | ProductAuthenticated> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.get<
        ProductPublicDetail | ProductAuthenticated
      >(`${endpoints.marketProducts}/${productId}`)

      // Map MongoDB _id to id if needed
      if (response && typeof response === 'object') {
        const mappedResponse = this.mapMongoIdToId(response)

        // Validate that we have a valid ID
        if (!this.validateProductId(mappedResponse)) {
          throw new Error('Invalid product: missing ID')
        }

        return mappedResponse
      }

      return response
    } catch (error) {
      // Handle rate limiting (429) gracefully
      if (this.isRateLimitError(error)) {
        console.warn('Rate limit reached for product detail')
        const msg = 'Rate limit reached. Please try again later.'
        throw new Error(msg)
      }
      throw error
    }
  }

  /**
   * Get random product for homepage display
   * Fetches a small batch and returns one randomly
   */
  async getRandomProduct(): Promise<
    ProductPublicListing | Product | null
  > {
    try {
      const response = await this.getProducts({ limit: 10 })

      if (!response.items || response.items.length === 0) {
        return null
      }

      const randomIndex = Math.floor(
        Math.random() * response.items.length
      )
      return response.items[randomIndex] || null
    } catch (error) {
      handleApiError(
        error,
        'fetch random product',
        { logError: true, throwError: false }
      )
      return null
    }
  }

  /**
   * Create a new product listing
   * @param companyId - The company ID creating the product
   * @param formData - FormData containing product details and images
   */
  async createProduct(
    companyId: string,
    formData: FormData
  ): Promise<{ id: string; message?: string }> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.post<{ id: string; message?: string }>(
        `${endpoints.marketProducts}/${companyId}`,
        formData
      )

      // Handle optional product_id field from API response
      if (response && typeof response === 'object') {
        const typedResponse = response as any
        if (!typedResponse?.product_id) {
          console.debug('Response without product_id (backward compatible)')
        }
      }

      // Map MongoDB _id to id if needed
      if (response && typeof response === 'object') {
        return this.mapMongoIdToId(response)
      }

      return response
    } catch (error) {
      // Handle specific error cases
      if (this.isRateLimitError(error)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      // Handle forbidden error (403 - space authorization)
      if (this.isForbiddenError(error)) {
        throw new Error(
          'Insufficient permissions to create product in this space'
        )
      }

      // Handle server error (500 - database persistence)
      if (this.isServerError(error)) {
        const errorData = (error as any)?.data
        // Check for specific listing limit error
        if (errorData?.message?.includes('limit')) {
          const limitMsg = 'You have reached your listing limit. ' +
            'Please upgrade your plan to create more products.'
          throw new Error(limitMsg)
        }
        throw new Error(
          'Database error creating product. Please try again.'
        )
      }

      // Check for specific status codes
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error
      ) {
        const statusCode = (error as any).statusCode
        const errorData = (error as any).data

        switch (statusCode) {
          case 400:
            // Validation error from backend (e.g., invalid category)
            const msg400 = errorData?.detail || errorData?.message ||
              'Invalid data provided. Please check your input.'
            throw new Error(msg400)
          case 401:
            throw new Error(
              'Authentication required. Please log in.'
            )
          case 404:
            const msg404 = 'Company not found. ' +
              'Please check your account settings.'
            throw new Error(msg404)
          case 422:
            // Unprocessable Entity - validation errors
            let msg422 = 'Validation error: '
            if (errorData?.detail) {
              if (Array.isArray(errorData.detail)) {
                // FastAPI validation error format
                const errors = errorData.detail.map((err: any) => {
                  const field = err.loc?.[err.loc.length - 1] || 'field'
                  return `${field}: ${err.msg}`
                })
                msg422 = 'Missing required fields: ' + errors.join(', ')
              } else {
                msg422 = errorData.detail
              }
            } else {
              msg422 = errorData?.message ||
                'Please ensure all required fields are filled correctly.'
            }
            throw new Error(msg422)
          default:
            const defaultMsg = errorData?.message ||
              'Failed to create product. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  async updateProduct(
    id: string,
    data: Partial<Product>
  ): Promise<{ id: string; message?: string }> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.put<{ id: string; message?: string }>(
        `${endpoints.marketProducts}/${id}`,
        data
      )

      if (response && typeof response === 'object') {
        return this.mapMongoIdToId(response)
      }

      return response
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error
      ) {
        const statusCode = (error as any).statusCode
        const errorData = (error as any).data

        switch (statusCode) {
          case 400:
            // Validation error from backend
            const msg400 = errorData?.detail || errorData?.message ||
              'Invalid data provided. Please check your input.'
            throw new Error(msg400)
          case 401:
            throw new Error(
              'Authentication required. Please log in.'
            )
          case 403:
            const msg403 = errorData?.message ||
              'You do not have permission to update this product.'
            throw new Error(msg403)
          case 404:
            const msg404 = 'Product not found or ' +
              'you do not have permission to edit it.'
            throw new Error(msg404)
          case 422:
            // Unprocessable Entity - validation errors
            let msg422 = 'Validation error: '
            if (errorData?.detail) {
              if (Array.isArray(errorData.detail)) {
                const errors = errorData.detail.map((err: any) => {
                  const field = err.loc?.[err.loc.length - 1] || 'field'
                  return `${field}: ${err.msg}`
                })
                msg422 = 'Missing required fields: ' + errors.join(', ')
              } else {
                msg422 = errorData.detail
              }
            } else {
              msg422 = errorData?.message ||
                'Please ensure all required fields are filled correctly.'
            }
            throw new Error(msg422)
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.')
          case 500:
            throw new Error(
              'Server error. Please try again later.'
            )
          default:
            const defaultMsg = errorData?.message ||
              'Failed to update product. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  async deleteProduct(
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.delete<{
        success: boolean;
        message?: string
      }>(`${endpoints.marketProducts}/${id}`)

      return response
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error
      ) {
        const statusCode = (error as any).statusCode
        const errorData = (error as any).data

        switch (statusCode) {
          case 401:
            throw new Error(
              'Authentication required. Please log in.'
            )
          case 403:
            const msg403 = errorData?.message ||
              'You do not have permission to delete this product.'
            throw new Error(msg403)
          case 404:
            const msg404 = 'Product not found or ' +
              'you do not have permission to delete it.'
            throw new Error(msg404)
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.')
          case 500:
            throw new Error(
              'Server error. Please try again later.'
            )
          default:
            const defaultMsg = errorData?.message ||
              'Failed to delete product. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  async updateProductImages(
    id: string,
    files: File[]
  ): Promise<{ id: string; message?: string; image_urls?: string[] }> {
    const endpoints = useApiEndpoints()

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    try {
      const response = await this.put<{
        id: string;
        message?: string;
        image_urls?: string[]
      }>(`${endpoints.marketProducts}/${id}/images`, formData)

      if (response && typeof response === 'object') {
        return this.mapMongoIdToId(response)
      }

      return response
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error
      ) {
        const statusCode = (error as any).statusCode
        const errorData = (error as any).data

        switch (statusCode) {
          case 401:
            throw new Error(
              'Authentication required. Please log in.'
            )
          case 403:
            const msg403 = errorData?.message ||
              'You do not have permission to update product images.'
            throw new Error(msg403)
          case 404:
            const msg404 = 'Product not found or ' +
              'you do not have permission to edit it.'
            throw new Error(msg404)
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.')
          case 500:
            throw new Error(
              'Server error. Please try again later.'
            )
          default:
            const defaultMsg = errorData?.message ||
              'Failed to update product images. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  /**
   * Check if the repository has authentication token
   * (BaseRepository handles token automatically via useApi)
   */
  hasAuthentication(): boolean {
    // Check if auth token exists in the store
    const authStore = useAuthStore()
    return !!authStore.token
  }
}