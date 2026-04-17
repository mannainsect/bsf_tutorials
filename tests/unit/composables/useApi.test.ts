import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

// Mock useErrorHandler BEFORE importing useApi
const mockHandleSilentError = vi.fn()
vi.mock('~/composables/errors/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleSilentError: mockHandleSilentError,
    handleError: vi.fn(),
    normalizeError: vi.fn(),
    handleApiError: vi.fn(),
    handleValidationError: vi.fn()
  })
}))

// Capture $fetch.create config
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let captured: Record<string, any> = {}
const originalFetch = global.$fetch
const originalUseAuthStore = global.useAuthStore

describe('useApi', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    vi.clearAllMocks()
    captured = {}
    // Override $fetch with a create spy that captures config
    global.$fetch = Object.assign(vi.fn(), {
      create: (opts: Record<string, unknown>) => {
        Object.assign(captured, opts)
        return vi.fn()
      }
    }) as unknown as typeof global.$fetch
    setActivePinia(createPinia())
    store = useAuthStore()
    // Override global useAuthStore so useApi's onRequest
    // resolves to the real Pinia store instance
    global.useAuthStore = (() => store) as typeof global.useAuthStore
  })

  afterEach(() => {
    global.$fetch = originalFetch
    global.useAuthStore = originalUseAuthStore
  })

  // Helper: lazily import and invoke useApi to capture config
  const loadUseApi = async () => {
    const mod = await import('~/composables/useApi')
    return mod.useApi()
  }

  describe('config', () => {
    it('sets timeout to API_TIMEOUT (10000)', async () => {
      await loadUseApi()
      expect(captured.timeout).toBe(10000)
    })

    it('sets retry to 2', async () => {
      await loadUseApi()
      expect(captured.retry).toBe(2)
    })
  })

  describe('onRequest', () => {
    it('sets Bearer header when token is present', async () => {
      store.setToken('abc')
      await loadUseApi()
      const headers = new Headers()
      const options = { headers }
      captured.onRequest({ options })
      expect(options.headers.get('Authorization')).toBe('Bearer abc')
    })

    it('does not set Authorization when token is null', async () => {
      await loadUseApi()
      // initializeAuth is a no-op when storage is empty,
      // so token stays null after the interceptor runs
      const headers = new Headers()
      const options = { headers }
      captured.onRequest({ options })
      expect(options.headers.get('Authorization')).toBeNull()
    })

    it('calls initializeAuth when client and no token', async () => {
      await loadUseApi()
      const spy = vi.spyOn(store, 'initializeAuth')
      const headers = new Headers()
      const options = { headers }
      captured.onRequest({ options })
      expect(spy).toHaveBeenCalled()
    })

    it('strips Content-Type for FormData body', async () => {
      store.setToken('tok')
      await loadUseApi()
      const headers = new Headers({
        'Content-Type': 'application/json'
      })
      const options = { headers, body: new FormData() }
      captured.onRequest({ options })
      expect(options.headers.get('Content-Type')).toBeNull()
    })

    it('preserves Content-Type for JSON body', async () => {
      store.setToken('tok')
      await loadUseApi()
      const headers = new Headers({
        'Content-Type': 'application/json'
      })
      const options = { headers, body: { foo: 'bar' } }
      captured.onRequest({ options })
      expect(options.headers.get('Content-Type')).toBe('application/json')
    })
  })

  describe('onRequestError', () => {
    it('calls handleSilentError with error and context', async () => {
      await loadUseApi()
      const err = new Error('net fail')
      try {
        captured.onRequestError({ error: err })
      } catch {
        // expected throw
      }
      expect(mockHandleSilentError).toHaveBeenCalledWith(err, 'useApi.request')
    })

    it('throws createError with statusCode 500', async () => {
      await loadUseApi()
      const err = new Error('net fail')
      expect(() => captured.onRequestError({ error: err })).toThrow()
      try {
        captured.onRequestError({ error: err })
      } catch (thrown: unknown) {
        const e = thrown as Error & {
          statusCode: number
          statusMessage: string
        }
        expect(e.statusCode).toBe(500)
        expect(e.statusMessage).toContain('Network connection error')
      }
    })
  })

  describe('onResponseError', () => {
    it('does not logout or navigate on non-401', async () => {
      await loadUseApi()
      const logoutSpy = vi.spyOn(store, 'logout')
      captured.onResponseError({ response: { status: 403 } })
      expect(logoutSpy).not.toHaveBeenCalled()
      expect(navigateTo).not.toHaveBeenCalled()
    })
  })
})
