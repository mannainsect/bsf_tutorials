<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button :default-href="localePath('/main')" />
      </ion-buttons>
      <ion-title>{{ $t('messaging.title') }}</ion-title>
    </ion-toolbar>

    <div class="ion-padding content-wrapper">
      <ion-refresher
        slot="fixed"
        @ion-refresh="handleRefresh($event)"
      >
        <ion-refresher-content
          :pulling-text="$t('common.pullToRefresh')"
          :refreshing-text="$t('common.refreshing')"
        />
      </ion-refresher>

      <MessageSkeleton v-if="isLoading" :count="5" />

      <div v-else-if="error" class="error-container">
        <ion-text color="danger">
          <h3>{{ $t('errors.loadingFailed') }}</h3>
          <p>{{ error.message }}</p>
        </ion-text>
        <ion-button
          color="primary"
          fill="outline"
          @click="retryLoad"
        >
          {{ $t('common.retry') }}
        </ion-button>
      </div>

      <ion-list v-else-if="conversations.length > 0">
        <ion-item
          v-for="conversation in sortedConversations"
          :key="conversation._id"
          button
          lines="inset"
          @click="viewConversation(conversation)"
        >
          <ion-thumbnail slot="start">
            <div class="avatar-container">
              <ion-icon
                :icon="icons.chatbubble"
                class="avatar-icon"
              />
            </div>
          </ion-thumbnail>
          <ion-label>
            <h2 class="conversation-title">
              {{ conversation.company_name }}
            </h2>
            <p class="product-title">
              {{ conversation.product_title }}
            </p>
            <p class="last-message">
              {{ getLastMessageText(conversation) }}
            </p>
          </ion-label>
          <ion-note slot="end">
            {{ formatTimestamp(conversation.updated_at) }}
          </ion-note>
        </ion-item>
      </ion-list>

      <EmptyStateMessage
        v-else
        :icon="icons.chatbubbles"
        :title="$t('messaging.noConversations')"
        :description="$t('messaging.noConversationsDescription')"
        :cta-label="$t('messaging.browseMarketplace')"
        :cta-action="() => router.push(localePath('/market'))"
        cta-fill="outline"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '../../../shared/types/models/Message'
import {
  getLatestMessage,
  sortConversationsByDate
} from '../../../shared/types/models/Message'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'
import { useMessaging } from '~/composables/useMessaging'
import MessageSkeleton from
  '~/components/features/messaging/MessageSkeleton.vue'
import EmptyStateMessage from
  '~/components/features/messaging/EmptyStateMessage.vue'

const { t, locale } = useI18n()

const icons = useIcons()
const router = useRouter()
const { localePath } = useSafeLocalePath()
const {
  conversations,
  isLoading,
  error,
  fetchConversations
} = useMessaging()

const sortedConversations = computed(() => {
  return sortConversationsByDate([...conversations.value])
})

const getLastMessageText = (conversation: Conversation): string => {
  const lastMessage = getLatestMessage(conversation)
  if (!lastMessage) {
    return t('messaging.noMessages')
  }

  const prefix = lastMessage.product_owner
    ? t('messaging.roles.seller')
    : t('messaging.roles.buyer')

  const truncatedMsg = lastMessage.message.length > 50
    ? lastMessage.message.substring(0, 50) + '...'
    : lastMessage.message

  return t('messaging.lastMessagePrefix', {
    role: prefix,
    message: truncatedMsg
  })
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (diffDays === 1) {
    return t('messaging.relativeTime.yesterday')
  } else if (diffDays < 7) {
    return t('messaging.relativeTime.daysAgo', { count: diffDays })
  } else {
    return date.toLocaleDateString(locale.value)
  }
}

const viewConversation = async (conversation: Conversation) => {
  await router.push(
    localePath(`/messages/${conversation._id}`)
  )
}

const handleRefresh = async (event: CustomEvent) => {
  await fetchConversations(true)
  event.target.complete()
}

const retryLoad = async () => {
  await fetchConversations(true)
}

onMounted(async () => {
  await fetchConversations()
})
</script>

<style scoped>
.content-wrapper {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow-y: auto;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 50vh;
  text-align: center;
}

.avatar-container {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary-tint);
  border-radius: 50%;
}

.avatar-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.conversation-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.product-title {
  font-size: 0.875rem;
  color: var(--ion-text-color-secondary);
  margin-bottom: 2px;
}

.last-message {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.conversation-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

ion-note {
  white-space: nowrap;
  font-size: 0.75rem;
  align-self: flex-start;
  margin-top: 8px;
}

ion-thumbnail {
  --size: 48px;
  margin-inline-end: 12px;
}
</style>
