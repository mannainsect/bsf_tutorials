export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData {
  email: string
  password: string
  name: string
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  account_type: string
  balance?: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface UserProfile {
  user: AuthUser
  active_company?: {
    company: {
      id: string
      name: string
    }
  }
}
