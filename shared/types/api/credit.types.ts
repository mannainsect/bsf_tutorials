import type { ApiResponse, PaginatedResponse } from './common.types'
import type { Credit, CreditBalance, CreditTransaction } from '../models/Credit'

// Credit API response types
export type GetCreditsResponse = PaginatedResponse<Credit>

export type GetCreditBalanceResponse = ApiResponse<CreditBalance>

export type GetCreditTransactionsResponse = PaginatedResponse<CreditTransaction>

// Credit API request types
export interface GetCreditsRequest {
  user_id?: string
  transaction_type?: 'earned' | 'spent' | 'refunded' | 'purchased'
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface CreateCreditTransactionRequest {
  user_id: string
  amount: number
  transaction_type: 'earned' | 'spent' | 'refunded' | 'purchased'
  description: string
  reference_id?: string
  reference_type?: string
}