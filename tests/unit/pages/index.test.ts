import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { onMounted, reactive } from 'vue'
import { flushPromises } from '../../setup/test-setup'
import { freeVideoWithQueryParams, premiumVideo } from '../../fixtures/videos'
import type { ContentPublic } from '../../../shared/types/api/content.types'

// Make Vue lifecycle hooks globally available
// (Nuxt auto-imports these but test-setup omits
// lifecycle hooks)
vi.stubGlobal('onMounted', onMounted)

// Mock swiper CSS imports
vi.mock('swiper/css', () => ({}))
vi.mock('swiper/css/navigation', () => ({}))
vi.mock('swiper/css/pagination', () => ({}))
vi.mock('swiper/css/autoplay', () => ({}))

// Stub definePageMeta globally
vi.stubGlobal('definePageMeta', vi.fn())

// Import component under test after mocks
// eslint-disable-next-line import/first
import IndexPage from '~/pages/index.vue'

const apiMock = vi.fn()

const stubs = {
  VideoCard: {
    template: '<div class="video-card-stub" />',
    props: ['video', 'featured']
  },
  'swiper-container': {
    template: '<div><slot /></div>'
  },
  'swiper-slide': {
    template: '<div><slot /></div>'
  }
}

function mountPage(
  overrides: {
    authenticated?: boolean
    apiResult?: unknown
  } = {}
) {
  const { authenticated = false, apiResult = [] } = overrides

  apiMock.mockResolvedValue(apiResult)

  vi.stubGlobal('useApi', () => ({ api: apiMock }))
  vi.stubGlobal('useAuthStore', () =>
    reactive({
      user: null,
      token: null,
      isAuthenticated: authenticated,
      setUser: vi.fn(),
      setToken: vi.fn(),
      logout: vi.fn(),
      $patch: vi.fn(),
      $reset: vi.fn(),
      $subscribe: vi.fn()
    })
  )

  return mount(IndexPage, {
    global: { stubs }
  })
}

