import { computed, readonly } from 'vue'
import { useRoute } from 'vue-router'
import { HelpTopic } from '../../shared/types/help'

export const useHelpTopic = () => {
  const route = useRoute()

  const currentHelpTopic = computed(() => {
    if (process.server || !route?.path) return null

    let path = route.path
    const routeName = route.name?.toString() || ''

    // Remove hash fragments if present
    path = path.split('#')[0]

    // Remove trailing slash if present
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1)
    }

    // Remove locale prefix if present (e.g., /es/market -> /market)
    // Common locale patterns: /xx/, /xx-XX/, /xxx/
    const localeRegex = /^\/[a-z]{2,3}(-[A-Z]{2})?(\/|$)/
    const cleanPath = path.replace(localeRegex, '/')

    // Also check locale-suffixed route names (e.g., market___es)
    const cleanRouteName = routeName.replace(/___[a-z]{2,3}(-[A-Z]{2})?$/, '')

    if (cleanPath === '/market' || cleanPath.startsWith('/market?'))
      return HelpTopic.MARKET_FILTERING

    if (cleanRouteName === 'market-id' ||
        cleanPath.match(/^\/market\/[^/]+$/))
      return HelpTopic.PRODUCT_CONTACT

    if (cleanPath === '/wanted' || cleanPath.startsWith('/wanted?'))
      return HelpTopic.WANTED_POSTING

    if (cleanPath === '/account' || cleanPath.startsWith('/account?'))
      return HelpTopic.PROFILE_SETTINGS

    return null
  })

  return { currentTopic: readonly(currentHelpTopic) }
}