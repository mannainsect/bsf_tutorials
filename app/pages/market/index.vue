<template>
  <div>
      <!-- Unified Search and Filter Component -->
      <UnifiedSearchFilter
        filter-type="product"
        :items="products"
        :available-categories="availableCategories"
        :available-subcategories="availableSubcategories"
        :available-countries="availableCountries"
        :show-result-count="!isLoading && filteredProducts.length > 0"
        :result-count="filteredProducts.length"
        @update:filters="handleFilterUpdate"
        @clear-filters="clearFilters"
      />

      <!-- Add Listing Button -->
      <div class="ion-padding-horizontal ion-padding-top">
        <ion-button
          expand="block"
          color="primary"
          @click="handleAddClick"
          :disabled="isNavigating"
        >
          <ion-icon slot="start" :icon="addCircleOutline" />
          {{ $t('marketplace.addListing') }}
        </ion-button>
      </div>

      <!-- Auth Prompt Modal -->
      <AuthPromptModal
        v-model:is-open="showAuthModal"
        @dismiss="handleAuthModalDismiss"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner color="primary" />
        <ion-text color="medium">
          <p>{{ $t('marketplace.loadingProducts') }}</p>
        </ion-text>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <ion-text color="danger">
          <h3>{{ $t('errors.loadingFailed') }}</h3>
          <p>{{ error.message }}</p>
        </ion-text>
        <ion-button
          color="primary"
          fill="outline"
          @click="retryLoad"
        >
          {{ $t('common.retry') }}
        </ion-button>
      </div>

      <!-- Products Grid -->
      <ion-grid v-else-if="filteredProducts.length > 0">
        <ion-row>
          <ion-col
            v-for="product in filteredProducts"
            :id="`product-${product.id}`"
            :key="product.id"
            size="12"
            size-md="6"
          >
            <ProductCard :product="product" />
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Empty State -->
      <div v-else class="empty-container">
        <ion-icon
          :icon="icons.bag"
          color="medium"
          class="empty-icon"
        />
        <ion-text color="medium">
          <h3>{{ $t('marketplace.noProducts') }}</h3>
          <p>{{ $t('marketplace.noProductsDescription') }}</p>
        </ion-text>
        <ion-button
          v-if="filterState.searchQuery || filterState.selectedCategory"
          fill="outline"
          @click="clearFilters"
        >
          {{ $t('marketplace.clearFilters') }}
        </ion-button>
      </div>
  </div>
</template>

<script setup lang="ts">
import ProductCard from '../../components/marketplace/ProductCard.vue'
import UnifiedSearchFilter from '../../components/marketplace/UnifiedSearchFilter.vue'
import AuthPromptModal from '../../components/marketplace/AuthPromptModal.vue'
import { useSearchFilter } from '../../composables/useSearchFilter'
import type { SortOption } from '../../composables/useSearchFilter'
import { useAddListingButton } from '../../composables/useAddListingButton'
import { addCircleOutline } from 'ionicons/icons'
import type {
  MarketplaceBrowseInfo
} from '../../../shared/types/models/metrics'
import { MetricCategory } from '../../../shared/types/models/metrics'

const { t } = useI18n()
const icons = useIcons()
const route = useRoute()
const {
  products,
  isLoading,
  error,
  fetchProducts
} = useMarketplace()

// Use add listing button composable
const {
  showAuthModal,
  isNavigating,
  handleAddClick,
  handleAuthModalDismiss
} = useAddListingButton('/create/product')

// Use the new search filter composable
const {
  filterState,
  filteredItems: filteredProducts,
  availableCategories,
  availableSubcategories,
  availableCountries,
  updateFilter,
  clearFilters: clearSearchFilters
} = useSearchFilter(products)

// Track if we need to scroll after products load
const pendingScrollToProduct = ref<string | null>(null)
const hasScrolledToProduct = ref(false)

// Load products on mount and check for hash
onMounted(async () => {
  // If there's a hash, save it for after products load
  if (route.hash) {
    const productId = route.hash.replace('#product-', '')
    if (productId) {
      pendingScrollToProduct.value = productId
      hasScrolledToProduct.value = false
    }
  }

  // Load products
  await loadProducts()

  // Only send metrics if user is logged in
  if (authStore.isAuthenticated) {
    const { sendMetric } = useMetrics()
    sendMetric({
      category: MetricCategory.VISIT_MARKETPLACE,
      extra_info: {
        view: 'browse',
        list_type: 'products'
      } as MarketplaceBrowseInfo
    })
  }
})

// Watch for products to finish loading and render
watch(
  [filteredProducts, isLoading],
  async ([products, loading]) => {
    // Only proceed if:
    // 1. We're not loading anymore
    // 2. We have products
    // 3. We have a pending scroll or current hash
    // 4. We haven't already scrolled
    if (!loading && products.length > 0 &&
        !hasScrolledToProduct.value) {
      const targetProductId = pendingScrollToProduct.value ||
        (route.hash ? route.hash.replace('#product-', '') : null)

      if (targetProductId) {
        // Mark that we're attempting to scroll
        hasScrolledToProduct.value = true

        // Wait for DOM to update
        await nextTick()

        // Wait for Vue to finish all updates
        await new Promise(resolve => {
          if (typeof window !== 'undefined' &&
              typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
              // Double RAF to ensure paint has happened
              requestAnimationFrame(() => {
                resolve(undefined)
              })
            })
          } else {
            setTimeout(resolve, 100)
          }
        })

        // Now wait a bit more for Ionic components to settle
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Finally attempt to scroll
        await scrollToProduct(targetProductId)
        // Clear pending scroll after attempting
        pendingScrollToProduct.value = null
      }
    }
  }
)

