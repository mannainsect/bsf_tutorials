<template>
  <ion-select
    v-model="currentLocale"
    :interface-options="customOptions"
    :placeholder="currentLanguageName"
    class="ion-padding-horizontal"
    :style="{ minWidth: '120px', maxWidth: '200px' }"
    @ion-change="changeLanguage"
  >
    <ion-select-option
      v-for="loc in availableLocales"
      :key="loc.code"
      :value="loc.code"
    >
      {{ loc.name }}
    </ion-select-option>
  </ion-select>
</template>

<script setup lang="ts">
const { locale, locales, t } = useI18n()
const currentLocale = ref(locale.value)

const availableLocales = computed(() => locales.value)

const currentLanguageName = computed(() => {
  const current = availableLocales.value.find(
    l => l.code === currentLocale.value
  )
  return current?.name || t('common.language')
})

const customOptions = computed(() => ({
  header: t('common.selectLanguage'),
  subHeader: `${t('common.current')}: ${currentLanguageName.value}`,
  cssClass: 'language-select-alert'
}))

const localePath = useLocalePath()
const route = useRoute()

const changeLanguage = async (event: CustomEvent) => {
  const newLocale = event.detail.value
  currentLocale.value = newLocale

  // Navigate to the same page but with the new locale
  await navigateTo(localePath(route.path, newLocale))
}

watch(locale, newLocale => {
  currentLocale.value = newLocale
})
</script>
