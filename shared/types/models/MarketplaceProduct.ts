// Marketplace Product types matching backend response formats

// Base public fields for list view
export interface ProductPublicListing {
  id: string
  title: string
  category: string
  subcategory: string
  description: string
  price: number
  price_currency: string
  quantity: number
  quantity_unit: string
  countries: string[]
  image_urls: string[]
  additional_info: Record<string, any>
  company_name: string
  created_at: string
}

// Authenticated list view - adds private fields
export interface Product extends ProductPublicListing {
  company_id?: string
  active?: boolean
}

// Public detail view - includes company_id and active status
export interface ProductPublicDetail extends ProductPublicListing {
  company_id?: string
  active?: boolean
}

// Authenticated detail view - adds user fields
export interface ProductAuthenticated extends ProductPublicDetail {
  // Add auth fields when backend provides them
}

// Response type for marketplace products list
export interface MarketplaceProductsResponse {
  items: Product[] | ProductPublicListing[]
  total?: number
  page?: number
  limit?: number
}

// Type guards for checking field availability
export function isAuthenticatedProduct(
  product: ProductPublicListing | Product
): product is Product {
  return 'company_id' in product || 'active' in product
}

export function isProductPublicDetail(
  product: ProductPublicListing | ProductPublicDetail
): product is ProductPublicDetail {
  return 'company_id' in product && 'active' in product
}

export function isProductAuthenticated(
  product: ProductPublicDetail | ProductAuthenticated
): product is ProductAuthenticated {
  // Update when backend provides auth fields
  return false
}

// Request parameters for fetching products
export interface GetMarketplaceProductsRequest {
  category?: string
  subcategory?: string
  company_id?: string
  limit?: number
  offset?: number
  search?: string
}

// Request parameters for product detail
export interface GetMarketplaceProductDetailRequest {
  productId: string
}