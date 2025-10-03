import { describe, it, expect } from 'vitest'
import { HelpTopic } from '../../../shared/types/help'

describe('useHelpTopic logic', () => {
  const getHelpTopicForRoute = (
    route: { path?: string; name?: string } | null,
    isServer = false
  ): HelpTopic | null => {
    if (isServer || !route?.path) return null

    let path = route.path
    const routeName = route.name?.toString() || ''

    path = path.split('#')[0]
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1)
    }

    const localeRegex = /^\/[a-z]{2,3}(-[A-Z]{2})?(\/|$)/
    const cleanPath = path.replace(localeRegex, '/')
    const cleanRouteName = routeName.replace(/___[a-z]{2,3}(-[A-Z]{2})?$/, '')

    if (cleanPath === '/' || cleanRouteName === 'index') {
      return HelpTopic.GETTING_STARTED
    }

    if (cleanPath === '/main' || cleanRouteName === 'main') {
      return HelpTopic.GETTING_STARTED
    }

    if (cleanPath === '/account' || cleanPath.startsWith('/account?')) {
      return HelpTopic.PROFILE_SETTINGS
    }

    if (
      cleanPath === '/verify-token' ||
      cleanRouteName === 'verify-token' ||
      cleanPath.startsWith('/auth/verify-email')
    ) {
      return HelpTopic.ACCOUNT_SECURITY
    }

    return null
  }

  describe('Route to topic mappings', () => {
    it('maps root path to GETTING_STARTED', () => {
      const topic = getHelpTopicForRoute({ path: '/' })
      expect(topic).toBe(HelpTopic.GETTING_STARTED)
    })

    it('maps /main to GETTING_STARTED', () => {
      const topic = getHelpTopicForRoute({ path: '/main' })
      expect(topic).toBe(HelpTopic.GETTING_STARTED)
    })

    it('maps account routes to PROFILE_SETTINGS', () => {
      expect(getHelpTopicForRoute({ path: '/account' })).toBe(HelpTopic.PROFILE_SETTINGS)
      expect(getHelpTopicForRoute({ path: '/account?tab=settings' })).toBe(HelpTopic.PROFILE_SETTINGS)
    })

    it('maps verification routes to ACCOUNT_SECURITY', () => {
      expect(getHelpTopicForRoute({ path: '/verify-token' })).toBe(HelpTopic.ACCOUNT_SECURITY)
      expect(getHelpTopicForRoute({ path: '/auth/verify-email?token=abc' })).toBe(HelpTopic.ACCOUNT_SECURITY)
      expect(
        getHelpTopicForRoute({ path: '/auth/verify-email', name: 'verify-token___es' })
      ).toBe(HelpTopic.ACCOUNT_SECURITY)
    })
  })

  describe('Locale-prefixed routes', () => {
    it('handles locale prefixes for root and main routes', () => {
      expect(getHelpTopicForRoute({ path: '/es/' })).toBe(HelpTopic.GETTING_STARTED)
      expect(getHelpTopicForRoute({ path: '/fr/main' })).toBe(HelpTopic.GETTING_STARTED)
    })

    it('handles locale prefixes for account routes', () => {
      expect(getHelpTopicForRoute({ path: '/de/account' })).toBe(HelpTopic.PROFILE_SETTINGS)
    })

    it('handles locale prefixes for verify routes', () => {
      expect(getHelpTopicForRoute({ path: '/pt/verify-token' })).toBe(HelpTopic.ACCOUNT_SECURITY)
    })
  })

  describe('SSR and invalid route handling', () => {
    it('returns null during SSR', () => {
      const topic = getHelpTopicForRoute({ path: '/' }, true)
      expect(topic).toBeNull()
    })

    it('returns null for unknown routes', () => {
      const topic = getHelpTopicForRoute({ path: '/reports' })
      expect(topic).toBeNull()
    })

    it('returns null when route data is missing', () => {
      expect(getHelpTopicForRoute(null)).toBeNull()
      expect(getHelpTopicForRoute({ path: undefined })).toBeNull()
      expect(getHelpTopicForRoute({ path: '' })).toBeNull()
    })
  })
})
