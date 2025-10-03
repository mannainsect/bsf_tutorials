import type { PurchasedProduct } from './Product'
import type { Company } from './Company'
import type { CompanyMetrics } from '../api/metrics.types'

// Types that match the /profiles/me endpoint exactly
export interface ProfilesResponse {
  user: User
  active_company: ActiveCompany | null
  other_companies: Company[]
}

export interface ActiveCompany {
  company: Company | null
  metrics: CompanyMetrics
  tasks: Task[]
  devices: Device[]
  spaces: Space[]
  admins: User[]
  managers: User[]
  operators: User[]
}


export interface Task {
  task_type: TaskType
  spaces: Space[]
}

export type TaskType = 
  | "breeding"
  | "nursing" 
  | "rearing"
  | "pupa_rearing"
  | "pre_processing"
  | "post_processing"
  | "storage"

export interface Device {
  _id: string
  description: string
  account_type: string
}

export interface Space {
  _id: string
  name: string
  process: string
}

// User model interface - matches /profiles/me endpoint
export interface User {
  _id: string
  email: string
  name?: string
  country?: string
  city?: string
  balance: number
  account_type: string
  superadmin?: boolean
  profile?: string
  account_info?: {
    subscription_tier?: string
    trial_end_date?: string
    [key: string]: string | number | boolean | null | undefined
  }
  share_code?: string
  onboarding_email_sent?: string | null
  purchased_products: PurchasedProduct[]
  subscription_valid_until: string
  
  // Legacy fields for backward compatibility
  id?: string | number
  first_name?: string
  last_name?: string
  avatar?: string
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
  active_company?: Company | null
  companies?: Company[]
  roles?: string[]
  permissions?: string[]
  preferences?: UserPreferences
  credits_balance?: number
}

export interface UserPreferences {
  language?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'auto'
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
}


// User profile update types - updated to match actual API
export interface UpdateUserRequest {
  name?: string
  country?: string
  city?: string
  avatar?: string
  preferences?: Partial<UserPreferences>
}

export interface UpdateUserResponse {
  user: User
  message: string
}