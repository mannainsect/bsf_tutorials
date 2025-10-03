<template>
  <ion-card>
    <ion-card-header v-if="title || subtitle || $slots.header">
      <slot name="header">
        <ion-card-title v-if="title">{{ title }}</ion-card-title>
        <ion-card-subtitle v-if="subtitle">{{ subtitle }}</ion-card-subtitle>
      </slot>
    </ion-card-header>
    
    <ion-card-content v-if="$slots.default">
      <slot />
    </ion-card-content>
    
    <div v-if="$slots.actions" class="ion-padding">
      <slot name="actions" />
    </div>
  </ion-card>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: ''
})
</script>

