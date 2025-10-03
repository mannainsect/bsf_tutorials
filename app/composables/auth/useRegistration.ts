import type { Ref } from 'vue'

export interface RegistrationData {
  email: string
  password: string
  name: string
}

export interface UseRegistrationReturn {
  registerUser: (email: string, password: string) => Promise<void>
  generateDefaultName: (email: string) => string
  storeEmailForVerification: (email: string) => void
  loading: Ref<boolean>
  error: Ref<string>
}

/**
 * Composable for handling user registration logic
 * Separates the business logic from the presentation layer
 */
export function useRegistration(): UseRegistrationReturn {
  const { t } = useI18n()
  
  const loading = ref(false)
  const error = ref('')

  /**
   * Generate a default name from email address
   * Transforms email prefix into a formatted name
   */
  const generateDefaultName = (email: string): string => {
    const emailPrefix = email.split('@')[0] || email
    return emailPrefix
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }


  /**
   * Store email in local storage for verification page
   */
  const storeEmailForVerification = (email: string): void => {
    const storage = useStorage()
    storage.set('registration_email', email)
  }

  /**
   * Register a new user with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  const registerUser = async (email: string, password: string): Promise<void> => {
    loading.value = true
    error.value = ''
    
    try {
      const { register } = useAuth()
      
      const registrationData: RegistrationData = {
        email,
        password,
        name: generateDefaultName(email)
      }

      await register(registrationData)
      
      // Store email for use in verification page
      storeEmailForVerification(email)
      
    } catch (err: unknown) {
      const errorObj = err as { data?: { detail?: string } }
      error.value = errorObj.data?.detail || t('errors.failedToCreateAccount')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    registerUser,
    generateDefaultName,
    storeEmailForVerification,
    loading: readonly(loading),
    error: readonly(error)
  }
}