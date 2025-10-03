import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useField } from 'vee-validate'
import { UserService } from './api/services/UserService'
import type { UpdateUserRequest } from '../../shared/types'

export type ProfileEditForm = {
  name: string
  city?: string
  country?: string
}

export const useProfileEdit = () => {
  const { user, refreshProfile } = useProfile()
  const { t } = useI18n()
  const userService = new UserService()

  const profileEditSchema = z.object({
    name: z.string().min(1, t('validation.profile.nameRequired')),
    city: z.string().optional(),
    country: z.string().optional()
  })
  
  // Edit state
  const isEditing = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  
  // Form setup with validation
  const form = useForm({
    validationSchema: toTypedSchema(profileEditSchema),
    initialValues: {
      name: '',
      city: '',
      country: ''
    }
  })
  
  // Form fields
  const { value: name, errorMessage: nameError } = useField<string>('name')
  const { value: city, errorMessage: cityError } = useField<string>('city')
  const { value: country, errorMessage: countryError } = useField<string>('country')
  
  // Computed values
  const isValid = computed(() => form.meta.value.valid)
  const isDirty = computed(() => form.meta.value.dirty)
  const hasErrors = computed(() => !form.meta.value.valid && form.meta.value.touched)
  
  // Get all form errors
  const allErrors = computed(() => {
    const errors: string[] = []
    if (nameError.value) errors.push(nameError.value)
    if (cityError.value) errors.push(cityError.value)
    if (countryError.value) errors.push(countryError.value)
    return errors
  })
  
  // Populate form with current user data
  const populateForm = () => {
    if (!user.value) return
    
    form.setValues({
      name: user.value.name || '',
      city: user.value.city || '',
      country: user.value.country || ''
    })
    
    // Reset form state
    form.resetForm({
      values: {
        name: user.value.name || '',
        city: user.value.city || '',
        country: user.value.country || ''
      }
    })
  }
  
  // Start editing mode
  const startEdit = () => {
    populateForm()
    isEditing.value = true
    error.value = null
  }
  
  // Cancel editing
  const cancelEdit = () => {
    isEditing.value = false
    populateForm() // Reset to original values
  }
  
  // Save profile changes
  const saveProfile = async () => {
    if (!isValid.value || !user.value) return
    
    isSubmitting.value = true
    error.value = null
    
    try {
      const formData = form.values as ProfileEditForm
      
      // Only send changed fields
      const updateData: UpdateUserRequest = {}
      if (formData.name !== user.value.name) updateData.name = formData.name
      if (formData.city !== user.value.city) updateData.city = formData.city
      if (formData.country !== user.value.country) updateData.country = formData.country
      
      // Only make API call if there are actual changes
      if (Object.keys(updateData).length === 0) {
        isEditing.value = false
        return
      }
      
      await userService.updateCurrentUser(updateData)
      
      // Refresh profile data to get updated info
      await refreshProfile()
      
      // Success feedback
      const toast = await useToast().create({
        message: t('account.profile.updateSuccess'),
        duration: 3000,
        color: 'success',
        position: 'top'
      })
      await toast.present()
      
      isEditing.value = false
      
    } catch (err: unknown) {
      console.error(t('errors.account.updateProfileLog'), err)
      error.value = err instanceof Error ? err.message : t('account.profile.updateError')
      
      const toast = await useToast().create({
        message: error.value || t('common.error'),
        duration: 4000,
        color: 'danger',
        position: 'top',
        buttons: [
          {
            text: t('common.dismiss'),
            role: 'cancel'
          }
        ]
      })
      await toast.present()
    } finally {
      isSubmitting.value = false
    }
  }
  
  // Handle form submission
  const handleSubmit = form.handleSubmit(saveProfile)
  
  return {
    // State
    isEditing: readonly(isEditing),
    isSubmitting: readonly(isSubmitting),
    error: readonly(error),
    isValid,
    isDirty,
    hasErrors,
    allErrors,
    
    // Form fields
    name,
    city,
    country,
    
    // Field errors
    nameError: readonly(nameError),
    cityError: readonly(cityError),
    countryError: readonly(countryError),
    
    // Methods
    startEdit,
    cancelEdit,
    saveProfile,
    handleSubmit,
    populateForm,
    
    // Form utilities
    resetForm: form.resetForm,
    setFieldValue: form.setFieldValue,
    setValues: form.setValues
  }
}
