<template>
  <form @submit.prevent="onSubmit">
    <ion-item>
      <ion-label position="stacked">
        {{ $t('auth.email') }}
      </ion-label>
      <ion-input
        v-model="email"
        type="email"
        :placeholder="$t('auth.enterEmail')"
        :disabled="submitting"
      />
      <ion-note
        v-if="errors.email"
        color="danger"
      >
        {{ errors.email }}
      </ion-note>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">
        {{ $t('auth.password') }}
      </ion-label>
      <ion-input
        v-model="password"
        type="password"
        :placeholder="$t('auth.enterPassword')"
        :disabled="submitting"
      />
      <ion-note
        v-if="errors.password"
        color="danger"
      >
        {{ errors.password }}
      </ion-note>
    </ion-item>

    <div class="button-container">
      <ion-button
        expand="block"
        type="submit"
        :disabled="submitting || !isValid"
        class="ion-margin-top"
      >
        <ion-spinner
          v-if="submitting"
          name="crescent"
        />
        <span v-else>
          {{ $t('auth.registerButton') }}
        </span>
      </ion-button>
    </div>

    <ion-text
      v-if="error"
      color="danger"
      class="ion-margin-top"
    >
      <p>{{ error }}</p>
    </ion-text>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  createRegisterEmailPasswordSchema,
  useFormValidation,
} from '~/composables/validation/useFormValidation'

interface Props {
  submitting?: boolean
  error?: string
}

interface Emits {
  submit: [
    formData: { email: string; password: string },
  ]
}

withDefaults(defineProps<Props>(), {
  submitting: false,
  error: '',
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const schema = createRegisterEmailPasswordSchema(t)
const {
  handleSubmit: formSubmit,
  defineField,
  errors,
  isValid,
} = useFormValidation(schema, {
  email: '',
  password: '',
})

const [email] = defineField('email' as const)
const [password] = defineField('password' as const)

const onSubmit = formSubmit(values => {
  emit('submit', {
    email: values.email as string,
    password: values.password as string,
  })
})
</script>
