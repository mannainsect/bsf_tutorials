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
  VISIT_MARKETPLACE = 'visit_marketplace',

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

/**
 * Metrics data for marketplace landing page visits
 */
export interface MarketplaceLandingInfo {
  view: 'landing'
  [key: string]: unknown
}

/**
 * Metrics data for marketplace browse page visits
 */
export interface MarketplaceBrowseInfo {
  view: 'browse'
  list_type: 'products' | 'wanted'
  category?: string
  subcategory?: string
  [key: string]: unknown
}

/**
 * Metrics data for marketplace detail page visits
 */
export type MarketplaceDetailInfo =
  | {
      view: 'detail'
      item_type: 'product'
      product_id: string
      [key: string]: unknown
    }
  | {
      view: 'detail'
      item_type: 'wanted'
      wanted_id: string
      [key: string]: unknown
    }

export type MarketplaceExtraInfo =
  | MarketplaceLandingInfo
  | MarketplaceBrowseInfo
  | MarketplaceDetailInfo