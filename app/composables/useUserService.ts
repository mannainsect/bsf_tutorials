import { UserService } from './api/services/UserService'

export const useUserService = () => {
  return new UserService()
}
