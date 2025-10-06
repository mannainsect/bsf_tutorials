import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore as realUseAuthStore } from '~/stores/auth'
import { useCompanyEdit } from '~/composables/useCompanyEdit'
import { CompanyRepository } from '~/composables/api/repositories/CompanyRepository'
import type { Company } from '~/shared/types'

// Create a shared form state for vee-validate mocks
let mockFormValues: Record<string, any> = {}
let mockFieldRefs: Record<string, any> = {}
let mockFormMeta = ref({ valid: true, dirty: false, touched: false })

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => {
    const formInstance = {
      get values() {
        return mockFormValues
      },
      meta: mockFormMeta,
      setValues: (values: any) => {
        Object.keys(mockFormValues).forEach(key => {
          delete mockFormValues[key]
        })
        Object.assign(mockFormValues, values)
        Object.keys(values).forEach(key => {
          if (mockFieldRefs[key]) {
            mockFieldRefs[key].value = values[key]
          }
        })
      },
      resetForm: (opts?: any) => {
        if (opts?.values) {
          Object.keys(mockFormValues).forEach(key => {
            delete mockFormValues[key]
          })
          Object.assign(mockFormValues, opts.values)
          Object.keys(opts.values).forEach(key => {
            if (mockFieldRefs[key]) {
              mockFieldRefs[key].value = opts.values[key]
            }
          })
        }
      },
      setFieldValue: (name: string, value: any) => {
        mockFormValues[name] = value
        if (mockFieldRefs[name]) {
          mockFieldRefs[name].value = value
        }
      },
      handleSubmit: (fn: any) => fn
    }
    return formInstance
  }),
  useField: vi.fn((name: string) => {
    if (!mockFieldRefs[name]) {
      const fieldRef = ref('')
      mockFieldRefs[name] = fieldRef

      // Watch for changes to the ref and update form values
      const originalSetter = Object.getOwnPropertyDescriptor(
        fieldRef,
        'value'
      )?.set
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

// Mock CompanyRepository
vi.mock('~/composables/api/repositories/CompanyRepository')

describe('useCompanyEdit', () => {
  let authStore: ReturnType<typeof realUseAuthStore>
  let mockCompany: Company

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock form state
    mockFormValues = {}
    mockFieldRefs = {}
    mockFormMeta.value = { valid: true, dirty: false, touched: false }

    setActivePinia(createPinia())

    // Override global auth store with real one
    global.useAuthStore = realUseAuthStore
    authStore = realUseAuthStore()
    authStore.setToken('test-token')

    mockCompany = {
      _id: 'comp1',
      id: 'comp1',
      name: 'Test Company',
      street: '123 Test St',
      city: 'Test City',
      country: 'US',
      timezone: 'UTC',
      business_id: 'BIZ123'
    }

    authStore.setUser({
      _id: 'user1',
      id: 'user1',
      email: 'test@test.com'
    })
    authStore.setActiveCompany(mockCompany)

    // Override useProfile to return mock company
    global.useProfile = () =>
      ({
        activeCompany: computed(() => mockCompany),
        user: computed(() => authStore.user),
        userId: computed(() => authStore.userId),
        companyId: computed(() => authStore.companyId)
      }) as any

    // Override useUserRole to return admin permissions
    global.useUserRole = () =>
      ({
        isCompanyAdmin: vi.fn(() => true),
        isCompanyManager: vi.fn(() => false)
      }) as any
  })

  it('should allow admin to start editing', () => {
    const { startEdit, isEditing } = useCompanyEdit()

    expect(isEditing.value).toBe(false)
    startEdit()
    expect(isEditing.value).toBe(true)
  })

  it('should prevent non-admin from starting edit', () => {
    // Override to return false for both checks
    global.useUserRole = () =>
      ({
        isCompanyAdmin: vi.fn(() => false),
        isCompanyManager: vi.fn(() => false)
      }) as any

    const { startEdit, isEditing, error } = useCompanyEdit()

    startEdit()
    expect(isEditing.value).toBe(false)
    expect(error.value).toBeTruthy()
  })

  it('should save company and refresh profile', async () => {
    const mockUpdateCompany = vi.fn().mockResolvedValue({})
    const mockRefreshProfile = vi.fn().mockResolvedValue({})
    const mockShowSuccess = vi.fn()

    vi.mocked(CompanyRepository).mockImplementation(
      () =>
        ({
          updateCompany: mockUpdateCompany
        }) as any
    )

    authStore.refreshProfile = mockRefreshProfile

    global.useToast = () =>
      ({
        showSuccess: mockShowSuccess,
        showError: vi.fn()
      }) as any

    const { startEdit, name, saveCompany } = useCompanyEdit()

    startEdit()
    name.value = 'Updated Company'
    await saveCompany()

    expect(mockUpdateCompany).toHaveBeenCalledWith('comp1', {
      name: 'Updated Company'
    })
    expect(mockRefreshProfile).toHaveBeenCalledWith({ force: true })
    expect(mockShowSuccess).toHaveBeenCalled()
  })

  it('should handle save errors', async () => {
    const mockError = new Error('Save failed')
    const mockUpdateCompany = vi.fn().mockRejectedValue(mockError)
    const mockShowError = vi.fn()

    vi.mocked(CompanyRepository).mockImplementation(
      () =>
        ({
          updateCompany: mockUpdateCompany
        }) as any
    )

    global.useToast = () =>
      ({
        showSuccess: vi.fn(),
        showError: mockShowError
      }) as any

    const { startEdit, name, saveCompany } = useCompanyEdit()

    startEdit()
    name.value = 'Updated Company'
    await saveCompany()

    expect(mockShowError).toHaveBeenCalled()
  })

  it('should only send changed fields', async () => {
    const mockUpdateCompany = vi.fn().mockResolvedValue({})

    vi.mocked(CompanyRepository).mockImplementation(
      () =>
        ({
          updateCompany: mockUpdateCompany
        }) as any
    )

    authStore.refreshProfile = vi.fn().mockResolvedValue({})

    const { startEdit, city, saveCompany } = useCompanyEdit()

    startEdit()
    city.value = 'New City'
    await saveCompany()

    expect(mockUpdateCompany).toHaveBeenCalledWith('comp1', {
      city: 'New City'
    })
  })
})
