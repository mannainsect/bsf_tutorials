import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '~/composables/api/services/AuthService'

const createMockAuthStore = () => ({
  token: 'test-token' as string | null,
  isAuthenticated: true,
  user: null,
  setToken: vi.fn(),
  fetchProfile: vi.fn(),
  logout: vi.fn()
})

const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)

global.useApiEndpoints = vi.fn(() => ({
  authSendToken: '/auth/send-token',
  authRefresh: '/auth/refresh',
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authResetPassword: '/auth/reset-password',
  authResetPasswordConfirm: '/auth/reset-password/confirm',
  authRegisterVerify: '/auth/register/verify',
  authLoginToken: '/auth/login/token',
  usersResetPassword: '/users/reset_password'
}))

global.useRuntimeConfig = vi.fn(() => ({
  public: { domainAlias: 'bsfapp' }
}))

// Mock AuthRepository prototype methods
const mockSendRegisterToken = vi.fn()
const mockResetUserPassword = vi.fn()
const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockSendPasswordReset = vi.fn()
const mockVerifyEmail = vi.fn()
const mockLoginWithToken = vi.fn()

vi.mock('~/composables/api/repositories/AuthRepository', () => ({
  AuthRepository: vi.fn().mockImplementation(() => ({
    sendRegisterToken: mockSendRegisterToken,
    resetUserPassword: mockResetUserPassword,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
    refreshToken: vi.fn(),
    sendPasswordReset: mockSendPasswordReset,
    confirmPasswordReset: vi.fn(),
    verifyEmail: mockVerifyEmail,
    loginWithToken: mockLoginWithToken
  }))
}))

// Mock useMetrics dynamic import used in loginWithToken
vi.mock('../../useMetrics', () => ({
  useMetrics: () => ({
    trackLogin: vi.fn()
  })
}))

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AuthService()
  })

  describe('sendRegisterToken', () => {
    it('should delegate to AuthRepository.sendRegisterToken', async () => {
      const email = 'test@example.com'
      const mockResponse = { message: 'Token sent' }
      mockSendRegisterToken.mockResolvedValue(mockResponse)

      const result = await service.sendRegisterToken(email)

      expect(mockSendRegisterToken).toHaveBeenCalledWith(email)
      expect(result).toEqual(mockResponse)
    })

    it('should pass email argument through unchanged', async () => {
      const email = 'another@test.com'
      mockSendRegisterToken.mockResolvedValue({ message: 'ok' })

      await service.sendRegisterToken(email)

      expect(mockSendRegisterToken).toHaveBeenCalledTimes(1)
      expect(mockSendRegisterToken).toHaveBeenCalledWith(email)
    })
  })

  describe('resetUserPassword', () => {
    it('should delegate to AuthRepository.resetUserPassword', async () => {
      const newPassword = 'securePassword123'
      const mockResponse = { message: 'Password reset' }
      mockResetUserPassword.mockResolvedValue(mockResponse)

      const result = await service.resetUserPassword(newPassword)

      expect(mockResetUserPassword).toHaveBeenCalledWith(newPassword)
      expect(result).toEqual(mockResponse)
    })

    it('should pass only newPassword argument', async () => {
      mockResetUserPassword.mockResolvedValue({ message: 'ok' })

      await service.resetUserPassword('newPass')

      expect(mockResetUserPassword).toHaveBeenCalledTimes(1)
      expect(mockResetUserPassword).toHaveBeenCalledWith('newPass')
    })
  })

  describe('login', () => {
    it('should call repo, set token, and fetch profile', async () => {
      const credentials = { email: 'a@b.com', password: 'pw' }
      const response = { access_token: 'tok123', token_type: 'bearer' }
      mockLogin.mockResolvedValue(response)

      const result = await service.login(credentials)

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(mockAuthStore.setToken).toHaveBeenCalledWith('tok123')
      expect(mockAuthStore.fetchProfile).toHaveBeenCalled()
      expect(result).toEqual(response)
    })
  })

  describe('register', () => {
    it('should delegate to AuthRepository.register', async () => {
      const userData = {
        email: 'new@user.com',
        password: 'pass123'
      }
      const response = { status: 'ok', message: 'registered' }
      mockRegister.mockResolvedValue(response)

      const result = await service.register(userData)

      expect(mockRegister).toHaveBeenCalledWith(userData)
      expect(result).toEqual(response)
    })
  })

  describe('logout', () => {
    it('should clear auth state and navigate to /', async () => {
      await service.logout()

      expect(mockAuthStore.logout).toHaveBeenCalled()
      expect(navigateTo).toHaveBeenCalledWith('/')
    })
  })

  describe('sendPasswordReset', () => {
    it('should delegate to AuthRepository.sendPasswordReset', async () => {
      const mockResponse = { message: 'Email sent' }
      mockSendPasswordReset.mockResolvedValue(mockResponse)

      const result = await service.sendPasswordReset('a@b.com')

      expect(mockSendPasswordReset).toHaveBeenCalledWith('a@b.com')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('verifyEmail', () => {
    it('should verify, set token, flag storage, fetch profile', async () => {
      const response = {
        access_token: 'verified-tok',
        token_type: 'bearer'
      }
      mockVerifyEmail.mockResolvedValue(response)
      const mockStorage = { set: vi.fn(), get: vi.fn() }
      const origUseStorage = global.useStorage
      global.useStorage = vi.fn(() => mockStorage) as unknown as typeof global.useStorage

      const result = await service.verifyEmail('email-token')

      expect(mockVerifyEmail).toHaveBeenCalledWith('email-token')
      expect(mockAuthStore.setToken).toHaveBeenCalledWith('verified-tok')
      expect(mockStorage.set).toHaveBeenCalledWith('needs_company_init', true)
      expect(mockAuthStore.fetchProfile).toHaveBeenCalled()
      expect(result).toEqual(response)

      global.useStorage = origUseStorage
    })
  })

  describe('loginWithToken', () => {
    it('should login with token, set token, fetch profile', async () => {
      const response = {
        access_token: 'token-login-tok',
        token_type: 'bearer'
      }
      mockLoginWithToken.mockResolvedValue(response)

      const result = await service.loginWithToken('magic-token')

      expect(mockLoginWithToken).toHaveBeenCalledWith('magic-token')
      expect(mockAuthStore.setToken).toHaveBeenCalledWith('token-login-tok')
      expect(mockAuthStore.fetchProfile).toHaveBeenCalled()
      expect(result).toEqual(response)
    })
  })

  describe('isAuthenticated', () => {
    it('should return authStore.isAuthenticated', () => {
      expect(service.isAuthenticated).toBe(true)
    })
  })

  describe('currentUser', () => {
    it('should return authStore.user', () => {
      expect(service.currentUser).toBeNull()
    })
  })

  describe('token', () => {
    it('should return authStore.token', () => {
      expect(service.token).toBe('test-token')
    })
  })
})
