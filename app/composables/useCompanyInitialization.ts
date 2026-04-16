import type { CompanyCreationResponse } from '../../shared/types/models/Company'
import { CompanyRepository } from './api/repositories/CompanyRepository'
import { useErrorHandler } from './errors/useErrorHandler'

export const useCompanyInitialization = () => {
  const authStore = useAuthStore()
  const { handleApiError, handleSilentError } = useErrorHandler()
  const companyRepository = new CompanyRepository()

  const extractNameFromEmail = (email: string): string => {
    const parts = email.split('@')
    const localPart = parts[0] || ''

    const cleanName = localPart.replace(/[._-]/g, ' ').replace(/\d+/g, '').trim()

    if (!cleanName) {
      return "User's Farm"
    }

    const capitalized = cleanName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    return capitalized ? `${capitalized}'s Farm` : "User's Farm"
  }

  const createCompanyWithSpaces = async (email: string): Promise<CompanyCreationResponse> => {
    const companyName = extractNameFromEmail(email)
    const companyData = {
      name: companyName,
      city: 'Helsinki',
      country: 'FI',
      timezone: 'Europe/Helsinki'
    }

    try {
      const response = await companyRepository.createCompanyWithSpaces(companyData)

      if (response.failed_space_types?.length) {
        handleSilentError(
          new Error('Some spaces failed to create: ' + JSON.stringify(response.failed_space_types)),
          'useCompanyInitialization.initialize'
        )
      }

      return response
    } catch (error) {
      const normalizedError = handleApiError(error as Error, 'CompanyInit: Create company')
      throw normalizedError
    }
  }

  const initializeCompany = async (
    email: string,
    maxRetries = 3
  ): Promise<CompanyCreationResponse | null> => {
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < maxRetries) {
      attempts++

      try {
        const token = authStore.token
        if (!token) {
          throw new Error('No authentication token available')
        }

        if (import.meta.dev) {
          // Attempt to create company
        }

        const response = await createCompanyWithSpaces(email)

        await authStore.fetchProfile()

        return response
      } catch (error) {
        lastError = error as Error
        handleSilentError(error as Error, `CompanyInit: Attempt ${attempts} failed`)

        if (attempts < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 4000)
          if (import.meta.dev) {
            // Waiting before retry
          }
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    handleSilentError(lastError, 'CompanyInit: All attempts failed')
    return null
  }

  return {
    extractNameFromEmail,
    createCompanyWithSpaces,
    initializeCompany
  }
}
