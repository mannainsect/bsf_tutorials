import type { LoginRequest, RegisterRequest } from '../../shared/types'

export const useAuth = () => {
  const authService = useAuthService()
  const authStore = useAuthStore()

  const login = async (credentials: LoginRequest) => {
    return authService.login(credentials)
  }

  const logout = async () => {
    return authService.logout()
  }

  const register = async (userData: RegisterRequest) => {
    return authService.register(userData)
  }

  const sendPasswordReset = async (email: string) => {
    return authService.sendPasswordReset(email)
  }

  const verifyEmail = async (token: string) => {
    return authService.verifyEmail(token)
  }


  const setToken = (token: string) => {
    authStore.setToken(token)
  }

  return {
    login,
    logout,
    register,
    sendPasswordReset,
    verifyEmail,
    setToken,
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
  }
}