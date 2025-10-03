/**
 * Shared error handling utilities for API repositories
 */

export interface ErrorHandlerOptions {
  defaultMessage?: string
  logError?: boolean
  throwError?: boolean
}

/**
 * Standardized error handler for API calls
 * @param error - The error to handle
 * @param context - Context for the error (e.g., 'fetching products')
 * @param options - Additional options for handling
 * @returns Formatted error message
 */
export function handleApiError(
  error: unknown,
  context: string,
  options: ErrorHandlerOptions = {}
): string {
  const {
    defaultMessage = `Error ${context}`,
    logError = true,
    throwError = false
  } = options

  let errorMessage: string

  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (
    error &&
    typeof error === 'object' &&
    'message' in error
  ) {
    errorMessage = String((error as any).message)
  } else {
    errorMessage = defaultMessage
  }

  const formattedError = `Failed to ${context}: ${errorMessage}`

  if (logError) {
    console.error(formattedError, error)
  }

  if (throwError) {
    throw new Error(formattedError)
  }

  return formattedError
}

/**
 * Extract error message from various error formats
 * @param error - The error to extract message from
 * @returns Extracted error message
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error
  ) {
    return String((error as any).message)
  }

  return 'An unexpected error occurred'
}