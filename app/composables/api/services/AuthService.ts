import type { LoginRequest, RegisterRequest } from '../../../../shared/types'
import { AuthRepository } from '../repositories/AuthRepository'

export class AuthService {
  private authRepository: AuthRepository

  constructor() {
    this.authRepository = new AuthRepository()
  }

  private get authStore() {
    return useAuthStore()
  }

  /**
   * Login user and handle authentication state
   */
  async login(credentials: LoginRequest) {
    const response = await this.authRepository.login(credentials)

    // Set token in store
    this.authStore.setToken(response.access_token)

    // Fetch user profile data and store it using centralized method
    await this.authStore.fetchProfile()

    return response
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest) {
    const response = await this.authRepository.register(userData)
    return response
  }

  /**
   * Logout user and clean up state
   */
  async logout() {
    // Clear local authentication state (no API call needed)
    this.authStore.logout()

    // Navigate to index page
    const localePath = useLocalePath()
    await navigateTo(localePath('/'))
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string) {
    return this.authRepository.sendPasswordReset(email)
  }

  /**
   * Verify email with token and handle authentication
   */
  async verifyEmail(token: string) {
    const response = await this.authRepository.verifyEmail(token)

    // Set token in store (verifyEmail now returns LoginResponse with access_token)
    this.authStore.setToken(response.access_token)

    // Store flag to indicate this is a new registration that needs company initialization
    const storage = useStorage()
    storage.set('needs_company_init', true)

    // Fetch user profile data and store it using centralized method
    await this.authStore.fetchProfile()

    return response
  }

  /**
   * Login with email token (passwordless login)
   */
  async loginWithToken(token: string) {
    const response = await this.authRepository.loginWithToken(token)

    // Set token in store
    this.authStore.setToken(response.access_token)

    // Fetch user profile data and store it using centralized method
    await this.authStore.fetchProfile()

    // Track login metric (fire and forget)
    if (import.meta.client) {
      import('../../useMetrics').then(({ useMetrics }) => {
        const { trackLogin } = useMetrics()
        trackLogin('token')
      })
    }

    return response
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated() {
    return this.authStore.isAuthenticated
  }

  /**
   * Get current user
   */
  get currentUser() {
    return this.authStore.user
  }

  /**
   * Get current token
   */
  get token() {
    return this.authStore.token
  }
}
