import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MessagingRepository
} from '~/composables/api/repositories/MessagingRepository'
import {
  mockConversations,
  mockConversationsListResponse,
  mockEmptyConversationsListResponse,
  mockContactRequest,
  mockContactProductResponse,
  mockMessageSendResponse,
  mockRateLimitError,
  mockAuthError,
  mockForbiddenError,
  mockNotFoundError,
  mockNetworkError
} from '../../fixtures/messaging'
const mockApi = vi.fn()
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    api: mockApi
  }))
}))
const createMockAuthStore = () => ({
  token: 'test-token',
  isAuthenticated: true,
  companyId: 'test-company-123'
})
const mockAuthStore = createMockAuthStore()
global.useAuthStore = vi.fn(() => mockAuthStore)
global.useApi = vi.fn(() => ({ api: mockApi }))
global.useApiEndpoints = vi.fn(() => ({
  marketContact: '/market/contact',
  marketConversations: '/market/conversations'
}))
describe('MessagingRepository', () => {
  let repository: MessagingRepository
  beforeEach(() => {
    mockAuthStore.token = 'test-token'
    mockAuthStore.isAuthenticated = true
    mockAuthStore.companyId = 'test-company-123'
    repository = new MessagingRepository()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })
  describe('getConversations', () => {
    it('should fetch conversations successfully', async () => {
      vi.spyOn(repository as any, 'get').mockResolvedValue(
        mockConversations
      )
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual(mockConversationsListResponse)
      expect(repository.get).toHaveBeenCalledWith(
        '/market/contact',
        { company_id: 'test-company-123' }
      )
    })
    it('should handle empty conversations list', async () => {
      vi.spyOn(repository as any, 'get').mockResolvedValue([])
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual(mockEmptyConversationsListResponse)
    })
    it('should handle non-array response gracefully', async () => {
      vi.spyOn(repository as any, 'get').mockResolvedValue(null)
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual({
        conversations: [],
        total: 0,
        page: 1,
        limit: 100
      })
    })
    it('should handle 401 authentication error', async () => {
      vi.spyOn(repository as any, 'get').mockRejectedValue(mockAuthError)
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual(mockEmptyConversationsListResponse)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch conversations:',
        mockAuthError
      )
    })
    it('should handle 403 forbidden error', async () => {
      vi.spyOn(repository as any, 'get').mockRejectedValue(mockForbiddenError)
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual(mockEmptyConversationsListResponse)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch conversations:',
        mockForbiddenError
      )
    })
    it('should handle 404 not found error', async () => {
      vi.spyOn(repository as any, 'get').mockRejectedValue(mockNotFoundError)
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual(mockEmptyConversationsListResponse)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch conversations:',
        mockNotFoundError
      )
    })
    it('should retry on 429 rate limit error with exponential backoff', async () => {
      const getSpy = vi.spyOn(repository as any, 'get')
      getSpy.mockRejectedValueOnce(mockRateLimitError)
      getSpy.mockRejectedValueOnce(mockRateLimitError)
      getSpy.mockResolvedValueOnce(mockConversations)
      vi.useFakeTimers()
      const promise = repository.getConversations('test-company-123')
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      const result = await promise
      vi.useRealTimers()
      expect(result).toEqual(mockConversationsListResponse)
      expect(getSpy).toHaveBeenCalledTimes(3)
    })
    it('should throw after max retries on 429 rate limit', async () => {
      vi.spyOn(repository as any, 'get').mockRejectedValue(mockRateLimitError)
      vi.useFakeTimers()
      const promise = repository.getConversations('test-company-123')
        .catch(e => e)
      await vi.runAllTimersAsync()
      const result = await promise
      expect(result).toEqual(mockRateLimitError)
      vi.useRealTimers()
      expect(repository.get).toHaveBeenCalledTimes(3)
    })
    it('should handle general network errors', async () => {
      vi.spyOn(repository as any, 'get').mockRejectedValue(mockNetworkError)
      const result = await repository.getConversations('test-company-123')
      expect(result).toEqual(mockEmptyConversationsListResponse)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch conversations:',
        mockNetworkError
      )
    })
  })
  describe('sendInitialMessage', () => {
    it('should send initial message successfully', async () => {
      vi.spyOn(repository as any, 'post').mockResolvedValue(
        mockContactProductResponse
      )
      const result = await repository.sendInitialMessage(mockContactRequest)
      expect(result).toEqual(mockContactProductResponse)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/contact',
        mockContactRequest
      )
    })
    it('should retry on 429 rate limit error', async () => {
      const postSpy = vi.spyOn(repository as any, 'post')
      postSpy.mockRejectedValueOnce(mockRateLimitError)
      postSpy.mockResolvedValueOnce(mockContactProductResponse)
      vi.useFakeTimers()
      const promise = repository.sendInitialMessage(mockContactRequest)
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise
      vi.useRealTimers()
      expect(result).toEqual(mockContactProductResponse)
      expect(postSpy).toHaveBeenCalledTimes(2)
    })
    it('should throw error for non-rate-limit errors', async () => {
      vi.spyOn(repository as any, 'post').mockRejectedValue(mockAuthError)
      await expect(
        repository.sendInitialMessage(mockContactRequest)
      ).rejects.toThrow('Failed to send initial message')
    })
    it('should throw after max retries on persistent rate limit', async () => {
      vi.spyOn(repository as any, 'post').mockRejectedValue(mockRateLimitError)
      vi.useFakeTimers()
      const promise = repository.sendInitialMessage(mockContactRequest)
        .catch(e => e)
      await vi.runAllTimersAsync()
      const result = await promise
      expect(result).toEqual(mockRateLimitError)
      vi.useRealTimers()
      expect(repository.post).toHaveBeenCalledTimes(3)
    })
    it('should handle network errors properly', async () => {
      vi.spyOn(repository as any, 'post').mockRejectedValue(mockNetworkError)
      await expect(
        repository.sendInitialMessage(mockContactRequest)
      ).rejects.toThrow('Failed to send initial message')
    })
  })
  describe('sendFollowUpMessage', () => {
    const conversation = mockConversations[0]
    const message = 'This is a follow-up message'
    const currentCompanyId = 'test-company-123'
    it('should send follow-up message successfully', async () => {
      vi.spyOn(repository as any, 'post').mockResolvedValue(
        mockContactProductResponse
      )
      const result = await repository.sendFollowUpMessage(
        conversation,
        message,
        currentCompanyId
      )
      expect(result).toEqual(mockContactProductResponse)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/contact',
        {
          product_id: conversation.product_id,
          company_id: conversation.company_id,
          buyer_company_id: conversation.buyer_company_id,
          product_owner: true,
          message: message
        }
      )
    })
    it('should retry on 429 rate limit error', async () => {
      const postSpy = vi.spyOn(repository as any, 'post')
      postSpy.mockRejectedValueOnce(mockRateLimitError)
      postSpy.mockResolvedValueOnce(mockContactProductResponse)
      vi.useFakeTimers()
      const promise = repository.sendFollowUpMessage(conversation, message, currentCompanyId)
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise
      vi.useRealTimers()
      expect(result).toEqual(mockContactProductResponse)
      expect(postSpy).toHaveBeenCalledTimes(2)
    })
    it('should throw error for non-rate-limit errors', async () => {
      vi.spyOn(repository as any, 'post').mockRejectedValue(mockForbiddenError)
      await expect(
        repository.sendFollowUpMessage(conversation, message, currentCompanyId)
      ).rejects.toThrow('Failed to send follow-up message')
    })
    it('should throw after max retries on persistent rate limit', async () => {
      vi.spyOn(repository as any, 'post').mockRejectedValue(mockRateLimitError)
      vi.useFakeTimers()
      const promise = repository.sendFollowUpMessage(conversation, message, currentCompanyId)
        .catch(e => e)
      await vi.runAllTimersAsync()
      const result = await promise
      expect(result).toEqual(mockRateLimitError)
      vi.useRealTimers()
      expect(repository.post).toHaveBeenCalledTimes(3)
    })
    it('should construct correct request for follow-up messages', async () => {
      vi.spyOn(repository as any, 'post').mockResolvedValue(
        mockContactProductResponse
      )
      const buyerCompanyId = 'buyer-456'
      await repository.sendFollowUpMessage(conversation, 'Test message', buyerCompanyId)
      expect(repository.post).toHaveBeenCalledWith(
        '/market/contact',
        {
          product_id: conversation.product_id,
          company_id: conversation.company_id,
          buyer_company_id: conversation.buyer_company_id,
          product_owner: false,
          message: 'Test message'
        }
      )
    })
  })
  describe('retry mechanism', () => {
    it('should use exponential backoff for retries', async () => {
      const postSpy = vi.spyOn(repository as any, 'post')
      postSpy.mockRejectedValueOnce(mockRateLimitError)
      postSpy.mockRejectedValueOnce(mockRateLimitError)
      postSpy.mockResolvedValueOnce(mockContactProductResponse)
      vi.useFakeTimers()
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      const promise = repository.sendInitialMessage(mockContactRequest)
      await vi.advanceTimersByTimeAsync(1000)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
      await vi.advanceTimersByTimeAsync(2000)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
      await promise
      vi.useRealTimers()
      expect(postSpy).toHaveBeenCalledTimes(3)
    })
    it('should not retry non-429 errors', async () => {
      const postSpy = vi.spyOn(repository as any, 'post')
      postSpy.mockRejectedValueOnce(mockAuthError)
      await expect(
        repository.sendInitialMessage(mockContactRequest)
      ).rejects.toThrow('Failed to send initial message')
      expect(postSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('isRateLimitError', () => {
    it('should identify rate limit errors correctly', () => {
      expect((repository as any).isRateLimitError(mockRateLimitError))
        .toBe(true)
      expect((repository as any).isRateLimitError(mockAuthError))
        .toBe(false)
      expect((repository as any).isRateLimitError(mockForbiddenError))
        .toBe(false)
      expect((repository as any).isRateLimitError(mockNotFoundError))
        .toBe(false)
      expect((repository as any).isRateLimitError(mockNetworkError))
        .toBe(false)
      expect((repository as any).isRateLimitError(null))
        .toBe(false)
      expect((repository as any).isRateLimitError(undefined))
        .toBe(false)
      expect((repository as any).isRateLimitError('string'))
        .toBe(false)
    })
  })
})