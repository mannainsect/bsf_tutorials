import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchRequest
} from '../../../../shared/types'
import { UserRepository } from '../repositories/UserRepository'

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  private get authStore() {
    return useAuthStore()
  }

  /**
   * Get current user profile
   * UPDATED: Uses centralized auth store data instead of direct API calls
   */
  async getCurrentUser() {
    // Use centralized profile data from auth store
    await this.authStore.ensureProfileData()

    // Check if user data is available
    if (!this.authStore.user) {
      throw new Error(
        'User data not available. Please ensure you are logged in.'
      )
    }

    return {
      user: this.authStore.user,
      message: 'User data retrieved from profile cache'
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string | number) {
    return this.userRepository.getUserById(id)
  }

  /**
   * Search and filter users
   */
  async searchUsers(searchParams: UserSearchRequest = {}) {
    return this.userRepository.getUsers(searchParams)
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest) {
    return this.userRepository.createUser(userData)
  }

  /**
   * Update user profile
   */
  async updateUser(id: string | number, userData: UpdateUserRequest) {
    return this.userRepository.updateUser(id, userData)
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(userData: UpdateUserRequest) {
    const response = await this.userRepository.updateCurrentUser(userData)

    // Update user in auth store
    if (response.user) {
      this.authStore.setUser(response.user)
    }

    return response
  }

  /**
   * Delete user
   */
  async deleteUser(id: string | number) {
    return this.userRepository.deleteUser(id)
  }

  /**
   * Switch active company for current user
   */
  async switchCompany(companyId: string | number) {
    const response = await this.userRepository.switchCompany(companyId)

    // Update user in auth store with new active company
    if (response.user) {
      this.authStore.setUser(response.user)
    }

    return response
  }

  /**
   * Get current user from store
   */
  get currentUser() {
    return this.authStore.user
  }
}
