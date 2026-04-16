import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthRepository } from '~/composables/api/repositories/AuthRepository'
import type { RefreshTokenRequest } from '../../../../shared/types'

const createMockAuthStore = () => ({
  token: null as string | null,
  isAuthenticated: false
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

describe('AuthRepository', () => {
  let repository: AuthRepository

  beforeEach(() => {
    mockAuthStore.token = 'test-token'
    mockAuthStore.isAuthenticated = true
    repository = new AuthRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('sendRegisterToken', () => {
    it('should POST to authSendToken endpoint with email and token_type', async () => {
      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue({ message: 'Token sent' })

      const email = 'test@example.com'
      await repository.sendRegisterToken(email)

      expect(repository.post).toHaveBeenCalledWith(
        '/auth/send-token',
        { email, token_type: 'register' }
      )
    })

    it('should return success response', async () => {
      const mockResponse = { message: 'Token sent' }
      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue(mockResponse)

      const result = await repository.sendRegisterToken('test@example.com')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const error = {
        statusCode: 400,
        data: { message: 'Invalid email' }
      }
      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockRejectedValue(error)

      await expect(
        repository.sendRegisterToken('bad-email')
      ).rejects.toMatchObject(error)
    })
  })

  describe('refreshToken', () => {
    it('should POST to authRefresh endpoint (not hardcoded)', async () => {
      const refreshData: RefreshTokenRequest = {
        refresh_token: 'refresh-token-123'
      }
      const mockResponse = {
        access_token: 'new-token',
        token_type: 'bearer'
      }

      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue(mockResponse)

      await repository.refreshToken(refreshData)

      expect(repository.post).toHaveBeenCalledWith(
        '/auth/refresh',
        refreshData
      )
    })

    it('should return refresh token response', async () => {
      const refreshData: RefreshTokenRequest = {
        refresh_token: 'refresh-token-123'
      }
      const mockResponse = {
        access_token: 'new-token',
        token_type: 'bearer',
        expires_in: 3600
      }

      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue(mockResponse)

      const result = await repository.refreshToken(refreshData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('resetUserPassword', () => {
    it('should POST with only new_password (no current_password)', async () => {
      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue({ message: 'Password reset' })

      const newPassword = 'newSecurePassword123'
      await repository.resetUserPassword(newPassword)

      expect(repository.post).toHaveBeenCalledWith(
        '/users/reset_password',
        { new_password: newPassword }
      )
    })

    it('should use usersResetPassword endpoint', async () => {
      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue({ message: 'Password reset' })

      await repository.resetUserPassword('newPass123')

      const callArgs = (repository.post as ReturnType<typeof vi.fn>)
        .mock.calls[0]
      expect(callArgs[0]).toBe('/users/reset_password')
    })

    it('should return success response', async () => {
      const mockResponse = { message: 'Password updated' }
      vi.spyOn(
        repository as unknown as { post: () => unknown },
        'post'
      ).mockResolvedValue(mockResponse)

      const result = await repository.resetUserPassword('newPass')
      expect(result).toEqual(mockResponse)
    })
  })
})
