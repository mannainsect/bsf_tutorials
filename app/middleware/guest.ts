export default defineNuxtRouteMiddleware((_to) => {
  // Only run on client side to avoid SSR issues
  if (import.meta.server) return
  
  // Use try-catch to handle Pinia initialization timing
  try {
    const authStore = useAuthStore()
    
    // Initialize auth on first load
    if (!authStore.token) {
      authStore.initializeAuth()
    }
    
    // If already authenticated, redirect to main
    if (authStore.isAuthenticated) {
      const localePath = useLocalePath()
      return navigateTo(localePath('/main'))
    }
  } catch (error) {
    // If Pinia isn't ready yet, just continue
    console.warn('Auth store not ready in guest middleware:', error)
  }
})