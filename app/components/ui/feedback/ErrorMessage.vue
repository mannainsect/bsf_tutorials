<template>
  <ion-card v-if="message" :color="color">
    <ion-card-content>
      <div class="ion-display-flex ion-align-items-start">
        <ion-icon
          v-if="showIcon"
          :icon="warning"
          :color="color"
          class="ion-margin-end"
        />
        <div class="ion-flex">
          <ion-card-title v-if="title" :color="color">{{
            title
          }}</ion-card-title>
          <ion-text :color="color">
            <p class="ion-no-margin">{{ message }}</p>
          </ion-text>
          <slot name="actions" />
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
const { warning } = useIcons()

interface Props {
  message: string
  title?: string
  showIcon?: boolean
  color?: 'danger' | 'warning' | 'medium'
}

withDefaults(defineProps<Props>(), {
  title: '',
  showIcon: true,
  color: 'danger'
})
</script>
