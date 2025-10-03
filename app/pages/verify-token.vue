<template>
  <ion-grid class="ion-padding">
    <ion-row class="ion-justify-content-center">
      <ion-col size="12" size-sm="6" size-md="5" size-lg="5">
        <!-- Email verification step -->
        <div v-if="!creatingCompany" class="ion-text-center ion-padding-vertical">
          <ion-icon
            :icon="mail"
            size="large"
            color="primary"
            class="ion-margin-bottom"
          />
          <ion-text>
            <h1>{{ $t('auth.checkYourEmail') }}</h1>
          </ion-text>
          <ion-text color="medium">
            <p>{{ $t('auth.verificationCodeSent',
                 { email: registrationEmail }) }}</p>
          </ion-text>
        </div>

        <!-- Company creation step -->
        <div v-else class="ion-text-center ion-padding-vertical">
          <ion-icon
            :icon="businessOutline"
            size="large"
            color="primary"
            class="ion-margin-bottom"
          />
          <ion-text>
            <h1>{{ $t('auth.creatingWorkspace') }}</h1>
          </ion-text>
          <ion-text color="medium">
            <p>{{ $t('auth.settingUpCompany') }}</p>
          </ion-text>
          <ion-progress-bar type="indeterminate" color="primary" />
        </div>

        <form v-if="!creatingCompany" @submit.prevent="handleVerify">
          <ion-item>
            <ion-label position="stacked">
              {{ $t('auth.verificationCode') }}
            </ion-label>
            <ion-input
              v-model="token"
              type="text"
              :placeholder="$t('auth.enterCodeFromEmail')"
              required
              :disabled="submitting"
              inputmode="numeric"
              :maxlength="6"
            />
          </ion-item>

          <div class="button-container">
            <ion-button
              expand="block"
              type="submit"
              :disabled="submitting || !token"
              class="ion-margin-top"
            >
              <ion-spinner v-if="submitting" name="crescent" />
              <span v-else>{{ $t('auth.verifyEmail') }}</span>
            </ion-button>
          </div>

          <ion-text v-if="error" color="danger" class="ion-margin-top">
            <p>{{ error }}</p>
          </ion-text>
        </form>

        <!-- Retry button for company creation failures -->
        <div v-if="companyCreationError" class="ion-text-center ion-margin-top">
          <ion-text color="danger">
            <p>{{ companyCreationError }}</p>
          </ion-text>
          <ion-button
            expand="block"
            class="ion-margin-top"
            @click="retryCompanyCreation"
          >
            {{ $t('auth.retryCreation') }}
          </ion-button>
          <ion-button
            expand="block"
            fill="clear"
            class="ion-margin-top"
            @click="skipCompanyCreation"
          >
            {{ $t('auth.skipForNow') }}
          </ion-button>
        </div>

        <div v-if="!creatingCompany" class="ion-text-center ion-margin-top">
          <ion-text color="medium">
            <p>{{ $t('auth.didntReceiveCode') }}</p>
          </ion-text>
          <ion-button
            fill="clear"
            :disabled="resending"
            @click="resendCode"
          >
            {{ resending ? $t('auth.sending') : $t('auth.resendCode') }}
          </ion-button>
        </div>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const { verifyEmail } = useAuth()
const { initializeCompany } = useCompanyInitialization()
const localePath = useLocalePath()
const { t } = useI18n()
const { mail, businessOutline } = useIcons()

// Get email from local storage
const storage = useStorage()
const registrationEmail = storage.get('registration_email')

// Redirect if no email stored
if (!registrationEmail) {
  await navigateTo(localePath('/register'))
}

const token = ref('')
const submitting = ref(false)
const resending = ref(false)
const error = ref('')
const creatingCompany = ref(false)
const companyCreationError = ref('')

const handleVerify = async () => {
  if (!token.value) return

  submitting.value = true
  error.value = ''

  try {
    // Verify email with token - this will now return JWT and set auth state
    await verifyEmail(token.value)

    // Check if this is a new registration that needs company initialization
    const storage = useStorage()
    const needsCompanyInit = storage.get<boolean>('needs_company_init')

    if (needsCompanyInit && registrationEmail) {
      // Clear the flag
      storage.remove('needs_company_init')

      // Show company creation UI
      creatingCompany.value = true
      submitting.value = false

      // Initialize company with all spaces
      const result = await initializeCompany(
        registrationEmail as string
      )

      if (result) {
        // Success - navigate to main page
        await navigateTo(localePath('/main'))
      } else {
        // Failed after retries
        companyCreationError.value = t('errors.companyCreationFailed')
        creatingCompany.value = false
      }
    } else {
      // Existing user or no company needed - navigate to main page
      await navigateTo(localePath('/main'))
    }
  } catch (err: unknown) {
    const errorObj = err as { data?: { detail?: string } }
    error.value = errorObj.data?.detail || t('errors.verificationFailed')
    submitting.value = false
  }
}

const retryCompanyCreation = async () => {
  if (!registrationEmail) return

  // Prevent double-submission
  if (creatingCompany.value) return

  companyCreationError.value = ''
  creatingCompany.value = true

  const result = await initializeCompany(
    registrationEmail as string
  )

  if (result) {
    await navigateTo(localePath('/main'))
  } else {
    companyCreationError.value = t('errors.companyCreationFailed')
    creatingCompany.value = false
  }
}

const skipCompanyCreation = async () => {
  // User chose to skip - navigate to main page without company
  await navigateTo(localePath('/main'))
}

const resendCode = async () => {
  if (!registrationEmail) return
  
  resending.value = true
  
  try {
    // Send new verification token
    const { api } = useApi()
    const endpoints = useApiEndpoints()
    
    await api(endpoints.authSendToken, {
      method: 'POST',
      body: {
        email: registrationEmail,
        token_type: 'register'
      }
    })
    
    // Show success message or toast
    // TODO: Add toast notification
  } catch (err: unknown) {
    const errorObj = err as { data?: { detail?: string } }
    error.value = errorObj.data?.detail || t('errors.resendFailed')
  } finally {
    resending.value = false
  }
}
</script>
