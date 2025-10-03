import { ref, computed, toRef } from 'vue'
import { refDebounced } from '@vueuse/core'
import { createSafeRegex } from '../utils/helpers'
import type {
  ProductPublicListing,
  Product
} from '../../shared/types/models/MarketplaceProduct'
import type {
  WantedPublicListing,
  Wanted
} from '../../shared/types/models/MarketplaceWanted'

export type FilterableItem =
  | ProductPublicListing
  | Product
  | WantedPublicListing
  | Wanted

export type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'title_asc'
  | 'title_desc'
  | 'none'

export interface FilterState {
  searchQuery: string
  useRegex: boolean
  selectedCategory: string | null
  selectedSubcategory: string | null
  selectedCountries: string[]
  sortOption: SortOption
}

export const useSearchFilter = <T extends FilterableItem>(
  items: Ref<T[]>
) => {
  // Filter state
  const filterState = ref<FilterState>({
    searchQuery: '',
    useRegex: false,
    selectedCategory: null,
    selectedSubcategory: null,
    selectedCountries: [],
    sortOption: 'none'
  })

  // Debounced search query for performance
  const debouncedSearchQuery = refDebounced(
    toRef(filterState.value, 'searchQuery'),
    300
  )

  // Available filter options based on current items
  const availableCategories = computed(() => {
    const categories = new Set(items.value.map(item => item.category))
    return Array.from(categories).sort()
  })

  const availableSubcategories = computed(() => {
    if (!filterState.value.selectedCategory) return []

    const subcategories = new Set(
      items.value
        .filter(item =>
          item.category === filterState.value.selectedCategory
        )
        .map(item => item.subcategory)
    )
    return Array.from(subcategories).sort()
  })

  const availableCountries = computed(() => {
    const countries = new Set(
      items.value.flatMap(item => item.countries || [])
    )
    return Array.from(countries).sort()
  })

  // Text search function with regex support
  const matchesTextSearch = (item: T): boolean => {
    const query = debouncedSearchQuery.value
    if (!query) return true

    const searchableText = [
      item.title,
      item.description,
      item.company_name
    ].join(' ').toLowerCase()

    if (filterState.value.useRegex) {
      try {
        const regex = createSafeRegex(query, 'i')
        if (!regex) return false
        return regex.test(searchableText)
      } catch (error) {
        console.error('Regex search error:', error)
        return true // Fail open to show all items
      }
    }

    return searchableText.includes(query.toLowerCase())
  }

  // Category filter function
  const matchesCategoryFilter = (item: T): boolean => {
    if (!filterState.value.selectedCategory) return true
    return item.category === filterState.value.selectedCategory
  }

  // Subcategory filter function
  const matchesSubcategoryFilter = (item: T): boolean => {
    if (!filterState.value.selectedSubcategory) return true
    return item.subcategory === filterState.value.selectedSubcategory
  }

  // Country filter function (multi-select)
  const matchesCountryFilter = (item: T): boolean => {
    if (filterState.value.selectedCountries.length === 0) return true

    const itemCountries = item.countries || []
    return filterState.value.selectedCountries.some(
      country => itemCountries.includes(country)
    )
  }

  // Combined filter function
  const applyFilters = (item: T): boolean => {
    return (
      matchesTextSearch(item) &&
      matchesCategoryFilter(item) &&
      matchesSubcategoryFilter(item) &&
      matchesCountryFilter(item)
    )
  }

  // Null-safe comparator for sorting
  const compareValues = (
    a: any,
    b: any,
    ascending = true
  ): number => {
    // Handle null/undefined values
    if (a == null && b == null) return 0
    if (a == null) return ascending ? 1 : -1
    if (b == null) return ascending ? -1 : 1

    // Use locale-aware comparison for strings
    if (typeof a === 'string' && typeof b === 'string') {
      const result = a.localeCompare(b, undefined, { sensitivity: 'base' })
      return ascending ? result : -result
    }

    // Compare numeric and other values
    if (a < b) return ascending ? -1 : 1
    if (a > b) return ascending ? 1 : -1
    return 0
  }

  // Sort function
  const applySorting = (items: T[]): T[] => {
    const { sortOption } = filterState.value
    if (sortOption === 'none') return items

    const sorted = [...items]

    switch (sortOption) {
      case 'price_asc':
      case 'price_desc':
        // Check if items have price field (products)
        sorted.sort((a, b) => {
          const aPrice = 'price' in a ? a.price : null
          const bPrice = 'price' in b ? b.price : null
          return compareValues(
            aPrice,
            bPrice,
            sortOption === 'price_asc'
          )
        })
        break

      case 'title_asc':
      case 'title_desc':
        sorted.sort((a, b) => {
          return compareValues(
            a.title,
            b.title,
            sortOption === 'title_asc'
          )
        })
        break
    }

    return sorted
  }

  // Main filtered and sorted items
  // Note: For very large datasets (100+ items), consider implementing
  // virtual scrolling or pagination for optimal performance
  const filteredItems = computed(() => {
    const filtered = items.value.filter(applyFilters)
    return applySorting(filtered)
  })

  // Update filter state
  const updateFilter = (
    key: keyof FilterState,
    value: any
  ) => {
    filterState.value[key] = value

    // Reset subcategory when category changes
    if (key === 'selectedCategory') {
      filterState.value.selectedSubcategory = null
    }
  }

  // Clear all filters
  const clearFilters = () => {
    filterState.value.searchQuery = ''
    filterState.value.useRegex = false
    filterState.value.selectedCategory = null
    filterState.value.selectedSubcategory = null
    filterState.value.selectedCountries = []
    filterState.value.sortOption = 'none'
  }

  // Check if any filters are active
  const hasActiveFilters = computed(() => {
    const state = filterState.value
    return !!(
      state.searchQuery ||
      state.selectedCategory ||
      state.selectedSubcategory ||
      state.selectedCountries.length > 0 ||
      state.sortOption !== 'none'
    )
  })

  return {
    // State
    filterState: readonly(filterState),

    // Computed
    filteredItems,
    availableCategories,
    availableSubcategories,
    availableCountries,
    hasActiveFilters,

    // Methods
    updateFilter,
    clearFilters,
    applyFilters,
    applySorting
  }
}