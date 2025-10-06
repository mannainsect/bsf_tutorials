import type {
  GetCreditsResponse,
  GetCreditBalanceResponse,
  GetCreditTransactionsResponse,
  GetCreditsRequest,
  CreateCreditTransactionRequest,
  CreditTransaction
} from '../../../../shared/types'
import { BaseRepository } from './BaseRepository'

export class CreditRepository extends BaseRepository {
  /**
   * Get credits log for a user
   */
  async getCredits(
    params: GetCreditsRequest = {}
  ): Promise<GetCreditsResponse> {
    const endpoints = useApiEndpoints()
    const {
      user_id,
      transaction_type,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = params

    const query = this.buildPaginationQuery(page, limit, {
      ...(user_id && { user_id }),
      ...(transaction_type && { transaction_type }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date })
    })

    return this.get<GetCreditsResponse>(endpoints.logsCredits, query)
  }

  /**
   * Get credits log for current user
   * GET /logs/credits/{user_id} with authorization header
   */
  async getCurrentUserCredits(): Promise<GetCreditsResponse> {
    const endpoints = useApiEndpoints()
    const authStore = useAuthStore()

    const userId = authStore.userId
    if (!userId) {
      throw new Error('User not authenticated - unable to get user ID')
    }

    // The endpoint requires authorization header which is already handled by BaseRepository
    return this.get<GetCreditsResponse>(`${endpoints.logsCredits}/${userId}`)
  }

  /**
   * Get current user's credit balance
   */
  async getCreditBalance(): Promise<GetCreditBalanceResponse> {
    const endpoints = useApiEndpoints()
    return this.get<GetCreditBalanceResponse>(
      `${endpoints.logsCredits}/balance`
    )
  }

  /**
   * Get credit transactions for current user
   */
  async getCreditTransactions(
    params: GetCreditsRequest = {}
  ): Promise<GetCreditTransactionsResponse> {
    const endpoints = useApiEndpoints()
    const {
      transaction_type,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = params

    const query = this.buildPaginationQuery(page, limit, {
      ...(transaction_type && { transaction_type }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date })
    })

    return this.get<GetCreditTransactionsResponse>(
      endpoints.logsCredits,
      query
    )
  }

  /**
   * Create a new credit transaction (admin only)
   */
  async createCreditTransaction(
    transactionData: CreateCreditTransactionRequest
  ): Promise<CreditTransaction> {
    const endpoints = useApiEndpoints()
    return this.post<CreditTransaction>(
      `${endpoints.logsCredits}/transactions`,
      transactionData
    )
  }
}
