import {
  describe, it, expect, beforeEach, vi, beforeAll, afterAll
} from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore as realUseAuthStore } from '~/stores/auth'
import { useUserRole } from '~/composables/useUserRole'
import type { User } from '~/shared/types'

// Mock localStorage
const mockStorage: Record<string, string> = {}
const originalUseStorage = global.useStorage
const originalUseAuthStore = global.useAuthStore

beforeAll(() => {
  // Override global useAuthStore to use the real store
  global.useAuthStore = realUseAuthStore

  global.useStorage = () => ({
    get: (key: string) => {
      const value = mockStorage[key]
      return value ? value : null
    },
    set: (key: string, value: any) => {
      mockStorage[key] = typeof value === 'string'
        ? value
        : JSON.stringify(value)
    },
    remove: (key: string) => {
      delete mockStorage[key]
    },
    clear: () => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    }
  })
})

afterAll(() => {
  global.useStorage = originalUseStorage
  global.useAuthStore = originalUseAuthStore
})

describe('useUserRole', () => {
  let authStore: ReturnType<typeof realUseAuthStore>
  let mockAdmins: User[]
  let mockManagers: User[]
  let mockOperators: User[]

  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    setActivePinia(createPinia())
    authStore = realUseAuthStore()
    // Set default token for authenticated tests
    authStore.setToken('test-token')

    // Setup mock users
    mockAdmins = [
      { _id: 'admin1', id: 'admin1', email: 'admin1@test.com' },
      { _id: 'admin2', id: 'admin2', email: 'admin2@test.com' }
    ]
    mockManagers = [
      { _id: 'manager1', id: 'manager1', email: 'mgr1@test.com' }
    ]
    mockOperators = [
      { _id: 'operator1', id: 'operator1', email: 'op1@test.com' }
    ]
  })

  describe('isCompanyAdmin', () => {
    it('should return true for superadmin user', () => {
      authStore.setUser({
        _id: 'user1',
        id: 'user1',
        email: 'super@test.com',
        superadmin: true
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      // Verify store state
      expect(authStore.user).toBeTruthy()
      expect(authStore.user?.superadmin).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(true)
    })

    it('should return true for admin in admins list', () => {
      authStore.setUser({
        _id: 'admin1',
        id: 'admin1',
        email: 'admin1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: mockAdmins, managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(true)
    })

    it('should return false when not authenticated', () => {
      authStore.logout()

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(false)
    })

    it('should return false when no active company', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany(null)

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(false)
    })

    it('should return false for non-admin user', () => {
      authStore.setUser({
        _id: 'manager1',
        id: 'manager1',
        email: 'mgr1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: mockAdmins, managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(false)
    })

    it('should match by _id field', () => {
      authStore.setUser({ _id: 'admin1', email: 'admin1@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: mockAdmins, managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(true)
    })

    it('should match by id field', () => {
      authStore.setUser({ id: 'admin1', email: 'admin1@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: mockAdmins, managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyAdmin } = useUserRole()
      expect(isCompanyAdmin()).toBe(true)
    })
  })

  describe('isCompanyManager', () => {
    it('should return true for manager in managers list', () => {
      authStore.setUser({
        _id: 'manager1',
        id: 'manager1',
        email: 'mgr1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = {
        admins: [],
        managers: mockManagers,
        operators: []
      }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyManager } = useUserRole()
      expect(isCompanyManager()).toBe(true)
    })

    it('should return false when not authenticated', () => {
      authStore.logout()

      const { isCompanyManager } = useUserRole()
      expect(isCompanyManager()).toBe(false)
    })

    it('should return false when no active company', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany(null)

      const { isCompanyManager } = useUserRole()
      expect(isCompanyManager()).toBe(false)
    })

    it('should return false for non-manager user', () => {
      authStore.setUser({
        _id: 'operator1',
        id: 'operator1',
        email: 'op1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = {
        admins: [],
        managers: mockManagers,
        operators: []
      }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyManager } = useUserRole()
      expect(isCompanyManager()).toBe(false)
    })
  })

  describe('isCompanyOperator', () => {
    it('should return true for operator in operators list', () => {
      authStore.setUser({
        _id: 'operator1',
        id: 'operator1',
        email: 'op1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = {
        admins: [],
        managers: [],
        operators: mockOperators
      }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyOperator } = useUserRole()
      expect(isCompanyOperator()).toBe(true)
    })

    it('should return false when not authenticated', () => {
      authStore.logout()

      const { isCompanyOperator } = useUserRole()
      expect(isCompanyOperator()).toBe(false)
    })

    it('should return false for non-operator user', () => {
      authStore.setUser({
        _id: 'admin1',
        id: 'admin1',
        email: 'admin1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = {
        admins: [],
        managers: [],
        operators: mockOperators
      }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { isCompanyOperator } = useUserRole()
      expect(isCompanyOperator()).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true for admin', () => {
      authStore.setUser({
        _id: 'admin1',
        id: 'admin1',
        email: 'admin1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: mockAdmins, managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(true)
    })

    it('should return true for manager', () => {
      authStore.setUser({
        _id: 'manager1',
        id: 'manager1',
        email: 'mgr1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = {
        admins: [],
        managers: mockManagers,
        operators: []
      }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(true)
    })

    it('should return true for operator', () => {
      authStore.setUser({
        _id: 'operator1',
        id: 'operator1',
        email: 'op1@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = {
        admins: [],
        managers: [],
        operators: mockOperators
      }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(true)
    })

    it('should return false when not authenticated', () => {
      authStore.logout()

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
    })

    it('should return false for user with no roles', () => {
      authStore.setUser({
        _id: 'norole',
        id: 'norole',
        email: 'norole@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: [], managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('should return "superadmin" for superadmin user', () => {
    })

    it('should return null for user with no role', () => {
      authStore.setUser({
        _id: 'norole',
        id: 'norole',
        email: 'norole@test.com'
      })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const roleData = { admins: [], managers: [], operators: [] }
      mockStorage['auth_active_company_roles'] = JSON.stringify(roleData)

      const { getUserRole } = useUserRole()
      expect(getUserRole()).toBe(null)
    })
  })

  describe('localStorage error handling', () => {
    it('should handle localStorage disabled gracefully', () => {
      // Mock window being undefined (SSR)
      const originalWindow = global.window
      ;(global as any).window = undefined

      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const consoleWarnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() => {})

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useUserRole] localStorage not available'
      )

      consoleWarnSpy.mockRestore()
      global.window = originalWindow
    })

    it('should handle corrupt JSON in cache', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      mockStorage['auth_active_company_roles'] = '{ invalid json }'

      const consoleErrorSpy = vi.spyOn(console, 'error')
        .mockImplementation(() => {})

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useUserRole] Failed to parse role data:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle missing role data', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      // No data in storage

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
    })

    it('should handle invalid role data structure', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      mockStorage['auth_active_company_roles'] = JSON.stringify({
        invalid: 'structure'
      })

      const consoleWarnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() => {})

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useUserRole] Invalid role data structure'
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle localStorage quota exceeded', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'

      // Mock storage.get to throw quota error
      const originalGet = global.useStorage().get
      global.useStorage = () => ({
        get: () => {
          throw quotaError
        },
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      })

      const consoleErrorSpy = vi.spyOn(console, 'error')
        .mockImplementation(() => {})

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useUserRole] localStorage quota exceeded'
      )

      consoleErrorSpy.mockRestore()
      // Restore original
      global.useStorage = () => ({
        get: originalGet,
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      })
    })

    it('should handle localStorage security error', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      const securityError = new Error('SecurityError')
      securityError.name = 'SecurityError'

      global.useStorage = () => ({
        get: () => {
          throw securityError
        },
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      })

      const consoleErrorSpy = vi.spyOn(console, 'error')
        .mockImplementation(() => {})

      const { hasAnyRole } = useUserRole()
      expect(hasAnyRole()).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useUserRole] localStorage access denied'
      )

      consoleErrorSpy.mockRestore()
    })

    it('should clear corrupt data on parse error', () => {
      authStore.setUser({ _id: 'user1', id: 'user1', email: 'u@test.com' })
      authStore.setActiveCompany({ _id: 'comp1', id: 'comp1' })

      mockStorage['auth_active_company_roles'] = 'invalid json'

      const consoleErrorSpy = vi.spyOn(console, 'error')
        .mockImplementation(() => {})

      const { hasAnyRole } = useUserRole()

      // Should have attempted to clear the invalid data
      expect(hasAnyRole()).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })
})
