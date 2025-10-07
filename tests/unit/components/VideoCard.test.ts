import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoCard from '~/components/content/VideoCard.vue'
import {
  freeVideoWithQueryParams,
  freeVideoNoQueryParams,
  premiumVideo,
  directVimeoUrlWithWww,
  directVimeoUrlNoWww,
  videoWithManyQueryParams,
  videoWithEncodedParams,
  invalidVideoHttp,
  invalidVideoWrongDomain
} from '../../fixtures/videos'
import type { ContentPublic } from '../../../shared/types/api/content.types'

describe('VideoCard', () => {
  describe('Valid URL Tests (backward compatibility)', () => {
    it('should accept URLs without query parameters', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoNoQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toBe(freeVideoNoQueryParams.url)
    })

    it('should accept direct vimeo.com URLs with www', () => {
      const wrapper = mount(VideoCard, {
        props: { video: directVimeoUrlWithWww }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toBe(directVimeoUrlWithWww.url)
    })

    it('should accept direct vimeo.com URLs without www', () => {
      const wrapper = mount(VideoCard, {
        props: { video: directVimeoUrlNoWww }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toBe(directVimeoUrlNoWww.url)
    })

    it('should accept embed player.vimeo.com URLs', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoNoQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toContain('player.vimeo.com')
    })
  })

  describe('Valid URL Tests (bug fix validation)', () => {
    it('should accept URLs with single query parameter', () => {
      const singleParamVideo: ContentPublic = {
        ...freeVideoNoQueryParams,
        url: 'https://player.vimeo.com/video/123456789?badge=0'
      }

      const wrapper = mount(VideoCard, {
        props: { video: singleParamVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toContain('?badge=0')
    })

    it('should accept URLs with multiple query parameters', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toContain('?')
      expect(iframe.attributes('src')).toContain('badge=0')
      expect(iframe.attributes('src')).toContain('autopause=0')
    })

    it('should accept URLs with many query parameters', () => {
      const wrapper = mount(VideoCard, {
        props: { video: videoWithManyQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      const src = iframe.attributes('src')
      expect(src).toContain('?')
      expect(src).toContain('quality=720p')
      expect(src).toContain('autoplay=1')
    })

    it('should accept URLs with HTML-encoded ampersands', () => {
      const wrapper = mount(VideoCard, {
        props: { video: videoWithEncodedParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toContain('?')
    })
  })

  describe('Invalid URL Tests (security)', () => {
    it('should reject HTTP URLs (not HTTPS)', () => {
      const wrapper = mount(VideoCard, {
        props: { video: invalidVideoHttp }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
    })

    it('should reject non-Vimeo domains', () => {
      const wrapper = mount(VideoCard, {
        props: { video: invalidVideoWrongDomain }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
    })

    it('should reject JavaScript URLs', () => {
      const jsUrlVideo: ContentPublic = {
        ...freeVideoNoQueryParams,
        url: 'javascript:alert("XSS")'
      }

      const wrapper = mount(VideoCard, {
        props: { video: jsUrlVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
    })

    it('should reject data URLs', () => {
      const dataUrlVideo: ContentPublic = {
        ...freeVideoNoQueryParams,
        url: 'data:text/html,<script>alert("XSS")</script>'
      }

      const wrapper = mount(VideoCard, {
        props: { video: dataUrlVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
    })

    it('should reject malformed URLs', () => {
      const malformedVideo: ContentPublic = {
        ...freeVideoNoQueryParams,
        url: 'not-a-valid-url'
      }

      const wrapper = mount(VideoCard, {
        props: { video: malformedVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
    })
  })

  describe('Component Rendering Tests', () => {
    it('should render component with valid URL', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      expect(wrapper.find('ion-card').exists()).toBe(true)
      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
    })

    it('should render premium badge with null URL', () => {
      const wrapper = mount(VideoCard, {
        props: { video: premiumVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const badge = wrapper.find('.premium-badge')
      expect(badge.exists()).toBe(true)
    })

    it('should show warning for invalid URL', () => {
      const wrapper = mount(VideoCard, {
        props: { video: invalidVideoHttp }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
      expect(warning.find('ion-text').exists()).toBe(true)
    })

    it('should have correct security attributes on iframe', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.attributes('sandbox')).toBe(
        'allow-scripts allow-same-origin allow-presentation'
      )
      expect(iframe.attributes('allow')).toBe(
        'autoplay; fullscreen; picture-in-picture'
      )
    })

    it('should display video title', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const title = wrapper.find('ion-card-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe(freeVideoWithQueryParams.title)
    })

    it('should display video description', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      expect(wrapper.text()).toContain(freeVideoWithQueryParams.description)
    })

    it('should display level chip', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const chip = wrapper.find('ion-chip')
      expect(chip.exists()).toBe(true)
    })

    it('should display credits badge', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const badge = wrapper.find('.credits-badge')
      expect(badge.exists()).toBe(true)
    })

    it('should display free badge for zero credits', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const badge = wrapper.find('.credits-badge')
      expect(badge.attributes('color')).toBe('success')
    })

    it('should display credit count for paid videos', () => {
      const wrapper = mount(VideoCard, {
        props: { video: premiumVideo }
      })

      const badge = wrapper.find('.credits-badge')
      expect(badge.attributes('color')).toBe('primary')
      expect(badge.text()).toContain('10')
    })

    it('should display category tags', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const tags = wrapper.findAll('ion-chip[size="small"]')
      expect(tags.length).toBeGreaterThan(0)
    })

    it('should limit category tags to 3', () => {
      const manyTagsVideo: ContentPublic = {
        ...freeVideoWithQueryParams,
        category_tags: ['breeding', 'rearing', 'nursing', 'substrate', 'sales']
      }

      const wrapper = mount(VideoCard, {
        props: { video: manyTagsVideo }
      })

      const tags = wrapper.findAll('ion-chip[size="small"]')
      expect(tags.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long query strings', () => {
      const longQueryVideo: ContentPublic = {
        ...freeVideoNoQueryParams,
        url:
          'https://player.vimeo.com/video/123456789?' +
          'param1=value1&param2=value2&param3=value3&' +
          'param4=value4&param5=value5&param6=value6&' +
          'param7=value7&param8=value8&param9=value9'
      }

      const wrapper = mount(VideoCard, {
        props: { video: longQueryVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(true)
      expect(iframe.attributes('src')).toBe(longQueryVideo.url)
    })

    it('should handle null URL correctly', () => {
      const wrapper = mount(VideoCard, {
        props: { video: premiumVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const premium = wrapper.find('.premium-placeholder')
      expect(premium.exists()).toBe(true)
    })

    it('should handle empty URL string', () => {
      const emptyUrlVideo: ContentPublic = {
        ...freeVideoNoQueryParams,
        url: ''
      }

      const wrapper = mount(VideoCard, {
        props: { video: emptyUrlVideo }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.exists()).toBe(false)

      const warning = wrapper.find('.invalid-url')
      expect(warning.exists()).toBe(true)
    })

    it('should update when video prop changes', async () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoNoQueryParams }
      })

      let iframe = wrapper.find('iframe')
      expect(iframe.attributes('src')).toBe(freeVideoNoQueryParams.url)

      await wrapper.setProps({ video: freeVideoWithQueryParams })

      iframe = wrapper.find('iframe')
      expect(iframe.attributes('src')).toBe(freeVideoWithQueryParams.url)
    })

    it('should apply featured class when featured prop is true', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams, featured: true }
      })

      expect(wrapper.find('.line-clamp-2').exists()).toBe(false)
    })

    it('should apply line-clamp when featured is false', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams, featured: false }
      })

      expect(wrapper.find('.line-clamp-2').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have iframe title attribute', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.attributes('title')).toBe(freeVideoWithQueryParams.title)
    })

    it('should have iframe aria-label attribute', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.attributes('aria-label')).toBe(
        freeVideoWithQueryParams.title
      )
    })

    it('should have allowfullscreen attribute', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.attributes('allowfullscreen')).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should have loading="lazy" on iframe', () => {
      const wrapper = mount(VideoCard, {
        props: { video: freeVideoWithQueryParams }
      })

      const iframe = wrapper.find('iframe')
      expect(iframe.attributes('loading')).toBe('lazy')
    })

    it('should not render iframe when URL is invalid', () => {
      const wrapper = mount(VideoCard, {
        props: { video: invalidVideoHttp }
      })

      const iframes = wrapper.findAll('iframe')
      expect(iframes.length).toBe(0)
    })
  })
})
