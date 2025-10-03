<template>
  <ion-grid class="ion-padding">
    <ion-row class="ion-justify-content-center">
      <ion-col size="12" size-sm="6" size-md="5">
        <div v-if="creatingCompany" class="ion-text-center ion-padding-vertical">
          <ion-icon
            :icon="businessOutline"
            size="large"
            color="primary"
            class="ion-margin-bottom"
          />
          <ion-text>
            <h2>{{ $t('auth.creatingWorkspace') }}</h2>
          </ion-text>
          <ion-text color="medium">
            <p>{{ $t('auth.settingUpCompany') }}</p>
          </ion-text>
          <ion-progress-bar type="indeterminate" color="primary" />
        </div>

        <div v-else class="ion-text-center ion-padding-vertical">
          <ion-spinner
            v-if="!error"
            name="crescent"
            size="large"
            color="primary"
          />
          <ion-icon
            v-else
            :icon="closeCircle"
            size="large"
            color="danger"
          />
          <ion-text>
            <h2 v-if="!error">
              {{ $t('auth.verifyingEmail') }}
            </h2>
            <h2 v-else>
              {{ $t('auth.verificationFailed') }}
            </h2>
          </ion-text>
        </div>

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
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'

definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const { localePath } = useSafeLocalePath()
const { verifyEmail } = useAuth()
const { t } = useI18n()
const { closeCircle, businessOutline } = useIcons()

const error = ref('')
const isProcessing = ref(false)
let redirectTimeout: NodeJS.Timeout | null = null

// Extract token from query params
const token = route.query.token as string

// Redirect if no token present
if (!token) {
  await navigateTo(localePath('/verify-token'))
}


// Company initialization
const { initializeCompany } = useCompanyInitialization()
const storage = useStorage()
const registrationEmail = storage.get('registration_email')
const creatingCompany = ref(false)
const companyCreationError = ref('')

// Auto-verify token on mount
onMounted(async () => {
  // Prevent duplicate processing
  if (isProcessing.value) return

  try {
    isProcessing.value = true

    // Verify email - API returns 201 (Created) on success
    // $fetch automatically handles both 200 and 201 as success
    await verifyEmail(token)

    const needsCompanyInit = storage.get<boolean>('needs_company_init')
    if (needsCompanyInit && registrationEmail) {
      storage.remove('needs_company_init')
      creatingCompany.value = true
      isProcessing.value = false

      const result = await initializeCompany(registrationEmail as string)

      if (result) {
        await navigateTo(localePath('/main'))
      } else {
        companyCreationError.value = t('errors.companyCreationFailed')
        creatingCompany.value = false
      }
    } else {
      await navigateTo(localePath('/main'))
    }
  } catch (err: unknown) {
    // Show error with proper type handling
    if (err && typeof err === 'object' && 'data' in err) {
      const errorData = err as { data?: { detail?: string } }
      error.value = errorData.data?.detail ||
                    t('errors.verificationFailed')
    } else {

      error.value = t('errors.verificationFailed')
    }

    // Redirect to manual entry after delay
    redirectTimeout = setTimeout(async () => {
      await navigateTo(localePath('/verify-token'))
    }, 3000)
  } finally {
    isProcessing.value = false
  }
})

const retryCompanyCreation = async () => {
  if (!registrationEmail) return
  if (creatingCompany.value) return

  companyCreationError.value = ''
  creatingCompany.value = true

  const result = await initializeCompany(registrationEmail as string)

  if (result) {
    await navigateTo(localePath('/main'))
  } else {
    companyCreationError.value = t('errors.companyCreationFailed')
    creatingCompany.value = false
  }
}

const skipCompanyCreation = async () => {
  await navigateTo(localePath('/main'))
}


// Cleanup on unmount
onUnmounted(() => {
  if (redirectTimeout) {
    clearTimeout(redirectTimeout)
    redirectTimeout = null
  }
})
</script>
