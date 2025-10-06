// Authentication related types
// Import User type from models
import type { User } from '../models/User'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  user?: User
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
  beta_code?: string
}

export interface RegisterResponse {
  status: string
  message: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}
