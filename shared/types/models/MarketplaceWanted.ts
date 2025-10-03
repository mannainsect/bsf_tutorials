export interface WantedPublicListing {
  id: string
  title: string
  category: string
  subcategory: string
  description: string
  countries: string[]
  additional_info: string | Record<string, any>
  company_name: string
  created_at: string
  active?: boolean
  budget_min?: number | null
  budget_max?: number | null
  budget_currency?: string | null
  quantity_needed?: number | null
  quantity_unit?: string | null
  image_urls?: string[]
  expires_at?: string | null
}

export interface Wanted extends WantedPublicListing {
  company_id: string
  active: boolean
  user_id?: string
  contact_email?: string
}

export interface WantedPublicDetail extends WantedPublicListing {
  company_id: string
  active: boolean
}

export interface WantedAuthenticated extends WantedPublicDetail {
  // Add auth fields when backend provides them
}

export interface MarketplaceWantedResponse {
  items: Wanted[] | WantedPublicListing[]
  total?: number
  page?: number
  limit?: number
}

export function isAuthenticatedWanted(
  wanted: WantedPublicListing | Wanted
): wanted is Wanted {
  return 'company_id' in wanted
}

export function isWantedPublicDetail(
  wanted: WantedPublicListing | WantedPublicDetail
): wanted is WantedPublicDetail {
  return 'company_id' in wanted && 'active' in wanted
}

export function isWantedAuthenticated(
  wanted: WantedPublicDetail | WantedAuthenticated
): wanted is WantedAuthenticated {
  // Update when backend provides auth fields
  return false
}

export interface GetMarketplaceWantedRequest {
  category?: string
  subcategory?: string
  company_id?: string
  wanted_id?: string
  limit?: number
  offset?: number
  search?: string
}

export interface GetMarketplaceWantedDetailRequest {
  wantedId: string
}
