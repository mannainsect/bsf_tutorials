import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '../errors/useErrorHandler'

export function usePasswordReset() {
  const { sendPasswordReset, confirmPasswordReset } = useAuth()
  const toast = useToast()
  const { handleApiError, handleSilentError } = useErrorHandler()
  const { t } = useI18n()
  const localePath = useLocalePath()

  const loading = ref(false)

  const requestReset = async (email: string) => {
    loading.value = true
    try {
      await sendPasswordReset(email)
    } catch (err: unknown) {
      handleSilentError(err, 'usePasswordReset.requestReset')
    } finally {
      loading.value = false
    }
    return { success: true }
  }

  const confirmReset = async (
    { token, password }: { token: string; password: string }
  ) => {
    loading.value = true
    try {
      try {
        await confirmPasswordReset(token, password)
      } catch (err: unknown) {
        handleApiError(
          err as import('ofetch').FetchError,
          'usePasswordReset.confirmReset'
        )
        return
      }
      await toast.showSuccess(
        t('auth.passwordReset.successToast')
      )
      await navigateTo(localePath('/login'))
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    requestReset,
    confirmReset
  }
}
