import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import {
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount
} from 'vue'
import { flushPromises } from '../../setup/test-setup'
import type { ContentPublic } from
  '../../../shared/types/api/content.types'
import {
  freeVideoWithQueryParams,
  freeVideoNoQueryParams,
  premiumVideo,
  allVideos
} from '../../fixtures/videos'

// Make Vue lifecycle hooks available as globals
// so compiled SFC code can reference them
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)
vi.stubGlobal('onBeforeMount', onBeforeMount)
vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)

// Stub Nuxt macros
vi.stubGlobal('definePageMeta', vi.fn())

// Import page after globals are set (top-level await)
const { default: TutorialsPage } =
  await import('~/pages/tutorials.vue')

// Helper: videos with non-null URLs from allVideos
const videosWithUrls = allVideos.filter(
  v => v.url !== null
)

/**
 * Mount tutorials page with a mocked API response.
 * By default returns allVideos.
 * Pass `apiResponse` to override, or `apiError` to
 * simulate a failure.
 */
async function mountPage(opts: {
  apiResponse?: ContentPublic[]
  apiError?: boolean
  skipFlush?: boolean
} = {}): Promise<{
  wrapper: VueWrapper
  mockApi: ReturnType<typeof vi.fn>
}> {
  const mockApi = vi.fn()

  if (opts.apiError) {
    mockApi.mockRejectedValueOnce(
      new Error('Network error')
    )
  } else {
    mockApi.mockResolvedValueOnce(
      opts.apiResponse ?? allVideos
    )
  }

  vi.stubGlobal(
    'useApi',
    () => ({ api: mockApi })
  )

  const wrapper = mount(TutorialsPage, {
    global: {
      stubs: {
        LoadingSpinner: {
          template:
            '<div class="loading-stub">loading</div>'
        },
        ErrorCard: {
          template:
            '<div class="error-stub">' +
            '<button class="retry" ' +
            '@click="$attrs[\'retry-action\']()">' +
            'retry</button></div>',
          inheritAttrs: false
        },
        VideoCard: {
          template:
            '<div class="video-card-stub">' +
            '{{ video.title }}</div>',
          props: ['video']
        }
      }
    }
  })

  if (!opts.skipFlush) {
    await flushPromises()
  }

  return { wrapper, mockApi }
}

