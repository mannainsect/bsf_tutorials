import { onUnmounted } from 'vue'
import { WantedRepository } from './api/repositories/WantedRepository'
import {
  isAuthenticatedWanted
} from '../../shared/types/models/MarketplaceWanted'
import type {
  WantedPublicListing,
  Wanted,
  WantedPublicDetail,
  WantedAuthenticated,
  MarketplaceWantedResponse,
  GetMarketplaceWantedRequest
} from '../../shared/types/models/MarketplaceWanted'

export const useWanted = () => {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const repository = new WantedRepository()

  const wantedItems = ref<(WantedPublicListing | Wanted)[]>([])
  const currentWanted = ref<
    WantedPublicDetail | WantedAuthenticated | null
  >(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const lastFetchParams = ref<GetMarketplaceWantedRequest | null>(null)

  const publicWantedCache = ref<MarketplaceWantedResponse | null>(null)
  const authWantedCache = ref<MarketplaceWantedResponse | null>(null)
  const cacheTimestamp = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000

  const showActiveOnly = ref(true)

  const isCacheValid = () => {
    return Date.now() - cacheTimestamp.value < CACHE_DURATION
  }

  const getCachedWanted = (): MarketplaceWantedResponse | null => {
    if (!isCacheValid()) return null

    return authStore.isAuthenticated
      ? authWantedCache.value
      : publicWantedCache.value
  }

  const setCachedWanted = (response: MarketplaceWantedResponse) => {
    cacheTimestamp.value = Date.now()

    if (authStore.isAuthenticated) {
      authWantedCache.value = response
    } else {
      publicWantedCache.value = response
    }
  }

  const fetchWantedItems = async (
    params: GetMarketplaceWantedRequest = {}
  ): Promise<void> => {
    isLoading.value = true
    error.value = null
    lastFetchParams.value = params

    try {
      const cached = getCachedWanted()
      if (cached && !params.search) {
        wantedItems.value = cached.items
        return
      }

      const response = await repository.getWantedItems(params)
      wantedItems.value = response.items || []

      if (!params.search) {
        setCachedWanted(response)
      }
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error(t('errors.wanted.loadFailed'))

      if (err && typeof err === 'object' &&
          'statusCode' in err && err.statusCode === 429) {
        error.value = new Error(
          t('errors.rateLimit')
        )
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchWantedDetail = async (
    wantedId: string
  ): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await repository.getWantedDetail(wantedId)
      currentWanted.value = response
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error(t('errors.wanted.loadDetailFailed'))

      if (err && typeof err === 'object' &&
          'statusCode' in err && err.statusCode === 429) {
        error.value = new Error(
          t('errors.rateLimit')
        )
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchRandomWanted = async (): Promise<
    WantedPublicListing | Wanted | null
  > => {
    try {
      return await repository.getRandomWanted()
    } catch (err) {
      return null
    }
  }

  const normalizeWantedItems = (
    items: (WantedPublicListing | Wanted)[]
  ): (WantedPublicListing | Wanted)[] => {
    if (!authStore.isAuthenticated) {
      return items.map(item => {
        const {
          user_id,
          contact_email,
          ...publicFields
        } = item as Wanted
        return publicFields as WantedPublicListing
      })
    }

    return items
  }

  const stopWatcher = watch(() => authStore.isAuthenticated, () => {
    publicWantedCache.value = null
    authWantedCache.value = null
    cacheTimestamp.value = 0

    if (lastFetchParams.value) {
      fetchWantedItems(lastFetchParams.value)
    }
  })

  onUnmounted(() => {
    stopWatcher()
  })


  const hasAuthenticatedFields = (
    item: WantedPublicListing | Wanted |
          WantedPublicDetail | WantedAuthenticated
  ): boolean => {
    return 'user_id' in item && 'contact_email' in item
  }

  return {
    wantedItems: readonly(wantedItems),
    currentWanted: readonly(currentWanted),
    isLoading: readonly(isLoading),
    error: readonly(error),

    showActiveOnly,

    fetchWantedItems,
    fetchWantedDetail,
    fetchRandomWanted,
    normalizeWantedItems,
    hasAuthenticatedFields,

    isAuthenticated: computed(() => authStore.isAuthenticated)
  }
}
