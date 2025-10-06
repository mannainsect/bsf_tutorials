<template>
  <ion-item :color="hasError ? 'danger' : undefined">
    <ion-label v-if="label" position="stacked">
      {{ label }}
      <ion-text v-if="required" color="danger">*</ion-text>
    </ion-label>
    <ion-input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :clear-input="clearable"
      v-bind="$attrs"
      @ion-input="handleInput"
      @ion-blur="handleBlur"
      @ion-focus="handleFocus"
    />
    <ion-note v-if="hasError" slot="error" color="danger">{{
      errorMessage
    }}</ion-note>
    <ion-note v-else-if="helpText" slot="helper" color="medium">{{
      helpText
    }}</ion-note>
  </ion-item>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number | null
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  errorMessage?: string
  helpText?: string
}

interface Emits {
  'update:modelValue': [value: string | number | null]
  input: [event: CustomEvent]
  blur: [event: CustomEvent]
  focus: [event: CustomEvent]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  errorMessage: '',
  helpText: ''
})

const emit = defineEmits<Emits>()

const hasError = computed(() => !!props.errorMessage)

const handleInput = (event: CustomEvent) => {
  emit('update:modelValue', event.detail.value)
  emit('input', event)
}

const handleBlur = (event: CustomEvent) => {
  emit('blur', event)
}

const handleFocus = (event: CustomEvent) => {
  emit('focus', event)
}
</script>
