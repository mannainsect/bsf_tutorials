/**
 * Metrics data types for tracking user behavior and system events
 */

/**
 * Base metric data structure (used for both requests and internal
 * representation)
 */
export interface MetricData {
  category: string
  extra_info?: Record<string, unknown>
}

/**
 * Response from metrics API
 */
export interface MetricsResponse {
  success: boolean
  message?: string
}

/**
 * Predefined metric categories
 */
export enum MetricCategory {
  // Authentication
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',

  // Navigation
  PAGE_VIEW = 'page_view',

  // User Actions
  CLICK_BUTTON = 'click_button',
  WATCH_VIDEO = 'watch_video',
  DOWNLOAD_DOCUMENT = 'download_document',

  // Sessions
  ACTIVE_SESSION = 'active_session',

  // Feature Usage
  FEATURE_USED = 'feature_used',

  // Errors
  ERROR_OCCURRED = 'error_occurred'
}
