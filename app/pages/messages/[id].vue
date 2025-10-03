<template>
  <div class="messages-page">
    <!-- Header -->
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button :default-href="localePath('/messages')" />
      </ion-buttons>
      <ion-title>{{ conversationTitle }}</ion-title>
    </ion-toolbar>


    <!-- Loading State -->
    <div v-if="isLoading" class="ion-text-center ion-padding">
      <ion-spinner color="primary" />
      <ion-text color="medium">
        <p>{{ $t('messaging.loadingConversation') }}</p>
      </ion-text>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="ion-text-center ion-padding">
      <ion-text color="danger">
        <h3>{{ $t('errors.loadingFailed') }}</h3>
        <p>{{ error.message }}</p>
      </ion-text>
      <ion-button color="primary" fill="outline" @click="retryLoad">
        {{ $t('common.retry') }}
      </ion-button>
    </div>

    <!-- Conversation -->
    <template v-else-if="conversation">
      <!-- Product Info -->
      <ion-card class="product-card">
        <ion-item lines="none">
          <ion-thumbnail slot="start">
            <img
              src="/images/product-placeholder.svg"
              :alt="conversation.product_title"
            />
          </ion-thumbnail>
          <ion-label>
            <h2>{{ conversation.product_title }}</h2>
            <ion-chip
              :color="conversation.conversation_type === 'market' ? 'secondary' : 'tertiary'"
              size="small"
            >
              {{ conversation.conversation_type === 'market'
                ? $t('messaging.marketListing')
                : $t('messaging.wantedListing') }}
            </ion-chip>
          </ion-label>
        </ion-item>
      </ion-card>

      <!-- Messages List -->
      <div class="messages-list" ref="messagesList">
        <div
          v-for="(msg, index) in sortedMessages"
          :key="index"
          :class="['message', msg.user_id === authStore.userId ? 'sent' : 'received']"
        >
          <ion-card :color="msg.user_id === authStore.userId ? 'primary' : 'light'">
            <ion-card-content>
              <p>{{ msg.message }}</p>
              <ion-note>{{ formatMessageTime(msg.created_at) }}</ion-note>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </template>

    <!-- Message composer (internal, fixed within IonContent) -->
    <div
      v-if="conversation && !isLoading"
      class="message-footer"
      :style="{ bottom: composerBottom + 'px' }"
    >
      <ion-toolbar>
        <div class="input-container">
          <ion-textarea
            class="message-textarea"
            v-model="newMessage"
            :placeholder="$t('messaging.compose.placeholder')"
            :disabled="isSending"
            :maxlength="1000"
            :auto-grow="true"
            :rows="1"
            enterkeyhint="send"
            @keydown.enter.prevent="handleSendMessage"
          />
          <ion-button
            class="send-button"
            :disabled="!canSend"
            fill="clear"
            @click="handleSendMessage"
          >
            <ion-spinner v-if="isSending" name="crescent" />
            <ion-icon v-else :icon="icons.send" />
          </ion-button>
        </div>
      </ion-toolbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Conversation,
  Message
} from '../../../shared/types/models/Message'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'
import { useMessaging } from '~/composables/useMessaging'

const icons = useIcons()
const route = useRoute()
const authStore = useAuthStore()
const { localePath } = useSafeLocalePath()
const { t, locale } = useI18n()
const {
  conversations,
  isLoading,
  error,
  isSending,
  fetchConversations,
  sendFollowUpMessage,
  clearError
} = useMessaging()

const conversationId = computed(() => route.params.id as string)
const conversation = ref<Conversation | null>(null)
const newMessage = ref('')
const pollingInterval = ref<NodeJS.Timeout | null>(null)
const messagesList = ref<HTMLElement | null>(null)
const composerBottom = ref(56)

const updateComposerBottom = () => {
  const vv = (window as any).visualViewport
  let extra = 0
  if (vv) {
    const inset = window.innerHeight - vv.height - vv.offsetTop
    extra = inset > 0 ? Math.round(inset) : 0
  }
  composerBottom.value = 56 + extra
}


const sortedMessages = computed(() => {
  if (!conversation.value?.messages) return []
  return [...conversation.value.messages].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
})

