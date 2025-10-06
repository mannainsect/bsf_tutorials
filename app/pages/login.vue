<template>
  <ion-grid class="ion-padding">
    <ion-row class="ion-justify-content-center">
      <ion-col size="12" size-sm="6" size-md="5" size-lg="5">
        <div class="ion-text-center ion-padding-vertical">
          <ion-text>
            <h1>{{ $t('auth.welcomeBack') }}</h1>
          </ion-text>
          <ion-text color="medium">
            <p>{{ $t('auth.signInToContinue') }}</p>
          </ion-text>
        </div>

        <AuthLoginForm
          :loading="loading"
          :error="error"
          @submit="handleLogin"
        />

        <div class="ion-text-center ion-margin-top">
          <ion-text color="medium">
            <p>{{ $t('auth.dontHaveAccount') }}</p>
          </ion-text>
          <NuxtLink :to="localePath('/register')">
            <ion-button fill="clear" size="small">
              {{ $t('auth.signUpLink') }}
            </ion-button>
          </NuxtLink>
        </div>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import { useLoginForm } from '~/composables/auth/useLoginForm'
import type { LoginCredentials } from '~/composables/auth/useLoginForm'

// Page configuration
definePageMeta({
  layout: 'public',
  middleware: 'guest'
})

// Composables
const { login } = useAuth()
const localePath = useLocalePath()
const {
  validateCredentials,
  formatErrorMessage,
  loading,
  error,
  setLoading,
  setError,
  clearError
} = useLoginForm()

/**
 * Handle login form submission
 * Orchestrates validation, authentication, and navigation
 */
const handleLogin = async (credentials: LoginCredentials) => {
  // Validate credentials using composable
  if (!validateCredentials(credentials)) {
    return
  }

  // Clear any previous errors
  clearError()
  setLoading(true)

  try {
    // Perform authentication
    await login(credentials)

    // Navigate to main page on success
    await navigateTo(localePath('/main'))
  } catch (err: unknown) {
    // Use composable to format error message
    setError(formatErrorMessage(err))
  } finally {
    setLoading(false)
  }
}
</script>
