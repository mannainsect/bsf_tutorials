import { ref, computed, readonly } from 'vue'
import type { 
  User, 
  UpdateUserRequest, 
  Credit
} from '../../shared/types'
import { UserRepository } from './api/repositories/UserRepository'
import { CreditRepository } from './api/repositories/CreditRepository'
import { AuthRepository } from './api/repositories/AuthRepository'

export const useAccount = () => {
  const { t } = useI18n()
  // State
  const user = ref<User | null>(null)
  const creditHistory = ref<Credit[]>([])
  const isLoading = ref(false)
  const error = ref<string>('')

  // Repositories
  const userRepository = new UserRepository()
  const creditRepository = new CreditRepository()
  const authRepository = new AuthRepository()

  // Computed
  const hasCredits = computed(() => user.value?.credits_balance && user.value.credits_balance > 0)
  const currentBalance = computed(() => user.value?.credits_balance || 0)
  const purchasedProducts = computed(() => user.value?.purchased_products || [])

  // User Profile Methods
  const loadCurrentUser = async () => {
    try {
      isLoading.value = true
      error.value = ''
      
      // Use centralized profile data from auth store
      const authStore = useAuthStore()
      await authStore.ensureProfileData()  // Uses cached data or fetches if needed
      user.value = authStore.user ? JSON.parse(JSON.stringify(authStore.user)) : null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('errors.account.loadProfileFailed')
      console.error(t('errors.account.loadProfileLog'), err)
    } finally {
      isLoading.value = false
    }
  }

  const updateUserProfile = async (userData: UpdateUserRequest) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await userRepository.updateCurrentUser(userData)
      user.value = response.user || null
      
      // Update auth store
      const authStore = useAuthStore()
      if (user.value) {
        authStore.setUser(user.value)
      }
      
      return response
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('errors.account.updateProfileFailed')
      console.error(t('errors.account.updateProfileLog'), err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Credit Methods
  const loadCreditHistory = async () => {
    try {
      // Ensure user data is loaded before fetching credits
      if (!user.value) {
        await loadCurrentUser()
      }
      
      const response = await creditRepository.getCurrentUserCredits()
      creditHistory.value = response.data || []
    } catch (err: unknown) {
      // Log the error but don't fail silently - credits should be available
      console.error(t('errors.account.creditHistoryLog'), err)
      creditHistory.value = []
      // Don't throw error to prevent blocking the account page
    }
  }

  // Product Methods - now included in user data

  // Password Reset Methods
  const sendPasswordResetEmail = async (email: string) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await authRepository.sendPasswordReset(email)
      return response
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('errors.account.sendResetFailed')
      console.error(t('errors.account.sendResetLog'), err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (currentPassword: string, newPassword: string) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await authRepository.resetUserPassword(currentPassword, newPassword)
      return response
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('errors.account.resetPasswordFailed')
      console.error(t('errors.account.resetPasswordLog'), err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Combined Load Methods
  const loadAccountData = async () => {
    // Load user data first (required)
    await loadCurrentUser()
    
    // Only load credits if user data is available
    if (user.value) {
      await loadCreditHistory()
    }
  }

  const refreshAccount = async () => {
    await loadAccountData()
  }

  return {
    // State
    user: readonly(user),
    creditHistory: readonly(creditHistory),
    purchasedProducts,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    hasCredits,
    currentBalance,

    // Methods
    loadCurrentUser,
    updateUserProfile,
    loadCreditHistory,
    sendPasswordResetEmail,
    resetPassword,
    loadAccountData,
    refreshAccount
  }
}
