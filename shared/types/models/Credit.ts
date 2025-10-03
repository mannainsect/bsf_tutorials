// Credit-related types
export interface Credit {
  id: string
  user_id: string
  amount: number
  transaction_type: 'earned' | 'spent' | 'refunded' | 'purchased'
  description: string
  reference_id?: string
  reference_type?: string
  created_at: string
  updated_at: string
}

export interface CreditBalance {
  user_id: string
  current_balance: number
  total_earned: number
  total_spent: number
  last_updated: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  transaction_type: 'earned' | 'spent' | 'refunded' | 'purchased'
  description: string
  reference_id?: string
  reference_type?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}