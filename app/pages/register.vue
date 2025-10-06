<template>
  <ion-grid class="ion-padding">
    <ion-row class="ion-justify-content-center">
      <ion-col size="12" size-sm="6" size-md="5" size-lg="5">
        <div class="ion-text-center ion-padding-vertical">
          <ion-text>
            <h1>{{ $t('auth.createAccount') }}</h1>
          </ion-text>
          <ion-text color="medium">
            <p>{{ $t('auth.joinUsToday') }}</p>
          </ion-text>
        </div>

        <AuthRegisterForm
          :submitting="submitting"
          :error="error"
          @submit="handleSubmit"
        />

        <div class="ion-text-center ion-margin-top">
          <ion-text color="medium">
            <p>{{ $t('auth.alreadyHaveAccount') }}</p>
          </ion-text>
          <NuxtLink :to="localePath('/login')">
            <ion-button fill="clear" size="small">
              {{ $t('auth.signInLink') }}
            </ion-button>
          </NuxtLink>
        </div>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import { useRegistration } from '~/composables/auth/useRegistration'

// Page configuration
definePageMeta({
  layout: 'public',
  middleware: 'guest'
})

// Composables
const localePath = useLocalePath()
const { registerUser, loading: submitting, error } = useRegistration()

/**
 * Handle registration form submission
 * Orchestrates user registration and navigation
 */
const handleSubmit = async (formData: { email: string; password: string }) => {
  try {
    // Register user using composable
    await registerUser(formData.email, formData.password)

    // Navigate to verification page on success
    await navigateTo(localePath('/verify-token'))
  } catch {
    // Error is already handled and formatted in the composable
    // No additional action needed here
  }
}
</script>