const scrollToBottom = () => {
  nextTick(() => {
    // Scroll to the bottom of the page
    window.scrollTo(0, document.body.scrollHeight)
  })
}

const conversationTitle = computed(() => {
  if (!conversation.value) return ''
  const isOwner = authStore.companyId === conversation.value.company_id
  return isOwner
    ? conversation.value.buyer_company_name
    : conversation.value.company_name
})

const canSend = computed(() => {
  return newMessage.value.trim().length > 0 &&
         newMessage.value.length <= 1000 &&
         !isSending.value &&
         conversation.value !== null
})

// Removed getMessageClass - now handled inline in template


const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const timePart = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (diffDays === 0) {
    return timePart
  } else if (diffDays === 1) {
    return t('messaging.relativeTime.yesterdayAt', { time: timePart })
  } else {
    const datePart = date.toLocaleDateString(locale.value)
    return t('messaging.relativeTime.dateAtTime', {
      date: datePart,
      time: timePart
    })
  }
}

const loadConversation = async () => {
  if (!conversationId.value) return

  clearError()
  await fetchConversations()

  const found = conversations.value.find(
    c => c._id === conversationId.value
  )

  if (found) {
    conversation.value = { ...found }
    scrollToBottom()
  } else {
    error.value = { message: t('messaging.conversationNotFound') } as any
  }
}

const handleSendMessage = async () => {
  if (!canSend.value || !conversation.value) return

  const messageText = newMessage.value.trim()
  newMessage.value = ''

  const response = await sendFollowUpMessage(
    conversation.value,
    messageText
  )

  if (response) {
    await loadConversation()
    scrollToBottom()
  }
}

const retryLoad = async () => {
  await loadConversation()
}



const startPolling = () => {
  pollingInterval.value = setInterval(async () => {
    if (!document.hidden) {
      await loadConversation()
    }
  }, 10000)
}

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

onMounted(async () => {
  await loadConversation()
  startPolling()
  updateComposerBottom()
  const vv = (window as any).visualViewport
  if (vv) {
    vv.addEventListener('resize', updateComposerBottom)
    vv.addEventListener('scroll', updateComposerBottom)
  }
  window.addEventListener('orientationchange', () => {
    setTimeout(updateComposerBottom, 300)
  })
})

onUnmounted(() => {
  stopPolling()
  const vv = (window as any).visualViewport
  if (vv) {
    vv.removeEventListener('resize', updateComposerBottom)
    vv.removeEventListener('scroll', updateComposerBottom)
  }
  window.removeEventListener('orientationchange', () => {
    setTimeout(updateComposerBottom, 300)
  })
})

onDeactivated(() => {
  stopPolling()
})

onActivated(() => {
  loadConversation()
  startPolling()
})
</script>

<style scoped>
/* Page container padding to avoid overlap with composer + app footer */
.messages-page {
  padding-bottom: 120px;
}

/* Fixed internal composer above the base app footer */
.message-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(56px + env(safe-area-inset-bottom));
  background: var(--ion-background-color);
  padding: 4px 8px;
  border-top: 1px solid var(--ion-color-step-150, #e0e0e0);
  z-index: 1000;
}


/* Product card */
.product-card {
  margin: 8px;
}

/* Messages list */
.messages-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Message alignment */
.message {
  display: flex;
}

.message.sent {
  justify-content: flex-end;
}

.message.received {
  justify-content: flex-start;
}

.message ion-card {
  max-width: 75%;
  margin: 0;
}

.message.sent ion-card {
  --ion-color-base: var(--ion-color-primary);
  --ion-color-contrast: white;
}

.message ion-card-content {
  padding: 12px;
}

.message ion-note {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
}



.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-container ion-textarea {
  flex: 1;
  background: var(--ion-color-light);
  border-radius: 20px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  --padding-start: 16px;
  --padding-end: 16px;
  min-height: 36px;
  max-height: 100px;
  font-size: 14px;
}

.input-container ion-button {
  --padding-start: 0;
  --padding-end: 0;
  width: 36px;
  height: 36px;
  --border-radius: 50%;
}

.input-container ion-button ion-icon {
  font-size: 20px;
}
</style>
