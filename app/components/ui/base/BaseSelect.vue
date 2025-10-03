<template>
  <ion-item :color="hasError ? 'danger' : undefined">
    <ion-label v-if="label" position="stacked">
      {{ label }}
      <ion-text v-if="required" color="danger">*</ion-text>
    </ion-label>
    <ion-select
      :value="modelValue"
      :placeholder="resolvedPlaceholder"
      :disabled="disabled"
      :multiple="multiple"
      :interface="interfaceType"
      :interface-options="interfaceOptions"
      v-bind="$attrs"
      @ion-change="handleChange"
      @ion-focus="handleFocus"
      @ion-blur="handleBlur"
    >
      <ion-select-option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </ion-select-option>
    </ion-select>
    <ion-note v-if="hasError" slot="error" color="danger">{{ errorMessage }}</ion-note>
    <ion-note v-else-if="helpText" slot="helper" color="medium">{{ helpText }}</ion-note>
  </ion-item>
</template>

<script setup lang="ts">
import type { SelectOption } from '../../../../shared/types'

interface Props {
  modelValue?: string | number | string[] | number[] | null
  options: SelectOption[]
  label?: string
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  interfaceType?: 'action-sheet' | 'alert' | 'popover'
  interfaceOptions?: Record<string, unknown>
  errorMessage?: string
  helpText?: string
}

interface Emits {
  'update:modelValue': [value: string | number | string[] | number[] | null]
  change: [event: CustomEvent]
  focus: [event: CustomEvent]
  blur: [event: CustomEvent]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: '',
  placeholder: '',
  multiple: false,
  disabled: false,
  required: false,
  interfaceType: 'alert',
  interfaceOptions: () => ({}),
  errorMessage: '',
  helpText: ''
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const hasError = computed(() => !!props.errorMessage)
const resolvedPlaceholder = computed(() => props.placeholder || t('forms.selectPlaceholder'))

const handleChange = (event: CustomEvent) => {
  emit('update:modelValue', event.detail.value)
  emit('change', event)
}

const handleFocus = (event: CustomEvent) => {
  emit('focus', event)
}

const handleBlur = (event: CustomEvent) => {
  emit('blur', event)
}
</script>
