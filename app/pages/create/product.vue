<template>
  <div class="page-container">
      <!-- Loading State -->
      <div
        v-if="isInitializing"
        class="ion-text-center ion-padding"
      >
        <ion-spinner name="crescent" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Main Content -->
      <div v-else>

            <!-- Header -->
            <div class="header-section ion-padding">
              <ion-text class="ion-text-center">
                <h1>{{
                  isEditMode
                    ? t('marketplace.update_listing')
                    : t('marketplace.create_product')
                }}</h1>
                <p>{{
                  isEditMode
                    ? t('marketplace.update_product_desc')
                    : t('marketplace.create_product_desc')
                }}</p>
              </ion-text>
            </div>

            <!-- Permission Check -->
            <div v-if="!hasPermission" class="form-section">
              <ion-card color="warning">
                <ion-card-content>
                  <ion-text>
                    <p>{{ t('marketplace.no_company_permission') }}</p>
                  </ion-text>
                  <ion-button
                    :router-link="localePath('/')"
                    fill="outline"
                    size="small"
                  >
                    {{ t('common.goHome') }}
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </div>

            <!-- Form -->
            <form v-else @submit.prevent="onSubmit" class="form-container">
              <!-- Title Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.title') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="none">
                    <ion-input
                      v-model="title"
                      :placeholder="t('marketplace.title_placeholder')"
                      :maxlength="200"
                      counter
                      required
                    />
                  </ion-item>
                  <ion-note v-if="errors.title" color="danger" class="error-note">
                    {{ errors.title }}
                  </ion-note>
                </ion-card-content>
              </ion-card>

              <!-- Category Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.category') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <!-- Category -->
                  <ion-item lines="none">
                    <ion-skeleton-text
                      v-if="categoryLoading"
                      animated
                      style="width: 100%; height: 56px"
                    />
                    <ion-select
                      v-else-if="!categoryError"
                      v-model="category"
                      :placeholder="t('marketplace.category_placeholder')"
                      interface="action-sheet"
                    >
                      <ion-select-option
                        v-for="cat in categoryOptions"
                        :key="cat"
                        :value="cat"
                      >
                        {{ getCategoryLabel(cat) }}
                      </ion-select-option>
                    </ion-select>
                    <ErrorCard
                      v-else
                      :message="t('marketplace.category_load_error')"
                      @retry="retryLoadCategories"
                    />
                  </ion-item>
                  <ion-note v-if="errors.category" color="danger" class="error-note">
                    {{ errors.category }}
                  </ion-note>

                  <!-- Subcategory -->
                  <ion-item lines="none">
                    <ion-skeleton-text
                      v-if="categoryLoading"
                      animated
                      style="width: 100%; height: 56px"
                    />
                    <ion-select
                      v-else-if="!categoryError"
                      v-model="subcategory"
                      :placeholder="t('marketplace.subcategory_placeholder')"
                      interface="action-sheet"
                      :disabled="!category"
                    >
                      <ion-select-option
                        v-for="sub in subcategoryOptions"
                        :key="sub"
                        :value="sub"
                      >
                        {{ getSubcategoryLabel(sub) }}
                      </ion-select-option>
                    </ion-select>
                    <ErrorCard
                      v-else
                      :message="t('marketplace.subcategory_load_error')"
                      @retry="retryLoadCategories"
                    />
                  </ion-item>
                  <ion-note v-if="errors.subcategory" color="danger" class="error-note">
                    {{ errors.subcategory }}
                  </ion-note>
                  <ion-note v-else-if="!category && !categoryLoading" color="medium" class="help-note">
                    {{ t('marketplace.select_category_first') }}
                  </ion-note>
                </ion-card-content>
              </ion-card>

              <!-- Description Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.description') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="none">
                    <ion-textarea
                      v-model="description"
                      :placeholder="t('marketplace.description_placeholder')"
                      :rows="8"
                      :maxlength="5000"
                      counter
                      required
                    />
                  </ion-item>
                  <ion-note v-if="errors.description" color="danger" class="error-note">
                    {{ errors.description }}
                  </ion-note>
                </ion-card-content>
              </ion-card>

              <!-- Pricing & Quantity Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.pricing_quantity') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <!-- Price & Currency Row -->
                  <ion-grid class="ion-no-padding">
                    <ion-row>
                      <ion-col size="7">
                        <ion-item lines="none">
                          <ion-input
                            v-model.number="price"
                            type="number"
                            :label="t('marketplace.price')"
                            label-placement="floating"
                            :placeholder="t('marketplace.price_placeholder')"
                            min="0"
                            step="0.01"
                            required
                          />
                        </ion-item>
                        <ion-note v-if="errors.price" color="danger" class="error-note">
                          {{ errors.price }}
                        </ion-note>
                      </ion-col>
                      <ion-col size="5">
                        <ion-item lines="none">
                          <ion-select
                            v-model="price_currency"
                            :label="t('marketplace.currency')"
                            label-placement="floating"
                            :placeholder="t('marketplace.select_currency')"
                            interface="action-sheet"
                          >
                            <ion-select-option
                              v-for="curr in currencyOptions"
                              :key="curr.code"
                              :value="curr.code"
                            >
                              {{ curr.code }} - {{ curr.name }}
                            </ion-select-option>
                          </ion-select>
                        </ion-item>
                        <ion-note v-if="errors.price_currency" color="danger" class="error-note">
                          {{ errors.price_currency }}
                        </ion-note>
                      </ion-col>
                    </ion-row>
                    <!-- Quantity & Unit Row -->
                    <ion-row>
                      <ion-col size="7">
                        <ion-item lines="none">
                          <ion-input
                            v-model.number="quantity"
                            type="number"
                            :label="t('marketplace.quantity')"
                            label-placement="floating"
                            :placeholder="t('marketplace.quantity_placeholder')"
                            min="0"
                            step="any"
                            required
                          />
                        </ion-item>
                        <ion-note v-if="errors.quantity" color="danger" class="error-note">
                          {{ errors.quantity }}
                        </ion-note>
                      </ion-col>
                      <ion-col size="5">
                        <ion-item lines="none">
                          <ion-select
                            v-model="quantity_unit"
                            :label="t('marketplace.unit')"
                            label-placement="floating"
                            :placeholder="t('marketplace.select_unit')"
                            interface="action-sheet"
                          >
                            <ion-select-option
                              v-for="unit in quantityUnits"
                              :key="unit.value"
                              :value="unit.value"
                            >
                              {{ unit.label }}
                            </ion-select-option>
                          </ion-select>
                        </ion-item>
                        <ion-note v-if="errors.quantity_unit" color="danger" class="error-note">
                          {{ errors.quantity_unit }}
                        </ion-note>
                      </ion-col>
                    </ion-row>
                  </ion-grid>
                </ion-card-content>
              </ion-card>

              <!-- Location & Shipping Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.location_shipping') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <!-- Countries -->
                  <div class="button-group-compact">
                    <ion-button
                      size="small"
                      fill="outline"
                      @click="selectAllCountries"
                      :disabled="!countryOptions || countryOptions.length === 0"
                      class="compact-button"
                    >
                      {{ t('marketplace.select_all_countries') }}
                    </ion-button>
                    <ion-button
                      size="small"
                      fill="outline"
                      color="medium"
                      @click="clearAllCountries"
                      :disabled="!countriesArray || countriesArray.length === 0"
                      class="compact-button"
                    >
                      {{ t('marketplace.clear_all_countries') }}
                    </ion-button>
                  </div>
                  <ion-item lines="none">
                    <ion-select
                      v-model="countriesArray"
                      :placeholder="t('marketplace.select_countries')"
                      interface="alert"
                      multiple
                    >
                      <ion-select-option
                        v-for="country in countryOptions"
                        :key="country.code"
                        :value="country.code"
                      >
                        {{ country.flag }} {{ country.name }}
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                  <ion-note v-if="errors.countries" color="danger" class="error-note">
                    {{ errors.countries }}
                  </ion-note>
                  <ion-note color="medium" class="help-note">
                    {{ t('marketplace.countries_delivery_help') }}
                  </ion-note>
                  <ion-button
                    size="small"
                    fill="clear"
                    :router-link="localePath('/account')"
                    class="ion-margin-top"
                  >
                    <ion-icon slot="start" :icon="settings" />
                    {{ t('marketplace.update_company_link') }}
                  </ion-button>
                </ion-card-content>
              </ion-card>

              <!-- Images Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.images') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ImageUploadField
                    v-model="images"
                    :help-text="t('marketplace.images_help')"
                    :error="errors.images"
                    @error="handleImageError"
                  />
                </ion-card-content>
              </ion-card>

              <!-- Additional Information Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.additional_info') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="none">
                    <ion-textarea
                      v-model="additional_info"
                      :placeholder="t('marketplace.additional_details_placeholder')"
                      :rows="5"
                      :maxlength="2000"
                      counter
                    />
                  </ion-item>
                  <ion-note v-if="errors.additional_info" color="danger" class="error-note">
                    {{ errors.additional_info }}
                  </ion-note>
                </ion-card-content>
              </ion-card>

              <!-- Contact Information Card -->
              <ion-card>
                <ion-card-header class="card-header">
                  <ion-card-title>{{ t('marketplace.contact_email') }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="none">
                    <ion-input
                      v-model="contact_email"
                      type="email"
                      :placeholder="t('marketplace.contact_email_placeholder')"
                    />
                  </ion-item>
                  <ion-note v-if="errors.contact_email" color="danger" class="error-note">
                    {{ errors.contact_email }}
                  </ion-note>
                </ion-card-content>
              </ion-card>

              <!-- Form Actions -->
              <div class="form-actions ion-padding-vertical">
                <ion-button
                  type="submit"
                  expand="block"
                  :disabled="!meta.valid || isSubmitting"
                >
                  <ion-spinner
                    v-if="isSubmitting"
                    slot="start"
                    name="crescent"
                  />
                  {{
                    isEditMode
                      ? t('marketplace.update_listing')
                      : t('marketplace.create_listing')
                  }}
                </ion-button>
                <ion-button
                  type="button"
                  expand="block"
                  fill="outline"
                  color="medium"
                  @click="handleCancel"
                >
                  {{ t('common.cancel') }}
                </ion-button>
              </div>

              <!-- Auto-save indicator -->
              <ion-note v-if="isSaving" color="medium" class="ion-text-center">
                <p>{{ t('common.saving') }}...</p>
              </ion-note>
              <ion-note
                v-else-if="hasUnsavedChanges"
                color="success"
                class="ion-text-center"
              >
                <p>{{ t('common.draft_saved') }}</p>
              </ion-note>
            </form>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { watch, onMounted, onUnmounted, computed } from 'vue'
import {
  createProductValidationSchema,
  getCommonCurrencies
} from '~/utils/validation/listingSchemas'
import { getTranslatedUnits } from '~/utils/translatedConstants'
import type {
  ProductFormData
} from '~/utils/validation/listingSchemas'
import {
  useListingCreation
} from '~/composables/useListingCreation'
import { useCategories } from '~/composables/useCategories'
import { useCountries } from '~/composables/useCountries'
import type { CategoryData } from '~/composables/useCategories'
import {
  MarketplaceRepository
} from '~/composables/api/repositories/MarketplaceRepository'
import ImageUploadField from '~/components/forms/ImageUploadField.vue'
import ErrorCard from '~/components/ui/ErrorCard.vue'

const { settings } = useIcons()
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const { countries: countriesRef } = useCountries()
const countryOptions = computed(() => countriesRef.value)

// Get translated units
const quantityUnits = computed(() => getTranslatedUnits())
const currencyOptions = computed(() => getCommonCurrencies(t))

// Edit mode detection
const editId = computed(() => route.query.edit as string | undefined)
const isEditMode = computed(() => !!editId.value)


// Categories setup
const {
  categories: categoryOptions,
  subcategories: subcategoryOptions,
  isLoading: categoryLoading,
  error: categoryError,
  selectedCategory,
  fetchCategories,
  getCategoryLabel,
  getSubcategoryLabel
} = useCategories()

// Combined loading state
const isInitializing = ref(true)

// Retry loading categories
const retryLoadCategories = async () => {
  await fetchCategories(true)
}

// Form setup
const productValidation = createProductValidationSchema(t)

const { handleSubmit, defineField, errors, meta, values, setFieldValue } =
  useForm<ProductFormData>({
    validationSchema: productValidation,
    initialValues: {
      title: '',
      category: '',
      subcategory: '',
      description: '',
      price: 0,
      price_currency: 'USD',
      quantity: 0,
      quantity_unit: 'piece',
      countries: [],
      additional_info: '',
      contact_email: ''
    }
  })

// Define form fields
const [title] = defineField('title')
const [category] = defineField('category')
const [subcategory] = defineField('subcategory')
const [description] = defineField('description')
const [price] = defineField('price')
const [price_currency] = defineField('price_currency')
const [quantity] = defineField('quantity')
const [quantity_unit] = defineField('quantity_unit')
const [countries] = defineField('countries')
const [images] = defineField('images')
const [additional_info] = defineField('additional_info')
const [contact_email] = defineField('contact_email')

// Countries array handling (for multi-select)
const countriesArray = computed({
  get: () => countries.value || [],
  set: (val) => setFieldValue('countries', val)
})

// Flag to prevent clearing subcategory during initial load
const isInitialLoad = ref(false)

// Watch for category changes to update selectedCategory and clear subcategory
watch(category, (newCategory) => {
  selectedCategory.value = newCategory as keyof CategoryData | null
  if (newCategory && !isInitialLoad.value) {
    // Clear subcategory when category changes (except during initial load)
    setFieldValue('subcategory', '')
  }
})


// Listing creation composable
const {
  hasPermission,
  isSubmitting,
  isSaving,
  hasUnsavedChanges,
  loadDraft,
  autoSave,
  clearDraft,
  setupNavigationGuards,
  submitListing
} = useListingCreation({
  type: 'product',
  onSuccess: (listingId) => {
    // Product created
  },
  onError: (error) => {
    console.error(t('errors.product.createFailedLog'), error)
  }
})

// Initialize repository for fetching existing data in edit mode
const marketplaceRepo = new MarketplaceRepository()


// Watch for form changes and auto-save (only for new products)
watch(
  values,
  (newValues) => {
    if (hasPermission.value && !isEditMode.value) {
      autoSave(newValues)
    }
  },
  { deep: true }
)

// Handle image error
const handleImageError = async (message: string) => {
  const toast = useToast()
  await toast.showError(message)
}

// Form submission
const onSubmit = handleSubmit(async (formData) => {
  try {
    if (isEditMode.value && editId.value) {
      // Update existing product
      // Don't modify isSubmitting as it's from useListingCreation

      // Build update payload (exclude images from main update)
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        price: Number(formData.price),
        price_currency: formData.price_currency,
        quantity: Number(formData.quantity),
        quantity_unit: formData.quantity_unit,
        countries: formData.countries,
        additional_info: (formData.additional_info || '').toString().trim(),
        contact_email: formData.contact_email
      }

      // Update product data
      await marketplaceRepo.updateProduct(editId.value, updateData)

      // Update images if new ones were selected
      if (formData.images && formData.images.length > 0) {
        await marketplaceRepo.updateProductImages(
          editId.value,
          formData.images
        )
      }

      // Show success toast
      const toast = useToast()
      await toast.showSuccess(t('marketplace.product_updated'))

      // Navigate to detail page
      await router.push(localePath(`/market/${editId.value}`))
    } else {
      // Create new product
      await submitListing(formData)
    }
  } catch (error) {
    // Error handling
    const logKey = isEditMode.value
      ? 'errors.product.updateFailedLog'
      : 'errors.product.createFailedLog'
    console.error(t(logKey), error)
    const toast = useToast()
    const message = error instanceof Error ?
      error.message : t('errors.generic')
    await toast.showError(message)
  } finally {
    if (isEditMode.value) {
      // Don't modify isSubmitting as it's from useListingCreation
    }
  }
})

