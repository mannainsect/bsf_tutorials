import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed } from 'vue'
import { useListingCreation } from '~/composables/useListingCreation'
import type { ProductFormData, WantedFormData } from '~/utils/validation/listingSchemas'
global.useI18n = vi.fn(() => ({
  t: vi.fn((key: string) => key)
}))
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn)
}))
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://api.test'
  }
}))
global.$fetch = vi.fn()
describe('useListingCreation', () => {
  let mockAuthStore: any
  let mockRouter: any
  let mockApi: any
  let mockToast: any
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    const userRef = ref({ id: 'user-123', _id: 'user-123', email: 'test@test.com' })
    const activeCompanyRef = ref({ id: 'company-123', _id: 'company-123', name: 'Test Company' })
    const isAuthenticatedRef = ref(true)
    const tokenRef = ref('test-token')
    mockAuthStore = {
      get user() { return userRef.value },
      get isAuthenticated() { return isAuthenticatedRef.value },
      get activeCompany() { return activeCompanyRef.value },
      get userId() { return userRef.value?._id || userRef.value?.id },
      get companyId() { return activeCompanyRef.value?._id || activeCompanyRef.value?.id },
      get token() { return tokenRef.value },
      set user(val) { userRef.value = val },
      set isAuthenticated(val) { isAuthenticatedRef.value = val },
      set activeCompany(val) { activeCompanyRef.value = val },
      set token(val) { tokenRef.value = val },
      fetchProfile: vi.fn()
    }
    mockRouter = {
      push: vi.fn(),
      beforeEach: vi.fn((guard) => {
        return vi.fn()
      })
    }
    mockApi = vi.fn()
    mockToast = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn()
      }),
      showSuccess: vi.fn().mockResolvedValue(undefined),
      showError: vi.fn().mockResolvedValue(undefined),
      showWarning: vi.fn().mockResolvedValue(undefined),
      showInfo: vi.fn().mockResolvedValue(undefined)
    }
    global.useAuthStore = vi.fn(() => mockAuthStore)
    global.useRouter = vi.fn(() => mockRouter)
    global.useLocalePath = vi.fn(() => (path: string) => path)
    global.useApi = vi.fn(() => ({ api: mockApi }))
    global.useApiEndpoints = vi.fn(() => ({
      marketProducts: '/market/products',
      marketWanted: '/market/wanted'
    }))
    global.useToast = vi.fn(() => mockToast)
  })
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  global.useUserRole = vi.fn(() => ({
    canCreateListings: vi.fn(() => {
      if (!mockAuthStore.isAuthenticated) return false
      const company = mockAuthStore.activeCompany
      return !!(company && (company.id || company._id))
    }),
    isAdmin: vi.fn(() => false),
    isManager: vi.fn(() => false),
    isOperator: vi.fn(() => true),
    hasRole: vi.fn(() => true)
  }))
  describe('Permission validation', () => {
    it('should handle both id and _id fields for company', () => {
      mockAuthStore.activeCompany = {
        id: 'company-123',
        name: 'Test Company'
      }
      const { hasPermission } = useListingCreation({ type: 'product' })
      expect(hasPermission.value).toBe(true)
      mockAuthStore.activeCompany = {
        _id: 'company-456',
        name: 'Test Company 2'
      }
      const { hasPermission: hasPermission2 } = useListingCreation({ type: 'product' })
      expect(hasPermission2.value).toBe(true)
    })
    it('should handle company with both id and _id fields', () => {
      mockAuthStore.activeCompany = {
        id: 'company-123',
        _id: 'company-456',
        name: 'Test Company'
      }
      const { hasPermission } = useListingCreation({ type: 'product' })
      expect(hasPermission.value).toBe(true)
    })
    it('should return false when no company is set', () => {
      mockAuthStore.activeCompany = null
      const { hasPermission } = useListingCreation({ type: 'product' })
      expect(hasPermission.value).toBe(false)
    })
    it('should return false when company has no id or _id', () => {
      mockAuthStore.activeCompany = {
        name: 'Test Company'
      }
      const { hasPermission } = useListingCreation({ type: 'product' })
      expect(hasPermission.value).toBe(false)
    })
    it('should return false when not authenticated', () => {
      mockAuthStore.isAuthenticated = false
      mockAuthStore.activeCompany = {
        id: 'company-123',
        _id: 'company-123'
      }
      const { hasPermission } = useListingCreation({ type: 'product' })
      expect(hasPermission.value).toBe(false)
    })
    it('should NOT fetch profile when authenticated but no active company', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.activeCompany = null
      mockAuthStore.fetchProfile.mockResolvedValue({
        activeCompany: { id: 'company-123', _id: 'company-123' }
      })
      const { hasPermission } = useListingCreation({ type: 'product' })
      const permissionValue = hasPermission.value
      expect(mockAuthStore.fetchProfile).not.toHaveBeenCalled()
      expect(permissionValue).toBe(false)
    })
  })
  describe('Profile initialization', () => {
    it('should NOT fetch profile before submission if no active company', async () => {
      mockAuthStore.activeCompany = null
      const { submitListing } = useListingCreation({ type: 'product' })
      const formData: ProductFormData = {
        title: 'Test Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test description',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      await expect(submitListing(formData)).rejects.toThrow(
        'marketplace.no_company_permission'
      )
      expect(mockAuthStore.fetchProfile).not.toHaveBeenCalled()
      expect(global.$fetch).not.toHaveBeenCalled()
    })
    it('should handle missing company gracefully', async () => {
      mockAuthStore.activeCompany = null
      const { submitListing } = useListingCreation({ type: 'product' })
      const formData: ProductFormData = {
        title: 'Test Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      await expect(submitListing(formData)).rejects.toThrow(
        'marketplace.no_company_permission'
      )
      expect(mockAuthStore.fetchProfile).not.toHaveBeenCalled()
      expect(global.$fetch).not.toHaveBeenCalled()
    })
    it('should handle user with no companies', async () => {
      mockAuthStore.activeCompany = null
      const { submitListing } = useListingCreation({ type: 'product' })
      const formData: ProductFormData = {
        title: 'Test Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      await expect(submitListing(formData)).rejects.toThrow(
        'marketplace.no_company_permission'
      )
      expect(mockAuthStore.fetchProfile).not.toHaveBeenCalled()
      expect(global.$fetch).not.toHaveBeenCalled()
    })
  })
  describe('FormData creation', () => {
    it('should create FormData with all fields', () => {
      mockAuthStore.activeCompany = {
        id: 'company-123',
        _id: 'company-123',
        name: 'Test Company'
      }
      const { createFormData } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Test Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test description',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US', 'CA'],
        additional_info: 'Extra info',
        contact_email: 'test@test.com'
      }
      const formData = createFormData(data)
      expect(formData.get('company_id')).toBe(null)
      expect(formData.get('listing_type')).toBe(null)
      expect(formData.get('title')).toBe('Test Product')
      expect(formData.get('category')).toBe('bsf')
    })
    it('should handle wanted listing fields', () => {
      mockAuthStore.activeCompany = {
        _id: 'company-456',
        id: 'company-456',
        name: 'Test Company'
      }
      const { createFormData } = useListingCreation({ type: 'wanted' })
      const data: WantedFormData = {
        title: 'Test Wanted',
        category: 'frass',
        subcategory: 'frass_powder',
        description: 'Looking for frass',
        price: 100,
        price_currency: 'EUR',
        quantity: 5,
        quantity_unit: 'ton',
        countries: ['DE'],
        additional_info: '',
        contact_email: 'buyer@test.com'
      }
      const formData = createFormData(data)
      expect(formData.get('company_id')).toBe(null)
      expect(formData.get('listing_type')).toBe(null)
      expect(formData.get('title')).toBe('Test Wanted')
      expect(formData.get('price')).toBe('100')
    })
    it('should handle countries as array in FormData', () => {
      mockAuthStore.activeCompany = {
        id: 'company-123',
        _id: 'company-123',
        name: 'Test Company'
      }
      const { createFormData } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US', 'CA'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      const formData = createFormData(data)
      const countries = formData.getAll('countries')
      expect(countries).toEqual(['US', 'CA'])
    })
    it('should handle empty fields', () => {
      mockAuthStore.activeCompany = { id: 'company-123', _id: 'company-123' }
      const { createFormData } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: '',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: [],
        additional_info: '',
        contact_email: ''
      }
      const formData = createFormData(data)
      expect(formData.get('description')).toBe(null)
      const countries = formData.getAll('countries')
      expect(countries).toEqual([])
    })
    it('should handle image files correctly', () => {
      mockAuthStore.activeCompany = { id: 'company-123', _id: 'company-123' }
      const { createFormData } = useListingCreation({ type: 'product' })
      const mockFile1 = new File(['image1'], 'image1.jpg', { type: 'image/jpeg' })
      const mockFile2 = new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        images: [mockFile1, mockFile2] as any,
        additional_info: '',
        contact_email: 'test@test.com'
      }
      const formData = createFormData(data)
      const images = formData.getAll('images')
      expect(images).toHaveLength(2)
      expect(images[0]).toBe(mockFile1)
      expect(images[1]).toBe(mockFile2)
    })
  })
  describe('Draft management', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })
    it('should save draft to localStorage', () => {
      const { autoSave } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Draft Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Draft description',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      autoSave(data)
      vi.runAllTimers()
      const savedDraft = localStorage.getItem('listing_draft_product_user-123')
      expect(savedDraft).toBeTruthy()
      const parsed = JSON.parse(savedDraft!)
      expect(parsed.title).toBe('Draft Product')
      expect(parsed.category).toBe('bsf')
    })
    it('should load draft from localStorage', () => {
      const draftData: ProductFormData = {
        title: 'Loaded Draft',
        category: 'frass',
        subcategory: 'frass_powder',
        description: 'Loaded description',
        price: 200,
        price_currency: 'EUR',
        quantity: 20,
        quantity_unit: 'ton',
        countries: ['DE'],
        additional_info: 'Extra',
        contact_email: 'draft@test.com'
      }
      localStorage.setItem(
        'listing_draft_product_user-123',
        JSON.stringify(draftData)
      )
      const { loadDraft } = useListingCreation({ type: 'product' })
      const loaded = loadDraft()
      expect(loaded).toEqual(draftData)
    })
    it('should clear draft from localStorage', () => {
      localStorage.setItem(
        'listing_draft_wanted_user-123',
        JSON.stringify({ title: 'Test' })
      )
      const { clearDraft } = useListingCreation({ type: 'wanted' })
      clearDraft()
      expect(localStorage.getItem('listing_draft_wanted_user-123')).toBeNull()
    })
    it('should use different storage keys for different listing types', () => {
      const productListing = useListingCreation({ type: 'product' })
      const wantedListing = useListingCreation({ type: 'wanted' })
      const productData: ProductFormData = {
        title: 'Product Draft',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Product',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      const wantedData: WantedFormData = {
        title: 'Wanted Draft',
        category: 'frass',
        subcategory: 'frass_powder',
        description: 'Wanted',
        price: 100,
        price_currency: 'EUR',
        quantity: 5,
        quantity_unit: 'ton',
        countries: ['DE'],
        additional_info: '',
        contact_email: 'buyer@test.com'
      }
      productListing.autoSave(productData)
      wantedListing.autoSave(wantedData)
      vi.runAllTimers()
      const productDraft = localStorage.getItem('listing_draft_product_user-123')
      const wantedDraft = localStorage.getItem('listing_draft_wanted_user-123')
      expect(JSON.parse(productDraft!).title).toBe('Product Draft')
      expect(JSON.parse(wantedDraft!).title).toBe('Wanted Draft')
    })
  })
  describe('Submission flow', () => {
    beforeEach(() => {
      mockAuthStore.activeCompany = { id: 'company-123', _id: 'company-123', name: 'Test Company' }
    })
    it('should submit product listing with correct endpoint', async () => {
      const { submitListing } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Test Product',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      global.$fetch.mockResolvedValueOnce({ status: 'success' })
      await submitListing(data)
      expect(global.$fetch).toHaveBeenCalledWith(
        'http://api.test/market/products/company-123',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      )
    })
    it('should submit wanted listing with correct endpoint', async () => {
      const { submitListing } = useListingCreation({ type: 'wanted' })
      const data: WantedFormData = {
        title: 'Test Wanted',
        category: 'frass',
        subcategory: 'frass_powder',
        description: 'Test',
        price: 100,
        price_currency: 'EUR',
        quantity: 5,
        quantity_unit: 'ton',
        countries: ['DE'],
        additional_info: '',
        contact_email: 'buyer@test.com'
      }
      global.$fetch.mockResolvedValueOnce({ status: 'success' })
      await submitListing(data)
      expect(global.$fetch).toHaveBeenCalledWith(
        'http://api.test/market/wanted/company-123',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      )
    })
    it('should handle submission success correctly', async () => {
      const onSuccess = vi.fn()
      const { submitListing } = useListingCreation({
        type: 'product',
        onSuccess
      })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      global.$fetch.mockResolvedValueOnce({ status: 'success' })
      await submitListing(data)
      expect(onSuccess).toHaveBeenCalledWith('success')
      expect(mockToast.showSuccess).toHaveBeenCalledWith('marketplace.product_created_success')
      expect(mockRouter.push).toHaveBeenCalledWith('/my-listings')
    })
    it('should handle submission error correctly', async () => {
      const onError = vi.fn()
      const { submitListing } = useListingCreation({
        type: 'product',
        onError
      })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      const error = new Error('API Error')
      global.$fetch.mockRejectedValueOnce(error)
      await expect(submitListing(data)).rejects.toThrow('API Error')
      expect(onError).toHaveBeenCalledWith(error)
      expect(mockToast.showError).toHaveBeenCalledWith('API Error')
    })
    it('should update submission state correctly', async () => {
      const { submitListing, isSubmitting } = useListingCreation({
        type: 'product'
      })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      expect(isSubmitting.value).toBe(false)
      global.$fetch.mockResolvedValueOnce({ status: 'success' })
      const submissionPromise = submitListing(data)
      expect(isSubmitting.value).toBe(true)
      await submissionPromise
      expect(isSubmitting.value).toBe(false)
    })
  })
  describe('Edge cases', () => {
    it('should handle user with multiple companies but no active', () => {
      mockAuthStore.activeCompany = null
      mockAuthStore.companies = [
        { id: 'company-1', name: 'Company 1' },
        { id: 'company-2', name: 'Company 2' }
      ]
      const { hasPermission } = useListingCreation({ type: 'product' })
      expect(hasPermission.value).toBe(false)
    })
    it('should handle empty categories array submission', async () => {
      mockAuthStore.activeCompany = { id: 'company-123', _id: 'company-123' }
      const { submitListing } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: [],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      global.$fetch.mockResolvedValueOnce({ status: 'success' })
      await submitListing(data)
      const formDataArg = global.$fetch.mock.calls[0][1].body as FormData
      const countries = formDataArg.getAll('countries')
      expect(countries).toEqual([])
    })
    it('should handle network timeout during submission', async () => {
      mockAuthStore.activeCompany = { id: 'company-123', _id: 'company-123' }
      const { submitListing, saveError } = useListingCreation({
        type: 'product'
      })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      global.$fetch.mockRejectedValueOnce(new Error('Request timeout'))
      await expect(submitListing(data)).rejects.toThrow('Request timeout')
      expect(saveError.value).toBe('Request timeout')
    })
    it('should handle missing company during submission', async () => {
      mockAuthStore.activeCompany = null
      const { submitListing } = useListingCreation({ type: 'product' })
      const data: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      await expect(submitListing(data)).rejects.toThrow(
        'marketplace.no_company_permission'
      )
      expect(mockAuthStore.fetchProfile).not.toHaveBeenCalled()
      expect(global.$fetch).not.toHaveBeenCalled()
    })
  })
  describe('Image validation', () => {
    it('should validate image count', () => {
      const { validateImages } = useListingCreation({ type: 'product' })
      const files = Array.from({ length: 6 }, (_, i) =>
        new File([`image${i}`], `image${i}.jpg`, { type: 'image/jpeg' })
      )
      const error = validateImages(files)
      expect(error).toContain('marketplace.images_max_files')
    })
    it('should validate image file types', () => {
      const { validateImages } = useListingCreation({ type: 'product' })
      const files = [
        new File(['image'], 'image.pdf', { type: 'application/pdf' })
      ]
      const error = validateImages(files)
      expect(error).toContain('marketplace.images_invalid_type')
    })
    it('should validate individual file size', () => {
      const { validateImages } = useListingCreation({ type: 'product' })
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      )
      const error = validateImages([largeFile])
      expect(error).toContain('marketplace.images_too_large')
    })
    it('should validate total file size', () => {
      const { validateImages } = useListingCreation({ type: 'product' })
      const files = Array.from({ length: 5 }, (_, i) =>
        new File(
          [`image${i}`],
          `image${i}.jpg`,
          { type: 'image/jpeg' }
        )
      )
      Object.defineProperty(files[0], 'size', { value: 10 * 1024 * 1024 })
      Object.defineProperty(files[1], 'size', { value: 10 * 1024 * 1024 })
      Object.defineProperty(files[2], 'size', { value: 10 * 1024 * 1024 })
      Object.defineProperty(files[3], 'size', { value: 10 * 1024 * 1024 })
      Object.defineProperty(files[4], 'size', { value: 10 * 1024 * 1024 + 1 })
      const error = validateImages(files)
      expect(error).toContain('marketplace.images_too_large')
    })
    it('should accept valid images', () => {
      const { validateImages } = useListingCreation({ type: 'product' })
      const files = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.png', { type: 'image/png' }),
        new File(['image3'], 'image3.webp', { type: 'image/webp' })
      ]
      const error = validateImages(files)
      expect(error).toBeNull()
    })
  })
  describe('Navigation guards', () => {
    it('should setup navigation guards correctly', () => {
      const { setupNavigationGuards } = useListingCreation({ type: 'product' })
      const cleanup = setupNavigationGuards()
      expect(mockRouter.beforeEach).toHaveBeenCalled()
      expect(typeof cleanup).toBe('function')
      cleanup()
    })
    it('should warn about unsaved changes', () => {
      const { setupNavigationGuards, autoSave } = useListingCreation({
        type: 'product'
      })
      const formData: ProductFormData = {
        title: 'Test',
        category: 'bsf',
        subcategory: 'live_larvae',
        description: 'Test',
        price: 100,
        price_currency: 'USD',
        quantity: 10,
        quantity_unit: 'kg',
        countries: ['US'],
        additional_info: '',
        contact_email: 'test@test.com'
      }
      autoSave(formData)
      const originalConfirm = window.confirm
      window.confirm = vi.fn(() => false)
      setupNavigationGuards()
      const guard = mockRouter.beforeEach.mock.calls[0][0]
      const next = vi.fn()
      guard(
        { path: '/other' },
        { path: '/create/product' },
        next
      )
      expect(window.confirm).toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(false)
      window.confirm = originalConfirm
    })
  })
})