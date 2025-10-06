import type { User, Company } from '../../shared/types'
import { retry } from '~/utils/helpers'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const activeCompany = ref<Company | null>(null)
  const otherCompanies = ref<Company[]>([])
  const lastProfileFetch = ref<number>(0)
  const profileFetchPromise = ref<Promise<unknown> | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  // Computed properties for easy ID access
  const userId = computed(() => user.value?._id || user.value?.id)
  const companyId = computed(
    () => activeCompany.value?._id || activeCompany.value?.id
  )
  const otherCompanyIds = computed(() =>
    otherCompanies.value.map(c => c._id || c.id)
  )
  const userEmail = computed(() => user.value?.email)
  const userCredits = computed(() => user.value?.balance || 0)

  // Profile caching - increased to 10 minutes as per requirements
  const PROFILE_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
  const shouldRefetchProfile = computed(() => {
    return Date.now() - lastProfileFetch.value > PROFILE_CACHE_DURATION
  })

  const setUser = (userData: User | null) => {
    user.value = userData
    const storage = useStorage()
    if (userData) {
      storage.set('auth_user', JSON.stringify(userData))
    } else {
      storage.remove('auth_user')
    }
  }

  const setToken = (tokenValue: string) => {
    token.value = tokenValue
    const storage = useStorage()
    storage.set('auth_token', tokenValue)
  }

  const setActiveCompany = (companyData: Company | null) => {
    activeCompany.value = companyData
    const storage = useStorage()
    if (companyData) {
      storage.set('auth_active_company', JSON.stringify(companyData))
    } else {
      storage.remove('auth_active_company')
    }
  }

  const setOtherCompanies = (companies: Company[]) => {
    otherCompanies.value = companies
    const storage = useStorage()
    storage.set('auth_other_companies', JSON.stringify(companies))
  }

  const logout = () => {
    user.value = null
    token.value = null
    activeCompany.value = null
    otherCompanies.value = []
    lastProfileFetch.value = 0
    const storage = useStorage()
    storage.remove('auth_token')
    storage.remove('auth_user')
    storage.remove('auth_active_company')
    storage.remove('auth_other_companies')
    storage.remove('auth_last_profile_fetch')
  }

  const initializeAuth = () => {
    const storage = useStorage()
    const savedToken = storage.get<string>('auth_token')
    const savedUser = storage.get<string>('auth_user')
    const savedActiveCompany = storage.get<string>('auth_active_company')
    const savedOtherCompanies = storage.get<string>('auth_other_companies')
    const savedLastProfileFetch = storage.get<string>(
      'auth_last_profile_fetch'
    )

    if (savedToken) {
      token.value = savedToken
    }

    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to parse saved user data:', error)
        storage.remove('auth_user')
      }
    }

    if (savedActiveCompany) {
      try {
        activeCompany.value = JSON.parse(savedActiveCompany)
      } catch (error) {
        console.error('Failed to parse saved active company data:', error)
        storage.remove('auth_active_company')
      }
    }

    if (savedOtherCompanies) {
      try {
        otherCompanies.value = JSON.parse(savedOtherCompanies)
      } catch (error) {
        console.error('Failed to parse saved other companies data:', error)
        storage.remove('auth_other_companies')
      }
    }

    if (savedLastProfileFetch) {
      try {
        lastProfileFetch.value = parseInt(savedLastProfileFetch) || 0
      } catch (error) {
        console.error('Failed to parse saved last profile fetch time:', error)
        storage.remove('auth_last_profile_fetch')
      }
    }
  }

  /**
   * Normalize server response to handle id/_id inconsistencies
   * MongoDB returns _id but some frontend code expects id field
   * This ensures both fields are present for backward compatibility
   * @param entity - Entity with potential id/_id fields
   * @returns Normalized entity with both id and _id fields
   */
  const normalizeEntity = <T extends { _id?: string; id?: string | number }>(
    entity: T
  ): T => {
    if (!entity) return entity
    // Ensure both id and _id are present for backward compatibility
    if (entity._id && !entity.id) {
      return { ...entity, id: entity._id }
    }
    if (entity.id && !entity._id) {
      return { ...entity, _id: String(entity.id) }
    }
    return entity
  }

  /**
   * Normalize arrays of entities
   */
  const normalizeEntityArray = <
    T extends { _id?: string; id?: string | number }
  >(
    entities: T[]
  ): T[] => {
    if (!Array.isArray(entities)) return []
    return entities.map(normalizeEntity)
  }

  /**
   * Set all profile state atomically from normalized response
   */
  const setProfileState = (
    profile: import('../composables/api/repositories/ProfileRepository').ProfileResponse
  ) => {
    // Normalize and set user
    const normalizedUser = normalizeEntity(profile.user)
    setUser(normalizedUser)

    // Normalize and set active company
    const normalizedActiveCompany = profile.active_company?.company
      ? normalizeEntity(profile.active_company.company)
      : null
    setActiveCompany(normalizedActiveCompany)

    // Normalize and set other companies
    const normalizedOtherCompanies = normalizeEntityArray(
      profile.other_companies || []
    )
    setOtherCompanies(normalizedOtherCompanies)

    // Store role information if present
    if (profile.active_company) {
      // Store admins, managers, operators in localStorage for sync access
      try {
        const storage = useStorage()
        const roleData = JSON.stringify({
          admins: normalizeEntityArray(profile.active_company.admins || []),
          managers: normalizeEntityArray(
            profile.active_company.managers || []
          ),
          operators: normalizeEntityArray(
            profile.active_company.operators || []
          )
        })

        // Check if data size is reasonable (< 100KB)
        if (roleData.length > 100000) {
          console.warn(
            '[AUTH] Role data too large for localStorage, storing summary only'
          )
          // Store only IDs if data is too large
          const summaryData = JSON.stringify({
            admins: (profile.active_company.admins || []).map(
              a => a._id || String(a.id)
            ),
            managers: (profile.active_company.managers || []).map(
              m => m._id || String(m.id)
            ),
            operators: (profile.active_company.operators || []).map(
              o => o._id || String(o.id)
            )
          })
          storage.set('auth_active_company_roles', summaryData)
        } else {
          storage.set('auth_active_company_roles', roleData)
        }
      } catch (error) {
        // Handle localStorage errors (quota exceeded, disabled, etc.)
        if (error instanceof Error) {
          if (error.name === 'QuotaExceededError') {
            console.error(
              '[AUTH] localStorage quota exceeded, clearing old data'
            )
            try {
              const storage = useStorage()
              // Clear old data to make room
              storage.remove('auth_active_company_roles')
              // Try once more with minimal data
              const minimalData = JSON.stringify({
                admins: [],
                managers: [],
                operators: []
              })
              storage.set('auth_active_company_roles', minimalData)
            } catch {
              console.error('[AUTH] Unable to store role data in localStorage')
            }
          } else {
            console.error('[AUTH] Failed to store role data:', error.message)
          }
        }
      }
    }
  }

  /**
   * Centralized profile fetching using single API call
   * Uses /profiles/me as the primary endpoint for all logged-in user data
   * Implements concurrency control with memoized promises to prevent race conditions
   *
   * Features:
   * - Returns existing promise if fetch is already in progress
   * - Auto-selects first company if no active_company is set
   * - Normalizes all entities to handle id/_id inconsistencies
   * - Updates localStorage cache with 10-minute expiration
   * - Implements retry logic for company selection (3 attempts)
   *
   * @returns Promise with user, profile, activeCompany, and otherCompanies
   * @throws Error if profile fetch fails after retries
   */
  const fetchProfile = async () => {
    const { ProfileRepository } = await import(
      '../composables/api/repositories/ProfileRepository'
    )

    // If there's already a fetch in progress, return the existing promise
    if (profileFetchPromise.value) {
      return profileFetchPromise.value
    }

    // Create new fetch promise with cleanup safeguards
    profileFetchPromise.value = (async () => {
      let cleanupDone = false
      try {
        // Single API call - /profiles/me includes all user data
        // and company information
        const profileRepository = new ProfileRepository()
        const profile = await profileRepository.getCurrentProfile()

        // Auto-select first company if no active_company is set
        if (
          !profile.active_company?.company &&
          profile.other_companies?.length > 0
        ) {
          // No active company found, auto-selecting first available

          // Get the first company ID (handle both _id and id fields)
          const firstCompany = profile.other_companies[0]
          const firstCompanyId = firstCompany
            ? firstCompany._id || firstCompany.id
            : null

          if (!firstCompanyId) {
            console.error('[AUTH] First company has no valid ID')
            // Fallback: set company locally without API update
            setProfileState(profile)
          } else {
            try {
              // Switching to company

              // Try to switch company with retry mechanism
              const updatedProfile = await retry(
                () => profileRepository.switchCompany(String(firstCompanyId)),
                3, // max retries
                1000 // delay between attempts
              )

              // Successfully auto-selected company
              console.log('[AUTH] Successfully auto-selected company')

              // Update state from fresh response
              setProfileState(updatedProfile)
            } catch (error) {
              console.error('[AUTH] Failed to auto-select company:', error)

              // Fallback: set company locally without API update
              // Using local fallback for company selection
              // Manually construct the active_company structure
              const fallbackProfile: import('../composables/api/repositories/ProfileRepository').ProfileResponse =
                {
                  ...profile,
                  active_company: {
                    company: firstCompany!,
                    metrics: {
                      today: {},
                      week: {},
                      month: {}
                    },
                    tasks: [],
                    devices: [],
                    spaces: [],
                    admins: [],
                    managers: [],
                    operators: []
                  }
                }
              console.log('[AUTH] Using local fallback for company selection')
              setProfileState(fallbackProfile)
            }
          }
        } else {
          // Original behavior preserved - active company exists or no companies
          setProfileState(profile)
        }

        // Update last fetch time
        lastProfileFetch.value = Date.now()
        const storage = useStorage()
        const fetchTimeStr = lastProfileFetch.value.toString()
        storage.set('auth_last_profile_fetch', fetchTimeStr)

        return {
          user: user.value,
          profile,
          activeCompany: activeCompany.value,
          otherCompanies: otherCompanies.value
        }
      } catch (error) {
        console.error('[AUTH] Failed to fetch profile:', error)
        // Ensure cleanup happens even on error
        if (!cleanupDone) {
          profileFetchPromise.value = null
          cleanupDone = true
        }
        throw error
      } finally {
        // Clear the promise reference when done (safeguard against double cleanup)
        if (!cleanupDone) {
          profileFetchPromise.value = null
          cleanupDone = true
        }
      }
    })()

    return profileFetchPromise.value
  }

  /**
   * Ensure profile data is available (fetch if needed)
   * Used by auth middleware to bootstrap profile before route rendering
   * This prevents components from needing to check/fetch profile data
   *
   * Fetches profile if:
   * - force=true (manual refresh requested)
   * - No user data exists
   * - Profile cache is stale (>10 minutes old)
   * - User has companies but no active company selected
   *
   * @param force - Force refresh even if cache is valid
   * @returns Object with user, activeCompany, and otherCompanies
   * @throws Error if user is not authenticated
   */
  const ensureProfileData = async (force = false) => {
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated')
    }

    // Fetch if forced, no user, profile is stale, or activeCompany is missing
    const needsFetch =
      force ||
      !user.value ||
      shouldRefetchProfile.value ||
      (user.value && !activeCompany.value && otherCompanies.value.length > 0)

    if (needsFetch) {
      await fetchProfile()
    }

    return {
      user: user.value,
      activeCompany: activeCompany.value,
      otherCompanies: otherCompanies.value
    }
  }

  /**
   * Public method to refresh profile data
   * Wrapper around ensureProfileData for external use
   *
   * Use cases:
   * - Manual refresh triggered by user action
   * - After company switch or role changes
   * - When returning from background (mobile apps)
   *
   * @param options - Optional configuration
   * @param options.force - Force refresh even if cache is valid
   * @returns Promise with updated profile data
   */
  const refreshProfile = async (options?: { force?: boolean }) => {
    return ensureProfileData(options?.force ?? false)
  }

  return {
    user: readonly(user),
    token: readonly(token),
    activeCompany: readonly(activeCompany),
    otherCompanies: readonly(otherCompanies),
    userId: readonly(userId),
    companyId: readonly(companyId),
    otherCompanyIds: readonly(otherCompanyIds),
    userEmail: readonly(userEmail),
    userCredits: readonly(userCredits),
    lastProfileFetch: readonly(lastProfileFetch),
    shouldRefetchProfile: readonly(shouldRefetchProfile),
    isAuthenticated,
    setUser,
    setToken,
    setActiveCompany,
    setOtherCompanies,
    logout,
    initializeAuth,
    fetchProfile,
    ensureProfileData,
    refreshProfile
  }
})
