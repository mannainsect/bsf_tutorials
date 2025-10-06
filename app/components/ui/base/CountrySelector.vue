<template>
  <ion-item>
    <ion-label position="stacked">{{ resolvedLabel }}</ion-label>
    <ion-select
      :value="modelValue"
      :placeholder="resolvedPlaceholder"
      interface="action-sheet"
      @ion-change="handleChange"
    >
      <ion-select-option
        v-for="country in countryOptions"
        :key="country.code"
        :value="country.code"
      >
        {{ country.flag }} {{ country.name }}
      </ion-select-option>
    </ion-select>
  </ion-item>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { useCountries } from '~/composables/useCountries'
import type { Country } from '~/composables/useCountries'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
}

interface Emits {
  'update:modelValue': [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: ''
})

const { modelValue } = toRefs(props)

const emit = defineEmits<Emits>()
const { t } = useI18n()
const { countries: availableCountries } = useCountries()

const resolvedLabel = computed(() => props.label || t('forms.country'))
const resolvedPlaceholder = computed(
  () => props.placeholder || t('forms.countryPlaceholder')
)
const countryOptions = computed<Country[]>(() => availableCountries.value)

const handleChange = (event: CustomEvent) => {
  emit('update:modelValue', event.detail.value)
}
</script>
