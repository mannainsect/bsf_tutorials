<template>
  <form @submit.prevent="onSubmit">
    <ion-item>
      <ion-label position="stacked">
        {{ $t('auth.email') }}
      </ion-label>
      <ion-input v-model="email" type="email" :placeholder="$t('auth.enterEmail')" required />
      <ion-note v-if="errors.email" color="danger">
        {{ errors.email }}
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
          {{ $t('auth.passwordReset.requestButton') }}
        </span>
      </ion-button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  createResetPasswordRequestSchema,
  useFormValidation
} from '~/composables/validation/useFormValidation'

interface Props {
  loading?: boolean
}

interface Emits {
  submit: [payload: { email: string }]
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const schema = createResetPasswordRequestSchema(t)
const { handleSubmit, defineField, errors, isValid } = useFormValidation(schema, { email: '' })

const [email] = defineField('email' as const)

const onSubmit = handleSubmit(values => {
  emit('submit', { email: values.email })
})
</script>
