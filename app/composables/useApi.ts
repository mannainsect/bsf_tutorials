import { API_TIMEOUT } from '~/utils/constants'
import { useErrorHandler } from './errors/useErrorHandler'

export const useApi = () => {
  const { handleError } = useErrorHandler()
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    timeout: API_TIMEOUT,
    retry: 2,
    retryDelay: 1000,
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ options }) {
      const authStore = useAuthStore()
      // Initialize auth if not already done
      if (import.meta.client && !authStore.token) {
        authStore.initializeAuth()
      }

      // Handle headers
      const headers = new Headers(options.headers || {})

      // Set Authorization header if token exists
      if (authStore.token) {
        headers.set('Authorization', `Bearer ${authStore.token}`)
      }

      // Remove Content-Type header for FormData to let browser set it automatically
      if (options.body instanceof FormData) {
        headers.delete('Content-Type')
      }

      options.headers = headers
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        const localePath = useLocalePath()
        navigateTo(localePath('/login'))
      }
    },
    onRequestError({ error }) {
      handleError(error, { source: 'useApi.request' })
      throw createError({
        statusCode: 500,
        statusMessage: 'Network connection error. Please check your internet connection.'
      })
    }
  })

  return { api }
}
