import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePasswordReset } from '~/composables/auth/usePasswordReset'

// Mock useAuth
const mockSendPasswordReset = vi.fn()
const mockConfirmPasswordReset = vi.fn()

// Mock useToast
const mockShowSuccess = vi.fn()

// Mock useErrorHandler
const mockHandleApiError = vi.fn()
const mockHandleSilentError = vi.fn()

vi.mock('~/composables/errors/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleApiError: mockHandleApiError,
    handleSilentError: mockHandleSilentError,
    normalizeError: vi.fn(),
    handleError: vi.fn(),
    handleValidationError: vi.fn()
  })
}))

describe('usePasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSendPasswordReset.mockResolvedValue(undefined)
    mockConfirmPasswordReset.mockResolvedValue(undefined)

    global.useAuth = vi.fn(() => ({
      sendPasswordReset: mockSendPasswordReset,
      confirmPasswordReset: mockConfirmPasswordReset
    }))

    global.useToast = vi.fn(() => ({
      showSuccess: mockShowSuccess,
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
      create: vi.fn(() => Promise.resolve({ present: vi.fn() }))
    }))

    global.useErrorHandler = vi.fn(() => ({
      handleApiError: mockHandleApiError,
      handleSilentError: mockHandleSilentError,
      normalizeError: vi.fn(),
      handleError: vi.fn(),
      handleValidationError: vi.fn()
    }))

    global.navigateTo = vi.fn()
  })

  describe('requestReset', () => {
    it('should call sendPasswordReset with email', async () => {
      const { requestReset } = usePasswordReset()

      await requestReset('user@example.com')

      expect(mockSendPasswordReset).toHaveBeenCalledWith('user@example.com')
    })

    it('should return generic success on API success', async () => {
      const { requestReset } = usePasswordReset()

      const result = await requestReset('user@example.com')

      expect(result).toEqual({ success: true })
    })

    it('should return generic success on API error ' + '(anti-enumeration)', async () => {
      mockSendPasswordReset.mockRejectedValue(new Error('User not found'))
      const { requestReset } = usePasswordReset()

      const result = await requestReset('no-user@example.com')

      expect(result).toEqual({ success: true })
    })

    it('should call handleSilentError on error', async () => {
      const error = new Error('Network error')
      mockSendPasswordReset.mockRejectedValue(error)
      const { requestReset } = usePasswordReset()

      await requestReset('user@example.com')

      expect(mockHandleSilentError).toHaveBeenCalledWith(error, 'usePasswordReset.requestReset')
    })

    it('should set loading true during request and false after', async () => {
      let resolveRequest: () => void
      mockSendPasswordReset.mockReturnValue(
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
      )
      const { requestReset, loading } = usePasswordReset()

      expect(loading.value).toBe(false)

      const promise = requestReset('user@example.com')
      expect(loading.value).toBe(true)

      resolveRequest!()
      await promise

      expect(loading.value).toBe(false)
    })
  })

  describe('confirmReset', () => {
    it('should call confirmPasswordReset with token and password', async () => {
      const { confirmReset } = usePasswordReset()

      await confirmReset({
        token: 'reset-token-123',
        password: 'newPassword1!'
      })

      expect(mockConfirmPasswordReset).toHaveBeenCalledWith('reset-token-123', 'newPassword1!')
    })

    it('should show success toast on success', async () => {
      const { confirmReset } = usePasswordReset()

      await confirmReset({
        token: 'reset-token-123',
        password: 'newPassword1!'
      })

      expect(mockShowSuccess).toHaveBeenCalledWith('auth.passwordReset.successToast')
    })

    it('should navigate to /login on success', async () => {
      const { confirmReset } = usePasswordReset()

      await confirmReset({
        token: 'reset-token-123',
        password: 'newPassword1!'
      })

      expect(global.navigateTo).toHaveBeenCalledWith('/login')
    })

    it('should call handleApiError on error', async () => {
      const error = new Error('Invalid token')
      mockConfirmPasswordReset.mockRejectedValue(error)
      const { confirmReset } = usePasswordReset()

      await confirmReset({
        token: 'bad-token',
        password: 'newPassword1!'
      })

      expect(mockHandleApiError).toHaveBeenCalledWith(error, 'usePasswordReset.confirmReset')
    })

    it('should NOT navigate on error', async () => {
      mockConfirmPasswordReset.mockRejectedValue(new Error('Invalid token'))
      const { confirmReset } = usePasswordReset()

      await confirmReset({
        token: 'bad-token',
        password: 'newPassword1!'
      })

      expect(global.navigateTo).not.toHaveBeenCalled()
    })

    it('should set loading true during request and false after', async () => {
      let resolveRequest: () => void
      mockConfirmPasswordReset.mockReturnValue(
        new Promise<void>(resolve => {
          resolveRequest = resolve
        })
      )
      const { confirmReset, loading } = usePasswordReset()

      expect(loading.value).toBe(false)

      const promise = confirmReset({
        token: 'reset-token-123',
        password: 'newPassword1!'
      })
      expect(loading.value).toBe(true)

      resolveRequest!()
      await promise

      expect(loading.value).toBe(false)
    })
  })
})
