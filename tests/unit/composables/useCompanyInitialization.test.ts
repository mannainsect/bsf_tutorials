import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCompanyInitialization } from '~/composables/useCompanyInitialization'

describe('useCompanyInitialization', () => {
  let companyInit: ReturnType<typeof useCompanyInitialization>
  let mockApi: ReturnType<typeof vi.fn>
  let mockFetchProfile: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset mocks before each test
    mockApi = vi.fn()
    mockFetchProfile = vi.fn()

    // Override global mocks for this test suite
    vi.stubGlobal('useApi', () => ({ api: mockApi }))
    vi.stubGlobal('useApiEndpoints', () => ({ companies: '/companies' }))
    vi.stubGlobal('useAuthStore', () => ({
      token: 'mock-token',
      fetchProfile: mockFetchProfile
    }))

    companyInit = useCompanyInitialization()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('extractNameFromEmail', () => {
    it('should extract and format name from email correctly', () => {
      const testCases = [
        {
          email: 'yka.marjanen@gmail.com',
          expected: "Yka Marjanen's Farm"
        },
        {
          email: 'john_doe@company.com',
          expected: "John Doe's Farm"
        },
        {
          email: 'user123@domain.org',
          expected: "User's Farm"
        },
        {
          email: 'alice-bob@test.com',
          expected: "Alice Bob's Farm"
        },
        {
          email: 'first.middle.last@email.com',
          expected: "First Middle Last's Farm"
        },
        {
          email: '123456@numbers.com',
          expected: "User's Farm"
        },
        {
          email: '@nodomain.com',
          expected: "User's Farm"
        }
      ]

      testCases.forEach(({ email, expected }) => {
        expect(companyInit.extractNameFromEmail(email)).toBe(expected)
      })
    })

    it('should handle edge cases gracefully', () => {
      expect(companyInit.extractNameFromEmail('')).toBe("User's Farm")
      expect(companyInit.extractNameFromEmail('invalid')).toBe(
        "Invalid's Farm"
      )
      expect(companyInit.extractNameFromEmail('@')).toBe("User's Farm")
    })
  })

  describe('createCompanyWithSpaces', () => {
    it('should create company with correct data', async () => {
      mockApi.mockResolvedValue({
        status: 'success',
        company_id: 'test-company-id',
        created_spaces: ['space1', 'space2', 'space3']
      })

      const result = await companyInit.createCompanyWithSpaces(
        'test-token',
        'test.user@email.com'
      )

      expect(mockApi).toHaveBeenCalledWith(
        '/companies?create_all_spaces=true',
        {
          method: 'POST',
          body: {
            name: "Test User's Farm",
            city: 'Helsinki',
            country: 'FI',
            timezone: 'Europe/Helsinki'
          },
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      )

      expect(result).toEqual({
        status: 'success',
        company_id: 'test-company-id',
        created_spaces: ['space1', 'space2', 'space3']
      })
    })

    it('should handle API errors', async () => {
      mockApi.mockRejectedValue(new Error('API Error'))

      await expect(
        companyInit.createCompanyWithSpaces('test-token', 'test@email.com')
      ).rejects.toThrow('API Error')
    })
  })

  describe('initializeCompany', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should succeed on first attempt', async () => {
      mockApi.mockResolvedValue({
        status: 'success',
        company_id: 'test-company-id'
      })

      const result = await companyInit.initializeCompany('test@email.com')

      expect(result).toEqual({
        status: 'success',
        company_id: 'test-company-id'
      })
      expect(mockApi).toHaveBeenCalledTimes(1)
      expect(mockFetchProfile).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure with exponential backoff', async () => {
      mockApi
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValue({
          status: 'success',
          company_id: 'test-company-id'
        })

      const promise = companyInit.initializeCompany('test@email.com', 3)

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(1000) // First retry delay
      await vi.advanceTimersByTimeAsync(2000) // Second retry delay

      const result = await promise

      expect(result).toEqual({
        status: 'success',
        company_id: 'test-company-id'
      })
      expect(mockApi).toHaveBeenCalledTimes(3)
    })

    it('should return null after max retries', async () => {
      mockApi.mockRejectedValue(new Error('API Error'))

      const promise = companyInit.initializeCompany('test@email.com', 2)

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(1000) // First retry delay

      const result = await promise

      expect(result).toBeNull()
      expect(mockApi).toHaveBeenCalledTimes(2)
    })

    it('should handle missing token gracefully', async () => {
      // Override the auth store mock with null token
      vi.stubGlobal('useAuthStore', () => ({
        token: null,
        fetchProfile: vi.fn()
      }))

      // Re-initialize the composable with the new mock
      companyInit = useCompanyInitialization()

      const result = await companyInit.initializeCompany('test@email.com', 1)

      expect(result).toBeNull()
    })
  })
})
