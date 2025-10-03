import type { 
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchRequest
} from '../../shared/types'

export const useUser = () => {
  const userService = useUserService()
  const authStore = useAuthStore()

  const getCurrentUser = async () => {
    return userService.getCurrentUser()
  }

  const getUserById = async (id: string | number) => {
    return userService.getUserById(id)
  }

  const searchUsers = async (searchParams: UserSearchRequest = {}) => {
    return userService.searchUsers(searchParams)
  }

  const createUser = async (userData: CreateUserRequest) => {
    return userService.createUser(userData)
  }

  const updateUser = async (id: string | number, userData: UpdateUserRequest) => {
    const result = await userService.updateUser(id, userData)
    // If updating current user, refresh profile
    if (String(id) === String(authStore.userId)) {
      await authStore.refreshProfile({ force: true })
    }
    return result
  }

  const updateCurrentUser = async (userData: UpdateUserRequest) => {
    const result = await userService.updateCurrentUser(userData)
    // Refresh profile after updating current user
    await authStore.refreshProfile({ force: true })
    return result
  }

  const deleteUser = async (id: string | number) => {
    return userService.deleteUser(id)
  }

  const switchCompany = async (companyId: string | number) => {
    const result = await userService.switchCompany(companyId)
    // Refresh profile after switching company
    await authStore.refreshProfile({ force: true })
    return result
  }

  return {
    getCurrentUser,
    getUserById,
    searchUsers,
    createUser,
    updateUser,
    updateCurrentUser,
    deleteUser,
    switchCompany,
    currentUser: computed(() => authStore.user),
  }
}