// Company model interface
export interface Company {
  _id: string
  id?: string | number // Legacy support
  name: string
  slug?: string
  description?: string
  logo?: string
  website?: string
  email?: string
  phone?: string
  address?: string | null
  street?: string
  business_id?: string
  city?: string
  country?: string
  timezone?: string
  account_type?: 'free' | 'pro' | 'enterprise'
  mind_attached?: boolean
  settings?: CompanySettings
  subscription?: CompanySubscription
  created_at?: string
  updated_at?: string
}

export interface CompanyAddress {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface CompanySettings {
  timezone?: string
  currency?: string
  date_format?: string
  language?: string
  features?: string[]
}

export interface CompanySubscription {
  plan?: string
  status?: 'active' | 'inactive' | 'trial' | 'cancelled'
  expires_at?: string
  created_at?: string
}

// Company API types
export interface CreateCompanyRequest {
  name: string
  slug?: string
  description?: string
  website?: string
  email?: string
  phone?: string
  address?: Partial<CompanyAddress>
}

export interface UpdateCompanyRequest {
  name?: string
  slug?: string
  description?: string
  website?: string
  email?: string
  phone?: string
  logo?: string
  address?: Partial<CompanyAddress>
  settings?: Partial<CompanySettings>
}

export interface CompanyResponse {
  company: Company
  message?: string
}

// Company creation response with bulk space creation
export interface CompanyCreationResponse {
  status: 'success' | 'partial' | 'error'
  company_id: string
  created_spaces?: string[]
  failed_space_types?: string[]
}