import { ref, nextTick } from 'vue'
import { useSafeLocalePath } from './useSafeLocalePath'
import { useAuthStore } from '../stores/auth'

export const useAddListingButton = (targetRoute: string) => {
  const router = useRouter()
  const { localePath } = useSafeLocalePath()
  const authStore = useAuthStore()

  const showAuthModal = ref(false)
  const isNavigating = ref(false)

  const handleAddClick = async (): Promise<void> => {
    if (isNavigating.value) return

    try {
      if (authStore.isAuthenticated) {
        isNavigating.value = true
        await router.push(localePath(targetRoute))
      } else {
        showAuthModal.value = false
        await nextTick()
        showAuthModal.value = true
      }
    } catch (error) {
      console.error(`Error navigating to: ${localePath(targetRoute)}`, error)
    } finally {
      isNavigating.value = false
    }
  }

  const handleShowAuthModal = async (): Promise<void> => {
    showAuthModal.value = false
    await nextTick()
    showAuthModal.value = true
  }

  const handleAuthModalDismiss = (): void => {
    showAuthModal.value = false
  }

  return {
    showAuthModal,
    isNavigating,
    handleAddClick,
    handleShowAuthModal,
    handleAuthModalDismiss
  }
}