describe('IndexPage', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    apiMock.mockReset()
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  describe('Featured Video Selection', () => {
    it('calls API on mount', async () => {
      mountPage({ apiResult: [] })
      await flushPromises()

      expect(apiMock).toHaveBeenCalledWith('/products/content/public')
    })

    it('filters out videos with null url', async () => {
      // premiumVideo has url=null, should not
      // be selected even with Math.random=0
      // Only freeVideoWithQueryParams qualifies
      const wrapper = mountPage({
        apiResult: [premiumVideo, freeVideoWithQueryParams]
      })
      await flushPromises()

      const card = wrapper.findComponent(stubs.VideoCard)
      expect(card.exists()).toBe(true)
      expect(card.props('video')._id).toBe(freeVideoWithQueryParams._id)
    })

    it('filters out non-basic level videos', async () => {
      const intermediateVideo: ContentPublic = {
        ...freeVideoWithQueryParams,
        _id: 'intermediate-1',
        level: 'intermediate'
      }
      const wrapper = mountPage({
        apiResult: [intermediateVideo, freeVideoWithQueryParams]
      })
      await flushPromises()

      const card = wrapper.findComponent(stubs.VideoCard)
      expect(card.exists()).toBe(true)
      expect(card.props('video')._id).toBe(freeVideoWithQueryParams._id)
    })

    it('filters out videos with credits > 0', async () => {
      const paidBasic: ContentPublic = {
        ...freeVideoWithQueryParams,
        _id: 'paid-basic-1',
        credits: 5
      }
      const wrapper = mountPage({
        apiResult: [paidBasic, freeVideoWithQueryParams]
      })
      await flushPromises()

      const card = wrapper.findComponent(stubs.VideoCard)
      expect(card.exists()).toBe(true)
      expect(card.props('video')._id).toBe(freeVideoWithQueryParams._id)
    })

    it('uses Math.random to select from pool', async () => {
      const second: ContentPublic = {
        ...freeVideoWithQueryParams,
        _id: 'second-free'
      }
      randomSpy.mockReturnValue(0.99)

      const wrapper = mountPage({
        apiResult: [freeVideoWithQueryParams, second]
      })
      await flushPromises()

      const card = wrapper.findComponent(stubs.VideoCard)
      expect(card.exists()).toBe(true)
      // floor(0.99 * 2) = 1 => second video
      expect(card.props('video')._id).toBe('second-free')
    })
  })

  describe('Display Logic', () => {
    it('renders VideoCard with featured=true', async () => {
      const wrapper = mountPage({
        apiResult: [freeVideoWithQueryParams]
      })
      await flushPromises()

      const card = wrapper.findComponent(stubs.VideoCard)
      expect(card.exists()).toBe(true)
      expect(card.props('featured')).toBe(true)
    })

    it('View All button links to /tutorials', async () => {
      const wrapper = mountPage({
        apiResult: [freeVideoWithQueryParams]
      })
      await flushPromises()

      const buttons = wrapper.findAll('ion-button')
      const viewAll = buttons.find(b => b.text().includes('home.featuredVideo.viewAll'))
      expect(viewAll).toBeDefined()
      expect(viewAll!.attributes('router-link')).toBe('/tutorials')
    })

    it('hides featured section while loading', () => {
      // Do not await flushPromises so
      // loadingVideo stays true
      apiMock.mockReturnValue(new Promise(() => {}))
      vi.stubGlobal('useApi', () => ({ api: apiMock }))
      vi.stubGlobal('useAuthStore', () =>
        reactive({
          user: null,
          token: null,
          isAuthenticated: false,
          setUser: vi.fn(),
          setToken: vi.fn(),
          logout: vi.fn(),
          $patch: vi.fn(),
          $reset: vi.fn(),
          $subscribe: vi.fn()
        })
      )

      const wrapper = mount(IndexPage, {
        global: { stubs }
      })

      const grid = wrapper.find('.featured-grid')
      expect(grid.exists()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('does not show error UI on API failure', async () => {
      apiMock.mockRejectedValue(new Error('Network error'))
      vi.stubGlobal('useApi', () => ({ api: apiMock }))
      vi.stubGlobal('useAuthStore', () =>
        reactive({
          user: null,
          token: null,
          isAuthenticated: false,
          setUser: vi.fn(),
          setToken: vi.fn(),
          logout: vi.fn(),
          $patch: vi.fn(),
          $reset: vi.fn(),
          $subscribe: vi.fn()
        })
      )

      const wrapper = mount(IndexPage, {
        global: { stubs }
      })
      await flushPromises()

      expect(wrapper.find('.error').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('hides featured section on API error', async () => {
      apiMock.mockRejectedValue(new Error('Server error'))
      vi.stubGlobal('useApi', () => ({ api: apiMock }))
      vi.stubGlobal('useAuthStore', () =>
        reactive({
          user: null,
          token: null,
          isAuthenticated: false,
          setUser: vi.fn(),
          setToken: vi.fn(),
          logout: vi.fn(),
          $patch: vi.fn(),
          $reset: vi.fn(),
          $subscribe: vi.fn()
        })
      )

      const wrapper = mount(IndexPage, {
        global: { stubs }
      })
      await flushPromises()

      expect(wrapper.find('.featured-grid').exists()).toBe(false)
    })
  })

  describe('Authentication States', () => {
    it('shows register and login when not auth', async () => {
      const wrapper = mountPage({
        authenticated: false,
        apiResult: []
      })
      await flushPromises()

      const text = wrapper.text()
      expect(text).toContain('home.getStarted')
      expect(text).toContain('home.signIn')
      expect(text).not.toContain('home.manageAccount')
    })

    it('shows account button when authenticated', async () => {
      const wrapper = mountPage({
        authenticated: true,
        apiResult: []
      })
      await flushPromises()

      const text = wrapper.text()
      expect(text).toContain('home.manageAccount')
      expect(text).not.toContain('home.getStarted')
      expect(text).not.toContain('home.signIn')
    })
  })

  describe('Edge Cases', () => {
    it('no featured video when all premium', async () => {
      const wrapper = mountPage({
        apiResult: [premiumVideo]
      })
      await flushPromises()

      expect(wrapper.find('.featured-grid').exists()).toBe(false)
    })

    it('selects the only matching video', async () => {
      randomSpy.mockReturnValue(0)

      const wrapper = mountPage({
        apiResult: [premiumVideo, freeVideoWithQueryParams]
      })
      await flushPromises()

      const card = wrapper.findComponent(stubs.VideoCard)
      expect(card.exists()).toBe(true)
      expect(card.props('video')._id).toBe(freeVideoWithQueryParams._id)
    })
  })
})
