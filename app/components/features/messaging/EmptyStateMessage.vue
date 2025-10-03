<template>
  <ion-card class="empty-state-card">
    <ion-card-content class="empty-state-content">
      <ion-icon
        v-if="icon"
        :icon="icon"
        color="medium"
        class="empty-state-icon"
      />

      <ion-text v-if="title" color="dark">
        <h3 class="empty-state-title">{{ title }}</h3>
      </ion-text>

      <ion-text v-if="description" color="medium">
        <p class="empty-state-description">{{ description }}</p>
      </ion-text>

      <ion-button
        v-if="ctaLabel && ctaAction"
        :fill="ctaFill || 'outline'"
        :color="ctaColor || 'primary'"
        class="empty-state-cta"
        @click="handleCtaClick"
      >
        {{ ctaLabel }}
      </ion-button>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title?: string
  description?: string
  ctaLabel?: string
  ctaAction?: () => void | Promise<void>
  ctaFill?: 'clear' | 'outline' | 'solid'
  ctaColor?: string
}

const props = defineProps<Props>()

const handleCtaClick = async () => {
  if (props.ctaAction) {
    await props.ctaAction()
  }
}
</script>

<style scoped>
.empty-state-card {
  margin: 2rem auto;
  max-width: 400px;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  gap: 1rem;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 0.5rem;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.empty-state-description {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.empty-state-cta {
  margin-top: 1rem;
}
</style>