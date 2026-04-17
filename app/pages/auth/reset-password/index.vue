<template>
  <ion-grid class="ion-padding">
    <ion-row class="ion-justify-content-center">
      <ion-col size="12" size-sm="6" size-md="5" size-lg="5">
        <div class="ion-text-center ion-padding-vertical">
          <ion-text>
            <h1>
              {{ $t('auth.passwordReset.requestTitle') }}
            </h1>
          </ion-text>
          <ion-text color="medium">
            <p>
              {{ $t('auth.passwordReset.requestSubtitle') }}
            </p>
          </ion-text>
        </div>

        <AuthPasswordResetRequestForm
          v-if="!submitted"
          :loading="loading"
          @submit="handleRequest"
        />

        <div v-else class="ion-text-center ion-padding-vertical">
          <ion-text color="success">
            <p>
              {{ $t('auth.passwordReset.requestSuccess') }}
            </p>
          </ion-text>
        </div>

        <div class="ion-text-center ion-margin-top">
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
import { usePasswordReset } from '~/composables/auth/usePasswordReset'

definePageMeta({
  layout: 'public',
  middleware: 'guest'
})

const localePath = useLocalePath()
const { loading, requestReset } = usePasswordReset()
const submitted = ref(false)

const handleRequest = async (payload: { email: string }) => {
  await requestReset(payload.email)
  submitted.value = true
}
</script>
