import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useSearchFilter } from '../../../app/composables/useSearchFilter'
import type {
  ProductPublicListing,
  Product
} from '../../../shared/types/models/MarketplaceProduct'
import type {
  WantedPublicListing,
  Wanted
} from '../../../shared/types/models/MarketplaceWanted'

describe('useSearchFilter', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      title: 'Laptop Dell XPS',
      category: 'Electronics',
      subcategory: 'Computers',
      description: 'High performance laptop',
      price: 1500,
      price_currency: 'USD',
      quantity: 1,
      quantity_unit: 'piece',
      countries: ['USA', 'Canada'],
      image_urls: [],
      additional_info: {},
      company_name: 'TechCorp',
      created_at: '2024-01-01',
      company_id: 'comp1',
      active: true
    },
    {
      id: '2',
      title: 'iPhone 15 Pro',
      category: 'Electronics',
      subcategory: 'Phones',
      description: 'Latest iPhone model',
      price: 999,
      price_currency: 'USD',
      quantity: 2,
      quantity_unit: 'pieces',
      countries: ['USA', 'UK', 'Germany'],
      image_urls: [],
      additional_info: {},
      company_name: 'MobileShop',
      created_at: '2024-01-02',
      company_id: 'comp2',
      active: true
    },
    {
      id: '3',
      title: 'Office Chair',
      category: 'Furniture',
      subcategory: 'Office',
      description: 'Ergonomic office chair',
      price: 250,
      price_currency: 'EUR',
      quantity: 5,
      quantity_unit: 'pieces',
      countries: ['Germany', 'France'],
      image_urls: [],
      additional_info: {},
      company_name: 'FurnitureWorld',
      created_at: '2024-01-03',
      company_id: 'comp3',
      active: true
    }
  ]

  describe('Text Search', () => {
    it('filters items by title', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'laptop')

      // Wait for debounced search
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].title).toBe('Laptop Dell XPS')
    })

    it('filters items by description', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'ergonomic')
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].title).toBe('Office Chair')
    })

    it('filters items by company name', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'techcorp')
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].company_name).toBe('TechCorp')
    })

    it('handles case-insensitive search', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'IPHONE')
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].title).toBe('iPhone 15 Pro')
    })
  })

  describe('Regex Search', () => {
    it('supports regex patterns', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'i[Pp]hone.*Pro')
      updateFilter('useRegex', true)
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].title).toBe('iPhone 15 Pro')
    })

    it('handles invalid regex gracefully', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', '[invalid(regex')
      updateFilter('useRegex', true)
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(0)
    })

    it('prevents ReDoS patterns', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', '(.*+)+')
      updateFilter('useRegex', true)
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(0)
    })
  })

  describe('Category Filtering', () => {
    it('filters by category', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('selectedCategory', 'Electronics')

      expect(filteredItems.value).toHaveLength(2)
      expect(
        filteredItems.value.every(item => item.category === 'Electronics')
      ).toBe(true)
    })

    it('filters by subcategory', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('selectedCategory', 'Electronics')
      updateFilter('selectedSubcategory', 'Phones')

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].subcategory).toBe('Phones')
    })

    it('resets subcategory when category changes', () => {
      const items = ref(mockProducts)
      const { filterState, updateFilter } = useSearchFilter(items)

      updateFilter('selectedCategory', 'Electronics')
      updateFilter('selectedSubcategory', 'Phones')
      expect(filterState.value.selectedSubcategory).toBe('Phones')

      updateFilter('selectedCategory', 'Furniture')
      expect(filterState.value.selectedSubcategory).toBeNull()
    })
  })

  describe('Country Filtering', () => {
    it('filters by single country', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('selectedCountries', ['Germany'])

      expect(filteredItems.value).toHaveLength(2)
      const titles = filteredItems.value.map(i => i.title)
      expect(titles).toContain('iPhone 15 Pro')
      expect(titles).toContain('Office Chair')
    })

    it('filters by multiple countries (OR logic)', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('selectedCountries', ['USA', 'France'])

      expect(filteredItems.value).toHaveLength(3) // All match
    })

    it('handles items with no countries', () => {
      const itemsWithEmpty = ref([
        ...mockProducts,
        {
          ...mockProducts[0],
          id: '4',
          countries: []
        }
      ])
      const { filteredItems, updateFilter } = useSearchFilter(itemsWithEmpty)

      updateFilter('selectedCountries', ['USA'])
      expect(filteredItems.value).toHaveLength(2)
    })
  })

  describe('Sorting', () => {
    it('sorts by price ascending', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('sortOption', 'price_asc')

      expect(filteredItems.value[0].price).toBe(250)
      expect(filteredItems.value[1].price).toBe(999)
      expect(filteredItems.value[2].price).toBe(1500)
    })

    it('sorts by price descending', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('sortOption', 'price_desc')

      expect(filteredItems.value[0].price).toBe(1500)
      expect(filteredItems.value[1].price).toBe(999)
      expect(filteredItems.value[2].price).toBe(250)
    })

    it('sorts by title ascending', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('sortOption', 'title_asc')

      expect(filteredItems.value[0].title).toBe('iPhone 15 Pro')
      expect(filteredItems.value[1].title).toBe('Laptop Dell XPS')
      expect(filteredItems.value[2].title).toBe('Office Chair')
    })

    it('sorts by title descending', () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('sortOption', 'title_desc')

      expect(filteredItems.value[0].title).toBe('Office Chair')
      expect(filteredItems.value[1].title).toBe('Laptop Dell XPS')
      expect(filteredItems.value[2].title).toBe('iPhone 15 Pro')
    })

    it('handles null values in sorting', () => {
      const itemsWithNull = ref([
        ...mockProducts,
        {
          ...mockProducts[0],
          id: '4',
          price: null as any
        }
      ])
      const { filteredItems, updateFilter } = useSearchFilter(itemsWithNull)

      updateFilter('sortOption', 'price_asc')

      // Null values should be sorted last
      expect(filteredItems.value[3].price).toBeNull()
    })
  })

  describe('Combined Filters', () => {
    it('combines text search with category filter', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'phone')
      updateFilter('selectedCategory', 'Electronics')
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].title).toBe('iPhone 15 Pro')
    })

    it('combines all filters', async () => {
      const items = ref(mockProducts)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', '')
      updateFilter('selectedCategory', 'Electronics')
      updateFilter('selectedCountries', ['USA'])
      updateFilter('sortOption', 'price_desc')
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value[0].price).toBe(1500) // Highest price
      expect(filteredItems.value[1].price).toBe(999)
    })
  })

  describe('Clear Filters', () => {
    it('clears all filters', async () => {
      const items = ref(mockProducts)
      const {
        filteredItems,
        updateFilter,
        clearFilters,
        hasActiveFilters
      } = useSearchFilter(items)

      // Set multiple filters
      updateFilter('searchQuery', 'test')
      updateFilter('selectedCategory', 'Electronics')
      updateFilter('selectedCountries', ['USA'])
      updateFilter('sortOption', 'price_asc')

      expect(hasActiveFilters.value).toBe(true)

      // Clear all filters
      clearFilters()
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(hasActiveFilters.value).toBe(false)
      expect(filteredItems.value).toHaveLength(3) // All items
    })
  })

  describe('Performance', () => {
    it('handles 100+ items efficiently', async () => {
      const largeDataset = Array.from({ length: 150 }, (_, i) => ({
        ...mockProducts[i % 3],
        id: `item-${i}`,
        title: `Product ${i}`,
        price: Math.random() * 1000
      }))

      const items = ref(largeDataset)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      const startTime = performance.now()

      updateFilter('searchQuery', 'Product 5')
      updateFilter('selectedCategory', 'Electronics')
      updateFilter('sortOption', 'price_asc')

      await new Promise(resolve => setTimeout(resolve, 350))

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete within 400ms (350ms debounce + 50ms processing)
      expect(duration).toBeLessThan(400)
      expect(filteredItems.value.length).toBeGreaterThan(0)
    })
  })

  describe('Computed Properties', () => {
    it('provides available categories', () => {
      const items = ref(mockProducts)
      const { availableCategories } = useSearchFilter(items)

      expect(availableCategories.value).toEqual(['Electronics', 'Furniture'])
    })

    it('provides available subcategories for selected category', () => {
      const items = ref(mockProducts)
      const {
        availableSubcategories,
        updateFilter
      } = useSearchFilter(items)

      updateFilter('selectedCategory', 'Electronics')
      expect(availableSubcategories.value).toEqual(['Computers', 'Phones'])

      updateFilter('selectedCategory', 'Furniture')
      expect(availableSubcategories.value).toEqual(['Office'])
    })

    it('provides available countries', () => {
      const items = ref(mockProducts)
      const { availableCountries } = useSearchFilter(items)

      expect(availableCountries.value).toEqual([
        'Canada',
        'France',
        'Germany',
        'UK',
        'USA'
      ])
    })

    it('tracks active filters state', () => {
      const items = ref(mockProducts)
      const { hasActiveFilters, updateFilter } = useSearchFilter(items)

      expect(hasActiveFilters.value).toBe(false)

      updateFilter('searchQuery', 'test')
      expect(hasActiveFilters.value).toBe(true)

      updateFilter('searchQuery', '')
      expect(hasActiveFilters.value).toBe(false)

      updateFilter('sortOption', 'price_asc')
      expect(hasActiveFilters.value).toBe(true)
    })
  })

  describe('Wanted Items Support', () => {
    const mockWanted: Wanted[] = [
      {
        id: 'w1',
        title: 'Looking for server',
        category: 'IT',
        subcategory: 'Hardware',
        description: 'Need powerful server',
        countries: ['USA'],
        additional_info: {},
        company_name: 'StartupCo',
        created_at: '2024-01-01',
        company_id: 'comp1',
        active: true,
        budget_min: 1000,
        budget_max: 5000,
        budget_currency: 'USD'
      }
    ]

    it('works with wanted items', async () => {
      const items = ref(mockWanted)
      const { filteredItems, updateFilter } = useSearchFilter(items)

      updateFilter('searchQuery', 'server')
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].title).toBe('Looking for server')
    })
  })
})