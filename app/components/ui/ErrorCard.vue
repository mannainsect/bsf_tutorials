<template>
  <ion-card color="danger" :class="{ 'error-card': compact }">
    <ion-card-content>
      <ion-text color="danger">
        <p>{{ message }}</p>
      </ion-text>
      <ion-button
        v-if="showRetry"
        size="small"
        @click="$emit('retry')"
      >
        {{ retryLabel || t('common.retry') }}
      </ion-button>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
interface Props {
  message: string
  showRetry?: boolean
  retryLabel?: string
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  showRetry: true,
  compact: true
})

defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.error-card {
  margin-top: 8px;
  margin-bottom: 8px;
}

.error-card ion-card-content {
  padding: 12px;
}

.error-card ion-button {
  margin-top: 8px;
}
</style>