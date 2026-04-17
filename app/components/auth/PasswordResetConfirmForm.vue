<template>
  <form @submit.prevent="onSubmit">
    <ion-item>
      <ion-label position="stacked">
        {{ $t('auth.passwordReset.newPassword') }}
      </ion-label>
      <ion-input
        v-model="password"
        type="password"
        :placeholder="$t('auth.enterPassword')"
        required
      />
      <ion-note v-if="errors.password" color="danger">
        {{ errors.password }}
      </ion-note>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">
        {{ $t('auth.passwordReset.confirmPassword') }}
      </ion-label>
      <ion-input
        v-model="confirmPassword"
        type="password"
        :placeholder="$t('auth.confirmPassword')"
        required
      />
      <ion-note v-if="errors.confirmPassword" color="danger">
        {{ errors.confirmPassword }}
      </ion-note>
    </ion-item>

    <div class="button-container">
      <ion-button
        expand="block"
        type="submit"
        :disabled="loading || !isValid"
        class="ion-margin-top"
      >
        <ion-spinner v-if="loading" name="crescent" />
        <span v-else>
          {{ $t('auth.passwordReset.submitButton') }}
        </span>
      </ion-button>
    </div>

    <ion-text v-if="error" color="danger" class="ion-margin-top">
      <p>{{ error }}</p>
    </ion-text>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  createResetPasswordConfirmSchema,
  useFormValidation
} from '~/composables/validation/useFormValidation'

interface Props {
  loading?: boolean
  error?: string
}

interface Emits {
  submit: [payload: { password: string }]
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: ''
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const schema = createResetPasswordConfirmSchema(t)
const { handleSubmit, defineField, errors, isValid } = useFormValidation(schema, {
  password: '',
  confirmPassword: ''
})

const [password] = defineField('password' as const)
const [confirmPassword] = defineField('confirmPassword' as const)

const onSubmit = handleSubmit(values => {
  emit('submit', { password: values.password })
})
</script>
