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

vi.mock('~/composables/api/repositories/AuthRepository', () => ({
  AuthRepository: vi.fn().mockImplementation(() => ({
    sendRegisterToken: mockSendRegisterToken,
    resetUserPassword: mockResetUserPassword,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    sendPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    verifyEmail: vi.fn(),
    loginWithToken: vi.fn()
  }))
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
})
