<template>
  <div class="ion-padding">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <ion-spinner name="crescent" />
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <ion-icon :icon="alertCircle" />
      <h2>{{ $t('errors.account.loadingFailed') }}</h2>
      <p>{{ error }}</p>
      <ion-button fill="outline" @click="loadProfileData">
        {{ $t('common.retry') }}
      </ion-button>
    </div>

    <!-- Account Content -->
    <div v-else-if="profileData">
      <!-- Page Header with Help -->
      <ion-text class="ion-text-center page-header">
        <h1>{{ $t('account.title') }}</h1>
        <p>{{ $t('account.subtitle') }}</p>
      </ion-text>

      <!-- Basic User Details -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{
            $t('account.profile.basicDetails')
          }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div v-if="!isEditing">
            <ion-item>
              <ion-label>
                <h3>{{ $t('account.profile.email') }}</h3>
                <p>{{ profileData?.email }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>{{ $t('account.profile.name') }}</h3>
                <p>{{ profileData?.name || $t('common.notSet') }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>{{ $t('account.profile.city') }}</h3>
                <p>{{ profileData?.city || $t('common.notSet') }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>{{ $t('account.profile.country') }}</h3>
                <p>
                  {{
                    getCountryName(profileData?.country || '') ||
                    $t('common.notSet')
                  }}
                </p>
              </ion-label>
            </ion-item>

            <div class="form-actions">
              <ion-button
                fill="solid"
                size="small"
                :disabled="loading"
                color="primary"
                @click="startEdit"
              >
                <ion-icon slot="start" :icon="create" />
                {{ $t('common.edit') }}
              </ion-button>
            </div>
          </div>

          <form v-else @submit.prevent="handleSubmit">
            <!-- Show validation errors -->
            <div v-if="hasErrors" class="form-errors">
              <ion-item color="danger" lines="none">
                <ion-icon slot="start" :icon="alertCircle" />
                <ion-label>
                  <h3>
                    {{ $t('common.pleaseCorrectErrors') }}
                  </h3>
                  <ul>
                    <li v-if="nameError">{{ nameError }}</li>
                    <li v-if="cityError">{{ cityError }}</li>
                    <li v-if="countryError">
                      {{ countryError }}
                    </li>
                  </ul>
                </ion-label>
              </ion-item>
            </div>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.profile.email') }}
              </ion-label>
              <ion-input :value="profileData?.email" type="email" disabled />
            </ion-item>

            <ion-item lines="none" :class="{ 'ion-invalid': nameError }">
              <ion-label position="stacked">
                {{ $t('account.profile.name') }} *
              </ion-label>
              <ion-input
                v-model="name"
                :placeholder="$t('account.profile.namePlaceholder')"
                required
              />
              <ion-note v-if="nameError" slot="error">
                {{ nameError }}
              </ion-note>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.profile.city') }}
              </ion-label>
              <ion-input
                v-model="city"
                :placeholder="$t('account.profile.cityPlaceholder')"
              />
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.profile.country') }}
              </ion-label>
              <ion-select
                v-model="country"
                :placeholder="$t('account.profile.countryPlaceholder')"
                interface="action-sheet"
              >
                <ion-select-option
                  v-for="countryOption in countries"
                  :key="countryOption.code"
                  :value="countryOption.code"
                >
                  {{ countryOption.flag }}
                  {{ countryOption.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <div class="form-actions">
              <ion-button
                type="submit"
                fill="solid"
                size="small"
                :disabled="!isValid || isSubmitting"
                color="primary"
              >
                <ion-spinner
                  v-if="isSubmitting"
                  slot="start"
                  name="crescent"
                />
                {{ $t('common.save') }}
              </ion-button>
              <ion-button
                type="button"
                fill="outline"
                size="small"
                :disabled="isSubmitting"
                color="medium"
                @click="cancelEdit"
              >
                {{ $t('common.cancel') }}
              </ion-button>
            </div>

            <!-- Show unsaved changes warning -->
            <div v-if="isDirty" class="unsaved-changes-warning">
              <ion-item color="warning" lines="none">
                <ion-icon slot="start" :icon="warning" />
                <ion-label>
                  <p>{{ $t('common.unsavedChanges') }}</p>
                </ion-label>
              </ion-item>
            </div>
          </form>
        </ion-card-content>
      </ion-card>

      <!-- Company Information Card -->
      <ion-card v-if="activeCompany">
        <ion-card-header>
          <ion-card-title>
            {{ $t('account.company.title') }}
          </ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <!-- View Mode -->
          <div v-if="!isEditingCompany">
            <ion-item>
              <ion-label>
                <h3>{{ $t('account.company.name') }}</h3>
                <p>{{ activeCompany.name }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>{{ $t('account.company.street') }}</h3>
                <p>{{ activeCompany.street || $t('common.notSet') }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>{{ $t('account.company.city') }}</h3>
                <p>{{ activeCompany.city || $t('common.notSet') }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>{{ $t('account.company.country') }}</h3>
                <p>
                  {{
                    getCountryName(activeCompany.country || '') ||
                    $t('account.company.notSet')
                  }}
                </p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>{{ $t('account.company.timezone') }}</h3>
                <p>
                  {{
                    activeCompany.timezone
                      ? getTimezoneLabel(activeCompany.timezone)
                      : $t('common.notSet')
                  }}
                </p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-label>
                <h3>{{ $t('account.company.businessId') }}</h3>
                <p>
                  {{
                    activeCompany.business_id || $t('account.company.notSet')
                  }}
                </p>
              </ion-label>
            </ion-item>

            <div class="form-actions">
              <ion-button
                v-if="canEditCompany"
                @click="startCompanyEdit"
                fill="solid"
                size="small"
                color="primary"
              >
                <ion-icon slot="start" :icon="create" />
                {{ $t('common.edit') }}
              </ion-button>
            </div>
          </div>

          <!-- Edit Mode -->
          <form v-else @submit.prevent="handleCompanySubmit">
            <!-- Show validation errors -->
            <div v-if="hasCompanyErrors" class="form-errors">
              <ion-item color="danger" lines="none">
                <ion-icon slot="start" :icon="alertCircle" />
                <ion-label>
                  <h3>{{ $t('common.pleaseCorrectErrors') }}</h3>
                  <ul>
                    <li v-if="companyNameError">
                      {{ companyNameError }}
                    </li>
                    <li v-if="streetError">{{ streetError }}</li>
                    <li v-if="companyCityError">
                      {{ companyCityError }}
                    </li>
                    <li v-if="companyCountryError">
                      {{ companyCountryError }}
                    </li>
                    <li v-if="timezoneError">
                      {{ timezoneError }}
                    </li>
                    <li v-if="businessIdError">
                      {{ businessIdError }}
                    </li>
                  </ul>
                </ion-label>
              </ion-item>
            </div>

            <ion-item
              lines="none"
              :class="{ 'ion-invalid': companyNameError }"
            >
              <ion-label position="stacked">
                {{ $t('account.company.name') }} *
              </ion-label>
              <ion-input
                v-model="companyName"
                :placeholder="$t('account.company.namePlaceholder')"
                required
              />
              <ion-note v-if="companyNameError" slot="error">
                {{ companyNameError }}
              </ion-note>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.company.street') }}
              </ion-label>
              <ion-input
                v-model="companyStreet"
                :placeholder="$t('account.company.streetPlaceholder')"
              />
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.company.city') }}
              </ion-label>
              <ion-input
                v-model="companyCity"
                :placeholder="$t('account.company.cityPlaceholder')"
              />
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.company.country') }}
              </ion-label>
              <ion-select
                v-model="companyCountry"
                :placeholder="$t('account.company.countryPlaceholder')"
                interface="action-sheet"
              >
                <ion-select-option
                  v-for="countryOption in countries"
                  :key="countryOption.code"
                  :value="countryOption.code"
                >
                  {{ countryOption.flag }} {{ countryOption.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.company.timezone') }}
              </ion-label>
              <ion-select
                v-model="companyTimezone"
                :placeholder="$t('account.company.timezonePlaceholder')"
                interface="action-sheet"
              >
                <ion-select-option
                  v-for="timezone in timezones"
                  :key="timezone.value"
                  :value="timezone.value"
                >
                  {{ timezone.label }} (UTC{{ timezone.offset }})
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">
                {{ $t('account.company.businessId') }}
              </ion-label>
              <ion-input
                v-model="companyBusinessId"
                :placeholder="$t('account.company.businessIdPlaceholder')"
              />
            </ion-item>

            <div class="form-actions">
              <ion-button
                type="submit"
                fill="solid"
                size="small"
                :disabled="!isCompanyValid || isCompanySubmitting"
                color="primary"
              >
                <ion-spinner
                  v-if="isCompanySubmitting"
                  slot="start"
                  name="crescent"
                />
                {{ $t('common.save') }}
              </ion-button>
              <ion-button
                type="button"
                fill="outline"
                size="small"
                :disabled="isCompanySubmitting"
                color="medium"
                @click="cancelCompanyEdit"
              >
                {{ $t('common.cancel') }}
              </ion-button>
            </div>

            <!-- Show unsaved changes warning -->
            <div v-if="isCompanyDirty" class="unsaved-changes-warning">
              <ion-item color="warning" lines="none">
                <ion-icon slot="start" :icon="warning" />
                <ion-label>
                  <p>{{ $t('common.unsavedChanges') }}</p>
                </ion-label>
              </ion-item>
            </div>
          </form>
        </ion-card-content>
      </ion-card>

      <!-- Current Credits -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ $t('account.credits.title') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-icon slot="start" :icon="wallet" />
            <ion-label>
              <h2>{{ profileData?.balance || 0 }}</h2>
              <p>{{ $t('account.credits.currentBalance') }}</p>
            </ion-label>
            <ion-chip
              slot="end"
              :color="getAccountTypeColor(profileData?.account_type || '')"
              size="small"
            >
              {{ profileData?.account_type?.toUpperCase() }}
            </ion-chip>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Password Reset Section -->
      <ion-card class="section">
        <ion-card-header>
          <ion-card-title>{{ $t('account.password.title') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form @submit.prevent="updatePassword">
            <ion-item>
              <ion-label position="stacked">
                {{ $t('account.password.new') }}
              </ion-label>
              <ion-input
                v-model="passwordForm.newPassword"
                :placeholder="$t('account.password.newPlaceholder')"
                type="password"
              />
            </ion-item>

            <ion-item>
              <ion-label position="stacked">
                {{ $t('account.password.confirm') }}
              </ion-label>
              <ion-input
                v-model="passwordForm.confirmPassword"
                :placeholder="$t('account.password.confirmPlaceholder')"
                type="password"
              />
            </ion-item>

            <div class="form-actions">
              <div class="button-container">
                <ion-button
                  expand="block"
                  type="submit"
                  :disabled="passwordLoading || !isPasswordValid"
                  size="large"
                >
                  <ion-spinner
                    v-if="passwordLoading"
                    slot="start"
                    name="crescent"
                  />
                  {{ $t('account.password.updateButton') }}
                </ion-button>
              </div>
            </div>
          </form>
        </ion-card-content>
      </ion-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// Use icons from the centralized useIcons composable
const { alertCircle, create, warning, wallet } = useIcons()

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

// Profile composables
const {
  user: profileData,
  activeCompany,
  loading,
  error: profileError,
  ensureProfileData
} = useProfile()
const {
  isEditing,
  isSubmitting,
  error: editError,
  isValid,
  isDirty,
  hasErrors,
  name,
  city,
  country,
  nameError,
  cityError,
  countryError,
  startEdit,
  cancelEdit,
  handleSubmit
} = useProfileEdit()

// Company edit composable
const {
  isEditing: isEditingCompany,
  isSubmitting: isCompanySubmitting,
  isValid: isCompanyValid,
  isDirty: isCompanyDirty,
  hasErrors: hasCompanyErrors,
  canEdit: canEditCompany,
  name: companyName,
  street: companyStreet,
  city: companyCity,
  country: companyCountry,
  timezone: companyTimezone,
  business_id: companyBusinessId,
  nameError: companyNameError,
  streetError,
  cityError: companyCityError,
  countryError: companyCountryError,
  timezoneError,
  businessIdError,
  startEdit: startCompanyEdit,
  cancelEdit: cancelCompanyEdit,
  handleSubmit: handleCompanySubmit
} = useCompanyEdit()

// State
const error = computed(() => profileError.value || editError.value)
const passwordLoading = ref(false)

// TypeScript interface for password form
interface PasswordForm {
  newPassword: string
  confirmPassword: string
}

const passwordForm = ref<PasswordForm>({
  newPassword: '',
  confirmPassword: ''
})

// Countries data
const { countries, getCountryName } = useCountries()

// Timezones data
const { timezones, getTimezoneLabel } = useTimezones()

// Computed
const isPasswordValid = computed(() => {
  return (
    passwordForm.value.newPassword &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
    passwordForm.value.newPassword.length >= 6
  )
})

// Methods
const loadProfileData = async () => {
  try {
    await ensureProfileData()
  } catch (err: unknown) {
    console.error('Error loading profile:', err)
  }
}

const updatePassword = async () => {
  if (!isPasswordValid.value) {
    const toast = await useToast().create({
      message: t('account.password.validationError'),
      duration: 4000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
    return
  }

  try {
    passwordLoading.value = true

    // Use the API client directly for the new password reset endpoint
    const { api } = useApi()
    const endpoints = useApiEndpoints()

    await api(endpoints.usersResetPassword, {
      method: 'POST',
      body: {
        new_password: passwordForm.value.newPassword
      }
    })

    const successToast = await useToast().create({
      message: t('account.password.updateSuccess'),
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await successToast.present()

    // Clear form
    passwordForm.value = {
      newPassword: '',
      confirmPassword: ''
    }
  } catch (err: unknown) {
    console.error('Error updating password:', err)
    const errorToast = await useToast().create({
      message: t('account.password.updateError'),
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
    await errorToast.present()
  } finally {
    passwordLoading.value = false
  }
}

const getAccountTypeColor = (accountType: string) => {
  switch (accountType?.toLowerCase()) {
    case 'pro':
      return 'success'
    case 'premium':
      return 'warning'
    case 'basic':
      return 'medium'
    default:
      return 'medium'
  }
}

// Lifecycle
onMounted(async () => {
  await loadProfileData()
})
</script>

<style scoped>
/* Keep only Ionic-specific customizations and validation states that need CSS variables */
ion-item.ion-invalid ion-label {
  color: var(--ion-color-danger);
}

ion-item.ion-invalid ion-input {
  --color: var(--ion-color-danger);
  --border-color: var(--ion-color-danger);
}

ion-note[slot='error'] {
  color: var(--ion-color-danger);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

ion-spinner {
  width: 1.2rem;
  height: 1.2rem;
}
</style>
