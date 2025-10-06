import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useField } from 'vee-validate'
import { createCompanyEditSchema } from '~/utils/validation/companySchemas'
import type { CompanyEditForm } from '~/utils/validation/companySchemas'
import { CompanyRepository } from './api/repositories/CompanyRepository'
import type { UpdateCompanyRequest } from './api/repositories/CompanyRepository'

export const useCompanyEdit = () => {
  const { activeCompany } = useProfile()
  const authStore = useAuthStore()
  const { t } = useI18n()
  const { isCompanyAdmin, isCompanyManager } = useUserRole()
  const companyRepository = new CompanyRepository()
  const toast = useToast()

  const companyEditSchema = createCompanyEditSchema(t)

  // Edit state
  const isEditing = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Form setup with validation
  const form = useForm({
    validationSchema: toTypedSchema(companyEditSchema),
    initialValues: {
      name: undefined,
      street: undefined,
      city: undefined,
      country: undefined,
      timezone: undefined,
      business_id: undefined
    }
  })

  // Form fields
  const { value: name, errorMessage: nameError } = useField<string>('name')
  const { value: street, errorMessage: streetError } =
    useField<string>('street')
  const { value: city, errorMessage: cityError } = useField<string>('city')
  const { value: country, errorMessage: countryError } =
    useField<string>('country')
  const { value: timezone, errorMessage: timezoneError } =
    useField<string>('timezone')
  const { value: business_id, errorMessage: businessIdError } =
    useField<string>('business_id')

  // Computed values
  const isValid = computed(() => form.meta.value.valid)
  const isDirty = computed(() => form.meta.value.dirty)
  const hasErrors = computed(
    () => !form.meta.value.valid && form.meta.value.touched
  )

  // Check permissions
  const canEdit = computed(() => isCompanyAdmin() || isCompanyManager())

  // Get all form errors
  const allErrors = computed(() => {
    const errors: string[] = []
    if (nameError.value) errors.push(nameError.value)
    if (streetError.value) errors.push(streetError.value)
    if (cityError.value) errors.push(cityError.value)
    if (countryError.value) errors.push(countryError.value)
    if (timezoneError.value) errors.push(timezoneError.value)
    if (businessIdError.value) errors.push(businessIdError.value)
    return errors
  })

  // Populate form with current company data
  const populateForm = () => {
    if (!activeCompany.value) return

    form.setValues({
      name: activeCompany.value.name || undefined,
      street: activeCompany.value.street || undefined,
      city: activeCompany.value.city || undefined,
      country: activeCompany.value.country || undefined,
      timezone: activeCompany.value.timezone || undefined,
      business_id: activeCompany.value.business_id || undefined
    })

    // Reset form state
    form.resetForm({
      values: {
        name: activeCompany.value.name || undefined,
        street: activeCompany.value.street || undefined,
        city: activeCompany.value.city || undefined,
        country: activeCompany.value.country || undefined,
        timezone: activeCompany.value.timezone || undefined,
        business_id: activeCompany.value.business_id || undefined
      }
    })
  }

  // Start editing mode
  const startEdit = () => {
    if (!canEdit.value) {
      error.value = t('account.company.permissionDenied')
      return
    }
    populateForm()
    isEditing.value = true
    error.value = null
  }

  // Cancel editing
  const cancelEdit = () => {
    isEditing.value = false
    populateForm() // Reset to original values
  }

  // Save company changes
  const saveCompany = async () => {
    if (!isValid.value || !activeCompany.value) return

    if (!canEdit.value) {
      error.value = t('account.company.permissionDenied')
      await toast.showError(error.value)
      return
    }

    isSubmitting.value = true
    error.value = null

    try {
      const formData = form.values as CompanyEditForm

      // Only send changed fields
      const updateData: UpdateCompanyRequest = {}
      if (formData.name !== activeCompany.value.name)
        updateData.name = formData.name
      if (formData.street !== activeCompany.value.street)
        updateData.street = formData.street
      if (formData.city !== activeCompany.value.city)
        updateData.city = formData.city
      if (formData.country !== activeCompany.value.country)
        updateData.country = formData.country
      if (formData.timezone !== activeCompany.value.timezone)
        updateData.timezone = formData.timezone
      if (formData.business_id !== activeCompany.value.business_id)
        updateData.business_id = formData.business_id

      // Only make API call if there are actual changes
      if (Object.keys(updateData).length === 0) {
        isEditing.value = false
        return
      }

      const companyId = activeCompany.value._id || activeCompany.value.id
      await companyRepository.updateCompany(companyId, updateData)

      // CRITICAL: Invalidate cache and refresh profile
      await authStore.refreshProfile({ force: true })

      // Success feedback
      await toast.showSuccess(t('account.company.updateSuccess'))

      isEditing.value = false
    } catch (err: unknown) {
      console.error(t('errors.account.updateCompanyLog'), err)
      error.value =
        err instanceof Error ? err.message : t('account.company.updateError')

      await toast.showError(error.value || t('common.error'))
    } finally {
      isSubmitting.value = false
    }
  }

  // Handle form submission
  const handleSubmit = form.handleSubmit(saveCompany)

  return {
    // State
    isEditing: readonly(isEditing),
    isSubmitting: readonly(isSubmitting),
    error: readonly(error),
    isValid,
    isDirty,
    hasErrors,
    allErrors,
    canEdit,

    // Form fields
    name,
    street,
    city,
    country,
    timezone,
    business_id,

    // Field errors
    nameError: readonly(nameError),
    streetError: readonly(streetError),
    cityError: readonly(cityError),
    countryError: readonly(countryError),
    timezoneError: readonly(timezoneError),
    businessIdError: readonly(businessIdError),

    // Methods
    startEdit,
    cancelEdit,
    saveCompany,
    handleSubmit,
    populateForm,

    // Form utilities
    resetForm: form.resetForm,
    setFieldValue: form.setFieldValue,
    setValues: form.setValues
  }
}