// Watch for hash changes (for browser navigation)
watch(() => route.hash, (newHash, oldHash) => {
  // Only scroll if hash actually changed and we have products
  if (newHash && newHash !== oldHash && !isLoading.value &&
      filteredProducts.value.length > 0) {
    const productId = newHash.replace('#product-', '')
    if (productId) {
      // Reset scroll flag for new hash
      hasScrolledToProduct.value = false
      pendingScrollToProduct.value = productId

      nextTick(async () => {
        // Wait for any ongoing renders
        await new Promise(resolve => {
          if (typeof window !== 'undefined' &&
              typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve(undefined))
            })
          } else {
            setTimeout(resolve, 100)
          }
        })

        // Wait for Ionic to settle
        await new Promise(resolve => setTimeout(resolve, 1000))

        await scrollToProduct(productId)
        hasScrolledToProduct.value = true
      })
    }
  }
})

// Scroll to specific product by ID
const scrollToProduct = async (productId: string) => {
  if (!productId || typeof window === 'undefined') return

  // Try to find and scroll to the element with retry logic
  const MAX_SCROLL_ATTEMPTS = 30
  const SCROLL_RETRY_DELAY = 200 // milliseconds

  const attemptScroll = async (attempts = 0) => {
    if (attempts >= MAX_SCROLL_ATTEMPTS) {
      // Total wait time: 30 * 200ms = 6 seconds
      return
    }

    const element = document.getElementById(`product-${productId}`)

    if (element) {
      // Ensure element is visible and has dimensions
      const rect = element.getBoundingClientRect()
      if (rect.height === 0) {
        // Element exists but not rendered yet, retry
        setTimeout(() => attemptScroll(attempts + 1), SCROLL_RETRY_DELAY)
        return
      }

      // Find the main ion-content that contains the products
      // It should be within the main layout, not in modals
      const mainContent = document.querySelector(
        'ion-page:not(.ion-page-hidden) ' +
        'ion-content:not(.menu-content-open)'
      )

      if (mainContent &&
          typeof (mainContent as any).scrollToPoint === 'function') {
        // Get the position of the element relative to the document
        const elementRect = element.getBoundingClientRect()
        const contentRect = mainContent.getBoundingClientRect()

        // Calculate element's position relative to ion-content scroll
        const scrollElement = (mainContent as any).getScrollElement ?
          await (mainContent as any).getScrollElement() : mainContent
        const currentScrollTop = scrollElement.scrollTop || 0

        // Target position is element's current position plus current
        // scroll, minus the content top
        const targetScrollTop = currentScrollTop + elementRect.top -
          contentRect.top - 100 // 100px offset from top

        (mainContent as any).scrollToPoint(0, targetScrollTop, 300)
          .catch(() => {
            // Fallback to standard scroll
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          })
      } else {
        // Fallback to standard scrollIntoView
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    } else {
      // Element not found yet, try again
      setTimeout(() => attemptScroll(attempts + 1), SCROLL_RETRY_DELAY)
    }
  }

  // Start attempting to scroll
  await attemptScroll()
}

// Load products
const loadProducts = async () => {
  await fetchProducts({
    limit: 50 // Load more products for the listing page
  })
}

// Handle filter updates from UnifiedSearchFilter
const handleFilterUpdate = (filters: {
  searchQuery: string
  useRegex: boolean
  selectedCategory: string | null
  selectedSubcategory: string | null
  selectedCountries: string[]
  sortOption: SortOption
}) => {
  updateFilter('searchQuery', filters.searchQuery)
  updateFilter('useRegex', filters.useRegex)
  updateFilter('selectedCategory', filters.selectedCategory)
  updateFilter('selectedSubcategory', filters.selectedSubcategory)
  updateFilter('selectedCountries', filters.selectedCountries)
  updateFilter('sortOption', filters.sortOption)
}

// Retry loading products
const retryLoad = () => {
  loadProducts()
}

// Clear all filters
const clearFilters = () => {
  clearSearchFilters()
}

// SEO metadata
useHead({
  title: t('marketplace.pageTitle'),
  meta: [
    {
      name: 'description',
      content: t('marketplace.pageDescription')
    }
  ]
})
</script>

<style scoped>
.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--ion-padding, 16px);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

ion-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

/* Ensure cards have consistent spacing */
ion-grid {
  padding: var(--ion-padding, 16px);
}

/* Category segment styling */
ion-segment {
  margin: 0 var(--ion-margin, 16px);
}

/* Search bar customization */
ion-searchbar {
  --box-shadow: none;
  --background: var(--ion-background-color);
}

/* Responsive adjustments */
@media (min-width: 768px) {
  ion-col {
    padding: 8px;
  }
}
</style>