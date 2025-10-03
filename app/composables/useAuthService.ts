import { AuthService } from './api/services/AuthService'

export const useAuthService = () => {
  return new AuthService()
}