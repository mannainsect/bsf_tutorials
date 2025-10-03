// App constants
export const APP_NAME = 'BSF Template'
export const APP_VERSION = '1.0.0'

// API constants
export const API_TIMEOUT = 10000 // 10 seconds
export const DEFAULT_PAGE_SIZE = 20
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB

// UI constants
export const MOBILE_BREAKPOINT = 768
export const TABLET_BREAKPOINT = 1024
export const DESKTOP_BREAKPOINT = 1200

// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  LANGUAGE: 'selected_language',
  THEME: 'selected_theme'
} as const

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'MM/DD/YYYY HH:mm'
} as const

// Validation constants
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-()]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 50,
  MESSAGE_MAX_LENGTH: 1000
} as const

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// Common regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  URL: /^https?:\/\/.+/,
  NUMBER_ONLY: /^\d+$/,
  LETTERS_ONLY: /^[a-zA-Z]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
} as const

// Search and filter timeouts
export const SEARCH_DEBOUNCE_MS = 300 as const // 300ms debounce

// Cache durations
export const CACHE_DURATION_MARKETPLACE_MS =
  300000 as const // 5 min
export const CACHE_DURATION_CATEGORIES_MS =
  86400000 as const // 24 hr