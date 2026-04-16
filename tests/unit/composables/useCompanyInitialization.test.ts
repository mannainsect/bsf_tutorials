import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCompanyInitialization } from '~/composables/useCompanyInitialization'

const mockCreateCompanyWithSpaces = vi.fn()

vi.mock('~/composables/api/repositories/CompanyRepository', () => ({
  CompanyRepository: vi.fn().mockImplementation(() => ({
    createCompanyWithSpaces: mockCreateCompanyWithSpaces
  }))
}))

describe('useCompanyInitialization', () => {
  let companyInit: ReturnType<typeof useCompanyInitialization>
  let mockFetchProfile: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetchProfile = vi.fn()

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
      expect(companyInit.extractNameFromEmail('invalid')).toBe("Invalid's Farm")
      expect(companyInit.extractNameFromEmail('@')).toBe("User's Farm")
    })
  })

  describe('createCompanyWithSpaces', () => {
    it('should delegate to CompanyRepository with data object', async () => {
      mockCreateCompanyWithSpaces.mockResolvedValue({
        status: 'success',
        company_id: 'test-company-id',
        created_spaces: ['space1', 'space2', 'space3']
      })

      const result = await companyInit.createCompanyWithSpaces('test.user@email.com')

      // New signature: only data, no token
      expect(mockCreateCompanyWithSpaces).toHaveBeenCalledWith({
        name: "Test User's Farm",
        city: 'Helsinki',
        country: 'FI',
        timezone: 'Europe/Helsinki'
      })

      expect(result).toEqual({
        status: 'success',
        company_id: 'test-company-id',
        created_spaces: ['space1', 'space2', 'space3']
      })
    })

    it('should not pass token as a parameter', async () => {
      mockCreateCompanyWithSpaces.mockResolvedValue({
        status: 'success'
      })

      await companyInit.createCompanyWithSpaces('test@email.com')

      // createCompanyWithSpaces on repo takes only data, no token
      const callArgs = mockCreateCompanyWithSpaces.mock.calls[0]
      expect(callArgs).toHaveLength(1)
      expect(callArgs[0]).not.toHaveProperty('token')
    })

    it('should handle API errors', async () => {
      mockCreateCompanyWithSpaces.mockRejectedValue(new Error('API Error'))

      await expect(companyInit.createCompanyWithSpaces('test@email.com')).rejects.toThrow(
        'API Error'
      )
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
      mockCreateCompanyWithSpaces.mockResolvedValue({
        status: 'success',
        company_id: 'test-company-id'
      })

      const result = await companyInit.initializeCompany('test@email.com')

      expect(result).toEqual({
        status: 'success',
        company_id: 'test-company-id'
      })
      expect(mockCreateCompanyWithSpaces).toHaveBeenCalledTimes(1)
      expect(mockFetchProfile).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure with exponential backoff', async () => {
      mockCreateCompanyWithSpaces
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValue({
          status: 'success',
          company_id: 'test-company-id'
        })

      const promise = companyInit.initializeCompany('test@email.com', 3)

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)

      const result = await promise

      expect(result).toEqual({
        status: 'success',
        company_id: 'test-company-id'
      })
      expect(mockCreateCompanyWithSpaces).toHaveBeenCalledTimes(3)
    })

    it('should return null after max retries', async () => {
      mockCreateCompanyWithSpaces.mockRejectedValue(new Error('API Error'))

      const promise = companyInit.initializeCompany('test@email.com', 2)

      await vi.advanceTimersByTimeAsync(1000)

      const result = await promise

      expect(result).toBeNull()
      expect(mockCreateCompanyWithSpaces).toHaveBeenCalledTimes(2)
    })

    it('should handle missing token gracefully', async () => {
      vi.stubGlobal('useAuthStore', () => ({
        token: null,
        fetchProfile: vi.fn()
      }))

      companyInit = useCompanyInitialization()

      const result = await companyInit.initializeCompany('test@email.com', 1)

      expect(result).toBeNull()
    })
  })
})
