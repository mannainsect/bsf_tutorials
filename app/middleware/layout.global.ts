export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return
  }

  // Ensure meta object exists
  if (!to.meta) {
    to.meta = {}
  }

  try {
    // Ensure Pinia is available before trying to use stores
    const nuxtApp = useNuxtApp()
    if (!nuxtApp.$pinia) {
      console.warn('Pinia not yet initialized, defaulting to public layout')
      to.meta.layout = 'public'
      return
    }

    const authStore = useAuthStore()

    if (!authStore) {
      to.meta.layout = 'public'
      return
    }

    authStore.initializeAuth()

    to.meta.layout = authStore.isAuthenticated
      ? 'private'
      : 'public'
  } catch (error) {
    console.error('Layout middleware error:', error)
    to.meta.layout = 'public'
  }
})