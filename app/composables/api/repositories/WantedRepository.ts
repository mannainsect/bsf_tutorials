import type {
  MarketplaceWantedResponse,
  WantedPublicDetail,
  WantedAuthenticated,
  GetMarketplaceWantedRequest,
  WantedPublicListing,
  Wanted
} from '../../../../shared/types/models/MarketplaceWanted'
import { BaseRepository } from './BaseRepository'
import { handleApiError } from '../utils/errorHandler'

export class WantedRepository extends BaseRepository {
  private mapMongoIdToId(item: any): any {
    if (!item) return item
    return {
      ...item,
      id: item._id || item.id
    }
  }

  private validateWantedId(item: any): boolean {
    if (!item.id) {
      return false
    }
    return true
  }

  async getWantedItems(
    params: GetMarketplaceWantedRequest = {}
  ): Promise<MarketplaceWantedResponse> {
    const endpoints = useApiEndpoints()
    const {
      category,
      subcategory,
      company_id,
      wanted_id,
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
      ...(wanted_id && { wanted_id }),
      ...(search && { search })
    }

    try {
      const response = await this.get<
        WantedPublicListing[] | Wanted[]
      >(endpoints.marketWanted, query)

      const mappedItems = Array.isArray(response)
        ? response
            .map((item: any) => this.mapMongoIdToId(item))
            .filter((item: any) => this.validateWantedId(item))
        : []

      return {
        items: mappedItems,
        total: mappedItems.length,
        limit: limit,
        page: Math.floor(offset / limit) + 1
      }
    } catch (error) {
      if (this.isRateLimitError(error)) {
        return { items: [] }
      }
      throw error
    }
  }

  async getWantedDetail(
    wantedId: string
  ): Promise<WantedPublicDetail | WantedAuthenticated> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.get<
        WantedPublicDetail | WantedAuthenticated
      >(`${endpoints.marketWanted}/${wantedId}`)

      if (response && typeof response === 'object') {
        const mappedResponse = this.mapMongoIdToId(response)

        if (!this.validateWantedId(mappedResponse)) {
          throw new Error('Invalid wanted item: missing ID')
        }

        return mappedResponse
      }

      return response
    } catch (error) {
      if (this.isRateLimitError(error)) {
        const msg = 'Rate limit reached. Please try again later.'
        throw new Error(msg)
      }
      throw error
    }
  }

  async getRandomWanted(): Promise<
    WantedPublicListing | Wanted | null
  > {
    try {
      const response = await this.getWantedItems({ limit: 10 })

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
        'fetch random wanted item',
        { logError: true, throwError: false }
      )
      return null
    }
  }

  async createWanted(
    companyId: string,
    formData: FormData
  ): Promise<{ id: string; message?: string }> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.post<{ id: string; message?: string }>(
        `${endpoints.marketWanted}/${companyId}`,
        formData
      )

      // Handle optional wanted_id field from API response
      if (response && typeof response === 'object') {
        const typedResponse = response as any
        if (!typedResponse?.wanted_id) {
          console.debug('Response without wanted_id (backward compatible)')
        }
      }

      if (response && typeof response === 'object') {
        return this.mapMongoIdToId(response)
      }

      return response
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      // Handle forbidden error (403 - space authorization)
      if (this.isForbiddenError(error)) {
        throw new Error(
          'Insufficient permissions to create wanted item in space'
        )
      }

      // Handle server error (500 - database persistence)
      if (this.isServerError(error)) {
        const errorData = (error as any)?.data
        // Check for specific listing limit error
        if (errorData?.message?.includes('limit')) {
          const limitMsg = 'You have reached your listing limit. ' +
            'Please upgrade your plan to create more wanted items.'
          throw new Error(limitMsg)
        }
        throw new Error(
          'Database error creating wanted item. Please try again.'
        )
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
          case 404:
            const msg404 = 'Company not found. ' +
              'Please check your account settings.'
            throw new Error(msg404)
          default:
            const defaultMsg = errorData?.message ||
              'Failed to create wanted item. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  async updateWanted(
    id: string,
    data: Partial<Wanted>
  ): Promise<{ id: string; message?: string }> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.put<{ id: string; message?: string }>(
        `${endpoints.marketWanted}/${id}`,
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
          case 401:
            throw new Error(
              'Authentication required. Please log in.'
            )
          case 403:
            const msg403 = errorData?.message ||
              'You do not have permission to update this wanted item.'
            throw new Error(msg403)
          case 404:
            const msg404 = 'Wanted item not found or ' +
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
              'Failed to update wanted item. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  async deleteWanted(
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    const endpoints = useApiEndpoints()

    try {
      const response = await this.delete<{
        success: boolean;
        message?: string
      }>(`${endpoints.marketWanted}/${id}`)

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
              'You do not have permission to delete this wanted item.'
            throw new Error(msg403)
          case 404:
            const msg404 = 'Wanted item not found or ' +
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
              'Failed to delete wanted item. Please try again.'
            throw new Error(defaultMsg)
        }
      }

      throw error
    }
  }

  hasAuthentication(): boolean {
    const authStore = useAuthStore()
    return !!authStore.token
  }
}