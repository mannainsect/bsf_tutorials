import type { ApiResponse, PaginatedResponse } from './common.types'
import type { Product, PurchasedProduct, ProductCategory, ProductPurchase } from '../models/Product'

// Product API response types
export type GetProductsResponse = PaginatedResponse<Product>

export type GetProductResponse = ApiResponse<Product>

export type GetPurchasedProductsResponse = PaginatedResponse<PurchasedProduct>

export type GetProductCategoriesResponse = PaginatedResponse<ProductCategory>

export type PurchaseProductResponse = ApiResponse<PurchasedProduct>

// Product API request types
export interface GetProductsRequest {
  category?: string
  type?: 'content' | 'playlist' | 'tool' | 'subscription'
  status?: 'active' | 'inactive' | 'draft'
  search?: string
  page?: number
  limit?: number
}

export interface GetPurchasedProductsRequest {
  user_id?: string
  status?: 'active' | 'expired' | 'cancelled'
  type?: 'content' | 'playlist' | 'tool' | 'subscription'
  page?: number
  limit?: number
}

export type PurchaseProductRequest = ProductPurchase