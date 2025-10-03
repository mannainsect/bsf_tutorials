<template>
  <ion-modal
    ref="modal"
    :is-open="isOpen"
    :initial-breakpoint="initialBreakpoint"
    :breakpoints="breakpoints"
    :backdrop-dismiss="backdropDismiss"
    :keyboard-close="keyboardClose"
    :show-backdrop="showBackdrop"
    @ion-modal-did-dismiss="handleDismiss"
    @ion-modal-will-dismiss="handleWillDismiss"
  >
    <ion-header v-if="title || $slots.header || showCloseButton">
      <ion-toolbar>
        <ion-title v-if="title">{{ title }}</ion-title>
        <slot name="header" />
        <template #end>
<ion-buttons v-if="showCloseButton" >
          <ion-button
            fill="clear"
            @click="dismiss"
          >
            <ion-icon :icon="closeIcon" />
          </ion-button>
        </ion-buttons>
</template>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <slot />
    </ion-content>

    <ion-footer v-if="$slots.footer">
      <ion-toolbar>
        <slot name="footer" />
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
const { close } = useIcons()

interface Props {
  isOpen: boolean
  title?: string
  initialBreakpoint?: number
  breakpoints?: number[]
  backdropDismiss?: boolean
  keyboardClose?: boolean
  showBackdrop?: boolean
  showCloseButton?: boolean
}

interface Emits {
  'update:isOpen': [value: boolean]
  dismiss: [data?: unknown, role?: string]
  willDismiss: [data?: unknown, role?: string]
}

withDefaults(defineProps<Props>(), {
  title: '',
  initialBreakpoint: 1,
  breakpoints: () => [0, 1],
  backdropDismiss: true,
  keyboardClose: true,
  showBackdrop: true,
  showCloseButton: true
})

const emit = defineEmits<Emits>()

const modal = ref()
const closeIcon = close

const handleDismiss = (event: CustomEvent) => {
  emit('update:isOpen', false)
  emit('dismiss', event.detail.data, event.detail.role)
}

const handleWillDismiss = (event: CustomEvent) => {
  emit('willDismiss', event.detail.data, event.detail.role)
}

const dismiss = (data?: unknown, role?: string) => {
  modal.value?.$el.dismiss(data, role)
}

const present = async () => {
  await modal.value?.$el.present()
}

// Expose methods for parent components
defineExpose({
  dismiss,
  present
})
</script>

