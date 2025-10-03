import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, computed, watch, onUnmounted, readonly, reactive } from 'vue'
import { useMessaging } from '~/composables/useMessaging'
import {
  mockConversations,
  mockConversationsListResponse,
  mockContactProductResponse,
  mockMessageSendResponse,
  mockRateLimitError,
  createLongMessage,
  xssTestStrings,
  sanitizedXssStrings
} from '../../fixtures/messaging'
const mockGetConversations = vi.fn()
const mockSendInitialMessage = vi.fn()
const mockSendFollowUpMessage = vi.fn()
vi.mock('~/composables/api/repositories/MessagingRepository', () => {
  return {
    MessagingRepository: class {
      getConversations = mockGetConversations
      sendInitialMessage = mockSendInitialMessage
      sendFollowUpMessage = mockSendFollowUpMessage
    }
  }
})
global.ref = ref
global.computed = computed
global.reactive = reactive
global.watch = watch
global.onUnmounted = vi.fn((fn) => fn())
global.readonly = readonly
const mockAuthStore = reactive({
  token: 'test-token',
  isAuthenticated: true,
  companyId: 'test-company-123'
})
global.useAuthStore = vi.fn(() => mockAuthStore)
global.useApiEndpoints = vi.fn(() => ({
  marketContact: '/market/contact',
  marketConversations: '/market/conversations'
}))
describe('useMessaging', () => {
  let composable: ReturnType<typeof useMessaging>
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.companyId = 'test-company-123'
    composable = useMessaging()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  describe('Initial State', () => {
    it('should initialize with empty conversations', () => {
      expect(composable.conversations.value).toEqual([])
    })
    it('should initialize with null current conversation', () => {
      expect(composable.currentConversation.value).toBeNull()
    })
    it('should initialize with false loading state', () => {
      expect(composable.isLoading.value).toBe(false)
    })
    it('should initialize with false sending state', () => {
      expect(composable.isSending.value).toBe(false)
    })
    it('should initialize with null error', () => {
      expect(composable.error.value).toBeNull()
    })
    it('should provide isAuthenticated computed property', () => {
      expect(composable.isAuthenticated.value).toBe(true)
      mockAuthStore.isAuthenticated = false
      expect(composable.isAuthenticated.value).toBe(false)
    })
  })
  describe('fetchConversations', () => {
    it('should fetch conversations successfully', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledWith('test-company-123')
      expect(composable.conversations.value).toEqual(mockConversations)
      expect(composable.error.value).toBeNull()
      expect(composable.isLoading.value).toBe(false)
    })
    it('should set loading state while fetching', async () => {
      mockGetConversations.mockImplementation(
        () => new Promise(resolve => setTimeout(
          () => resolve(mockConversationsListResponse), 100
        ))
      )
      const promise = composable.fetchConversations()
      expect(composable.isLoading.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(composable.isLoading.value).toBe(false)
    })
    it('should handle error when company ID is missing', async () => {
      mockAuthStore.companyId = null
      await composable.fetchConversations()
      expect(mockGetConversations).not.toHaveBeenCalled()
      expect(composable.error.value?.message)
        .toBe('No company ID found in user profile')
    })
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error')
      mockGetConversations.mockRejectedValue(error)
      await composable.fetchConversations()
      expect(composable.error.value).toEqual(error)
      expect(composable.isLoading.value).toBe(false)
    })
    it('should handle rate limit errors with custom message', async () => {
      mockGetConversations.mockRejectedValue(mockRateLimitError)
      await composable.fetchConversations()
      expect(composable.error.value?.message)
        .toBe('Too many requests. Please wait and try again.')
    })
    it('should use cache for subsequent calls within TTL', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      expect(composable.conversations.value).toEqual(mockConversations)
    })
    it('should bypass cache when forceRefresh is true', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      await composable.fetchConversations(true)
      expect(mockGetConversations).toHaveBeenCalledTimes(2)
    })
    it('should invalidate cache after TTL expires', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(2)
    })
  })
  describe('sendInitialMessage', () => {
    it('should send initial message successfully', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const result = await composable.sendInitialMessage(
        'product-123',
        'Test message',
        'seller-company-123',
        false
      )
      expect(result).toEqual(mockContactProductResponse)
      expect(mockSendInitialMessage).toHaveBeenCalledWith({
        product_id: 'product-123',
        company_id: 'seller-company-123',
        buyer_company_id: 'test-company-123',
        product_owner: false,
        message: 'Test message'
      })
      expect(composable.error.value).toBeNull()
      expect(composable.isSending.value).toBe(false)
    })
    it('should set sending state while sending', async () => {
      mockSendInitialMessage.mockImplementation(
        () => new Promise(resolve => setTimeout(
          () => resolve(mockContactProductResponse), 100
        ))
      )
      const promise = composable.sendInitialMessage(
        'product-123',
        'Test message',
        'seller-company-123',
        false
      )
      expect(composable.isSending.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(composable.isSending.value).toBe(false)
    })
    it('should validate company ID before sending', async () => {
      mockAuthStore.companyId = null
      const result = await composable.sendInitialMessage(
        'product-123',
        'Test message',
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('No company ID found in user profile')
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should validate product ID is provided', async () => {
      const result = await composable.sendInitialMessage(
        '',
        'Test message',
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message).toBe('Product ID is required')
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should validate message is not empty', async () => {
      const result = await composable.sendInitialMessage(
        'product-123',
        '',
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message).toBe('Message cannot be empty')
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should validate seller company ID is provided', async () => {
      const result = await composable.sendInitialMessage(
        'product-123',
        'Test message',
        '',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('Seller company ID is required')
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should validate message is not just whitespace', async () => {
      const result = await composable.sendInitialMessage(
        'product-123',
        '   ',
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message).toBe('Message cannot be empty')
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should validate message does not exceed 1000 characters', async () => {
      const longMessage = createLongMessage(1001)
      const result = await composable.sendInitialMessage(
        'product-123',
        longMessage,
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('Message exceeds 1000 characters')
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should trim message before sending', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      await composable.sendInitialMessage(
        'product-123',
        '  Test message  ',
        'seller-company-123',
        false
      )
      expect(mockSendInitialMessage).toHaveBeenCalledWith({
        product_id: 'product-123',
        company_id: 'seller-company-123',
        buyer_company_id: 'test-company-123',
        product_owner: false,
        message: 'Test message'
      })
    })
    it('should sanitize XSS attempts in messages', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      for (let i = 0; i < xssTestStrings.length; i++) {
        vi.clearAllMocks()
        await composable.sendInitialMessage(
          'product-123',
          xssTestStrings[i],
          'seller-company-123',
          false
        )
        expect(mockSendInitialMessage).toHaveBeenCalledWith({
          product_id: 'product-123',
          company_id: 'seller-company-123',
          buyer_company_id: 'test-company-123',
          product_owner: false,
          message: sanitizedXssStrings[i]
        })
      }
    })
    it('should invalidate cache after successful send', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      await composable.sendInitialMessage(
        'product-123',
        'Test message',
        'seller-company-123',
        false
      )
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(2)
    })
    it('should handle API errors gracefully', async () => {
      const error = new Error('Failed to send')
      mockSendInitialMessage.mockRejectedValue(error)
      const result = await composable.sendInitialMessage(
        'product-123',
        'Test message',
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value).toEqual(error)
      expect(composable.isSending.value).toBe(false)
    })
    it('should handle rate limit errors with custom message', async () => {
      mockSendInitialMessage.mockRejectedValue(mockRateLimitError)
      const result = await composable.sendInitialMessage(
        'product-123',
        'Test message',
        'seller-company-123',
        false
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('Too many requests. Please wait and try again.')
    })
  })
  describe('sendFollowUpMessage', () => {
    it('should send follow-up message successfully', async () => {
      mockSendFollowUpMessage.mockResolvedValue(mockContactProductResponse)
      const result = await composable.sendFollowUpMessage(
        mockConversations[0],
        'Follow-up message'
      )
      expect(result).toEqual(mockContactProductResponse)
      expect(mockSendFollowUpMessage).toHaveBeenCalledWith(
        mockConversations[0],
        'Follow-up message',
        'test-company-123'
      )
      expect(composable.error.value).toBeNull()
      expect(composable.isSending.value).toBe(false)
    })
    it('should validate conversation is provided', async () => {
      const result = await composable.sendFollowUpMessage(null, 'Test message')
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('Conversation is required')
      expect(mockSendFollowUpMessage).not.toHaveBeenCalled()
    })
    it('should validate message is not empty', async () => {
      const result = await composable.sendFollowUpMessage(
        mockConversations[0],
        ''
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message).toBe('Message cannot be empty')
      expect(mockSendFollowUpMessage).not.toHaveBeenCalled()
    })
    it('should validate message does not exceed 1000 characters', async () => {
      const longMessage = createLongMessage(1001)
      const result = await composable.sendFollowUpMessage(
        mockConversations[0],
        longMessage
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('Message exceeds 1000 characters')
      expect(mockSendFollowUpMessage).not.toHaveBeenCalled()
    })
    it('should sanitize XSS attempts in follow-up messages', async () => {
      mockSendFollowUpMessage.mockResolvedValue(mockContactProductResponse)
      for (let i = 0; i < xssTestStrings.length; i++) {
        vi.clearAllMocks()
        await composable.sendFollowUpMessage(
          mockConversations[0],
          xssTestStrings[i]
        )
        expect(mockSendFollowUpMessage).toHaveBeenCalledWith(
          mockConversations[0],
          sanitizedXssStrings[i],
          'test-company-123'
        )
      }
    })
    it('should invalidate cache after successful send', async () => {
      mockSendFollowUpMessage.mockResolvedValue(mockMessageSendResponse)
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      await composable.sendFollowUpMessage(
        mockConversations[0],
        'Follow-up'
      )
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(2)
    })
    it('should handle API errors gracefully', async () => {
      const error = new Error('Failed to send follow-up')
      mockSendFollowUpMessage.mockRejectedValue(error)
      const result = await composable.sendFollowUpMessage(
        mockConversations[0],
        'Follow-up'
      )
      expect(result).toBeNull()
      expect(composable.error.value).toEqual(error)
      expect(composable.isSending.value).toBe(false)
    })
    it('should handle rate limit errors with custom message', async () => {
      mockSendFollowUpMessage.mockRejectedValue(mockRateLimitError)
      const result = await composable.sendFollowUpMessage(
        mockConversations[0],
        'Follow-up'
      )
      expect(result).toBeNull()
      expect(composable.error.value?.message)
        .toBe('Too many requests. Please wait and try again.')
    })
  })
  describe('clearCache', () => {
    it('should clear conversation cache', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      composable.clearCache()
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(2)
    })
  })
  describe('clearError', () => {
    it('should clear error state', async () => {
      mockAuthStore.companyId = null
      await composable.fetchConversations()
      expect(composable.error.value).not.toBeNull()
      composable.clearError()
      expect(composable.error.value).toBeNull()
    })
  })
  describe('Authentication State Changes', () => {
    it('should clear data when user logs out', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(composable.conversations.value).toEqual(mockConversations)
      mockAuthStore.isAuthenticated = false
      await vi.advanceTimersByTimeAsync(0)
      expect(composable.conversations.value).toEqual([])
      expect(composable.currentConversation.value).toBeNull()
      expect(composable.error.value).toBeNull()
    })
    it('should clear cache when authentication changes', async () => {
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(1)
      mockAuthStore.isAuthenticated = false
      await vi.advanceTimersByTimeAsync(0)
      mockAuthStore.isAuthenticated = true
      await vi.advanceTimersByTimeAsync(0)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledTimes(2)
    })
  })
  describe('XSS Sanitization', () => {
    it('should properly sanitize HTML entities', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const htmlMessage = 'Hello & goodbye < > " \' test'
      await composable.sendInitialMessage(
        'product-123',
        htmlMessage,
        'seller-company-123',
        false
      )
      expect(mockSendInitialMessage).toHaveBeenCalledWith({
        product_id: 'product-123',
        company_id: 'seller-company-123',
        buyer_company_id: 'test-company-123',
        product_owner: false,
        message: 'Hello &amp; goodbye &lt; &gt; " \' test'
      })
    })
    it('should handle unicode characters correctly', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const unicodeMessage = 'Hello 世界 🌍 émoji'
      await composable.sendInitialMessage(
        'product-123',
        unicodeMessage,
        'seller-company-123',
        false
      )
      expect(mockSendInitialMessage).toHaveBeenCalledWith({
        product_id: 'product-123',
        company_id: 'seller-company-123',
        buyer_company_id: 'test-company-123',
        product_owner: false,
        message: 'Hello 世界 🌍 émoji'
      })
    })
  })
  describe('Edge Cases', () => {
    it('should handle exactly 1000 character message', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const message = createLongMessage(1000)
      const result = await composable.sendInitialMessage(
        'product-123',
        message,
        'seller-company-123',
        false
      )
      expect(result).toEqual(mockContactProductResponse)
      expect(mockSendInitialMessage).toHaveBeenCalled()
    })
    it('should handle rapid consecutive calls correctly', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const promises = [
        composable.sendInitialMessage(
          'product-1',
          'Message 1',
          'seller-1',
          false
        ),
        composable.sendInitialMessage(
          'product-2',
          'Message 2',
          'seller-2',
          false
        ),
        composable.sendInitialMessage(
          'product-3',
          'Message 3',
          'seller-3',
          false
        )
      ]
      const results = await Promise.all(promises)
      expect(results).toEqual([
        mockContactProductResponse,
        mockContactProductResponse,
        mockContactProductResponse
      ])
      expect(mockSendInitialMessage).toHaveBeenCalledTimes(3)
    })
    it('should handle company ID as number', async () => {
      mockAuthStore.companyId = 12345 as any
      mockGetConversations.mockResolvedValue(mockConversationsListResponse)
      await composable.fetchConversations()
      expect(mockGetConversations).toHaveBeenCalledWith('12345')
    })
  })
})