<template>
  <ion-grid class="ion-padding">
    <ion-row class="ion-justify-content-center">
      <ion-col size="12" size-sm="6" size-md="5" size-lg="5">
        <template v-if="token">
          <div class="ion-text-center ion-padding-vertical">
            <ion-text>
              <h1>
                {{ $t('auth.passwordReset.confirmTitle') }}
              </h1>
            </ion-text>
            <ion-text color="medium">
              <p>
                {{ $t('auth.passwordReset.confirmSubtitle') }}
              </p>
            </ion-text>
          </div>

          <AuthPasswordResetConfirmForm :loading="loading" @submit="handleConfirm" />
        </template>

        <div v-else class="ion-text-center ion-padding-vertical">
          <ion-text color="danger">
            <p>
              {{ $t('auth.passwordReset.invalidToken') }}
            </p>
          </ion-text>
          <NuxtLink :to="localePath('/auth/reset-password')">
            <ion-button fill="clear" size="small">
              {{ $t('auth.passwordReset.requestButton') }}
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

const route = useRoute()
const localePath = useLocalePath()
const { loading, confirmReset } = usePasswordReset()

const token = computed(() => {
  const rawToken = route.query.token
  return typeof rawToken === 'string' && rawToken.length > 0 ? rawToken : undefined
})

const handleConfirm = async (payload: { password: string }) => {
  if (!token.value) return
  await confirmReset({
    token: token.value,
    password: payload.password
  })
}
</script>
