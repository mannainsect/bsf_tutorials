import type { Ref } from 'vue'

export interface LoginCredentials {
  email: string
  password: string
}

export interface UseLoginFormReturn {
  validateCredentials: (credentials: LoginCredentials) => boolean
  formatErrorMessage: (error: unknown) => string
  loading: Ref<boolean>
  error: Ref<string>
  setLoading: (value: boolean) => void
  setError: (value: string) => void
  clearError: () => void
}

/**
 * Composable for handling login form logic
 * Manages validation, error formatting, and loading states
 */
export function useLoginForm(): UseLoginFormReturn {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref('')

  /**
   * Validate login credentials
   * @param credentials - User credentials to validate
   * @returns true if valid, false otherwise
   */
  const validateCredentials = (credentials: LoginCredentials): boolean => {
    if (!credentials.email || !credentials.password) {
      error.value = t('validation.required')
      return false
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(credentials.email)) {
      error.value = t('validation.invalidEmail')
      return false
    }

    return true
  }

  /**
   * Format error messages from API responses
   * @param err - Error object from API
   * @returns Formatted error message
   */
  const formatErrorMessage = (err: unknown): string => {
    const errorObj = err as {
      data?: { detail?: string; message?: string }
      statusCode?: number
    }

    // Handle various error formats
    if (errorObj.data?.detail) {
      return errorObj.data.detail
    }

    if (errorObj.data?.message) {
      return errorObj.data.message
    }

    if (errorObj.statusCode === 401) {
      return t('errors.unauthorized')
    }

    if (errorObj.statusCode === 404) {
      return t('errors.userNotFound')
    }

    // Default error message
    return t('errors.loginFailed')
  }

  /**
   * Set loading state
   */
  const setLoading = (value: boolean): void => {
    loading.value = value
  }

  /**
   * Set error message
   */
  const setError = (value: string): void => {
    error.value = value
  }

  /**
   * Clear error message
   */
  const clearError = (): void => {
    error.value = ''
  }

  return {
    validateCredentials,
    formatErrorMessage,
    loading: readonly(loading),
    error: readonly(error),
    setLoading,
    setError,
    clearError
  }
}
