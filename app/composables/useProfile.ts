import { ProfileRepository } from './api/repositories/ProfileRepository'

export const useProfile = () => {
  const authStore = useAuthStore()
  const profileRepository = new ProfileRepository()
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get current user from auth store
   */
  const user = computed(() => authStore.user)

  /**
   * Get active company from auth store
   */
  const activeCompany = computed(() => authStore.activeCompany)

  /**
   * Get other companies from auth store
   */
  const otherCompanies = computed(() => authStore.otherCompanies)

  /**
   * Get user ID for API calls (centralized)
   */
  const userId = computed(() => authStore.userId)

  /**
   * Get company ID for API calls (centralized)
   */
  const companyId = computed(() => authStore.companyId)

  /**
   * Get user email (centralized)
   */
  const userEmail = computed(() => authStore.userEmail)

  /**
   * Get user credits (centralized)
   */
  const userCredits = computed(() => authStore.userCredits)

  /**
   * Refresh user profile data from API (uses centralized method)
   */
  const refreshProfile = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await authStore.fetchProfile()
      return result
    } catch (err: unknown) {
      error.value =
        err instanceof Error
          ? err.message
          : t('errors.failedToLoad', {
              resource: t('profile.userProfile').toLowerCase()
            })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Switch to a different company
   */
  const switchCompany = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      const profile = await profileRepository.switchCompany(companyId)

      // Trigger a full profile refresh to ensure consistency
      // This will normalize data and update all store state atomically
      await authStore.refreshProfile({ force: true })

      return profile
    } catch (err: unknown) {
      error.value =
        err instanceof Error
          ? err.message
          : t('errors.failedToSwitch', {
              resource: t('profile.company').toLowerCase()
            })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user has profile data loaded
   */
  const hasProfileData = computed(() => {
    return !!user.value && !!userId.value
  })

  /**
   * Ensure profile data is loaded (fetch if not available) - uses centralized method
   */
  const ensureProfileData = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await authStore.ensureProfileData()
      return result
    } catch (err: unknown) {
      error.value =
        err instanceof Error
          ? err.message
          : t('errors.failedToLoad', {
              resource: t('profile.userProfile').toLowerCase()
            })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Legacy method for backward compatibility
  const fetchProfile = refreshProfile

  return {
    // State
    user: readonly(user),
    activeCompany: readonly(activeCompany),
    otherCompanies: readonly(otherCompanies),
    userId: readonly(userId),
    companyId: readonly(companyId),
    userEmail: readonly(userEmail),
    userCredits: readonly(userCredits),
    loading: readonly(loading),
    error: readonly(error),
    hasProfileData: readonly(hasProfileData),

    // Methods
    refreshProfile,
    switchCompany,
    ensureProfileData,
    fetchProfile, // Legacy compatibility

    // Legacy property (for backward compatibility)
    profile: readonly(user)
  }
}
