import type { FetchError } from 'ofetch'
import type { ErrorInput, AppError as BaseAppError, AppErrorDetails } from '../../../shared/types'

// Extend the base AppError to ensure required fields for error handling
interface AppError extends BaseAppError {
  timestamp: Date  // Make timestamp required
  source: 'api' | 'validation' | 'system' | 'unknown'  // Make source required
}

export function useErrorHandler() {
  const { t } = useI18n()
  const toast = useToast()

  // Type guard for FetchError
  const isFetchError = (error: unknown): error is FetchError => {
    return error !== null && typeof error === 'object' && 
      ('data' in error || 'statusCode' in error)
  }

  // Type guard for validation errors
  const isValidationError = (error: unknown): error is { issues?: unknown; errors?: unknown } => {
    return error !== null && typeof error === 'object' && 
      ('issues' in error || 'errors' in error)
  }

  // Type guard for standard Error
  const isStandardError = (error: unknown): error is Error => {
    return error instanceof Error
  }

  // Convert various error types to standardized AppError
  const normalizeError = (error: ErrorInput): AppError => {
    const timestamp = new Date()

    // Handle API/Fetch errors
    if (isFetchError(error)) {
      return {
        message: error.data?.message || t('errors.api.generic'),
        code: error.statusCode || error.status,
        details: error.data,
        timestamp,
        source: 'api'
      }
    }

    // Handle validation errors
    if (isValidationError(error)) {
      return {
        message: t('errors.validation.generic'),
        code: 'VALIDATION_ERROR',
        details: (error.issues || error.errors) as AppErrorDetails | undefined,
        timestamp,
        source: 'validation'
      }
    }

    // Handle standard Error instances
    if (isStandardError(error)) {
      return {
        message: error.message || t('errors.generic'),
        code: 'UNKNOWN_ERROR',
        details: { name: error.name, stack: error.stack },
        timestamp,
        source: 'system'
      }
    }

    // Handle generic errors
    return {
      message: t('errors.generic'),
      code: 'UNKNOWN_ERROR',
      details: error as AppErrorDetails | undefined,
      timestamp,
      source: 'unknown'
    }
  }

  // Handle and display errors appropriately
  const handleError = (error: ErrorInput, options: {
    toast?: boolean
    console?: boolean
    source?: string
  } = {}) => {
    const { toast: showToast = true, console: logToConsole = true, source } = options
    const normalizedError = normalizeError(error)

    // Log to console in development
    if (logToConsole && import.meta.dev) {
      console.error(`[${normalizedError.source.toUpperCase()}] Error${source ? ` in ${source}` : ''}:`, normalizedError)
    }

    // Show user-friendly message
    if (showToast) {
      toast.create({
        message: normalizedError.message,
        color: 'danger',
        duration: 4000,
        position: 'top'
      }).then(t => t.present())
    }

    return normalizedError
  }

  // Specific handlers for common scenarios
  const handleApiError = (error: FetchError, context?: string) => {
    return handleError(error, {
      toast: true,
      console: true,
      source: context || 'API call'
    })
  }

  const handleValidationError = (error: ErrorInput, context?: string) => {
    return handleError(error, {
      toast: false, // Validation errors usually shown inline
      console: true,
      source: context || 'Form validation'
    })
  }

  // Silent error handling (no toast)
  const handleSilentError = (error: ErrorInput, context?: string) => {
    return handleError(error, {
      toast: false,
      console: true,
      source: context
    })
  }

  return {
    normalizeError,
    handleError,
    handleApiError,
    handleValidationError,
    handleSilentError
  }
}