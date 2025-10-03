import { debounce } from 'lodash-es'
import type {
  ProductFormData,
  WantedFormData
} from '~/utils/validation/listingSchemas'

export type ListingType = 'product' | 'wanted'
export type ListingFormData = ProductFormData | WantedFormData

interface UseListingCreationOptions {
  type: ListingType
  onSuccess?: (listingId: string) => void
  onError?: (error: Error) => void
}

export const useListingCreation = (options: UseListingCreationOptions) => {
  const { type, onSuccess, onError } = options
  const authStore = useAuthStore()
  const router = useRouter()
  const localePath = useLocalePath()
  let t: (key: string, params?: any) => string
  try {
    const { $i18n } = useNuxtApp()
    t = $i18n.t
  } catch {
    // Fallback for unit tests where useNuxtApp may not be available
    // @ts-ignore
    const i18n = typeof useI18n === 'function' ? useI18n() : null
    // @ts-ignore
    t = i18n?.t || ((k: string) => k)
  }

  // State
  const isSubmitting = ref(false)
  const isSaving = ref(false)
  const hasUnsavedChanges = ref(false)
  const lastSavedData = ref<ListingFormData | null>(null)
  const saveError = ref<string | null>(null)

  // Storage key for auto-save
  const STORAGE_KEY = `listing_draft_${type}_${authStore.user?.id || 'anon'}`

  // Check if user has permission to create listings
  // Uses synchronous role check from useUserRole
  const { canCreateListings } = useUserRole()
  const hasPermission = computed(() => {
    return canCreateListings()
  })

  // Load draft from localStorage
  const loadDraft = (): ListingFormData | null => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        // Validate the data structure matches expected type
        if (parsed && typeof parsed === 'object') {
          lastSavedData.value = parsed
          return parsed
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return null
  }

  // Save draft to localStorage
  const saveDraft = (data: ListingFormData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      lastSavedData.value = data
      isSaving.value = false
      saveError.value = null
    } catch (error) {
      console.error('Failed to save draft:', error)
      saveError.value = 'Failed to save draft'
      isSaving.value = false
    }
  }

  // Debounced save function (1 second delay)
  const debouncedSave = debounce((data: ListingFormData) => {
    isSaving.value = true
    saveDraft(data)
  }, 1000)

  // Auto-save function
  const autoSave = (data: ListingFormData) => {
    hasUnsavedChanges.value = true
    debouncedSave(data)
  }

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      lastSavedData.value = null
      hasUnsavedChanges.value = false
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }

  // Create FormData for API submission
  const createFormData = (data: ListingFormData): FormData => {
    const formData = new FormData()

    // Required fields
    if (data.title) formData.append('title', data.title)
    if (data.category) formData.append('category', data.category)
    if (data.subcategory) formData.append('subcategory', data.subcategory)
    if (data.price !== undefined) formData.append('price', data.price.toString())
    if (data.price_currency) formData.append('price_currency', data.price_currency)
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString())
    if (data.quantity_unit) formData.append('quantity_unit', data.quantity_unit)

    // Countries - append each country separately
    if (data.countries && Array.isArray(data.countries)) {
      data.countries.forEach(country => {
        formData.append('countries', country)
      })
    }

    // Optional fields
    if (data.description) formData.append('description', data.description)
    if (data.additional_info) formData.append('additional_info', data.additional_info)
    if (data.contact_email) formData.append('contact_email', data.contact_email)

    // Images (if any)
    if (data.images) {
      const files = data.images as File[]
      files.forEach((file) => {
        formData.append('images', file)
      })
    }

    return formData
  }

  // Submit listing
  const submitListing = async (data: ListingFormData) => {
    if (!authStore.isAuthenticated) {
      throw new Error(t('errors.not_authenticated'))
    }

    // Check permission synchronously
    if (!canCreateListings()) {
      throw new Error(t('marketplace.no_company_permission'))
    }

    // Get company ID directly from store (already normalized)
    const companyId = authStore.companyId

    if (!companyId) {
      throw new Error(t('marketplace.company_id_missing'))
    }

    isSubmitting.value = true
    saveError.value = null

    try {
      // Create FormData with all fields including images
      const formData = createFormData(data)

      // Call API to create listing with company ID in URL path
      const config = useRuntimeConfig()
      const endpoints = useApiEndpoints()
      const endpoint = type === 'product'
        ? `${endpoints.marketProducts}/${companyId}`
        : `${endpoints.marketWanted}/${companyId}`

      // Use $fetch directly for FormData (don't set Content-Type)
      const response = await $fetch(`${config.public.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${authStore.token}`
          // Don't set Content-Type - browser will set it with boundary
        }
      })

      // Clear draft on successful submission
      clearDraft()

      // Call success callback if provided
      const responseData = response as { status?: string }
      if (onSuccess) {
        // Generate a temporary ID since backend doesn't return one
        onSuccess('success')
      }

      // Show success message
      const toast = useToast()
      await toast.showSuccess(t(`marketplace.${type}_created_success`))

      // Navigate to my listings page after creation
      await router.push(localePath('/my-listings'))

      return response
    } catch (error) {
      console.error('Failed to create listing:', error)
      saveError.value = error instanceof Error
        ? error.message
        : t('errors.generic')

      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error'))
      }

      // Show error toast
      const toast = useToast()
      await toast.showError(saveError.value || t('errors.generic'))

      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  // Navigation guard for unsaved changes
  const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
  }

  // Setup navigation guards
  const setupNavigationGuards = () => {
    // Browser unload event
    window.addEventListener('beforeunload', beforeUnloadHandler)

    // Vue router navigation guard
    const removeGuard = router.beforeEach((to, from, next) => {
      if (hasUnsavedChanges.value && from.path.includes('/create/')) {
        const confirmed = window.confirm(
          t('common.unsavedChangesConfirm')
        )
        if (confirmed) {
          clearDraft()
          next()
        } else {
          next(false)
        }
      } else {
        next()
      }
    })

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
      removeGuard()
    }
  }

  // Validate images
  const validateImages = (files: File[]): string | null => {
    const MAX_FILES = 5
    const MAX_SIZE_PER_FILE = 10 * 1024 * 1024 // 10MB
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ]

    if (files.length > MAX_FILES) {
      return t('marketplace.images_max_files', { max: MAX_FILES })
    }

    let totalSize = 0
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return t('marketplace.images_invalid_type', { name: file.name })
      }
      if (file.size > MAX_SIZE_PER_FILE) {
        return t('marketplace.images_too_large', {
          name: file.name,
          max: '10MB'
        })
      }
      totalSize += file.size
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return t('marketplace.images_total_too_large', { max: '50MB' })
    }

    return null
  }

  return {
    // State
    hasPermission: readonly(hasPermission),
    isSubmitting: readonly(isSubmitting),
    isSaving: readonly(isSaving),
    hasUnsavedChanges: readonly(hasUnsavedChanges),
    saveError: readonly(saveError),

    // Methods
    loadDraft,
    autoSave,
    clearDraft,
    submitListing,
    setupNavigationGuards,
    validateImages,
    createFormData
  }
}