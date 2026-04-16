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
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const endpoints = useApiEndpoints()
    return await this.post<LoginResponse>(endpoints.authLogin, {
      email: credentials.email,
      password: credentials.password
    })
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const endpoints = useApiEndpoints()
    const { public: runtimePublicConfig } = useRuntimeConfig()
    const domainAlias = runtimePublicConfig?.domainAlias

    return this.request<RegisterResponse>(endpoints.authRegister, {
      method: 'POST',
      body: userData,
      query: domainAlias ? { domain_alias: domainAlias } : undefined
    })
  }

  async refreshToken(refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const endpoints = useApiEndpoints()
    return this.post<RefreshTokenResponse>(endpoints.authRefresh, refreshData)
  }

  async sendPasswordReset(email: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(endpoints.authResetPassword, { email })
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(endpoints.authResetPasswordConfirm, {
      token,
      new_password: newPassword
    })
  }

  async resetUserPassword(newPassword: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(endpoints.usersResetPassword, {
      new_password: newPassword
    })
  }

  async sendRegisterToken(email: string): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ message: string }>(endpoints.authSendToken, {
      email,
      token_type: 'register'
    })
  }

  async verifyEmail(token: string): Promise<LoginResponse> {
    const endpoints = useApiEndpoints()
    return this.post<LoginResponse>(endpoints.authRegisterVerify, { token })
  }

  async loginWithToken(token: string): Promise<LoginResponse> {
    const endpoints = useApiEndpoints()
    return this.post<LoginResponse>(endpoints.authLoginToken, { token })
  }
}