// Handle cancel
const handleCancel = async () => {
  if (hasUnsavedChanges.value) {
    const confirmed = window.confirm(t('common.unsavedChangesConfirm'))
    if (!confirmed) return
  }
  clearDraft()
  await router.push(localePath('/create'))
}

// Select all countries
const selectAllCountries = () => {
  const options = countriesRef.value
  if (!options || options.length === 0) return

  const allCodes = options.map(c => c.code)
  setFieldValue('countries', allCodes)
}

// Clear all countries
const clearAllCountries = () => {
  setFieldValue('countries', [])
}

// Fetch and prefill data when in edit mode
const fetchAndPrefillProduct = async () => {
  if (!editId.value || !isEditMode.value) return

  try {
    const product = await marketplaceRepo.getProductDetail(editId.value)

    // Set flag to prevent watch from clearing subcategory
    isInitialLoad.value = true

    // Update selectedCategory FIRST for subcategory options to load
    if (product.category) {
      selectedCategory.value = product.category as keyof CategoryData
    }

    // Prefill form fields
    setFieldValue('title', product.title)
    setFieldValue('category', product.category)
    setFieldValue('subcategory', product.subcategory)
    setFieldValue('description', product.description)
    setFieldValue('price', product.price)
    setFieldValue('price_currency', product.price_currency)
    setFieldValue('quantity', product.quantity)
    setFieldValue('quantity_unit', product.quantity_unit)
    setFieldValue('countries', product.countries || [])
    const additionalInfo = product.additional_info || {}
    setFieldValue('additional_info',
      typeof additionalInfo === 'string' ?
        additionalInfo : JSON.stringify(additionalInfo))
    setFieldValue('contact_email',
      'contact_email' in product ? product.contact_email : '')

    // Reset flag after fields are set
    await nextTick()
    isInitialLoad.value = false

    // Note: We don't prefill images as they can't be recreated as File objects
    // User will need to select new images if they want to change them
  } catch (error) {
    console.error(t('errors.product.fetchEditFailedLog'), error)
    const toast = useToast()
    await toast.showError(t('errors.loading_failed'))

    // Navigate back on error
    await router.push(localePath('/my-listings'))
  }
}

