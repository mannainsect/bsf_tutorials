<template>
  <ion-button
    :expand="expand"
    :fill="fill"
    :size="size"
    :color="color"
    :disabled="disabled || loading"
    :type="type"
    v-bind="$attrs"
    @click="handleClick"
  >
    <ion-spinner v-if="loading" :name="spinnerName" />
    <template v-else>
      <ion-icon v-if="icon" :slot="iconSlot" :icon="icon" />
      <slot />
    </template>
  </ion-button>
</template>

<script setup lang="ts">
interface Props {
  expand?: 'full' | 'block' | undefined
  fill?: 'clear' | 'outline' | 'solid' | undefined
  size?: 'small' | 'default' | 'large' | undefined
  color?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  icon?: string
  iconSlot?: 'start' | 'end' | 'icon-only'
  spinnerName?:
    | 'lines'
    | 'crescent'
    | 'bubbles'
    | 'circles'
    | 'circular'
    | 'dots'
    | 'lines-small'
    | 'lines-sharp'
    | 'lines-sharp-small'
}

interface Emits {
  click: [event: Event]
}

const props = withDefaults(defineProps<Props>(), {
  expand: undefined,
  fill: 'solid',
  size: 'default',
  color: 'primary',
  disabled: false,
  loading: false,
  type: 'button',
  icon: undefined,
  iconSlot: 'start',
  spinnerName: 'crescent'
})

const emit = defineEmits<Emits>()

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
