// Common API response types
export interface ApiResponse<T = unknown> {
  data?: T
  message?: string
  success?: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Request configuration
export interface RequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: Record<string, unknown> | string | FormData | null
  query?: Record<string, string | number | boolean | string[] | number[]>
}