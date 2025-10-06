import { computed } from 'vue'
import type { Country } from '~/utils/countries'
import { COUNTRIES_DATA, POPULAR_COUNTRY_CODES } from '~/utils/countries'

export type { Country }

export const useCountries = () => {
  const { t, locale } = useI18n()

  const localizedCountries = computed<Country[]>(() => {
    const rawLocale =
      typeof locale.value === 'string' ? locale.value.trim() : ''
    const normalizedLocale = rawLocale.replace(/_/g, '-')
    const candidateLocale =
      normalizedLocale.length > 0 ? normalizedLocale : 'en-US'

    let displayNames: Intl.DisplayNames | null = null
    for (const localeCode of [candidateLocale, 'en-US']) {
      try {
        displayNames = new Intl.DisplayNames([localeCode], { type: 'region' })
        break
      } catch {
        displayNames = null
      }
    }

    const sortLocale = displayNames?.resolvedOptions().locale ?? 'en-US'

    return [...COUNTRIES_DATA]
      .map(country => {
        const key = `countries.${country.code}`
        const translation = t(key)
        const hasTranslation = translation !== key
        const localizedName = hasTranslation
          ? translation
          : (displayNames?.of(country.code) ?? country.name)
        return {
          ...country,
          name: localizedName
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, sortLocale))
  })

  const getCountryByCode = (code: string): Country | undefined => {
    return localizedCountries.value.find(country => country.code === code)
  }

  const getCountryName = (code: string): string => {
    if (!code) return ''
    const country = getCountryByCode(code)
    return country ? `${country.flag} ${country.name}` : code
  }

  const getPopularCountries = (): Country[] => {
    return POPULAR_COUNTRY_CODES.map(code => getCountryByCode(code)).filter(
      (country): country is Country => country !== undefined
    )
  }

  return {
    countries: localizedCountries,
    localizedCountries,
    getCountryByCode,
    getCountryName,
    getPopularCountries
  }
}
