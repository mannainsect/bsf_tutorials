/**
 * Log API request and response types
 */

import type { PopulatedLog, LogFilters } from '../models/log'

/**
 * Request body for creating a log
 */
export interface CreateLogRequest {
  log_type: string
  content: Record<string, unknown>
  created_at?: string
}

/**
 * Response for creating a log
 */
export interface CreateLogResponse {
  status: string
  message?: string
  log_id?: string
}

/**
 * Response for getting logs
 */
export interface GetLogsResponse {
  logs: PopulatedLog[]
  total: number
  page?: number
  limit?: number
}

/**
 * Response for getting credit logs
 */
export interface GetCreditLogsResponse {
  logs: PopulatedLog[]
  current_balance: number
  total_earned: number
  total_spent: number
}

/**
 * Response for deleting a log
 */
export interface DeleteLogResponse {
  status: string
  message?: string
}

/**
 * Query parameters for getting logs
 */
export interface GetLogsParams extends LogFilters {
  company_id?: string
  limit?: number
  page?: number
  sort?: 'asc' | 'desc'
}

/**
 * Query parameters for creating process logs
 */
export interface CreateProcessLogParams {
  space_id: string
}

/**
 * Query parameters for creating content logs
 */
export interface CreateContentLogParams {
  content_id?: string
  content_type?: string
}
