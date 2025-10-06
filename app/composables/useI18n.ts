export const useAppI18n = () => {
  const { $i18n } = useNuxtApp()
  const i18n = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const availableLocales = computed(() => {
    return $i18n.locales.value.map(locale => ({
      code: locale.code,
      name: locale.name,
      iso: locale.iso
    }))
  })

  const currentLocale = computed({
    get: () => i18n.locale.value,
    set: (value: string) => {
      i18n.setLocale(value as 'en' | 'es' | 'fr' | 'de' | 'pt')
    }
  })

  const switchLanguage = async (locale: string) => {
    try {
      await navigateTo(
        localePath(route.path, locale as 'en' | 'es' | 'fr' | 'de' | 'pt'),
        {
          replace: true
        }
      )
    } catch (error) {
      console.warn('Failed to switch language:', error)
      // Fallback to setting locale without navigation
      await i18n.setLocale(locale as 'en' | 'es' | 'fr' | 'de' | 'pt')
    }
  }

  const getLocalizedRoute = (route: string, locale?: string) => {
    return localePath(
      route,
      locale as 'en' | 'es' | 'fr' | 'de' | 'pt' | undefined
    )
  }

  return {
    ...i18n,
    availableLocales,
    currentLocale,
    switchLanguage,
    getLocalizedRoute
  }
}
