import type {
  User,
  UpdateUserRequest,
  UpdateUserResponse
} from '../models/User'
import type { PaginatedResponse } from './common.types'

// User API endpoint types
export interface GetUserResponse {
  user: User
}

export type GetUsersResponse = PaginatedResponse<User>

export interface CreateUserRequest {
  email: string
  password: string
  name?: string
  first_name?: string
  last_name?: string
  phone?: string
  company_id?: string | number
}

export interface CreateUserResponse {
  user: User
  message: string
}

// Re-export update types for convenience
export type { UpdateUserRequest, UpdateUserResponse }

// User search and filter types
export interface UserFilters {
  search?: string
  company_id?: string | number
  role?: string
  status?: 'active' | 'inactive' | 'pending'
  created_after?: string
  created_before?: string
}

export interface UserSearchRequest extends UserFilters {
  page?: number
  limit?: number
  sort_by?: 'name' | 'email' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}
