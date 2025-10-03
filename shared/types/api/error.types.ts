import type { FetchError } from 'ofetch'

export type ErrorInput = 
  | Error 
  | FetchError 
  | { data?: unknown; statusCode?: number; status?: number }
  | { issues?: unknown[]; errors?: unknown[] }
  | { message?: string; code?: string | number }
  | unknown

export interface AppErrorDetails {
  field?: string
  value?: unknown
  constraint?: string
  [key: string]: unknown
}

export interface AppError {
  message: string
  statusCode?: number
  statusMessage?: string
  code?: string | number
  details?: AppErrorDetails
  timestamp?: Date
  source?: 'api' | 'validation' | 'system' | 'unknown'
}