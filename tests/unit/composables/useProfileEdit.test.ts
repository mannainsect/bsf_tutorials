import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore as realUseAuthStore } from '~/stores/auth'
import { useProfileEdit } from '~/composables/useProfileEdit'
import { UserService } from '~/composables/api/services/UserService'

// Create a shared form state for vee-validate mocks
let mockFormValues: Record<string, unknown> = {}
let mockFieldRefs: Record<string, unknown> = {}
const mockFormMeta = ref({ valid: true, dirty: false, touched: false })

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => {
    const formInstance = {
      get values() {
        return mockFormValues
      },
      meta: mockFormMeta,
      setValues: (values: Record<string, unknown>) => {
        mockFormValues = {}
        Object.assign(mockFormValues, values)
        Object.keys(values).forEach(key => {
          if (mockFieldRefs[key]) {
            ;(mockFieldRefs[key] as { value: unknown }).value = values[key]
          }
        })
      },
      resetForm: (opts?: { values?: Record<string, unknown> }) => {
        if (opts?.values) {
          mockFormValues = {}
          Object.assign(mockFormValues, opts.values)
          Object.keys(opts.values).forEach(key => {
            if (mockFieldRefs[key]) {
              ;(mockFieldRefs[key] as { value: unknown }).value = opts.values[key]
            }
          })
        }
      },
      setFieldValue: (name: string, value: unknown) => {
        mockFormValues[name] = value
        if (mockFieldRefs[name]) {
          ;(mockFieldRefs[name] as { value: unknown }).value = value
        }
      },
      handleSubmit: (fn: (...args: unknown[]) => unknown) => fn
    }
    return formInstance
  }),
  useField: vi.fn((name: string) => {
    if (!mockFieldRefs[name]) {
      const fieldRef = ref('')
      mockFieldRefs[name] = fieldRef

      const originalSetter = Object.getOwnPropertyDescriptor(fieldRef, 'value')?.set
      Object.defineProperty(fieldRef, 'value', {
        get() {
          return mockFormValues[name] ?? ''
        },
        set(newValue) {
          mockFormValues[name] = newValue
          if (originalSetter) {
            originalSetter.call(fieldRef, newValue)
          }
        }
      })
    }
    return {
      value: mockFieldRefs[name],
      errorMessage: ref(undefined)
    }
  })
}))

// Mock @vee-validate/zod
vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn(schema => schema)
}))

// Mock UserService
vi.mock('~/composables/api/services/UserService')

// Mock useErrorHandler
vi.mock('~/composables/errors/useErrorHandler', () => ({
  useErrorHandler: () => ({
    normalizeError: vi.fn((error: unknown) => error),
    handleError: vi.fn((error: unknown) => error),
    handleApiError: vi.fn((error: unknown) => error),
    handleValidationError: vi.fn((error: unknown) => error),
    handleSilentError: vi.fn((error: unknown) => error)
  })
}))

describe('useProfileEdit', () => {
  let authStore: ReturnType<typeof realUseAuthStore>
  const mockRefreshProfile = vi.fn().mockResolvedValue({})

  const mockUser = {
    _id: 'user1',
    id: 'user1',
    name: 'Test User',
    email: 'test@test.com',
    city: 'Test City',
    country: 'US'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock form state
    mockFormValues = {}
    mockFieldRefs = {}
    mockFormMeta.value = {
      valid: true,
      dirty: false,
      touched: false
    }

    setActivePinia(createPinia())

    global.useAuthStore = realUseAuthStore
    authStore = realUseAuthStore()
    authStore.setToken('test-token')
    authStore.setUser(mockUser)

    // Override useProfile
    global.useProfile = () =>
      ({
        user: computed(() => mockUser),
        activeCompany: computed(() => null),
        userId: computed(() => mockUser._id),
        companyId: computed(() => ''),
        refreshProfile: mockRefreshProfile
      }) as ReturnType<typeof useProfile>

    // Override useToast
    global.useToast = () =>
      ({
        create: vi.fn().mockResolvedValue({
          present: vi.fn()
        })
      }) as ReturnType<typeof useToast>
  })

  it('startEdit toggles isEditing', () => {
    const { startEdit, isEditing } = useProfileEdit()

    expect(isEditing.value).toBe(false)
    startEdit()
    expect(isEditing.value).toBe(true)
  })

  it('empty name produces nameError', () => {
    const { startEdit, name, hasErrors } = useProfileEdit()

    startEdit()
    name.value = ''
    mockFormMeta.value = {
      valid: false,
      dirty: true,
      touched: true
    }

    expect(hasErrors.value).toBe(true)
  })

  it('handleSubmit posts only dirty fields', async () => {
    const mockUpdateCurrentUser = vi.fn().mockResolvedValue({ user: mockUser })

    vi.mocked(UserService).mockImplementation(
      () =>
        ({
          updateCurrentUser: mockUpdateCurrentUser
        }) as unknown as UserService
    )

    const { startEdit, name, saveProfile } = useProfileEdit()

    startEdit()
    name.value = 'Updated Name'
    await saveProfile()

    expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
      name: 'Updated Name'
    })
  })
})
