<template>
  <div class="unified-search-filter">
    <!-- Search Bar with Regex Toggle -->
    <ion-toolbar>
      <ion-searchbar
        class="primary-searchbar"
        :model-value="searchQuery"
        :placeholder="$t('marketplace.searchPlaceholder')"
        :debounce="300"
        show-clear-button="focus"
        animated
        @ion-input="handleSearchInput"
      />
      <ion-buttons slot="end">
        <ion-button
          fill="clear"
          size="small"
          :color="useRegex ? 'primary' : 'medium'"
          :title="$t('marketplace.regexMode')"
          :aria-label="$t('marketplace.toggleRegexSearch')"
          :aria-pressed="String(useRegex)"
          @click="toggleRegex"
        >
          <ion-icon
            slot="icon-only"
            :icon="icons.codeSlash"
          />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- Mobile Filter Controls (Icon Row) -->
    <ion-toolbar class="mobile-filter-controls">
      <ion-buttons>
        <!-- Category Filter Button -->
        <ion-button
          fill="clear"
          :color="selectedCategory ? 'primary' : 'medium'"
          :aria-label="$t('marketplace.filterCategory')"
          @click="showCategoryModal = true"
        >
          <ion-icon slot="icon-only" :icon="icons.layers" />
          <ion-badge
            v-if="selectedCategory"
            color="primary"
            class="filter-badge"
          >
            1
          </ion-badge>
        </ion-button>

        <!-- Country Filter Button -->
        <ion-button
          fill="clear"
          :color="selectedCountries.length > 0 ? 'primary' : 'medium'"
          :aria-label="$t('marketplace.filterCountries')"
          @click="showCountryModal = true"
        >
          <ion-icon slot="icon-only" :icon="icons.globe" />
          <ion-badge
            v-if="selectedCountries.length > 0"
            color="primary"
            class="filter-badge"
          >
            {{ selectedCountries.length }}
          </ion-badge>
        </ion-button>

        <!-- Sort Button -->
        <ion-button
          fill="clear"
          :color="sortOption !== 'none' ? 'primary' : 'medium'"
          :aria-label="$t('marketplace.sortBy')"
          @click="showSortModal = true"
        >
          <ion-icon slot="icon-only" :icon="icons.sort" />
        </ion-button>

        <!-- All Filters Button -->
        <ion-button
          v-if="hasActiveFilters"
          fill="clear"
          color="danger"
          :aria-label="$t('marketplace.clearFilters')"
          @click="clearAllFilters"
        >
          <ion-icon slot="icon-only" :icon="icons.close" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- Desktop Filter Controls -->
    <ion-grid class="filter-controls desktop-filter-controls">
      <ion-row class="ion-align-items-center">
        <!-- Category Filter -->
        <ion-col size="12" size-md="3">
          <ion-item lines="none">
            <ion-select
              :model-value="selectedCategory"
              :placeholder="$t('marketplace.filterCategory')"
              interface="popover"
              :cancel-text="$t('common.cancel')"
              :ok-text="$t('common.ok')"
              @ion-change="handleCategoryChange"
            >
              <ion-select-option :value="null">
                {{ $t('marketplace.allCategories') }}
              </ion-select-option>
              <ion-select-option
                v-for="category in availableCategories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>

        <!-- Subcategory Filter -->
        <ion-col size="12" size-md="3">
          <ion-item lines="none">
            <ion-select
              :model-value="selectedSubcategory"
              :placeholder="$t('marketplace.filterSubcategory')"
              :disabled="!selectedCategory"
              interface="popover"
              :cancel-text="$t('common.cancel')"
              :ok-text="$t('common.ok')"
              @ion-change="handleSubcategoryChange"
            >
              <ion-select-option :value="null">
                {{ $t('marketplace.allSubcategories') }}
              </ion-select-option>
              <ion-select-option
                v-for="subcategory in availableSubcategories"
                :key="subcategory"
                :value="subcategory"
              >
                {{ subcategory }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>

        <!-- Country Multi-Select -->
        <ion-col size="12" size-md="3">
          <ion-item lines="none">
            <ion-select
              :model-value="selectedCountries"
              :placeholder="$t('marketplace.filterCountries')"
              interface="popover"
              multiple
              :cancel-text="$t('common.cancel')"
              :ok-text="$t('common.ok')"
              @ion-change="handleCountryChange"
            >
              <ion-select-option
                v-for="country in availableCountryOptions"
                :key="country.code"
                :value="country.value"
              >
                {{ country.flag }} {{ country.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>

        <!-- Sort Options -->
        <ion-col size="12" size-md="3">
          <ion-item lines="none">
            <ion-select
              :model-value="sortOption"
              :placeholder="$t('marketplace.sortBy')"
              interface="popover"
              :cancel-text="$t('common.cancel')"
              :ok-text="$t('common.ok')"
              @ion-change="handleSortChange"
            >
              <ion-select-option value="none">
                {{ $t('marketplace.sortNone') }}
              </ion-select-option>
              <ion-select-option
                v-if="props.filterType === 'product'"
                value="price_asc"
              >
                {{ $t('marketplace.sortPriceAsc') }}
              </ion-select-option>
              <ion-select-option
                v-if="props.filterType === 'product'"
                value="price_desc"
              >
                {{ $t('marketplace.sortPriceDesc') }}
              </ion-select-option>
              <ion-select-option value="title_asc">
                {{ $t('marketplace.sortTitleAsc') }}
              </ion-select-option>
              <ion-select-option value="title_desc">
                {{ $t('marketplace.sortTitleDesc') }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>
      </ion-row>

      <!-- Active Filter Chips (Desktop Only) -->
      <ion-row v-if="hasActiveFilters" class="filter-chips desktop-only">
        <ion-col size="12">
          <!-- Search Query Chip -->
          <ion-chip
            v-if="searchQuery"
            color="medium"
            outline
            :aria-label="`${$t('common.clear')} ${$t('marketplace.search')}`"
            @click="clearSearchQuery"
          >
            <ion-label>
              {{ useRegex ? $t('marketplace.regexMode') : $t('marketplace.searchFor') }}:
              "{{ searchQuery }}"
            </ion-label>
            <ion-icon :icon="icons.close" />
          </ion-chip>

          <!-- Category Chip -->
          <ion-chip
            v-if="selectedCategory"
            color="medium"
            outline
            :aria-label="`${$t('common.clear')} ${$t('marketplace.category')}`"
            @click="clearCategory"
          >
            <ion-label>
              {{ $t('marketplace.category') }}: {{ selectedCategory }}
            </ion-label>
            <ion-icon :icon="icons.close" />
          </ion-chip>

          <!-- Subcategory Chip -->
          <ion-chip
            v-if="selectedSubcategory"
            color="medium"
            outline
            :aria-label="`${$t('common.clear')} ${$t('marketplace.subcategory')}`"
            @click="clearSubcategory"
          >
            <ion-label>
              {{ $t('marketplace.subcategory') }}:
              {{ selectedSubcategory }}
            </ion-label>
            <ion-icon :icon="icons.close" />
          </ion-chip>

          <!-- Country Chips -->
          <ion-chip
            v-for="country in selectedCountries"
            :key="country"
            color="medium"
            outline
            :aria-label="`${$t('common.remove')} ${country}`"
            @click="removeCountry(country)"
          >
            <ion-label>
              {{ $t('marketplace.country') }}: {{ getCountryDisplay(country) }}
            </ion-label>
            <ion-icon :icon="icons.close" />
          </ion-chip>

          <!-- Sort Chip -->
          <ion-chip
            v-if="sortOption !== 'none'"
            color="medium"
            outline
            :aria-label="`${$t('common.clear')} ${$t('marketplace.sortBy')}`"
            @click="clearSort"
          >
            <ion-label>
              {{ $t('marketplace.sorted') }}: {{ getSortLabel() }}
            </ion-label>
            <ion-icon :icon="icons.close" />
          </ion-chip>

          <!-- Clear All Button -->
          <ion-button
            fill="clear"
            size="small"
            @click="clearAllFilters"
          >
            {{ $t('marketplace.clearFilters') }}
          </ion-button>
        </ion-col>
      </ion-row>

      <!-- Results Count -->
      <ion-row v-if="props.showResultCount" class="results-info">
        <ion-col size="12">
          <ion-text color="medium">
            <p>
              {{ $t('marketplace.showing') }}
              {{ props.resultCount }}
              {{
                props.filterType === 'product'
                  ? $t('marketplace.products').toLowerCase()
                  : $t('wanted.title').toLowerCase()
              }}
              <span v-if="hasActiveFilters">
                ({{ $t('marketplace.filtered') }})
              </span>
            </p>
          </ion-text>
        </ion-col>
      </ion-row>
    </ion-grid>
  </div>

  <!-- Category/Subcategory Modal -->
  <ion-modal
    :is-open="showCategoryModal"
    @did-dismiss="showCategoryModal = false"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('marketplace.filterCategory') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showCategoryModal = false">
            {{ $t('common.close') }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item button @click="selectCategory(null)">
          <ion-label
            :color="!selectedCategory ? 'primary' : undefined"
          >
            {{ $t('marketplace.allCategories') }}
          </ion-label>
          <ion-icon
            v-if="!selectedCategory"
            slot="end"
            :icon="icons.checkmark"
            color="primary"
          />
        </ion-item>
        <ion-item
          v-for="category in availableCategories"
          :key="category"
          button
          @click="selectCategory(category)"
        >
          <ion-label
            :color="selectedCategory === category ? 'primary' : undefined"
          >
            {{ category }}
          </ion-label>
          <ion-icon
            v-if="selectedCategory === category"
            slot="end"
            :icon="icons.checkmark"
            color="primary"
          />
        </ion-item>
      </ion-list>

      <!-- Subcategory Section -->
      <ion-list v-if="selectedCategory && availableSubcategories.length > 0" lines="none">
        <ion-list-header>
          <ion-label>{{ $t('marketplace.filterSubcategory') }}</ion-label>
        </ion-list-header>
        <ion-item button @click="selectSubcategory(null)">
          <ion-label
            :color="!selectedSubcategory ? 'primary' : undefined"
          >
            {{ $t('marketplace.allSubcategories') }}
          </ion-label>
          <ion-icon
            v-if="!selectedSubcategory"
            slot="end"
            :icon="icons.checkmark"
            color="primary"
          />
        </ion-item>
        <ion-item
          v-for="subcategory in availableSubcategories"
          :key="subcategory"
          button
          @click="selectSubcategory(subcategory)"
        >
          <ion-label
            :color="selectedSubcategory === subcategory ? 'primary' : undefined"
          >
            {{ subcategory }}
          </ion-label>
          <ion-icon
            v-if="selectedSubcategory === subcategory"
            slot="end"
            :icon="icons.checkmark"
            color="primary"
          />
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>

  <!-- Country Selection Modal -->
  <ion-modal
    :is-open="showCountryModal"
    @did-dismiss="showCountryModal = false"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('marketplace.filterCountries') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showCountryModal = false">
            {{ $t('common.close') }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item
          v-for="country in availableCountryOptions"
          :key="country.code"
          button
          @click="toggleCountry(country.value)"
        >
          <ion-checkbox
            slot="start"
            :checked="selectedCountries.includes(country.value)"
          />
          <ion-label>{{ country.flag }} {{ country.name }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>

  <!-- Sort Options Modal -->
  <ion-modal
    :is-open="showSortModal"
    @did-dismiss="showSortModal = false"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('marketplace.sortBy') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showSortModal = false">
            {{ $t('common.close') }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-radio-group :value="sortOption" @ion-change="handleSortChange">
          <ion-item>
            <ion-label>{{ $t('marketplace.sortNone') }}</ion-label>
            <ion-radio slot="start" value="none" />
          </ion-item>
          <ion-item v-if="props.filterType === 'product'">
            <ion-label>{{ $t('marketplace.sortPriceAsc') }}</ion-label>
            <ion-radio slot="start" value="price_asc" />
          </ion-item>
          <ion-item v-if="props.filterType === 'product'">
            <ion-label>{{ $t('marketplace.sortPriceDesc') }}</ion-label>
            <ion-radio slot="start" value="price_desc" />
          </ion-item>
          <ion-item>
            <ion-label>{{ $t('marketplace.sortTitleAsc') }}</ion-label>
            <ion-radio slot="start" value="title_asc" />
          </ion-item>
          <ion-item>
            <ion-label>{{ $t('marketplace.sortTitleDesc') }}</ion-label>
            <ion-radio slot="start" value="title_desc" />
          </ion-item>
        </ion-radio-group>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonCheckbox, IonRadioGroup, IonRadio, IonListHeader, IonBadge } from '@ionic/vue'
import { checkmarkOutline } from 'ionicons/icons'
import type { Country } from '~/composables/useCountries'
import { useCountries } from '~/composables/useCountries'
import type {
  FilterableItem,
  SortOption
} from '../../composables/useSearchFilter'

// Props
interface Props {
  filterType: 'product' | 'wanted'
  items: FilterableItem[]
  availableCategories: string[]
  availableSubcategories: string[]
  availableCountries: string[]
  showResultCount?: boolean
  resultCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  showResultCount: true,
  resultCount: 0
})

// Runtime validation for filterType prop
if (props.filterType !== 'product' && props.filterType !== 'wanted') {
  console.warn(
    `Invalid filter type: "${props.filterType}". Expected "product" or "wanted".`
  )
}

// Emits
const emit = defineEmits<{
  'update:filters': [filters: {
    searchQuery: string
    useRegex: boolean
    selectedCategory: string | null
    selectedSubcategory: string | null
    selectedCountries: string[]
    sortOption: SortOption
  }]
  'clear-filters': []
}>()

// State
const searchQuery = ref('')
const useRegex = ref(false)
const selectedCategory = ref<string | null>(null)
const selectedSubcategory = ref<string | null>(null)
const selectedCountries = ref<string[]>([])
const sortOption = ref<SortOption>('none')

// Modal state
const showCategoryModal = ref(false)
const showCountryModal = ref(false)
const showSortModal = ref(false)

// Use icons
const icons = { ...useIcons(), checkmark: checkmarkOutline }
const { t } = useI18n()
const { countries: countriesRef } = useCountries()

// Map available countries to country objects with original values
const availableCountryOptions = computed(() => {
  if (!props.availableCountries ||
      props.availableCountries.length === 0 ||
      !countriesRef.value ||
      countriesRef.value.length === 0) {
    return []
  }

  // Map each country to an object with original value and display info
  return props.availableCountries
    .map(codeOrName => {
      // First try to find by code
      let country = countriesRef.value.find(c => c.code === codeOrName)
      // If not found, try to find by name
      if (!country) {
        country = countriesRef.value.find(c =>
          c.name.toLowerCase() === codeOrName.toLowerCase())
      }
      // Return object with original value and display info
      if (country) {
        return {
          value: codeOrName, // Keep original value from data
          code: country.code,
          name: country.name,
          flag: country.flag
        }
      }
      return null
    })
    .filter(c => c !== null) as Array<{
      value: string
      code: string
      name: string
      flag: string
    }>
})

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    selectedCategory.value ||
    selectedSubcategory.value ||
    selectedCountries.value.length > 0 ||
    sortOption.value !== 'none'
  )
})

// Methods
const emitFilterUpdate = () => {
  emit('update:filters', {
    searchQuery: searchQuery.value,
    useRegex: useRegex.value,
    selectedCategory: selectedCategory.value,
    selectedSubcategory: selectedSubcategory.value,
    selectedCountries: selectedCountries.value,
    sortOption: sortOption.value
  })
}

const handleSearchInput = (event: CustomEvent) => {
  searchQuery.value = event.detail.value || ''
  emitFilterUpdate()
}

const toggleRegex = () => {
  useRegex.value = !useRegex.value
  emitFilterUpdate()
}

const handleCategoryChange = (event: CustomEvent) => {
  selectedCategory.value = event.detail.value
  selectedSubcategory.value = null // Reset subcategory
  emitFilterUpdate()
}

const handleSubcategoryChange = (event: CustomEvent) => {
  selectedSubcategory.value = event.detail.value
  emitFilterUpdate()
}

const handleCountryChange = (event: CustomEvent) => {
  selectedCountries.value = event.detail.value || []
  emitFilterUpdate()
}

const handleSortChange = (event: CustomEvent) => {
  sortOption.value = event.detail.value
  emitFilterUpdate()
  showSortModal.value = false
}

// Modal-specific methods
const selectCategory = (category: string | null) => {
  selectedCategory.value = category
  if (!category) {
    selectedSubcategory.value = null
  }
  emitFilterUpdate()
  if (!category || !props.availableSubcategories.length) {
    showCategoryModal.value = false
  }
}

const selectSubcategory = (subcategory: string | null) => {
  selectedSubcategory.value = subcategory
  emitFilterUpdate()
  showCategoryModal.value = false
}

const toggleCountry = (country: string) => {
  const index = selectedCountries.value.indexOf(country)
  if (index > -1) {
    selectedCountries.value.splice(index, 1)
  } else {
    selectedCountries.value.push(country)
  }
  emitFilterUpdate()
}

const clearSearchQuery = () => {
  searchQuery.value = ''
  useRegex.value = false
  emitFilterUpdate()
}

const clearCategory = () => {
  selectedCategory.value = null
  selectedSubcategory.value = null
  emitFilterUpdate()
}

const clearSubcategory = () => {
  selectedSubcategory.value = null
  emitFilterUpdate()
}

const removeCountry = (country: string) => {
  selectedCountries.value = selectedCountries.value.filter(
    c => c !== country
  )
  emitFilterUpdate()
}

const clearSort = () => {
  sortOption.value = 'none'
  emitFilterUpdate()
}

const getCountryDisplay = (codeOrName: string) => {
  // First try to find by code
  const countryOptions = countriesRef.value
  let country = countryOptions?.find(c => c.code === codeOrName)
  // If not found, try to find by name
  if (!country) {
    country = countryOptions?.find(c =>
      c.name.toLowerCase() === codeOrName.toLowerCase())
  }
  return country ? `${country.flag} ${country.name}` : codeOrName
}

const clearAllFilters = () => {
  searchQuery.value = ''
  useRegex.value = false
  selectedCategory.value = null
  selectedSubcategory.value = null
  selectedCountries.value = []
  sortOption.value = 'none'
  emit('clear-filters')
}

const getSortLabel = () => {
  const labels: Record<SortOption, string> = {
    none: t('marketplace.sortNone'),
    price_asc: t('marketplace.sortPriceAsc'),
    price_desc: t('marketplace.sortPriceDesc'),
    title_asc: t('marketplace.sortTitleAsc'),
    title_desc: t('marketplace.sortTitleDesc')
  }
  return labels[sortOption.value] || ''
}

// Expose methods for parent access
defineExpose({
  clearAllFilters
})
</script>

<style scoped>
.unified-search-filter {
  background: var(--ion-background-color);
}

/* Mobile filter toolbar */
.mobile-filter-controls {
  display: none;
  --background: var(--ion-toolbar-background);
  --min-height: 48px;
}

.mobile-filter-controls ion-buttons {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.mobile-filter-controls ion-button {
  position: relative;
  flex: 1;
}

.filter-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  padding: 0 4px;
}

/* Desktop filter controls */
.desktop-filter-controls {
  display: block;
}

.filter-controls {
  padding: var(--ion-padding, 16px);
  padding-top: 0;
}


.primary-searchbar {
  margin-top: 8px;
  margin-bottom: 8px;
}

.filter-controls ion-item {
  --padding-start: 12px;
  --inner-padding-end: 12px;
}

.filter-chips {
  margin-top: 0.5rem;
}

.filter-chips ion-chip {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.results-info {
  margin-top: 0.5rem;
  text-align: center;
}

.results-info p {
  margin: 0;
  font-size: 0.9rem;
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .mobile-filter-controls {
    display: block;
  }

  .desktop-filter-controls {
    display: none;
  }

  .desktop-only {
    display: none;
  }

  .filter-controls ion-col {
    padding: 0.25rem;
  }
}

/* Modal styles - Following Ionic best practices */
:deep(ion-modal ion-list),
:deep(ion-select-popover ion-list) {
  background: transparent;
}

:deep(ion-modal ion-item),
:deep(ion-select-popover ion-item),
:deep(.select-popover .select-interface-option) {
  --background: var(--ion-item-background);
  --min-height: 48px;
  --padding-start: 16px;
  --inner-padding-start: 16px;
  --inner-padding-end: 16px;
}

:deep(ion-modal ion-list-header),
:deep(ion-select-popover ion-list-header) {
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

:deep(ion-modal ion-checkbox),
:deep(ion-select-popover ion-checkbox),
:deep(.select-popover ion-checkbox) {
  margin-inline-end: 12px;
}

:deep(ion-modal ion-radio),
:deep(ion-select-popover ion-radio),
:deep(.select-popover ion-radio) {
  margin-inline-end: 12px;
}
</style>
