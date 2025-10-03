import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '../../../../shared/types'
import { BaseRepository } from './BaseRepository'

export class AuthRepository extends BaseRepository {
  /**
   * Login user with email and password using new /auth/login endpoint
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const endpoints = useApiEndpoints()
    
    // Use new /auth/login endpoint with JSON body
    return await this.post<LoginResponse>(endpoints.authLogin, {
      email: credentials.email,
      password: credentials.password
    })
  }

  /**
   * Register new user using new /auth/register endpoint
  */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const endpoints = useApiEndpoints()
    const { public: runtimePublicConfig } = useRuntimeConfig()
    const domainAlias = runtimePublicConfig?.domainAlias

    return this.request<RegisterResponse>(endpoints.authRegister, {
      method: 'POST',
      body: userData,
      query: domainAlias ? { domain_alias: domainAlias } : undefined,
    })
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    return this.post('/auth/logout')
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshData: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    return this.post<RefreshTokenResponse>('/auth/refresh', refreshData)
  }

  /**
   * Send password reset email using new /auth/reset-password endpoint
   */
  async sendPasswordReset(email: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(
      endpoints.authResetPassword,
      { email }
    )
  }

  /**
   * Confirm password reset using new /auth/reset-password/confirm endpoint
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(endpoints.authResetPasswordConfirm, {
      token,
      new_password: newPassword
    })
  }

  /**
   * Reset password for logged-in user using /users/reset_password endpoint
   */
  async resetUserPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(endpoints.usersResetPassword, {
      current_password: currentPassword,
      new_password: newPassword
    })
  }

  /**
   * Verify email with token using new /auth/register/verify endpoint
   *
   * @param token - Email verification token from URL
   * @returns User object with auth tokens on successful verification
   *
   * @note API returns HTTP 201 (Created) on success. $fetch
   *       automatically treats both 200 and 201 as success,
   *       ensuring backward compatibility during API transition.
   */
  async verifyEmail(token: string): Promise<LoginResponse> {
    const endpoints = useApiEndpoints()
    return this.post<LoginResponse>(endpoints.authRegisterVerify, { token })
  }

  /**
   * Login with email token (passwordless login)
   */
  async loginWithToken(token: string): Promise<LoginResponse> {
    const endpoints = useApiEndpoints()
    return this.post<LoginResponse>(endpoints.authLoginToken, { token })
  }

}
