<template>
  <div
    class="ion-text-center"
    :class="{
      'ion-justify-content-center ion-align-items-center': centered,
      'loading-fullscreen': fullscreen,
      'loading-container': !fullscreen
    }"
  >
    <ion-spinner :name="name" :color="color" />
    <ion-text v-if="message" color="medium">
      <p>{{ message }}</p>
    </ion-text>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name?:
    | 'bubbles'
    | 'circles'
    | 'circular'
    | 'crescent'
    | 'dots'
    | 'lines'
    | 'lines-small'
  color?: string
  message?: string
  centered?: boolean
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  name: 'crescent',
  color: 'primary',
  message: '',
  centered: false,
  fullscreen: false
})
</script>

<style scoped>
.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--ion-overlay-background-color, rgba(0, 0, 0, 0.4));
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
