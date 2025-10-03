<template>
  <ion-modal
    ref="modalRef"
    :is-open="isOpen"
    :backdrop-dismiss="true"
    :keyboard-close="true"
    @ion-modal-did-dismiss="handleDismiss"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>
          {{ $t('marketplace.authModal.title') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button
            fill="clear"
            :aria-label="$t('common.close')"
            @click="dismiss"
          >
            <ion-icon :icon="closeIcon" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ion-text-center">
        <!-- Icon for visual appeal -->
        <ion-icon
          :icon="lockIcon"
          class="auth-modal-icon"
          aria-hidden="true"
        />

        <!-- Main message -->
        <ion-text>
          <h3>{{ $t('marketplace.authModal.heading') }}</h3>
        </ion-text>

        <ion-text color="medium">
          <p class="description-text">
            {{ $t('marketplace.authModal.description') }}
          </p>
        </ion-text>

        <!-- Benefits list -->
        <ion-list lines="none" class="ion-no-padding">
          <ion-item
            v-for="benefit in benefits"
            :key="benefit"
            class="benefit-item"
          >
            <ion-icon
              slot="start"
              :icon="checkmarkIcon"
              color="success"
              size="small"
            />
            <ion-label class="benefit-label">
              {{ $t(`marketplace.authModal.benefits.${benefit}`) }}
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-text color="medium" class="free-usage-text">
          <p>{{ $t('marketplace.authModal.freeUsage') }}</p>
        </ion-text>
      </div>

      <!-- CTA Buttons -->
      <div class="ion-padding-top">
        <ion-button
          expand="block"
          :aria-label="$t('marketplace.authModal.signInButton')"
          @click="handleSignIn"
        >
          {{ $t('marketplace.authModal.signInButton') }}
        </ion-button>

        <ion-button
          expand="block"
          fill="outline"
          class="ion-margin-top"
          :aria-label="$t('marketplace.authModal.registerButton')"
          @click="handleRegister"
        >
          {{ $t('marketplace.authModal.registerButton') }}
        </ion-button>
      </div>

      <!-- Continue as guest option -->
      <div class="ion-text-center ion-padding-top guest-section">
        <ion-text color="medium" class="guest-text">
          <small>
            {{ $t('marketplace.authModal.continueAsGuest') }}
          </small>
        </ion-text>
        <ion-button
          fill="clear"
          size="small"
          :aria-label="$t('marketplace.authModal.browseOnly')"
          @click="dismiss"
        >
          {{ $t('marketplace.authModal.browseOnly') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

import { useSafeLocalePath } from '~/composables/useSafeLocalePath'

const { close, lock, success: checkmarkIcon } = useIcons()
const { localePath } = useSafeLocalePath()
const router = useRouter()

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'dismiss'): void
  (e: 'signIn'): void
  (e: 'register'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modalRef: Ref<any> = ref(null)
const closeIcon = close
const lockIcon = lock

// Benefits to display in the modal
const benefits = [
  'saveProducts',
  'trackOrders',
  'getDeals',
  'personalized'
]

const handleDismiss = () => {
  emit('update:isOpen', false)
  emit('dismiss')
}

const dismiss = () => {
  modalRef.value?.$el.dismiss()
}

const handleSignIn = async () => {
  dismiss()
  emit('signIn')
  await router.push(localePath('/login'))
}

const handleRegister = async () => {
  dismiss()
  emit('register')
  await router.push(localePath('/register'))
}

// Expose methods for parent components if needed
defineExpose({
  dismiss
})
</script>

<style scoped>
/* Minimal custom styles - using Ionic utilities for most spacing */
.auth-modal-icon {
  font-size: 3rem;
  color: var(--ion-color-primary);
  margin: 0.5rem 0;
}

.description-text {
  margin: 0.5rem 0;
}

.benefit-item {
  --background: transparent;
  --min-height: 36px;
  --padding-start: 0;
  --inner-padding-end: 0;
  --inner-padding-top: 0.25rem;
  --inner-padding-bottom: 0.25rem;
  margin: 0.25rem 0;
}

.benefit-label {
  font-size: 0.9rem;
}

.free-usage-text {
  margin-top: 0.75rem;
  font-weight: 500;
}

.guest-section {
  border-top: 1px solid var(--ion-color-light-shade);
}

.guest-text {
  display: block;
  margin-bottom: 0.5rem;
}

/* Compact spacing on small screens */
@media (max-height: 700px) {
  ion-content {
    --padding-top: 8px;
    --padding-bottom: 8px;
  }

  .auth-modal-icon {
    font-size: 2.5rem;
  }

  h3 {
    margin: 0.25rem 0;
  }

  .benefit-item {
    --min-height: 30px;
  }
}
</style>
