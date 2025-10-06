import type { HttpMethod, RequestConfig } from '../../../../shared/types'

export abstract class BaseRepository {
  protected api: ReturnType<typeof useApi>['api']

  constructor() {
    const { api } = useApi()
    this.api = api
  }

  /**
   * Generic API request method
   */
  protected async request<T = unknown>(
    endpoint: string,
    options: {
      method?: HttpMethod
      body?: unknown
      query?: Record<string, string | number | boolean | string[] | number[]>
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, query } = options

    const config: RequestConfig = {
      method
    }

    if (body !== undefined) {
      config.body = body as Record<string, unknown> | string | FormData | null
    }

    if (query) {
      config.query = query
    }

    return await this.api<T>(endpoint, config)
  }

  /**
   * GET request helper
   */
  protected async get<T = unknown>(
    endpoint: string,
    query?: Record<string, string | number | boolean | string[] | number[]>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', query })
  }

  /**
   * POST request helper
   */
  protected async post<T = unknown>(
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  /**
   * PUT request helper
   */
  protected async put<T = unknown>(
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  /**
   * PATCH request helper
   */
  protected async patch<T = unknown>(
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  /**
   * DELETE request helper
   */
  protected async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * Handle pagination for list endpoints
   */
  protected buildPaginationQuery(
    page = 1,
    limit = 20,
    additionalQuery: Record<string, string | number | boolean> = {}
  ): Record<string, string | number | boolean> {
    return {
      page,
      limit,
      ...additionalQuery
    }
  }

  /**
   * Check if error is a rate limit error (429)
   */
  protected isRateLimitError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as { statusCode: number }).statusCode === 429
    )
  }

  /**
   * Get status code from error object
   */
  protected getStatusCode(error: unknown): number | undefined {
    if (error === null || typeof error !== 'object') {
      return undefined
    }
    if (
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode
    }
    return undefined
  }

  /**
   * Check if error is a service unavailable error (503)
   */
  protected isServiceUnavailableError(error: unknown): boolean {
    return this.getStatusCode(error) === 503
  }

  /**
   * Check if error is a forbidden error (403)
   */
  protected isForbiddenError(error: unknown): boolean {
    return this.getStatusCode(error) === 403
  }

  /**
   * Check if error is a server error (500)
   */
  protected isServerError(error: unknown): boolean {
    return this.getStatusCode(error) === 500
  }
}
