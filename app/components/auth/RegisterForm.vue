<template>
  <form @submit.prevent="handleSubmit">
    <ion-item>
      <ion-label position="stacked">{{ $t('auth.email') }}</ion-label>
      <ion-input
        v-model="email"
        type="email"
        :placeholder="$t('auth.enterEmail')"
        required
        :disabled="submitting"
      />
    </ion-item>

    <ion-item>
      <ion-label position="stacked">{{ $t('auth.password') }}</ion-label>
      <ion-input
        v-model="password"
        type="password"
        :placeholder="$t('auth.enterPassword')"
        required
        :disabled="submitting"
      />
    </ion-item>

    <div class="button-container">
      <ion-button
        expand="block"
        type="submit"
        :disabled="submitting || !email || !password"
        class="ion-margin-top"
      >
        <ion-spinner v-if="submitting" name="crescent" />
        <span v-else>{{ $t('auth.registerButton') }}</span>
      </ion-button>
    </div>

    <ion-text v-if="error" color="danger" class="ion-margin-top">
      <p>{{ error }}</p>
    </ion-text>
  </form>
</template>

<script setup lang="ts">
interface Props {
  submitting?: boolean
  error?: string
}

interface Emits {
  submit: [formData: { email: string; password: string }]
}

withDefaults(defineProps<Props>(), {
  submitting: false,
  error: ''
})

const emit = defineEmits<Emits>()

const email = ref('')
const password = ref('')

const handleSubmit = () => {
  if (!email.value || !password.value) return
  emit('submit', { email: email.value, password: password.value })
}
</script>

