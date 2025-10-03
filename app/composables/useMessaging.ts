import { onUnmounted } from 'vue'
import { MessagingRepository } from './api/repositories/MessagingRepository'
import type {
  Conversation,
  ContactRequest
} from '../../shared/types/models/Message'
import type {
  ConversationsListResponse,
  ContactProductResponse,
  MessageSendResponse
} from '../../shared/types/api/MessageResponses'

export const useMessaging = () => {
  const authStore = useAuthStore()
  const repository = new MessagingRepository()

  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isSending = ref(false)

  const conversationsCache = ref<ConversationsListResponse | null>(null)
  const cacheTimestamp = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000

  const isCacheValid = () => {
    return Date.now() - cacheTimestamp.value < CACHE_DURATION
  }

  const sanitizeMessage = (message: string): string => {
    const div = document.createElement('div')
    div.textContent = message
    return div.innerHTML
  }

  const validateCompanyId = (): string | null => {
    const companyId = authStore.companyId
    if (!companyId) {
      const msg = 'No company ID found in user profile'
      error.value = new Error(msg)
      return null
    }
    return String(companyId)
  }

  const fetchConversations = async (
    forceRefresh = false
  ): Promise<void> => {
    const companyId = validateCompanyId()
    if (!companyId) return

    if (!forceRefresh && isCacheValid() && conversationsCache.value) {
      conversations.value = conversationsCache.value.conversations
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await repository.getConversations(companyId)
      conversations.value = response.conversations || []
      conversationsCache.value = response
      cacheTimestamp.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error('Failed to fetch conversations')

      if (err && typeof err === 'object' &&
          'statusCode' in err && err.statusCode === 429) {
        const msg = 'Too many requests. Please wait and try again.'
        error.value = new Error(msg)
      }
    } finally {
      isLoading.value = false
    }
  }

  const sendInitialMessage = async (
    productId: string,
    message: string,
    sellerCompanyId: string,
    isProductOwner: boolean = false
  ): Promise<ContactProductResponse | null> => {
    const buyerCompanyId = validateCompanyId()
    if (!buyerCompanyId) return null

    if (!productId) {
      error.value = new Error('Product ID is required')
      return null
    }

    if (!sellerCompanyId) {
      error.value = new Error('Seller company ID is required')
      return null
    }

    if (!message || message.trim().length === 0) {
      error.value = new Error('Message cannot be empty')
      return null
    }

    if (message.length > 1000) {
      error.value = new Error('Message exceeds 1000 characters')
      return null
    }

    isSending.value = true
    error.value = null

    try {
      const sanitizedMessage = sanitizeMessage(message.trim())

      const request: ContactRequest = {
        product_id: productId,
        company_id: sellerCompanyId,
        buyer_company_id: buyerCompanyId,
        product_owner: isProductOwner,
        message: sanitizedMessage
      }

      const response = await repository.sendInitialMessage(request)

      conversationsCache.value = null
      cacheTimestamp.value = 0

      return response
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error('Failed to send message')

      if (err && typeof err === 'object' &&
          'statusCode' in err && err.statusCode === 429) {
        const msg = 'Too many requests. Please wait and try again.'
        error.value = new Error(msg)
      }

      return null
    } finally {
      isSending.value = false
    }
  }

  const sendFollowUpMessage = async (
    conversation: Conversation,
    message: string
  ): Promise<ContactProductResponse | null> => {
    const companyId = validateCompanyId()
    if (!companyId) return null

    if (!conversation) {
      error.value = new Error('Conversation is required')
      return null
    }

    if (!message || message.trim().length === 0) {
      error.value = new Error('Message cannot be empty')
      return null
    }

    if (message.length > 1000) {
      error.value = new Error('Message exceeds 1000 characters')
      return null
    }

    isSending.value = true
    error.value = null

    try {
      const sanitizedMessage = sanitizeMessage(message.trim())

      const response = await repository.sendFollowUpMessage(
        conversation,
        sanitizedMessage,
        companyId
      )

      conversationsCache.value = null
      cacheTimestamp.value = 0

      return response
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error('Failed to send message')

      if (err && typeof err === 'object' &&
          'statusCode' in err && err.statusCode === 429) {
        const msg = 'Too many requests. Please wait and try again.'
        error.value = new Error(msg)
      }

      return null
    } finally {
      isSending.value = false
    }
  }

  const clearCache = () => {
    conversationsCache.value = null
    cacheTimestamp.value = 0
  }

  const clearError = () => {
    error.value = null
  }

  const stopWatcher = watch(() => authStore.isAuthenticated, () => {
    clearCache()
    conversations.value = []
    currentConversation.value = null
    error.value = null
  })

  onUnmounted(() => {
    stopWatcher()
  })

  return {
    conversations: readonly(conversations),
    currentConversation: readonly(currentConversation),
    isLoading: readonly(isLoading),
    isSending: readonly(isSending),
    error: readonly(error),

    fetchConversations,
    sendInitialMessage,
    sendFollowUpMessage,
    clearCache,
    clearError,

    isAuthenticated: computed(() => authStore.isAuthenticated)
  }
}