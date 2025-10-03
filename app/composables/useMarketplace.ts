import { onUnmounted } from 'vue'
import { MarketplaceRepository } from './api/repositories/MarketplaceRepository'
import {
  isAuthenticatedProduct
} from '../../shared/types/models/MarketplaceProduct'
import type {
  ProductPublicListing,
  Product,
  ProductPublicDetail,
  ProductAuthenticated,
  MarketplaceProductsResponse,
  GetMarketplaceProductsRequest
} from '../../shared/types/models/MarketplaceProduct'

export const useMarketplace = () => {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const repository = new MarketplaceRepository()

  // State management
  const products = ref<(ProductPublicListing | Product)[]>([])
  const currentProduct = ref<
    ProductPublicDetail | ProductAuthenticated | null
  >(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const lastFetchParams = ref<GetMarketplaceProductsRequest | null>(null)

  // Cache management
  const publicProductsCache = ref<MarketplaceProductsResponse | null>(null)
  const authProductsCache = ref<MarketplaceProductsResponse | null>(null)
  const cacheTimestamp = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes


  // Check if cache is valid
  const isCacheValid = () => {
    return Date.now() - cacheTimestamp.value < CACHE_DURATION
  }

  // Get cached products based on auth state
  const getCachedProducts = (): MarketplaceProductsResponse | null => {
    if (!isCacheValid()) return null

    return authStore.isAuthenticated
      ? authProductsCache.value
      : publicProductsCache.value
  }

  // Set cached products based on auth state
  const setCachedProducts = (response: MarketplaceProductsResponse) => {
    cacheTimestamp.value = Date.now()

    if (authStore.isAuthenticated) {
      authProductsCache.value = response
    } else {
      publicProductsCache.value = response
    }
  }

  // Fetch products with auth-aware caching
  const fetchProducts = async (
    params: GetMarketplaceProductsRequest = {}
  ): Promise<void> => {
    isLoading.value = true
    error.value = null
    lastFetchParams.value = params

    try {
      // Check cache first
      const cached = getCachedProducts()
      if (cached && !params.search) {
        products.value = cached.items
        return
      }

      const response = await repository.getProducts(params)
      products.value = response.items || []

      // Cache the response if no search query
      if (!params.search) {
        setCachedProducts(response)
      }
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error(t('errors.market.loadProductsFailed'))

      // Handle rate limiting gracefully
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

  // Fetch single product detail
  const fetchProductDetail = async (
    productId: string
  ): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await repository.getProductDetail(productId)
      currentProduct.value = response
    } catch (err) {
      error.value = err instanceof Error
        ? err
        : new Error(t('errors.market.loadProductDetailFailed'))

      // Handle rate limiting gracefully
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

  // Fetch random product for homepage
  const fetchRandomProduct = async (): Promise<
    ProductPublicListing | Product | null
  > => {
    try {
      return await repository.getRandomProduct()
    } catch (err) {
      console.error(t('errors.market.randomProductFailedLog'), err)
      return null
    }
  }

  // Normalize products based on auth state
  const normalizeProducts = (
    items: (ProductPublicListing | Product)[]
  ): (ProductPublicListing | Product)[] => {
    // If not authenticated, strip private fields
    if (!authStore.isAuthenticated) {
      return items.map(item => {
        const {
          user_id,
          contact_email,
          ...publicFields
        } = item as Product
        return publicFields as ProductPublicListing
      })
    }

    return items
  }

  // Clear cache when auth state changes
  const stopWatcher = watch(() => authStore.isAuthenticated, () => {
    // Clear both caches to force refresh on auth change
    publicProductsCache.value = null
    authProductsCache.value = null
    cacheTimestamp.value = 0

    // Refetch products if we have previous params
    if (lastFetchParams.value) {
      fetchProducts(lastFetchParams.value)
    }
  })

  // Clean up watcher on component unmount
  onUnmounted(() => {
    stopWatcher()
  })


  // Check if product has authenticated fields
  const hasAuthenticatedFields = (
    product: ProductPublicListing | Product |
             ProductPublicDetail | ProductAuthenticated
  ): boolean => {
    return 'user_id' in product && 'contact_email' in product
  }

  return {
    // State
    products: readonly(products),
    currentProduct: readonly(currentProduct),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    fetchProducts,
    fetchProductDetail,
    fetchRandomProduct,
    normalizeProducts,
    hasAuthenticatedFields,

    // Auth state
    isAuthenticated: computed(() => authStore.isAuthenticated)
  }
}
