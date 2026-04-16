import type { User } from '../../shared/types'
import { useErrorHandler } from './errors/useErrorHandler'

/**
 * Composable for checking user roles and permissions
 * All checks are now synchronous, reading from Pinia store state only
 *
 * Architecture:
 * - No API calls - all data comes from cached localStorage
 * - Synchronous methods for instant permission checks
 * - Graceful fallbacks for localStorage issues
 * - Data is populated by auth store during profile fetch
 *
 * @returns Object with role checking methods
 */
export const useUserRole = () => {
  const authStore = useAuthStore()
  const { handleSilentError } = useErrorHandler()

  /**
   * Get cached role data from localStorage (set by auth store)
   * Handles all localStorage edge cases gracefully:
   * - localStorage disabled by user/browser
   * - Quota exceeded errors
   * - Corrupt/invalid JSON data
   * - Missing or incomplete data
   *
   * @returns Role data object with admins, managers, operators arrays
   * @returns Default empty arrays if any error occurs
   */
  const getCachedRoleData = (): {
    admins: User[]
    managers: User[]
    operators: User[]
  } => {
    const defaultRoleData = { admins: [], managers: [], operators: [] }

    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultRoleData
      }

      // Try to access localStorage (may throw if disabled)
      const storage = useStorage()
      const rolesData = storage.get<string>('auth_active_company_roles')

      if (!rolesData) {
        return defaultRoleData
      }

      // Parse JSON with error handling
      try {
        const parsed = JSON.parse(rolesData)

        // Validate the structure
        if (
          typeof parsed === 'object' &&
          Array.isArray(parsed.admins) &&
          Array.isArray(parsed.managers) &&
          Array.isArray(parsed.operators)
        ) {
          return parsed
        } else {
          return defaultRoleData
        }
      } catch (parseError) {
        handleSilentError(parseError, 'useUserRole.loadRole')
        // Clear invalid data
        try {
          storage.remove('auth_active_company_roles')
        } catch {
          // Ignore removal error
        }
        return defaultRoleData
      }
    } catch (error) {
      handleSilentError(error, 'useUserRole.loadRole')
      return defaultRoleData
    }
  }

  /**
   * Check if user is admin of active company (synchronous)
   * Returns true if user is superadmin or company admin
   *
   * @returns true if user has admin privileges
   */
  const isCompanyAdmin = (): boolean => {
    if (!authStore.isAuthenticated || !authStore.activeCompany) {
      return false
    }

    // Check if user is superadmin
    if (authStore.user?.superadmin) {
      return true
    }

    const userId = authStore.userId
    if (!userId) return false

    const roleData = getCachedRoleData()
    const admins = roleData.admins || []

    return admins.some((admin: User) => admin._id === userId || admin.id === userId)
  }

  /**
   * Check if user is manager of active company (synchronous)
   */
  const isCompanyManager = (): boolean => {
    if (!authStore.isAuthenticated || !authStore.activeCompany) {
      return false
    }

    const userId = authStore.userId
    if (!userId) return false

    const roleData = getCachedRoleData()
    const managers = roleData.managers || []

    return managers.some((manager: User) => manager._id === userId || manager.id === userId)
  }

  /**
   * Check if user is operator of active company (synchronous)
   */
  const isCompanyOperator = (): boolean => {
    if (!authStore.isAuthenticated || !authStore.activeCompany) {
      return false
    }

    const userId = authStore.userId
    if (!userId) return false

    const roleData = getCachedRoleData()
    const operators = roleData.operators || []

    return operators.some((operator: User) => operator._id === userId || operator.id === userId)
  }

  /**
   * Check if user has any role in the active company
   */
  const hasAnyRole = (): boolean => {
    return isCompanyAdmin() || isCompanyManager() || isCompanyOperator()
  }

  /**
   * Get user's role level in active company
   * Returns: 'superadmin' | 'admin' | 'manager' | 'operator' | null
   */
  const getUserRole = (): string | null => {
    if (authStore.user?.superadmin) return 'superadmin'
    if (isCompanyAdmin()) return 'admin'
    if (isCompanyManager()) return 'manager'
    if (isCompanyOperator()) return 'operator'
    return null
  }

  return {
    isCompanyAdmin,
    isCompanyManager,
    isCompanyOperator,
    hasAnyRole,
    getUserRole
  }
}
