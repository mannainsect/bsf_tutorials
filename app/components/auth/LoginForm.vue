<template>
  <form @submit.prevent="onSubmit">
    <ion-item>
      <ion-label position="stacked">{{ $t('auth.email') }}</ion-label>
      <ion-input
        v-model="email"
        type="email"
        :placeholder="$t('auth.enterEmail')"
        required
      />
      <ion-note v-if="errors.email" color="danger">{{
        errors.email
      }}</ion-note>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">{{ $t('auth.password') }}</ion-label>
      <ion-input
        v-model="password"
        type="password"
        :placeholder="$t('auth.enterPassword')"
        required
      />
      <ion-note v-if="errors.password" color="danger">{{
        errors.password
      }}</ion-note>
    </ion-item>

    <div class="button-container">
      <ion-button
        expand="block"
        type="submit"
        :disabled="loading || !isValid"
        class="ion-margin-top"
      >
        <ion-spinner v-if="loading" name="crescent" />
        <span v-else>{{ $t('auth.loginButton') }}</span>
      </ion-button>
    </div>

    <ion-text v-if="error" color="danger" class="ion-margin-top">
      <p>{{ error }}</p>
    </ion-text>
  </form>
</template>

<script setup lang="ts">
import type { LoginCredentials } from '../../../shared/types'
import {
  loginSchema,
  useFormValidation
} from '~/composables/validation/useFormValidation'

interface Props {
  loading?: boolean
  error?: string
}

interface Emits {
  submit: [credentials: LoginCredentials]
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: ''
})

const emit = defineEmits<Emits>()

const { handleSubmit, defineField, errors, isValid } = useFormValidation(
  loginSchema,
  { email: '', password: '' }
)

const [email] = defineField('email' as const)
const [password] = defineField('password' as const)

const onSubmit = handleSubmit(values => {
  emit('submit', values as unknown as LoginCredentials)
})
</script>