// Load categories and draft on mount
// Profile is already loaded by auth middleware
onMounted(async () => {
  isInitializing.value = true

  // Load categories
  await fetchCategories()

  isInitializing.value = false

  // Check if in edit mode
  if (isEditMode.value) {
    await fetchAndPrefillProduct()
  } else {
    // Load draft for new products
    const draft = loadDraft()
    if (draft) {
      // Set flag to prevent watch from clearing subcategory
      isInitialLoad.value = true

      // Update selectedCategory first if category is in draft
      if (draft.category) {
        selectedCategory.value = draft.category as keyof CategoryData
      }

      // Populate form with draft data
      Object.entries(draft).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setFieldValue(key as keyof ProductFormData, value as any)
        }
      })

      // Reset flag after fields are set
      await nextTick()
      isInitialLoad.value = false

      const toast = useToast()
      await toast.showSuccess(t('common.draft_loaded'))
    }
  }
})

// Watch for edit ID changes
watch(editId, async (newId) => {
  if (newId && isEditMode.value) {
    await fetchAndPrefillProduct()
  }
})

// Setup navigation guards
const cleanupGuards = setupNavigationGuards()

// Cleanup on unmount
onUnmounted(() => {
  cleanupGuards()
})
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: var(--ion-background-color);
  min-height: 100vh;
}

.header-section {
  background: var(--ion-background-color);
  padding-bottom: 8px;
}

.form-container {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

ion-card {
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  background: var(--ion-color-step-150, #d7d8da);
  border-bottom: 1px solid var(--ion-color-step-200, #cccccc);
}

ion-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

ion-card-content {
  padding: 16px;
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.button-group-compact {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.compact-button {
  flex: 1;
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 0.875rem;
  min-width: 0;
}

.error-note {
  display: block;
  padding: 4px 16px;
  font-size: 0.875rem;
}

.help-note {
  display: block;
  padding: 4px 16px;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
}

ion-spinner {
  width: 1.2rem;
  height: 1.2rem;
}

/* Grid adjustments */
ion-grid {
  --ion-grid-padding: 0;
}

ion-col {
  padding: 4px;
}

@media (max-width: 768px) {
  .form-container {
    padding: 8px;
  }

  ion-card {
    margin-bottom: 12px;
    border-radius: 8px;
  }
}
</style>
