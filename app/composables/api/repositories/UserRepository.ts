import type {
  User,
  GetUserResponse,
  GetUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserSearchRequest
} from '../../../../shared/types'
import { BaseRepository } from './BaseRepository'

export class UserRepository extends BaseRepository {
  /**
   * Get current user profile
   * DEPRECATED: Use auth store's ensureProfileData() instead
   * /profiles/me is the primary endpoint and includes all necessary user data
   */
  async getCurrentUser(): Promise<GetUserResponse> {
    const endpoints = useApiEndpoints()
    return this.get<GetUserResponse>(endpoints.profilesMe)
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string | number): Promise<GetUserResponse> {
    const endpoints = useApiEndpoints()
    return this.get<GetUserResponse>(`${endpoints.users}/${id}`)
  }

  /**
   * Get list of users with pagination and filters
   */
  async getUsers(
    searchParams: UserSearchRequest = {}
  ): Promise<GetUsersResponse> {
    const endpoints = useApiEndpoints()
    const {
      page = 1,
      limit = 20,
      search,
      company_id,
      role,
      status,
      created_after,
      created_before,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = searchParams

    const query = this.buildPaginationQuery(page, limit, {
      ...(search && { search }),
      ...(company_id && { company_id }),
      ...(role && { role }),
      ...(status && { status }),
      ...(created_after && { created_after }),
      ...(created_before && { created_before }),
      sort_by,
      sort_order
    })

    return this.get<GetUsersResponse>(endpoints.users, query)
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    const endpoints = useApiEndpoints()
    return this.post<CreateUserResponse>(endpoints.users, userData)
  }

  /**
   * Update user profile
   */
  async updateUser(
    id: string | number,
    userData: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    const endpoints = useApiEndpoints()
    return this.put<UpdateUserResponse>(`${endpoints.users}/${id}`, userData)
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(
    userData: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    const endpoints = useApiEndpoints()
    const authStore = useAuthStore()
    const userId = authStore.user?.id || authStore.user?._id

    if (!userId) {
      throw new Error('User ID not found')
    }

    return this.put<UpdateUserResponse>(
      `${endpoints.users}/${userId}`,
      userData
    )
  }

  /**
   * Delete user
   */
  async deleteUser(id: string | number): Promise<{ message: string }> {
    const endpoints = useApiEndpoints()
    return this.delete<{ message: string }>(`${endpoints.users}/${id}`)
  }

  /**
   * Switch active company for current user
   */
  async switchCompany(
    companyId: string | number
  ): Promise<{ user: User; message: string }> {
    const endpoints = useApiEndpoints()
    return this.post<{ user: User; message: string }>(
      endpoints.profilesSwitchCompany,
      {
        company_id: companyId
      }
    )
  }
}