describe('TutorialsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('definePageMeta', vi.fn())
  })

  // -----------------------------------------------
  // 1. API Integration
  // -----------------------------------------------
  describe('API Integration', () => {
    it('calls API on mount with correct endpoint',
      async () => {
        const { mockApi } = await mountPage()
        expect(mockApi).toHaveBeenCalledWith(
          '/products/content/public'
        )
      }
    )

    it('shows loading state before API resolves',
      async () => {
        const { wrapper } = await mountPage({
          skipFlush: true
        })
        expect(
          wrapper.find('.loading-stub').exists()
        ).toBe(true)
      }
    )

    it('shows error state on API failure with retry',
      async () => {
        const { wrapper, mockApi } = await mountPage({
          apiError: true
        })

        expect(
          wrapper.find('.error-stub').exists()
        ).toBe(true)

        // Setup a successful retry
        mockApi.mockResolvedValueOnce(allVideos)
        await wrapper.find('.retry').trigger('click')
        await flushPromises()

        expect(
          wrapper.find('.error-stub').exists()
        ).toBe(false)
        expect(mockApi).toHaveBeenCalledTimes(2)
      }
    )
  })

  // -----------------------------------------------
  // 2. Search Filtering
  // -----------------------------------------------
  describe('Search Filtering', () => {
    it('filters by title case-insensitively',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.searchQuery = 'breeding basics'
        await wrapper.vm.$nextTick()

        const filtered = vm.filteredVideos
        expect(filtered.length).toBeGreaterThan(0)
        expect(
          filtered.every((v: ContentPublic) =>
            v.title.toLowerCase()
              .includes('breeding basics')
          )
        ).toBe(true)
      }
    )

    it('filters by description case-insensitively',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.searchQuery = 'FUNDAMENTALS'
        await wrapper.vm.$nextTick()

        const filtered = vm.filteredVideos
        expect(filtered.length).toBeGreaterThan(0)
        expect(
          filtered.every((v: ContentPublic) =>
            v.title.toLowerCase()
              .includes('fundamentals') ||
            v.description.toLowerCase()
              .includes('fundamentals')
          )
        ).toBe(true)
      }
    )

    it('shows all videos when search is empty',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.searchQuery = ''
        await wrapper.vm.$nextTick()

        expect(vm.filteredVideos.length).toBe(
          videosWithUrls.length
        )
      }
    )

    it('handles special characters without crash',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.searchQuery = '.*+?^${}()|[]\\'
        await wrapper.vm.$nextTick()

        // Should not throw; may return 0 results
        expect(vm.filteredVideos).toBeDefined()
      }
    )
  })

  // -----------------------------------------------
  // 3. Level Filtering
  // -----------------------------------------------
  describe('Level Filtering', () => {
    it('filters by a single level', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.selectedLevels = ['basic']
      await wrapper.vm.$nextTick()

      const filtered = vm.filteredVideos
      expect(filtered.length).toBeGreaterThan(0)
      expect(
        filtered.every(
          (v: ContentPublic) => v.level === 'basic'
        )
      ).toBe(true)
    })

    it('filters by multiple levels (OR)',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.selectedLevels = ['basic', 'advanced']
        await wrapper.vm.$nextTick()

        const filtered = vm.filteredVideos
        expect(filtered.length).toBeGreaterThan(0)
        expect(
          filtered.every((v: ContentPublic) =>
            ['basic', 'advanced'].includes(v.level)
          )
        ).toBe(true)
      }
    )

    it('restores all when filter is cleared',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.selectedLevels = ['basic']
        await wrapper.vm.$nextTick()
        const countWithFilter = vm.filteredVideos.length

        vm.selectedLevels = []
        await wrapper.vm.$nextTick()
        expect(vm.filteredVideos.length)
          .toBeGreaterThan(countWithFilter)
      }
    )
  })

  // -----------------------------------------------
  // 4. Tag Filtering
  // -----------------------------------------------
  describe('Tag Filtering', () => {
    it('category tags use OR logic', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.selectedCategoryTags = ['breeding', 'rearing']
      await wrapper.vm.$nextTick()

      const filtered = vm.filteredVideos
      expect(filtered.length).toBeGreaterThan(0)
      expect(
        filtered.every((v: ContentPublic) =>
          v.category_tags.some(
            t => ['breeding', 'rearing'].includes(t)
          )
        )
      ).toBe(true)
    })

    it('profile tags use OR logic', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.selectedProfileTags = ['newbie', 'business']
      await wrapper.vm.$nextTick()

      const filtered = vm.filteredVideos
      expect(filtered.length).toBeGreaterThan(0)
      expect(
        filtered.every((v: ContentPublic) =>
          v.profile_tags.some(
            t => ['newbie', 'business'].includes(t)
          )
        )
      ).toBe(true)
    })

    it('combines level + tags with AND logic',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.selectedLevels = ['basic']
        vm.selectedCategoryTags = ['breeding']
        await wrapper.vm.$nextTick()

        const filtered = vm.filteredVideos
        expect(
          filtered.every((v: ContentPublic) =>
            v.level === 'basic' &&
            v.category_tags.includes('breeding')
          )
        ).toBe(true)
      }
    )
  })

  // -----------------------------------------------
  // 5. Sorting
  // -----------------------------------------------
  describe('Sorting', () => {
    it('sorts by credits ascending', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.sortBy = 'credits'
      vm.sortDirection = 'asc'
      await wrapper.vm.$nextTick()

      const credits = vm.filteredVideos.map(
        (v: ContentPublic) => v.credits
      )
      for (let i = 1; i < credits.length; i++) {
        expect(credits[i]).toBeGreaterThanOrEqual(
          credits[i - 1]
        )
      }
    })

    it('sorts by credits descending', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.sortBy = 'credits'
      vm.sortDirection = 'desc'
      await wrapper.vm.$nextTick()

      const credits = vm.filteredVideos.map(
        (v: ContentPublic) => v.credits
      )
      for (let i = 1; i < credits.length; i++) {
        expect(credits[i]).toBeLessThanOrEqual(
          credits[i - 1]
        )
      }
    })

    it('sorts by title ascending', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.sortBy = 'title'
      vm.sortDirection = 'asc'
      await wrapper.vm.$nextTick()

      const titles = vm.filteredVideos.map(
        (v: ContentPublic) => v.title
      )
      for (let i = 1; i < titles.length; i++) {
        expect(
          titles[i].localeCompare(titles[i - 1])
        ).toBeGreaterThanOrEqual(0)
      }
    })

    it('sorts by title descending', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.sortBy = 'title'
      vm.sortDirection = 'desc'
      await wrapper.vm.$nextTick()

      const titles = vm.filteredVideos.map(
        (v: ContentPublic) => v.title
      )
      for (let i = 1; i < titles.length; i++) {
        expect(
          titles[i].localeCompare(titles[i - 1])
        ).toBeLessThanOrEqual(0)
      }
    })

    it('sorts by date ascending', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.sortBy = 'date'
      vm.sortDirection = 'asc'
      await wrapper.vm.$nextTick()

      const dates = vm.filteredVideos.map(
        (v: ContentPublic) =>
          new Date(v.created_at).getTime()
      )
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(
          dates[i - 1]
        )
      }
    })

    it('sorts by date descending', async () => {
      const { wrapper } = await mountPage()
      const vm = wrapper.vm as any
      vm.sortBy = 'date'
      vm.sortDirection = 'desc'
      await wrapper.vm.$nextTick()

      const dates = vm.filteredVideos.map(
        (v: ContentPublic) =>
          new Date(v.created_at).getTime()
      )
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(
          dates[i - 1]
        )
      }
    })
  })

  // -----------------------------------------------
  // 6. Tag Extraction
  // -----------------------------------------------
  describe('Tag Extraction', () => {
    it('extracts unique sorted category tags',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        const tags = vm.availableCategoryTags

        // Should be sorted
        for (let i = 1; i < tags.length; i++) {
          expect(
            tags[i].localeCompare(tags[i - 1])
          ).toBeGreaterThanOrEqual(0)
        }
        // Should be unique
        expect(tags.length).toBe(
          new Set(tags).size
        )
      }
    )

    it('extracts unique sorted profile tags',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        const tags = vm.availableProfileTags

        // Should be sorted
        for (let i = 1; i < tags.length; i++) {
          expect(
            tags[i].localeCompare(tags[i - 1])
          ).toBeGreaterThanOrEqual(0)
        }
        // Should be unique
        expect(tags.length).toBe(
          new Set(tags).size
        )
      }
    )
  })

  // -----------------------------------------------
  // 7. States
  // -----------------------------------------------
  describe('States', () => {
    it('shows empty state when no videos match',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        vm.searchQuery = 'zzz_no_match_ever_zzz'
        await wrapper.vm.$nextTick()

        expect(vm.filteredVideos.length).toBe(0)
        expect(
          wrapper.text()
        ).toContain('tutorials.empty.title')
      }
    )

    it('results count updates with filtering',
      async () => {
        const { wrapper } = await mountPage()
        const vm = wrapper.vm as any
        const allCount = vm.filteredVideos.length

        vm.selectedLevels = ['advanced']
        await wrapper.vm.$nextTick()
        const filteredCount = vm.filteredVideos.length

        expect(filteredCount).toBeLessThan(allCount)
        expect(
          wrapper.find('.results-count').exists()
        ).toBe(true)
      }
    )

    it('filters out videos with url=null',
      async () => {
        const { wrapper } = await mountPage({
          apiResponse: [
            freeVideoWithQueryParams,
            premiumVideo
          ]
        })
        const vm = wrapper.vm as any

        // premiumVideo has url: null
        expect(vm.filteredVideos.length).toBe(1)
        expect(
          vm.filteredVideos.every(
            (v: ContentPublic) => v.url !== null
          )
        ).toBe(true)
      }
    )
  })

  // -----------------------------------------------
  // 8. Edge Cases
  // -----------------------------------------------
  describe('Edge Cases', () => {
    it('handles empty API response', async () => {
      const { wrapper } = await mountPage({
        apiResponse: []
      })
      const vm = wrapper.vm as any

      expect(vm.filteredVideos.length).toBe(0)
      expect(
        wrapper.find('.error-stub').exists()
      ).toBe(false)
    })

    it('searches safely with null title/description',
      async () => {
        const nullFieldVideo: ContentPublic = {
          ...freeVideoWithQueryParams,
          _id: 'null-fields',
          title: null as unknown as string,
          description: null as unknown as string
        }

        const { wrapper } = await mountPage({
          apiResponse: [
            freeVideoWithQueryParams,
            nullFieldVideo
          ]
        })
        const vm = wrapper.vm as any
        vm.searchQuery = 'breeding'
        await wrapper.vm.$nextTick()

        // Should not throw
        expect(vm.filteredVideos).toBeDefined()
      }
    )

    it('sorts by date with missing created_at',
      async () => {
        const noDateVideo: ContentPublic = {
          ...freeVideoWithQueryParams,
          _id: 'no-date',
          created_at: '' as string
        }

        const { wrapper } = await mountPage({
          apiResponse: [
            freeVideoNoQueryParams,
            noDateVideo
          ]
        })
        const vm = wrapper.vm as any
        vm.sortBy = 'date'
        vm.sortDirection = 'asc'
        await wrapper.vm.$nextTick()

        // Should not throw
        expect(
          vm.filteredVideos.length
        ).toBeGreaterThan(0)
      }
    )
  })
})
