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
          {{ $t('messaging.compose.title') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button
            fill="clear"
            :aria-label="$t('common.close')"
            @click="dismiss"
          >
            <ion-icon :icon="icons.close" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item v-if="product" lines="none">
        <ion-label>
          <h2>{{ product.title }}</h2>
          <p>{{ product.company_name }}</p>
        </ion-label>
      </ion-item>

      <ion-item v-if="wantedItem" lines="none">
        <ion-label>
          <h2>{{ wantedItem.title }}</h2>
          <p>{{ wantedItem.company_name }}</p>
        </ion-label>
      </ion-item>

      <ion-item v-if="error" lines="none">
        <ion-label color="danger">
          <p>{{ error.message }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">
          {{ $t('messaging.compose.messageLabel') }}
        </ion-label>
        <ion-textarea
          v-model="messageText"
          data-test="message-input"
          :placeholder="$t('messaging.compose.placeholder')"
          :maxlength="1000"
          :disabled="isSending"
          :rows="8"
          auto-grow
        />
      </ion-item>

      <ion-text color="medium" class="character-count">
        <p>{{ messageText.length }} / 1000</p>
      </ion-text>

      <div class="button-group">
        <ion-button
          expand="block"
          data-test="send-button"
          :disabled="!canSend"
          @click="handleSend"
        >
          <ion-spinner
            v-if="isSending"
            slot="start"
            data-test="sending-spinner"
            name="dots"
          />
          <ion-icon
            v-else
            slot="start"
            :icon="icons.send"
          />
          {{ $t('messaging.compose.send') }}
        </ion-button>

        <ion-button
          expand="block"
          fill="outline"
          :disabled="isSending"
          @click="dismiss"
        >
          {{ $t('common.cancel') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type {
  Product,
  ProductPublicListing
} from '../../../shared/types/models/MarketplaceProduct'
import type {
  Wanted,
  WantedPublicListing
} from '../../../shared/types/models/MarketplaceWanted'
import { useMessaging } from '~/composables/useMessaging'

const icons = useIcons()
const {
  sendInitialMessage,
  isSending,
  error: messagingError,
  clearError
} = useMessaging()
const error = computed(() => messagingError.value)

interface Props {
  isOpen: boolean
  product?: Product | ProductPublicListing | null
  wantedItem?: Wanted | WantedPublicListing | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'dismiss'): void
  (e: 'sent', response: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modalRef: Ref<any> = ref(null)
const messageText = ref('')

const canSend = computed(() => {
  const hasProductId = props.product?.id || props.wantedItem?.id
  const hasCompanyId = (props.product && 'company_id' in props.product) ||
                      (props.wantedItem && 'company_id' in props.wantedItem)

  return messageText.value.trim().length > 0 &&
         messageText.value.length <= 1000 &&
         !isSending.value &&
         hasProductId &&
         hasCompanyId
})

const handleDismiss = () => {
  emit('update:isOpen', false)
  emit('dismiss')
  messageText.value = ''
}

const dismiss = () => {
  modalRef.value?.$el.dismiss()
}

const handleSend = async () => {
  if (!canSend.value) return

  const productId = props.product?.id || props.wantedItem?.id
  if (!productId) {
    return
  }

  const sellerCompanyId = (props.product && 'company_id' in props.product
                          ? props.product.company_id
                          : undefined) ||
                         (props.wantedItem && 'company_id' in props.wantedItem
                          ? props.wantedItem.company_id
                          : undefined)
  if (!sellerCompanyId) {
    return
  }

  const response = await sendInitialMessage(
    productId,
    messageText.value,
    sellerCompanyId,
    false
  )

  if (response) {
    emit('sent', response)
    messageText.value = ''
    dismiss()
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    messageText.value = ''
    clearError()
  }
})

defineExpose({
  dismiss
})
</script>

<style scoped>
.character-count {
  display: block;
  text-align: right;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.button-group {
  margin-top: 1.5rem;
}

.button-group ion-button {
  margin-bottom: 0.75rem;
}

ion-textarea {
  --padding-bottom: 0.5rem;
  --padding-top: 0.5rem;
}
</style>