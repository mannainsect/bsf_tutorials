import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
  beforeAll,
  afterAll
} from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import type { ProfileResponse } from '~/composables/api/repositories/ProfileRepository'
vi.mock('~/composables/api/repositories/ProfileRepository', () => ({
  ProfileRepository: vi.fn().mockImplementation(() => ({
    getCurrentProfile: vi.fn(),
    switchCompany: vi.fn()
  }))
}))
vi.mock('~/composables/useApiEndpoints', () => ({
  useApiEndpoints: () => ({
    profilesMe: '/profiles/me',
    profilesSwitchCompany: '/profiles/switch-company'
  })
}))
const mockStorage: Record<string, string> = {}
const originalUseStorage = global.useStorage
beforeAll(() => {
  global.useStorage = () => ({
    get: (key: string) => {
      const value = mockStorage[key]
      return value ? value : null
    },
    set: (key: string, value: unknown) => {
      mockStorage[key] =
        typeof value === 'string' ? value : JSON.stringify(value)
    },
    remove: (key: string) => {
      const keys = Object.keys(mockStorage)
      keys.forEach(k => {
        if (
          k === key &&
          Object.prototype.hasOwnProperty.call(mockStorage, k)
        ) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete mockStorage[k]
        }
      })
    },
    clear: () => {
      const keys = Object.keys(mockStorage)
      keys.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(mockStorage, k)) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete mockStorage[k]
        }
      })
    }
  })
})
afterAll(() => {
  global.useStorage = originalUseStorage
})
describe('Auth Store - Auto-select Active Company Feature', () => {
  let store: ReturnType<typeof useAuthStore>
  let mockGetCurrentProfile: ReturnType<typeof vi.fn>
  let mockSwitchCompany: ReturnType<typeof vi.fn>
  beforeEach(() => {
    vi.clearAllMocks()
    const keys = Object.keys(mockStorage)
    keys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(mockStorage, key)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete mockStorage[key]
      }
    })
    setActivePinia(createPinia())
    store = useAuthStore()
    store.setToken('test-token')
  })
  afterEach(() => {
    vi.clearAllTimers()
  })
  describe('Existing behavior preservation', () => {
    it('should not auto-select when active_company exists', async () => {
      const profileWithActiveCompany: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 100
        },
        active_company: {
          company: { _id: 'comp1', name: 'Active Co' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        },
        other_companies: [
          { _id: 'comp2', name: 'Other Co 1' },
          { _id: 'comp3', name: 'Other Co 2' }
        ]
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi
        .fn()
        .mockResolvedValue(profileWithActiveCompany)
      mockSwitchCompany = vi.fn()
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).not.toHaveBeenCalled()
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'Active Co'
      })
      expect(store.otherCompanies).toHaveLength(2)
      expect(store.user).toEqual({
        ...profileWithActiveCompany.user,
        id: profileWithActiveCompany.user._id
      })
    })
    it('should handle profile with no companies at all', async () => {
      const profileWithNoCompanies: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 50
        },
        active_company: null,
        other_companies: []
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithNoCompanies)
      mockSwitchCompany = vi.fn()
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).not.toHaveBeenCalled()
      expect(store.activeCompany).toBeNull()
      expect(store.otherCompanies).toHaveLength(0)
      expect(store.user).toEqual({
        ...profileWithNoCompanies.user,
        id: profileWithNoCompanies.user._id
      })
    })
  })
  describe('Auto-selection functionality', () => {
    it('should auto-select first company when no active_company exists', async () => {
      const profileWithoutActiveCompany: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 75
        },
        active_company: null,
        other_companies: [
          { _id: 'comp1', name: 'First Co' },
          { _id: 'comp2', name: 'Second Co' }
        ]
      }
      const updatedProfile: ProfileResponse = {
        ...profileWithoutActiveCompany,
        active_company: {
          company: { _id: 'comp1', name: 'First Co' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        }
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi
        .fn()
        .mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).toHaveBeenCalledWith('comp1')
      expect(mockSwitchCompany).toHaveBeenCalledTimes(1)
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'First Co'
      })
      const otherComps = profileWithoutActiveCompany.other_companies.map(
        c => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id
        })
      )
      expect(store.otherCompanies).toEqual(otherComps)
      expect(store.user).toEqual({
        ...updatedProfile.user,
        id: updatedProfile.user._id || updatedProfile.user.id,
        _id: updatedProfile.user._id || updatedProfile.user.id
      })
    })
    it('should handle companies with id field instead of _id', async () => {
      const profileWithIdField: ProfileResponse = {
        user: {
          id: 'user1',
          email: 'test@example.com',
          balance: 60
        },
        active_company: null,
        other_companies: [
          { id: 'comp1', name: 'Company with id' },
          { _id: 'comp2', name: 'Company with _id' }
        ]
      }
      const updatedProfile: ProfileResponse = {
        ...profileWithIdField,
        active_company: {
          company: { id: 'comp1', name: 'Company with id' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        }
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithIdField)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).toHaveBeenCalledWith('comp1')
      expect(store.activeCompany).toEqual({
        id: 'comp1',
        _id: 'comp1',
        name: 'Company with id'
      })
    })
    it('should use local fallback when company has no valid ID', async () => {
      const profileWithInvalidId: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 80
        },
        active_company: null,
        other_companies: [
          { name: 'Company without ID' } as { name: string },
          { _id: 'comp2', name: 'Valid Company' }
        ]
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithInvalidId)
      mockSwitchCompany = vi.fn()
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      await store.fetchProfile()
      expect(mockSwitchCompany).not.toHaveBeenCalled()
      const errorMsg = '[AUTH] First company has no valid ID'
      expect(consoleErrorSpy).toHaveBeenCalledWith(errorMsg)
      expect(store.activeCompany).toBeNull()
      const normalizedCompanies = profileWithInvalidId.other_companies.map(
        (c: { _id?: string; id?: string; name: string }) => {
          if (c._id) return { ...c, id: c._id }
          if (c.id) return { ...c, _id: c.id }
          return c
        }
      )
      expect(store.otherCompanies).toEqual(normalizedCompanies)
      consoleErrorSpy.mockRestore()
    })
  })
  describe('Retry mechanism', () => {
    it('should retry switchCompany on failure', async () => {
      vi.useFakeTimers()
      const profileWithoutActiveCompany: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 90
        },
        active_company: null,
        other_companies: [{ _id: 'comp1', name: 'First Co' }]
      }
      const updatedProfile: ProfileResponse = {
        ...profileWithoutActiveCompany,
        active_company: {
          company: { _id: 'comp1', name: 'First Co' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        }
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi
        .fn()
        .mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Retry'))
        .mockResolvedValueOnce(updatedProfile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const fetchPromise = store.fetchProfile()
      await vi.runOnlyPendingTimersAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await fetchPromise
      expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
      expect(mockSwitchCompany).toHaveBeenCalledWith('comp1')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AUTH] Successfully auto-selected company'
      )
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'First Co'
      })
      consoleLogSpy.mockRestore()
      vi.useRealTimers()
    })
    it('should fall back to local selection after all retries fail', async () => {
      vi.useFakeTimers()
      const profileWithoutActiveCompany: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 95
        },
        active_company: null,
        other_companies: [
          { _id: 'comp1', name: 'First Co' },
          { _id: 'comp2', name: 'Second Co' }
        ]
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi
        .fn()
        .mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi
        .fn()
        .mockRejectedValue(new Error('Persistent API failure'))
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const fetchPromise = store.fetchProfile()
      await vi.runOnlyPendingTimersAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await fetchPromise
      expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AUTH] Failed to auto-select company:',
        expect.any(Error)
      )
      const fallbackMsg = '[AUTH] Using local fallback for company selection'
      expect(consoleLogSpy).toHaveBeenCalledWith(fallbackMsg)
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'First Co'
      })
      const otherComps = profileWithoutActiveCompany.other_companies.map(
        c => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id
        })
      )
      expect(store.otherCompanies).toEqual(otherComps)
      expect(store.user).toEqual({
        ...profileWithoutActiveCompany.user,
        id: profileWithoutActiveCompany.user._id
      })
      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      vi.useRealTimers()
    })
    it('should use correct fixed retry delays', async () => {
      vi.useFakeTimers()
      const profileWithoutActiveCompany: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 85
        },
        active_company: null,
        other_companies: [{ _id: 'comp1', name: 'Test Co' }]
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi
        .fn()
        .mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockRejectedValue(new Error('Test error'))
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const fetchPromise = store.fetchProfile()
      await vi.runOnlyPendingTimersAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await fetchPromise
      expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      vi.useRealTimers()
    })
  })
  describe('State management', () => {
    it('should update lastProfileFetch after successful fetch', async () => {
      const profile: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 100
        },
        active_company: {
          company: { _id: 'comp1', name: 'Test Co' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        },
        other_companies: []
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: vi.fn()
      }))
      const beforeFetch = store.lastProfileFetch
      await store.fetchProfile()
      const afterFetch = store.lastProfileFetch
      expect(afterFetch).toBeGreaterThan(beforeFetch)
      expect(mockStorage['auth_last_profile_fetch']).toBeDefined()
    })
    it('should persist state to storage after auto-selection', async () => {
      const profileWithoutActiveCompany: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 70
        },
        active_company: null,
        other_companies: [{ _id: 'comp1', name: 'Selected Co' }]
      }
      const updatedProfile: ProfileResponse = {
        ...profileWithoutActiveCompany,
        active_company: {
          company: { _id: 'comp1', name: 'Selected Co' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        }
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi
        .fn()
        .mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockStorage['auth_user']).toBeDefined()
      expect(mockStorage['auth_active_company']).toBeDefined()
      expect(mockStorage['auth_other_companies']).toBeDefined()
      const storedUser = JSON.parse(mockStorage['auth_user'])
      const storedActiveCompany = JSON.parse(
        mockStorage['auth_active_company']
      )
      const storedOtherCompanies = JSON.parse(
        mockStorage['auth_other_companies']
      )
      expect(storedUser).toEqual({
        ...updatedProfile.user,
        id: updatedProfile.user._id
      })
      expect(storedActiveCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'Selected Co'
      })
      const otherComps = profileWithoutActiveCompany.other_companies.map(
        c => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id
        })
      )
      expect(storedOtherCompanies).toEqual(otherComps)
    })
    it('should return correct data structure from fetchProfile', async () => {
      const profile: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 65
        },
        active_company: null,
        other_companies: [{ _id: 'comp1', name: 'Auto Selected' }]
      }
      const updatedProfile: ProfileResponse = {
        ...profile,
        active_company: {
          company: { _id: 'comp1', name: 'Auto Selected' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        }
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const result = await store.fetchProfile()
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('profile')
      expect(result).toHaveProperty('activeCompany')
      expect(result).toHaveProperty('otherCompanies')
      expect(result.user).toEqual({
        ...updatedProfile.user,
        id: updatedProfile.user._id
      })
      expect(result.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'Auto Selected'
      })
      const normalizedOthers = profile.other_companies.map(c => ({
        ...c,
        id: c._id || c.id,
        _id: c._id || c.id
      }))
      expect(result.otherCompanies).toEqual(normalizedOthers)
    })
  })
  describe('Error handling', () => {
    it('should throw error when fetchProfile fails completely', async () => {
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockRejectedValue(new Error('API Error'))
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: vi.fn()
      }))
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      await expect(store.fetchProfile()).rejects.toThrow('API Error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AUTH] Failed to fetch profile:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })
    it('should handle edge case of empty other_companies array', async () => {
      const profile: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 55
        },
        active_company: null,
        other_companies: null as unknown as []
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      mockSwitchCompany = vi.fn()
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).not.toHaveBeenCalled()
      expect(store.activeCompany).toBeNull()
      expect(store.otherCompanies).toEqual([])
    })
    it('should handle undefined active_company gracefully', async () => {
      const profile: ProfileResponse = {
        user: {
          _id: 'user1',
          email: 'test@example.com',
          balance: 45
        },
        active_company: undefined as unknown as null,
        other_companies: [{ _id: 'comp1', name: 'Company 1' }]
      }
      const updatedProfile: ProfileResponse = {
        ...profile,
        active_company: {
          company: { _id: 'comp1', name: 'Company 1' },
          metrics: {},
          tasks: [],
          devices: [],
          spaces: [],
          admins: [],
          managers: [],
          operators: []
        }
      }
      const { ProfileRepository } = await import(
        '~/composables/api/repositories/ProfileRepository'
      )
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(
        ProfileRepository as typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository
      ).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).toHaveBeenCalledWith('comp1')
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'Company 1'
      })
    })
  })
})
