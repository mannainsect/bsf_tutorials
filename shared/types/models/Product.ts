// Product-related types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  credits_price?: number
  category: string
  type: 'content' | 'playlist' | 'tool' | 'subscription'
  status: 'active' | 'inactive' | 'draft'
  features?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// PurchasedProduct interface that matches /profiles/me endpoint
export interface PurchasedProduct {
  product_name: string
  product_type: string
  product: string // MongoDB ObjectId reference
  expires_at: string // ISO datetime string
  
  // Legacy fields for backward compatibility
  id?: string
  user_id?: string
  product_id?: string
  purchase_price?: number
  credits_used?: number
  purchase_method?: 'credits' | 'payment' | 'subscription'
  status?: 'active' | 'expired' | 'cancelled'
  purchase_date?: string
  created_at?: string
  updated_at?: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  slug: string
  parent_id?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductPurchase {
  product_id: string
  user_id: string
  payment_method: 'credits' | 'payment'
  amount?: number
  credits_amount?: number
}