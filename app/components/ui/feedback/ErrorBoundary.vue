<template>
  <div>
    <slot v-if="!hasError" />
    <div v-else class="error-boundary">
      <ion-card class="error-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="warningOutline" color="danger" />
            {{ title || $t('errors.boundary.title') }}
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <p>{{ message || $t('errors.boundary.message') }}</p>
          
          <div v-if="showDetails && errorDetails" class="error-details">
            <ion-button 
              fill="clear" 
              size="small" 
              @click="showErrorDetails = !showErrorDetails"
            >
              {{ showErrorDetails ? $t('common.hideDetails') : $t('common.showDetails') }}
            </ion-button>
            
            <div v-if="showErrorDetails" class="error-code">
              <pre>{{ errorDetails }}</pre>
            </div>
          </div>
          
          <div class="error-actions">
            <ion-button 
              fill="solid" 
              color="primary" 
              @click="handleRetry"
            >
              {{ retryText || $t('common.retry') }}
            </ion-button>
            
            <ion-button 
              v-if="showGoHome"
              fill="outline" 
              color="medium" 
              @click="goHome"
            >
              {{ $t('common.goHome') }}
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { warningOutline } from 'ionicons/icons'

interface Props {
  title?: string
  message?: string
  retryText?: string
  showDetails?: boolean
  showGoHome?: boolean
  fallbackComponent?: Component
}

interface Emits {
  retry: []
  error: [error: Error, errorInfo: unknown]
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  message: undefined,
  retryText: undefined,
  showDetails: false,
  showGoHome: true,
  fallbackComponent: undefined
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const hasError = ref(false)
const errorDetails = ref<string | null>(null)
const showErrorDetails = ref(false)

// Capture errors
onErrorCaptured((error: Error, _instance, errorInfo) => {
  hasError.value = true
  errorDetails.value = `${error.message}\n\nStack: ${error.stack}`
  
  emit('error', error, errorInfo)
  
  // Log error in development
  if (import.meta.dev) {
    console.error(t('errors.boundary.caughtLog'), error)
    console.error(t('errors.boundary.infoLog'), errorInfo)
  }
  
  return false // Prevent error from propagating
})

const handleRetry = () => {
  hasError.value = false
  errorDetails.value = null
  showErrorDetails.value = false
  emit('retry')
}

const goHome = () => {
  navigateTo('/')
}

// Allow programmatic error triggering
const triggerError = (error: Error) => {
  hasError.value = true
  errorDetails.value = `${error.message}\n\nStack: ${error.stack}`
}

defineExpose({
  triggerError,
  reset: handleRetry
})
</script>

<style scoped>
.error-boundary {
  padding: 1rem;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card {
  max-width: 500px;
  width: 100%;
}

.error-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ion-color-light);
}

.error-code {
  background: var(--ion-color-light);
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow-x: auto;
}

.error-code pre {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ion-color-danger);
}

.error-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
