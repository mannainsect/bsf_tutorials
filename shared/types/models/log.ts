/**
 * Log model types for the application
 * Based on REST API BaseLog schema
 */

/**
 * Base log model for all log entries
 */
export interface Log {
  _id?: string
  log_type: string
  content: Record<string, unknown>
  created_at?: string | Date
  // Additional fields populated by backend
  user?: string
  company?: string
  space?: string
  device?: string
}

/**
 * Log with populated relations (returned from GET endpoints)
 */
export interface PopulatedLog
  extends Omit<Log, 'user' | 'company' | 'space' | 'device'> {
  user?:
    | {
        _id: string
        name: string
        email: string
      }
    | string
  company?:
    | {
        _id: string
        name: string
      }
    | string
  space?:
    | {
        _id: string
        name: string
        process_type: string
      }
    | string
  device?:
    | {
        _id: string
        description: string
        device_code: string
      }
    | string
}

/**
 * Common log types (extend as needed based on your domain)
 */
export enum LogType {
  // Process logs
  PROCESS_START = 'process_start',
  PROCESS_COMPLETE = 'process_complete',
  PROCESS_ERROR = 'process_error',

  // Task logs
  TASK_COMPLETE = 'task_complete',
  TASK_FAILED = 'task_failed',

  // System logs
  SYSTEM_EVENT = 'system_event',
  SYSTEM_ERROR = 'system_error',

  // User activity logs
  USER_ACTION = 'user_action',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',

  // Content logs
  CONTENT_VIEWED = 'content_viewed',
  CONTENT_COMPLETED = 'content_completed',

  // Generic
  CUSTOM = 'custom'
}

/**
 * Log content types for different log types
 */
export interface ProcessLogContent {
  process_name: string
  status: 'started' | 'completed' | 'failed'
  duration_minutes?: number
  description?: string
  metadata?: Record<string, unknown>
}

export interface TaskLogContent {
  task_name: string
  task_id?: string
  result?: unknown
  error_message?: string
  description?: string
}

export interface UserActionLogContent {
  action: string
  target?: string
  metadata?: Record<string, unknown>
  description?: string
}

export interface ContentLogContent {
  content_id: string
  content_type: 'video' | 'document' | 'tool' | 'playlist'
  action: 'viewed' | 'completed' | 'purchased'
  duration_seconds?: number
  progress_percentage?: number
}

/**
 * Credit transaction log
 */
export interface CreditLog extends Log {
  log_type: 'credit_transaction'
  content: {
    amount: number
    transaction_type: 'purchase' | 'earn' | 'spend' | 'refund'
    balance_after: number
    description: string
    reference_id?: string
    reference_type?: string
  }
}

/**
 * Log filter options for querying
 */
export interface LogFilters {
  spaceId?: string
  userId?: string
  deviceId?: string
  log_type?: string
  start_datetime?: string
  end_datetime?: string
}
