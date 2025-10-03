/**
 * Global TypeScript declarations for test environment
 * These match the minimal mocks in test-setup.ts
 */

import type { Ref, ComputedRef } from 'vue'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'

declare global {
  // Vue reactivity functions (from real Vue)
  const ref: typeof import('vue')['ref']
  const computed: typeof import('vue')['computed']
  const reactive: typeof import('vue')['reactive']
  const readonly: typeof import('vue')['readonly']
  const watch: typeof import('vue')['watch']
  const watchEffect: typeof import('vue')['watchEffect']
  const nextTick: typeof import('vue')['nextTick']

  // Minimal Nuxt composables (mocked)
  const useState: <T = any>(key: string, init?: () => T) => Ref<T>
  const useRuntimeConfig: () => {
    public: {
      apiBaseUrl: string
      domainAlias: string
    }
  }
  const useCookie: (name: string) => Ref<any>
  const useRouter: () => Router
  const useRoute: () => RouteLocationNormalizedLoaded
  const navigateTo: (to: any) => Promise<void>
  const $fetch: typeof import('ofetch').$fetch

  // Pinia functions (from real Pinia)
  const defineStore: typeof import('pinia')['defineStore']
  const createPinia: typeof import('pinia')['createPinia']
  const setActivePinia: typeof import('pinia')['setActivePinia']
  const getActivePinia: typeof import('pinia')['getActivePinia']
  const storeToRefs: typeof import('pinia')['storeToRefs']

  // Real stores (from actual implementation)
  const useAuthStore: typeof import('../../app/stores/auth')['useAuthStore']

  // Real composables (from actual implementation)
  const useStorage: typeof import('../../app/composables/useStorage')['useStorage']
  const useAuthService: typeof import('../../app/composables/useAuthService')['useAuthService']
  const useAuth: typeof import('../../app/composables/useAuth')['useAuth']
}

export {}
