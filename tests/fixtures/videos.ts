import type { ContentPublic } from '~/shared/types/api/content.types'

/**
 * Test fixtures for video content
 * Used in unit and E2E tests
 */

// Free video with query parameters (typical backend response)
export const freeVideoWithQueryParams: ContentPublic = {
  _id: 'test-video-1',
  title: 'BSF Breeding Basics with Query Params',
  description: 'Learn the fundamentals of BSF breeding',
  category: 'video',
  level: 'basic',
  credits: 0,
  profile_tags: ['newbie'],
  category_tags: ['breeding'],
  url:
    'https://player.vimeo.com/video/1076142559?badge=0&' +
    'autopause=0&player_id=0&app_id=58479',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-01T00:00:00Z',
  available_at: '2025-01-01T00:00:00Z'
}

// Free video without query parameters (backward compatibility)
export const freeVideoNoQueryParams: ContentPublic = {
  _id: 'test-video-2',
  title: 'BSF Rearing Techniques',
  description: 'Advanced rearing techniques for BSF',
  category: 'video',
  level: 'intermediate',
  credits: 0,
  profile_tags: ['insect_farmer'],
  category_tags: ['rearing'],
  url: 'https://player.vimeo.com/video/123456789',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-02T00:00:00Z',
  available_at: '2025-01-02T00:00:00Z'
}

// Premium video (null URL)
export const premiumVideo: ContentPublic = {
  _id: 'test-video-3',
  title: 'Advanced BSF Business Strategies',
  description: 'Premium content for business optimization',
  category: 'video',
  level: 'advanced',
  credits: 10,
  profile_tags: ['business'],
  category_tags: ['business', 'financing'],
  url: null,
  active: true,
  expiry_days: 30,
  created_at: '2025-01-03T00:00:00Z',
  available_at: '2025-01-03T00:00:00Z'
}

// Video with direct vimeo.com URL (with www)
export const directVimeoUrlWithWww: ContentPublic = {
  _id: 'test-video-4',
  title: 'Substrate Management',
  description: 'Learn about substrate preparation',
  category: 'video',
  level: 'basic',
  credits: 0,
  profile_tags: ['newbie'],
  category_tags: ['substrate'],
  url: 'https://www.vimeo.com/987654321',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-04T00:00:00Z',
  available_at: '2025-01-04T00:00:00Z'
}

// Video with direct vimeo.com URL (without www)
export const directVimeoUrlNoWww: ContentPublic = {
  _id: 'test-video-5',
  title: 'Post Processing Methods',
  description: 'Processing techniques after harvesting',
  category: 'video',
  level: 'intermediate',
  credits: 5,
  profile_tags: ['insect_farmer'],
  category_tags: ['post_processing'],
  url: 'https://vimeo.com/111222333',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-05T00:00:00Z',
  available_at: '2025-01-05T00:00:00Z'
}

// Video with multiple query parameters
export const videoWithManyQueryParams: ContentPublic = {
  _id: 'test-video-6',
  title: 'BSF Nursing Guide',
  description: 'Comprehensive guide to BSF nursing',
  category: 'video',
  level: 'basic',
  credits: 0,
  profile_tags: ['newbie'],
  category_tags: ['nursing'],
  url:
    'https://player.vimeo.com/video/555666777?' +
    'badge=0&autopause=0&player_id=0&app_id=58479&' +
    'quality=720p&autoplay=1',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-06T00:00:00Z',
  available_at: '2025-01-06T00:00:00Z'
}

// Video with HTML-encoded ampersands (edge case)
export const videoWithEncodedParams: ContentPublic = {
  _id: 'test-video-7',
  title: 'Metrics and Analytics',
  description: 'Track your farm performance',
  category: 'video',
  level: 'advanced',
  credits: 0,
  profile_tags: ['business'],
  category_tags: ['metrics', 'tech'],
  url: 'https://player.vimeo.com/video/888999000?' + 'badge=0&amp;autopause=0',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-07T00:00:00Z',
  available_at: '2025-01-07T00:00:00Z'
}

// Invalid video (HTTP instead of HTTPS)
export const invalidVideoHttp: ContentPublic = {
  _id: 'test-video-invalid-1',
  title: 'Invalid HTTP Video',
  description: 'This video has an insecure HTTP URL',
  category: 'video',
  level: 'basic',
  credits: 0,
  profile_tags: ['newbie'],
  category_tags: ['breeding'],
  url: 'http://player.vimeo.com/video/123456789',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-08T00:00:00Z',
  available_at: '2025-01-08T00:00:00Z'
}

// Invalid video (wrong domain)
export const invalidVideoWrongDomain: ContentPublic = {
  _id: 'test-video-invalid-2',
  title: 'Invalid Domain Video',
  description: 'This video is from a non-Vimeo domain',
  category: 'video',
  level: 'basic',
  credits: 0,
  profile_tags: ['newbie'],
  category_tags: ['breeding'],
  url: 'https://youtube.com/watch?v=123456789',
  active: true,
  expiry_days: 0,
  created_at: '2025-01-09T00:00:00Z',
  available_at: '2025-01-09T00:00:00Z'
}

// Collection of all valid videos
export const validVideos = [
  freeVideoWithQueryParams,
  freeVideoNoQueryParams,
  directVimeoUrlWithWww,
  directVimeoUrlNoWww,
  videoWithManyQueryParams,
  videoWithEncodedParams
]

// Collection of all invalid videos
export const invalidVideos = [invalidVideoHttp, invalidVideoWrongDomain]

// Collection of all videos including premium
export const allVideos = [...validVideos, premiumVideo, ...invalidVideos]
