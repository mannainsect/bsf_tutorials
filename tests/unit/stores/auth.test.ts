import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import type { ProfileResponse } from '~/composables/api/repositories/ProfileRepository'

type MockProfileRepo =
  typeof import('~/composables/api/repositories/ProfileRepository').ProfileRepository

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
const makeActiveCompany = (company: {
  _id?: string
  id?: string
  name: string
}): ProfileResponse['active_company'] => ({
  company,
  metrics: {},
  tasks: [],
  devices: [],
  spaces: [],
  admins: [],
  managers: [],
  operators: []
})

const makeProfileResponse = (over: Partial<ProfileResponse> = {}): ProfileResponse => ({
  user: { _id: 'u1', email: 'a@b.c', balance: 0 },
  active_company: null,
  other_companies: [],
  ...over
})

const mockStorage: Record<string, string> = {}
const originalUseStorage = global.useStorage
beforeAll(() => {
  global.useStorage = () => ({
    get: (key: string) => {
      const value = mockStorage[key]
      return value ? value : null
    },
    set: (key: string, value: unknown) => {
      mockStorage[key] = typeof value === 'string' ? value : JSON.stringify(value)
    },
    remove: (key: string) => {
      const keys = Object.keys(mockStorage)
      keys.forEach(k => {
        if (k === key && Object.prototype.hasOwnProperty.call(mockStorage, k)) {
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
      const profileWithActiveCompany = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 100 },
        active_company: makeActiveCompany({ _id: 'comp1', name: 'Active Co' }),
        other_companies: [
          { _id: 'comp2', name: 'Other Co 1' },
          { _id: 'comp3', name: 'Other Co 2' }
        ]
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithActiveCompany)
      mockSwitchCompany = vi.fn()
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
      const profileWithNoCompanies = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 50 }
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithNoCompanies)
      mockSwitchCompany = vi.fn()
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
      const profileWithoutActiveCompany = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 75 },
        other_companies: [
          { _id: 'comp1', name: 'First Co' },
          { _id: 'comp2', name: 'Second Co' }
        ]
      })
      const updatedProfile = makeProfileResponse({
        ...profileWithoutActiveCompany,
        active_company: makeActiveCompany({ _id: 'comp1', name: 'First Co' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
      const otherComps = profileWithoutActiveCompany.other_companies.map(c => ({
        ...c,
        id: c._id || c.id,
        _id: c._id || c.id
      }))
      expect(store.otherCompanies).toEqual(otherComps)
      expect(store.user).toEqual({
        ...updatedProfile.user,
        id: updatedProfile.user._id || updatedProfile.user.id,
        _id: updatedProfile.user._id || updatedProfile.user.id
      })
    })
    it('should handle companies with id field instead of _id', async () => {
      const profileWithIdField = makeProfileResponse({
        user: { id: 'user1', email: 'test@example.com', balance: 60 },
        other_companies: [
          { id: 'comp1', name: 'Company with id' },
          { _id: 'comp2', name: 'Company with _id' }
        ]
      })
      const updatedProfile = makeProfileResponse({
        ...profileWithIdField,
        active_company: makeActiveCompany({ id: 'comp1', name: 'Company with id' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithIdField)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
      const profileWithInvalidId = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 80 },
        other_companies: [
          { name: 'Company without ID' } as { name: string },
          { _id: 'comp2', name: 'Valid Company' }
        ]
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithInvalidId)
      mockSwitchCompany = vi.fn()
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).not.toHaveBeenCalled()
      expect(store.activeCompany).toBeNull()
      const normalizedCompanies = profileWithInvalidId.other_companies.map(
        (c: { _id?: string; id?: string; name: string }) => {
          if (c._id) return { ...c, id: c._id }
          if (c.id) return { ...c, _id: c.id }
          return c
        }
      )
      expect(store.otherCompanies).toEqual(normalizedCompanies)
    })
  })
  describe('Retry mechanism', () => {
    it('should retry switchCompany on failure', async () => {
      vi.useFakeTimers()
      const profileWithoutActiveCompany = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 90 },
        other_companies: [{ _id: 'comp1', name: 'First Co' }]
      })
      const updatedProfile = makeProfileResponse({
        ...profileWithoutActiveCompany,
        active_company: makeActiveCompany({ _id: 'comp1', name: 'First Co' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Retry'))
        .mockResolvedValueOnce(updatedProfile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const fetchPromise = store.fetchProfile()
      await vi.runOnlyPendingTimersAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await fetchPromise
      expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
      expect(mockSwitchCompany).toHaveBeenCalledWith('comp1')
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'First Co'
      })
      vi.useRealTimers()
    })
    it('should fall back to local selection after all retries fail', async () => {
      vi.useFakeTimers()
      const profileWithoutActiveCompany = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 95 },
        other_companies: [
          { _id: 'comp1', name: 'First Co' },
          { _id: 'comp2', name: 'Second Co' }
        ]
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockRejectedValue(new Error('Persistent API failure'))
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const fetchPromise = store.fetchProfile()
      await vi.runOnlyPendingTimersAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await fetchPromise
      expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
      expect(store.activeCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'First Co'
      })
      const otherComps = profileWithoutActiveCompany.other_companies
        .filter(c => c._id !== 'comp1')
        .map(c => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id
        }))
      expect(store.otherCompanies).toEqual(otherComps)
      expect(store.user).toEqual({
        ...profileWithoutActiveCompany.user,
        id: profileWithoutActiveCompany.user._id
      })
      vi.useRealTimers()
    })
    it('should use correct fixed retry delays', async () => {
      vi.useFakeTimers()
      const profileWithoutActiveCompany = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 85 },
        other_companies: [{ _id: 'comp1', name: 'Test Co' }]
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockRejectedValue(new Error('Test error'))
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      const fetchPromise = store.fetchProfile()
      await vi.runOnlyPendingTimersAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      await fetchPromise
      expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
      vi.useRealTimers()
    })
  })
  describe('State management', () => {
    it('should update lastProfileFetch after successful fetch', async () => {
      const profile = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 100 },
        active_company: makeActiveCompany({ _id: 'comp1', name: 'Test Co' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
      const profileWithoutActiveCompany = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 70 },
        other_companies: [{ _id: 'comp1', name: 'Selected Co' }]
      })
      const updatedProfile = makeProfileResponse({
        ...profileWithoutActiveCompany,
        active_company: makeActiveCompany({ _id: 'comp1', name: 'Selected Co' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profileWithoutActiveCompany)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockStorage['auth_user']).toBeDefined()
      expect(mockStorage['auth_active_company']).toBeDefined()
      expect(mockStorage['auth_other_companies']).toBeDefined()
      const storedUser = JSON.parse(mockStorage['auth_user'])
      const storedActiveCompany = JSON.parse(mockStorage['auth_active_company'])
      const storedOtherCompanies = JSON.parse(mockStorage['auth_other_companies'])
      expect(storedUser).toEqual({
        ...updatedProfile.user,
        id: updatedProfile.user._id
      })
      expect(storedActiveCompany).toEqual({
        _id: 'comp1',
        id: 'comp1',
        name: 'Selected Co'
      })
      const otherComps = profileWithoutActiveCompany.other_companies.map(c => ({
        ...c,
        id: c._id || c.id,
        _id: c._id || c.id
      }))
      expect(storedOtherCompanies).toEqual(otherComps)
    })
    it('should return correct data structure from fetchProfile', async () => {
      const profile = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 65 },
        other_companies: [{ _id: 'comp1', name: 'Auto Selected' }]
      })
      const updatedProfile = makeProfileResponse({
        ...profile,
        active_company: makeActiveCompany({ _id: 'comp1', name: 'Auto Selected' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockRejectedValue(new Error('API Error'))
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: vi.fn()
      }))
      await expect(store.fetchProfile()).rejects.toThrow('API Error')
    })
    it('should handle edge case of empty other_companies array', async () => {
      const profile = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 55 },
        other_companies: null as unknown as []
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      mockSwitchCompany = vi.fn()
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: mockSwitchCompany
      }))
      await store.fetchProfile()
      expect(mockSwitchCompany).not.toHaveBeenCalled()
      expect(store.activeCompany).toBeNull()
      expect(store.otherCompanies).toEqual([])
    })
    it('should handle undefined active_company gracefully', async () => {
      const profile = makeProfileResponse({
        user: { _id: 'user1', email: 'test@example.com', balance: 45 },
        active_company: undefined as unknown as null,
        other_companies: [{ _id: 'comp1', name: 'Company 1' }]
      })
      const updatedProfile = makeProfileResponse({
        ...profile,
        active_company: makeActiveCompany({ _id: 'comp1', name: 'Company 1' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      mockSwitchCompany = vi.fn().mockResolvedValue(updatedProfile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
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
  describe('fetchProfile edge cases', () => {
    it('concurrent fetchProfile calls getCurrentProfile once', async () => {
      const profile = makeProfileResponse({
        user: { _id: 'user1', email: 'a@b.c', balance: 10 },
        active_company: makeActiveCompany({ _id: 'c1', name: 'Co' })
      })
      const { ProfileRepository } = await import('~/composables/api/repositories/ProfileRepository')
      mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
      ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
        getCurrentProfile: mockGetCurrentProfile,
        switchCompany: vi.fn()
      }))
      // Both calls start synchronously; the second should
      // reuse the in-flight promise
      const p1 = store.fetchProfile()
      const p2 = store.fetchProfile()
      const r1 = await p1
      await p2
      expect(mockGetCurrentProfile).toHaveBeenCalledTimes(1)
      expect(r1.user).toEqual({
        _id: 'user1',
        id: 'user1',
        email: 'a@b.c',
        balance: 10
      })
    })

    it(
      'profileFetchPromise cleared after rejection — ' +
        'second call fires fresh getCurrentProfile',
      async () => {
        const { ProfileRepository } = await import(
          '~/composables/api/repositories/ProfileRepository'
        )
        const successProfile = makeProfileResponse({
          user: { _id: 'u2', email: 'x@y.z', balance: 5 },
          active_company: makeActiveCompany({ _id: 'c2', name: 'C2' })
        })
        mockGetCurrentProfile = vi
          .fn()
          .mockRejectedValueOnce(new Error('boom'))
          .mockResolvedValueOnce(successProfile)
        ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
          getCurrentProfile: mockGetCurrentProfile,
          switchCompany: vi.fn()
        }))
        await expect(store.fetchProfile()).rejects.toThrow('boom')
        const result = await store.fetchProfile()
        expect(mockGetCurrentProfile).toHaveBeenCalledTimes(2)
        expect(result.user).toEqual({
          _id: 'u2',
          id: 'u2',
          email: 'x@y.z',
          balance: 5
        })
      }
    )

    it(
      'switchCompany rejected with string "Bad Gateway" ' + '— fallback sets first company',
      async () => {
        vi.useFakeTimers()
        try {
          const profile = makeProfileResponse({
            user: { _id: 'u3', email: 'f@g.h', balance: 0 },
            other_companies: [
              { _id: 'cx', name: 'FallbackCo' },
              { _id: 'cy', name: 'Other' }
            ]
          })
          const { ProfileRepository } = await import(
            '~/composables/api/repositories/ProfileRepository'
          )
          mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
          mockSwitchCompany = vi.fn().mockRejectedValue('Bad Gateway')
          ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
            getCurrentProfile: mockGetCurrentProfile,
            switchCompany: mockSwitchCompany
          }))
          const fetchPromise = store.fetchProfile()
          await vi.runOnlyPendingTimersAsync()
          await vi.advanceTimersByTimeAsync(1000)
          await vi.advanceTimersByTimeAsync(1000)
          await vi.advanceTimersByTimeAsync(1000)
          await fetchPromise
          expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
          expect(store.activeCompany).toEqual({
            _id: 'cx',
            id: 'cx',
            name: 'FallbackCo'
          })
        } finally {
          vi.useRealTimers()
        }
      }
    )

    it(
      'switchCompany rejected with fetchError-like object ' + '— fallback sets first company',
      async () => {
        vi.useFakeTimers()
        try {
          const profile = makeProfileResponse({
            user: { _id: 'u4', email: 'h@i.j', balance: 0 },
            other_companies: [{ _id: 'cz', name: 'FBCo' }]
          })
          const { ProfileRepository } = await import(
            '~/composables/api/repositories/ProfileRepository'
          )
          mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
          mockSwitchCompany = vi.fn().mockRejectedValue({
            statusCode: 502,
            data: { detail: 'forbidden' }
          })
          ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
            getCurrentProfile: mockGetCurrentProfile,
            switchCompany: mockSwitchCompany
          }))
          const fetchPromise = store.fetchProfile()
          await vi.runOnlyPendingTimersAsync()
          await vi.advanceTimersByTimeAsync(1000)
          await vi.advanceTimersByTimeAsync(1000)
          await vi.advanceTimersByTimeAsync(1000)
          await fetchPromise
          expect(mockSwitchCompany).toHaveBeenCalledTimes(4)
          expect(store.activeCompany).toEqual({
            _id: 'cz',
            id: 'cz',
            name: 'FBCo'
          })
        } finally {
          vi.useRealTimers()
        }
      }
    )

    it('retry exhaustion preserves token', async () => {
      vi.useFakeTimers()
      try {
        const profile = makeProfileResponse({
          user: { _id: 'u5', email: 'k@l.m', balance: 0 },
          other_companies: [{ _id: 'cw', name: 'KeepToken' }]
        })
        const { ProfileRepository } = await import(
          '~/composables/api/repositories/ProfileRepository'
        )
        mockGetCurrentProfile = vi.fn().mockResolvedValue(profile)
        mockSwitchCompany = vi.fn().mockRejectedValue(new Error('fail'))
        ;(ProfileRepository as MockProfileRepo).mockImplementation(() => ({
          getCurrentProfile: mockGetCurrentProfile,
          switchCompany: mockSwitchCompany
        }))
        const fetchPromise = store.fetchProfile()
        await vi.runOnlyPendingTimersAsync()
        await vi.advanceTimersByTimeAsync(1000)
        await vi.advanceTimersByTimeAsync(1000)
        await vi.advanceTimersByTimeAsync(1000)
        await fetchPromise
        expect(store.token).toBe('test-token')
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

describe('initializeAuth corruption handling', () => {
  // This block tests that initializeAuth performs a full
  // logout when any stored value is corrupt, rather than
  // silently skipping individual fields.

  const AUTH_KEYS = [
    'auth_token',
    'auth_user',
    'auth_active_company',
    'auth_other_companies',
    'auth_last_profile_fetch'
  ] as const

  let store: ReturnType<typeof useAuthStore>
  let mockRemove: ReturnType<typeof vi.fn>

  // Valid seed values — these simulate what storage.get()
  // returns AFTER a safe JSON.parse. The mock get() returns
  // these directly (no parse).
  const validUser = JSON.stringify({
    _id: 'u1',
    email: 'a@b.c',
    balance: 0
  })
  const validActiveCompany = JSON.stringify({
    _id: 'c1',
    name: 'Co'
  })
  const validOtherCompanies = JSON.stringify([{ _id: 'c2', name: 'Other' }])

  function seedValid() {
    mockStorage['auth_token'] = 'tok-1'
    localStorage.setItem('auth_token', JSON.stringify('tok-1'))
    mockStorage['auth_user'] = validUser
    localStorage.setItem('auth_user', validUser)
    mockStorage['auth_active_company'] = validActiveCompany
    localStorage.setItem('auth_active_company', validActiveCompany)
    mockStorage['auth_other_companies'] = validOtherCompanies
    localStorage.setItem('auth_other_companies', validOtherCompanies)
    mockStorage['auth_last_profile_fetch'] = '1700000000000'
    localStorage.setItem('auth_last_profile_fetch', JSON.stringify('1700000000000'))
  }

  function clearMockStorage() {
    const keys = Object.keys(mockStorage)
    keys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(mockStorage, key)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete mockStorage[key]
      }
    })
  }

  function allKeysAbsent(): boolean {
    return AUTH_KEYS.every(k => mockStorage[k] === undefined)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    clearMockStorage()
    setActivePinia(createPinia())
    store = useAuthStore()
    mockRemove = vi.fn((key: string) => {
      const keys = Object.keys(mockStorage)
      keys.forEach(k => {
        if (k === key && Object.prototype.hasOwnProperty.call(mockStorage, k)) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete mockStorage[k]
        }
      })
    })
    // Override the global mock's remove to track calls
    const prevGet = global.useStorage().get
    const prevSet = global.useStorage().set
    const prevClear = global.useStorage().clear
    global.useStorage = () => ({
      get: prevGet,
      set: prevSet,
      remove: mockRemove,
      clear: prevClear
    })
  })

  it('hydrates all fields when all keys are valid', () => {
    seedValid()
    store.initializeAuth()
    expect(store.token).toBe('tok-1')
    expect(store.user).toBeTruthy()
    expect(store.activeCompany).toBeTruthy()
    expect(store.otherCompanies.length).toBeGreaterThan(0)
    expect(store.lastProfileFetch).toBeGreaterThan(0)
    // All keys still present
    AUTH_KEYS.forEach(k => {
      expect(mockStorage[k]).toBeDefined()
    })
  })

  it('stays at initial values when no keys exist', () => {
    store.initializeAuth()
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.activeCompany).toBeNull()
    expect(store.otherCompanies).toEqual([])
    expect(store.lastProfileFetch).toBe(0)
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('hydrates token only when others are missing', () => {
    mockStorage['auth_token'] = 'tok-1'
    localStorage.setItem('auth_token', JSON.stringify('tok-1'))
    store.initializeAuth()
    expect(store.token).toBe('tok-1')
    expect(store.user).toBeNull()
    // No reset triggered — remove not called
    expect(mockRemove).not.toHaveBeenCalled()
  })

  // Corruption in any auth key triggers full logout
  // and clears all auth-related storage keys.

  it('corrupt auth_user triggers full reset ' + '(all keys removed)', () => {
    seedValid()
    mockStorage['auth_user'] = '{not-json'
    localStorage.setItem('auth_user', '{not-json')
    store.initializeAuth()
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.activeCompany).toBeNull()
    expect(allKeysAbsent()).toBe(true)
  })

  it('corrupt auth_active_company triggers full reset', () => {
    seedValid()
    mockStorage['auth_active_company'] = '{bad'
    localStorage.setItem('auth_active_company', '{bad')
    store.initializeAuth()
    expect(store.token).toBeNull()
    expect(allKeysAbsent()).toBe(true)
  })

  it('corrupt auth_other_companies triggers full reset', () => {
    seedValid()
    mockStorage['auth_other_companies'] = '[broken'
    localStorage.setItem('auth_other_companies', '[broken')
    store.initializeAuth()
    expect(store.token).toBeNull()
    expect(allKeysAbsent()).toBe(true)
  })

  it('corrupt auth_last_profile_fetch triggers full reset', () => {
    seedValid()
    mockStorage['auth_last_profile_fetch'] = 'NaN-bad'
    localStorage.setItem('auth_last_profile_fetch', 'NaN-bad')
    store.initializeAuth()
    expect(store.token).toBeNull()
    expect(allKeysAbsent()).toBe(true)
  })

  it('corrupt inner user JSON triggers full reset', () => {
    seedValid()
    // Valid outer string, invalid inner JSON
    const corruptValue = JSON.stringify('{not-json-inner')
    mockStorage['auth_user'] = corruptValue
    localStorage.setItem('auth_user', corruptValue)
    store.initializeAuth()
    expect(store.token).toBeNull()
    expect(allKeysAbsent()).toBe(true)
  })
})
