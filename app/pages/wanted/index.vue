<template>
  <div>
      <!-- Unified Search and Filter Component with Help -->
      <UnifiedSearchFilter
        filter-type="wanted"
        :items="wantedItems"
        :available-categories="availableCategories"
        :available-subcategories="availableSubcategories"
        :available-countries="availableCountries"
        :show-result-count="!isLoading && filteredWantedItems.length > 0"
        :result-count="filteredWantedItems.length"
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

      <ion-grid>

        <div v-if="isLoading" class="loading-state">
          <ion-spinner color="primary" />
          <ion-text color="medium">
            <p>{{ $t('wanted.loading') }}</p>
          </ion-text>
        </div>

        <div v-else-if="error" class="error-state">
          <ion-icon
            :icon="icons.alertCircle"
            color="danger"
            size="large"
          />
          <ion-text color="danger">
            <h3>{{ $t('wanted.error') }}</h3>
            <p>{{ error.message }}</p>
          </ion-text>
          <ion-button color="primary" @click="fetchWantedItems()">
            {{ $t('common.retry') }}
          </ion-button>
        </div>

        <div v-else-if="filteredWantedItems.length === 0" class="empty-state">
          <ion-icon
            :icon="icons.searchOutline"
            color="medium"
            size="large"
          />
          <ion-text color="medium">
            <h3>{{ $t('wanted.empty') }}</h3>
            <p v-if="filterState.searchQuery || filterState.selectedCategory">
              {{ $t('marketplace.tryAdjustingFilters') }}
            </p>
          </ion-text>
          <ion-button
            v-if="filterState.searchQuery || filterState.selectedCategory"
            fill="outline"
            size="small"
            @click="clearFilters"
          >
            {{ $t('marketplace.clearFilters') }}
          </ion-button>
        </div>

        <ion-row v-else>
          <ion-col
            v-for="item in filteredWantedItems"
            :key="item.id"
            size="12"
            size-md="6"
            size-lg="4"
          >
            <WantedCard :wanted="item" />
          </ion-col>
        </ion-row>

      </ion-grid>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import WantedCard from '../../components/marketplace/WantedCard.vue'
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

const {
  wantedItems,
  isLoading,
  error,
  fetchWantedItems
} = useWanted()

// Use the new search filter composable
const {
  filterState,
  filteredItems: filteredWantedItems,
  availableCategories,
  availableSubcategories,
  availableCountries,
  updateFilter,
  clearFilters: clearSearchFilters
} = useSearchFilter(wantedItems)

const icons = useIcons()

// Use add listing button composable
const {
  showAuthModal,
  isNavigating,
  handleAddClick,
  handleAuthModalDismiss
} = useAddListingButton('/create/wanted')

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

// Clear all filters
const { t } = useI18n()

const clearFilters = () => {
  clearSearchFilters()
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  if (wantedItems.value.length === 0) {
    await fetchWantedItems()
  }

  refreshInterval = setInterval(() => {
    if (!isLoading.value) {
      fetchWantedItems()
    }
  }, 5 * 60 * 1000)

  // Only send metrics if user is logged in
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
    const { sendMetric } = useMetrics()
    sendMetric({
      category: MetricCategory.VISIT_MARKETPLACE,
      extra_info: {
        view: 'browse',
        list_type: 'wanted'
      } as MarketplaceBrowseInfo
    })
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

useHead(() => ({
  title: t('wanted.meta.title'),
  meta: [
    {
      name: 'description',
      content: t('wanted.meta.description')
    }
  ]
}))
</script>

<style scoped>
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  text-align: center;
}

.error-state h3,
.empty-state h3 {
  margin: 0.5rem 0;
}

.error-state p,
.empty-state p {
  margin: 0.25rem 0;
  color: var(--ion-color-medium);
}

ion-chip {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
