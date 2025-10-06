export default defineNuxtRouteMiddleware(async _to => {
  // Only run on client side to avoid SSR issues
  if (import.meta.server) return

  // Use try-catch to handle Pinia initialization timing
  try {
    const authStore = useAuthStore()
    const localePath = useLocalePath()

    // Initialize auth on first load
    if (!authStore.token) {
      authStore.initializeAuth()
    }

    if (!authStore.isAuthenticated) {
      return navigateTo(localePath('/login'))
    }

    // Bootstrap profile data before rendering private routes
    // This ensures profile is fully hydrated before pages render
    try {
      await authStore.ensureProfileData(true)
    } catch (error) {
      console.error(
        '[AUTH_MIDDLEWARE] Failed to bootstrap profile data:',
        error
      )

      // If profile fetch fails critically, redirect to error page
      // Check if it's a network error or authentication issue
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('Network'))

      const isAuthError =
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('Unauthorized'))

      if (isAuthError) {
        // Authentication issue - redirect to login
        authStore.logout()
        return navigateTo(localePath('/login'))
      } else if (isNetworkError) {
        // Network issue - redirect to error page with retry option
        return navigateTo(localePath('/error?type=network&retry=profile'))
      } else {
        // Other critical error - redirect to error page
        return navigateTo(localePath('/error?type=profile&retry=profile'))
      }
    }
  } catch (error) {
    // If Pinia isn't ready yet, redirect to login as fallback
    console.warn('Auth store not ready in auth middleware:', error)
    const localePath = useLocalePath()
    return navigateTo(localePath('/login'))
  }
})
