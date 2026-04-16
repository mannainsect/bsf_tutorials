import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '../../../setup/test-setup'

const presentSpy = vi.fn()
const createSpy = vi.fn(
  () => Promise.resolve({ present: presentSpy })
)

// Override global useToast before composable import
global.useToast = () => ({ create: createSpy })

// eslint-disable-next-line import/first -- must follow useToast override
import { useErrorHandler } from '~/composables/errors/useErrorHandler'

// NOTE: import.meta.dev is statically replaced to false by Vitest at
// transform time. Tests that verify console.error logging in dev mode
// require `define: { 'import.meta.dev': true }` in vitest.config.mjs.
// Those tests are marked .skip until the config is updated.

describe('useErrorHandler', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error')
      .mockImplementation(() => {})
    createSpy.mockClear()
    presentSpy.mockClear()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('normalizeError', () => {
    it('normalizes FetchError with data.message', () => {
      const { normalizeError } = useErrorHandler()
      const fetchError = {
        data: { message: 'Not Found' },
        statusCode: 404
      }

      const result = normalizeError(fetchError)

      expect(result.message).toBe('Not Found')
      expect(result.source).toBe('api')
      expect(result.code).toBe(404)
      expect(result.details).toEqual({ message: 'Not Found' })
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('normalizes FetchError without data.message to i18n key', () => {
      const { normalizeError } = useErrorHandler()
      const fetchError = { data: {}, statusCode: 500 }

      const result = normalizeError(fetchError)

      expect(result.message).toBe('errors.api.generic')
      expect(result.source).toBe('api')
      expect(result.code).toBe(500)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('normalizes validation error with issues', () => {
      const { normalizeError } = useErrorHandler()
      const issues = [{ path: 'email', message: 'required' }]

      const result = normalizeError({ issues })

      expect(result.source).toBe('validation')
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.details).toEqual(issues)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('normalizes validation error with errors variant', () => {
      const { normalizeError } = useErrorHandler()
      const errors = [{ field: 'name', msg: 'too short' }]

      const result = normalizeError({ errors })

      expect(result.source).toBe('validation')
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.details).toEqual(errors)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('normalizes standard Error instance', () => {
      const { normalizeError } = useErrorHandler()
      const error = new Error('boom')

      const result = normalizeError(error)

      expect(result.source).toBe('system')
      expect(result.message).toBe('boom')
      expect(result.code).toBe('UNKNOWN_ERROR')
      expect(result.details).toHaveProperty('name', 'Error')
      expect(result.details).toHaveProperty('stack')
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('normalizes primitives to unknown source', () => {
      const { normalizeError } = useErrorHandler()

      const strResult = normalizeError('str' as unknown)
      expect(strResult.source).toBe('unknown')
      expect(strResult.message).toBe('errors.generic')
      expect(strResult.timestamp).toBeInstanceOf(Date)

      const numResult = normalizeError(42 as unknown)
      expect(numResult.source).toBe('unknown')
      expect(numResult.timestamp).toBeInstanceOf(Date)

      const nullResult = normalizeError(null as unknown)
      expect(nullResult.source).toBe('unknown')
      expect(nullResult.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('handleError', () => {
    it('shows toast by default with correct options', async () => {
      const { handleError } = useErrorHandler()

      handleError(new Error('test error'))
      await flushPromises()

      expect(createSpy).toHaveBeenCalledWith({
        message: 'test error',
        color: 'danger',
        duration: 4000,
        position: 'top'
      })
      expect(presentSpy).toHaveBeenCalled()
    })

    it('does not show toast when toast option is false', () => {
      const { handleError } = useErrorHandler()

      handleError(new Error('silent'), { toast: false })

      expect(createSpy).not.toHaveBeenCalled()
    })

    // Requires import.meta.dev=true in vitest config define
    it(
      'logs to console in dev mode with source',
      () => {
        const { handleError } = useErrorHandler()

        handleError(new Error('oops'), {
          console: true,
          source: 'TestModule'
        })

        expect(consoleSpy).toHaveBeenCalled()
        const msg = consoleSpy.mock.calls[0][0] as string
        expect(msg).toMatch(
          /^\[SYSTEM\] Error in TestModule:/
        )
      }
    )

    it('does not log to console when console option is false', () => {
      const { handleError } = useErrorHandler()

      handleError(new Error('no log'), { console: false })

      expect(consoleSpy).not.toHaveBeenCalled()
    })

    // Requires import.meta.dev=true in vitest config define
    it(
      'omits "in" from console message when no source',
      () => {
        const { handleError } = useErrorHandler()

        handleError(new Error('no source'), {
          console: true
        })

        expect(consoleSpy).toHaveBeenCalled()
        const msg = consoleSpy.mock.calls[0][0] as string
        expect(msg).toMatch(/^\[SYSTEM\] Error:/)
        expect(msg).not.toContain(' in ')
      }
    )

    it('returns normalized error matching shape', () => {
      const { handleError, normalizeError } = useErrorHandler()
      const error = new Error('shape test')

      const result = handleError(error, {
        toast: false,
        console: false
      })
      const normalized = normalizeError(error)

      expect(result.message).toBe(normalized.message)
      expect(result.source).toBe(normalized.source)
      expect(result.code).toBe(normalized.code)
    })
  })

  describe('handleApiError', () => {
    it('shows toast and returns api-normalized error', () => {
      const { handleApiError } = useErrorHandler()
      const fetchError = {
        data: { message: 'Server Error' },
        statusCode: 500
      }

      const result = handleApiError(fetchError as never)

      expect(createSpy).toHaveBeenCalled()
      expect(result.source).toBe('api')
      expect(result.message).toBe('Server Error')
      expect(result.code).toBe(500)
    })

    // Requires import.meta.dev=true in vitest config define
    it(
      'logs with API call as default source',
      () => {
        const { handleApiError } = useErrorHandler()
        const fetchError = {
          data: { message: 'Err' },
          statusCode: 500
        }

        handleApiError(fetchError as never)

        expect(consoleSpy).toHaveBeenCalled()
        const msg = consoleSpy.mock.calls[0][0] as string
        expect(msg).toContain('API call')
      }
    )
  })

  describe('handleValidationError', () => {
    it('does not show toast and returns validation error', () => {
      const { handleValidationError } = useErrorHandler()

      const result = handleValidationError({
        issues: [{ msg: 'required' }]
      })

      expect(createSpy).not.toHaveBeenCalled()
      expect(result.source).toBe('validation')
      expect(result.code).toBe('VALIDATION_ERROR')
    })

    // Requires import.meta.dev=true in vitest config define
    it(
      'logs with Form validation as default source',
      () => {
        const { handleValidationError } = useErrorHandler()

        handleValidationError({
          issues: [{ msg: 'required' }]
        })

        expect(consoleSpy).toHaveBeenCalled()
        const msg = consoleSpy.mock.calls[0][0] as string
        expect(msg).toContain('Form validation')
      }
    )
  })

  describe('handleSilentError', () => {
    it('does not show toast', () => {
      const { handleSilentError } = useErrorHandler()

      const result = handleSilentError(new Error('quiet'))

      expect(createSpy).not.toHaveBeenCalled()
      expect(result.source).toBe('system')
      expect(result.message).toBe('quiet')
    })

    // Requires import.meta.dev=true in vitest config define
    it(
      'logs without default source label',
      () => {
        const { handleSilentError } = useErrorHandler()

        handleSilentError(new Error('quiet'))

        expect(consoleSpy).toHaveBeenCalled()
        const msg = consoleSpy.mock.calls[0][0] as string
        expect(msg).toMatch(/^\[SYSTEM\] Error:/)
        expect(msg).not.toContain(' in ')
      }
    )
  })
})
