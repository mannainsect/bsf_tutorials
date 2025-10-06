<template>
  <div class="page-container">
    <div class="page-content" :class="contentClass">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" />
        <p>{{ loadingText || $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <ion-icon :icon="errorIcon" />
        <h2 v-if="errorTitle">{{ errorTitle }}</h2>
        <p>{{ error }}</p>
        <ion-button v-if="onRetry" fill="outline" @click="onRetry">
          {{ retryText || $t('common.retry') }}
        </ion-button>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Page Header -->
        <section v-if="title || subtitle || $slots.header" class="page-header">
          <slot name="header">
            <h1 v-if="title" class="page-title">{{ title }}</h1>
            <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
          </slot>
        </section>

        <!-- Main Content -->
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  loading?: boolean
  error?: string
  errorTitle?: string
  loadingText?: string
  retryText?: string
  width?: 'narrow' | 'medium' | 'wide' | 'full'
  onRetry?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  loading: false,
  error: '',
  errorTitle: '',
  loadingText: '',
  retryText: '',
  width: 'full',
  onRetry: undefined
})

const { error: errorIcon } = useIcons()

const contentClass = computed(() => {
  if (props.width === 'narrow') return 'page-content--narrow'
  if (props.width === 'medium') return 'page-content--medium'
  if (props.width === 'wide') return 'page-content--wide'
  return ''
})
</script>

<style scoped>
.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-3xl);
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0 0 var(--spacing-sm);
}

.page-subtitle {
  font-size: var(--font-lg);
  color: var(--ion-color-medium);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .page-title {
    font-size: var(--font-2xl);
  }

  .page-subtitle {
    font-size: var(--font-base);
  }
}
</style>
