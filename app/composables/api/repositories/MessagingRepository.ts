import type {
  Conversation,
  ContactRequest
} from '../../../../shared/types/models/Message'
import type {
  ConversationsListResponse,
  ContactProductResponse,
  MessageSendResponse
} from '../../../../shared/types/api/MessageResponses'
import { BaseRepository } from './BaseRepository'

export class MessagingRepository extends BaseRepository {
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        if (!this.isRateLimitError(error)) {
          throw error
        }

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  async getConversations(
    companyId: string
  ): Promise<ConversationsListResponse> {
    const endpoints = useApiEndpoints()

    return await this.retryWithBackoff(async () => {
      try {
        const response = await this.get<Conversation[]>(
          endpoints.marketContact,
          { company_id: companyId }
        )

        return {
          conversations: Array.isArray(response) ? response : [],
          total: Array.isArray(response) ? response.length : 0,
          page: 1,
          limit: 100
        }
      } catch (error) {
        if (this.isRateLimitError(error)) {
          throw error
        }

        console.error('Failed to fetch conversations:', error)
        return {
          conversations: [],
          total: 0,
          page: 1,
          limit: 100
        }
      }
    })
  }

  async sendInitialMessage(
    request: ContactRequest
  ): Promise<ContactProductResponse> {
    const endpoints = useApiEndpoints()

    return await this.retryWithBackoff(async () => {
      try {
        return await this.post<ContactProductResponse>(
          endpoints.marketContact,
          request
        )
      } catch (error) {
        if (this.isRateLimitError(error)) {
          throw error
        }

        const msg = 'Failed to send initial message'
        throw new Error(msg)
      }
    })
  }

  async sendFollowUpMessage(
    conversation: Conversation,
    message: string,
    currentCompanyId: string
  ): Promise<ContactProductResponse> {
    const endpoints = useApiEndpoints()

    return await this.retryWithBackoff(async () => {
      try {
        // Determine if current user is the product owner
        const isOwner = currentCompanyId === conversation.company_id

        const request: ContactRequest = {
          product_id: conversation.product_id,
          company_id: conversation.company_id,
          buyer_company_id: conversation.buyer_company_id,
          product_owner: isOwner,
          message: message
        }

        return await this.post<ContactProductResponse>(
          endpoints.marketContact,
          request
        )
      } catch (error) {
        if (this.isRateLimitError(error)) {
          throw error
        }

        const msg = 'Failed to send follow-up message'
        throw new Error(msg)
      }
    })
  }
}