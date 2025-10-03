import type { CompanyCreationResponse } from
  '../../shared/types/models/Company'
import { useErrorHandler } from './errors/useErrorHandler'

/**
 * Composable for handling automatic company initialization after
 * registration
 */
export const useCompanyInitialization = () => {
  const { api } = useApi()
  const endpoints = useApiEndpoints()
  const authStore = useAuthStore()
  const { handleApiError, handleSilentError } = useErrorHandler()

  /**
   * Extract name from email and format as "[Name]'s Farm"
   * @param email - User email address
   * @returns Formatted company name
   */
  const extractNameFromEmail = (email: string): string => {
    // Remove domain part
    const parts = email.split('@')
    const localPart = parts[0] || ''

    // Replace common separators with spaces and capitalize
    const cleanName = localPart
      .replace(/[._-]/g, ' ')
      .replace(/\d+/g, '') // Remove numbers
      .trim()

    if (!cleanName) {
      return "User's Farm"
    }

    // Capitalize each word
    const capitalized = cleanName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() +
                   word.slice(1).toLowerCase())
      .join(' ')

    return capitalized ? `${capitalized}'s Farm` : "User's Farm"
  }

  /**
   * Create company with all spaces using bulk creation feature
   * @param token - Authentication token
   * @param email - User email for generating company name
   * @returns Company creation response
   */
  const createCompanyWithSpaces = async (
    token: string,
    email: string
  ): Promise<CompanyCreationResponse> => {
    const companyName = extractNameFromEmail(email)

    // Default Helsinki location
    const companyData = {
      name: companyName,
      city: 'Helsinki',
      country: 'FI',
      timezone: 'Europe/Helsinki'
    }

    try {
      // Create company with all spaces using bulk creation parameter
      const response = await api<CompanyCreationResponse>(
        `${endpoints.companies}?create_all_spaces=true`,
        {
          method: 'POST',
          body: companyData,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (import.meta.dev) {
        // Company created successfully

        if (response.failed_space_types?.length) {
          console.warn('[CompanyInit] Some spaces failed to create:',
                       response.failed_space_types)
        }
      }

      return response
    } catch (error) {
      // Use the error handler for consistent error handling
      const normalizedError = handleApiError(
        error as Error,
        'CompanyInit: Create company'
      )
      throw normalizedError
    }
  }

  /**
   * Initialize company with retry mechanism
   * @param email - User email address
   * @param maxRetries - Maximum number of retry attempts
   * @returns Company creation response or null if all attempts fail
   */
  const initializeCompany = async (
    email: string,
    maxRetries = 3
  ): Promise<CompanyCreationResponse | null> => {
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < maxRetries) {
      attempts++

      try {
        // Get current token from auth store
        const token = authStore.token
        if (!token) {
          throw new Error('No authentication token available')
        }

        if (import.meta.dev) {
          // Attempt to create company
        }

        const response = await createCompanyWithSpaces(
          token as string,
          email
        )

        // Success - refresh profile to include new company
        await authStore.fetchProfile()

        return response
      } catch (error) {
        lastError = error as Error
        // Use silent error handler for retry attempts
        handleSilentError(
          error as Error,
          `CompanyInit: Attempt ${attempts} failed`
        )

        if (attempts < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 4000)
          if (import.meta.dev) {
            // Waiting before retry
          }
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Log final failure
    handleSilentError(
      lastError,
      'CompanyInit: All attempts failed'
    )
    return null
  }

  return {
    extractNameFromEmail,
    createCompanyWithSpaces,
    initializeCompany
  }
}